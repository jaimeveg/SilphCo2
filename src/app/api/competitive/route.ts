import { promises as fs } from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';
import { toSlug } from '@/lib/utils/pokemon-normalizer';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const pokemon = searchParams.get('pokemon');
    const fileId = searchParams.get('fileId'); 

    if (!pokemon || !fileId) {
        return NextResponse.json({ error: 'Missing params' }, { status: 400 });
    }

    try {
        const filePath = path.join(process.cwd(), 'public/data/smogon', `${fileId}.json`);
        
        try {
            await fs.access(filePath);
        } catch {
            return NextResponse.json({ error: 'Data not ingested' }, { status: 404 });
        }

        const fileContent = await fs.readFile(filePath, 'utf-8');
        const chaosData = JSON.parse(fileContent);

        const targetSlug = toSlug(pokemon);
        const availableMons = Object.keys(chaosData.data);
        const realKey = availableMons.find(k => toSlug(k) === targetSlug);

        if (!realKey) {
            return NextResponse.json({ error: 'Pokemon not found in format' }, { status: 404 });
        }

        const rawMon = chaosData.data[realKey];
        
        // --- CÁLCULOS ESTADÍSTICOS REFINADOS ---
        
        // 1. BASE DE CÁLCULO (DENOMINADOR)
        // Usamos la suma de habilidades como "Presencia Ponderada Total" del Pokémon.
        // Esto es mucho más preciso que 'Raw count' cuando estamos en High ELO (1500+).
        const abilities = rawMon.Abilities || {};
        const totalPresence = Object.values(abilities).reduce((a: any, b: any) => a + b, 0) as number;

        // 2. USAGE RATE GLOBAL (Con Fallbacks Inteligentes)
        const totalBattles = chaosData.info?.['number of battles'] || 0;
        const totalTeams = totalBattles * 2; 
        
        let usageRate = 0;

        // A. Intento Directo (Key oficial)
        if (rawMon['Usage %'] !== undefined) {
            console.log("Usa Usage%");
            usageRate = rawMon['Usage %'] * 100;
        } 
        // B. Intento Key alternativa (A veces pasa en dumps antiguos)
        else if (rawMon['usage'] !== undefined) {
            console.log("Usa usage");
            usageRate = rawMon['usage'] * 100;
        }
        // C. Cálculo Ponderado (Mejor que Raw)
        // Usamos totalPresence en lugar de RawCount para acercarnos al % oficial de Pikalytics
        else if (totalTeams > 0) {
            console.log("Usa cálculo");
            usageRate = (totalPresence / totalTeams) * 100;
        }

        // --- HELPERS DE MAPEO ---
        
        // El porcentaje de moves/items es relativo a la presencia del propio Pokémon
        const toPercent = (val: number) => {
            if (totalPresence <= 0) return "0.00";
            return ((val / totalPresence) * 100).toFixed(2);
        };
        
        const processMap = (map: any, limit = 10) => Object.entries(map || {})
            .sort(([, a], [, b]) => (b as number) - (a as number))
            .slice(0, limit)
            .map(([k, v]) => ({ 
                name: k, 
                value: parseFloat(toPercent(v as number)), 
                displayValue: toPercent(v as number),
                slug: toSlug(k) 
            }));

        const processCounters = (countersMap: any) => {
            return Object.entries(countersMap || {})
                .map(([name, data]: [string, any]) => {
                    let numericScore = 0;
                    if (Array.isArray(data)) numericScore = data[1] || 0;
                    else if (typeof data === 'object' && data !== null) numericScore = data.score || data.p || 0;
                    return { name, rawScore: numericScore };
                })
                .sort((a, b) => b.rawScore - a.rawScore)
                .slice(0, 10)
                .map(c => ({
                    name: c.name,
                    score: (c.rawScore * 100).toFixed(2),
                    slug: toSlug(c.name)
                }));
        };

        const teraData = rawMon['Tera Types'] || rawMon.TeraTypes || {};

        const response = {
            meta: { pokemon: realKey, format: fileId, gen: 9 },
            general: {
                usage: usageRate.toFixed(2), // Formateo final
                rawCount: rawMon['Raw count']
            },
            stats: {
                moves: processMap(rawMon.Moves),
                items: processMap(rawMon.Items),
                abilities: processMap(rawMon.Abilities),
                teammates: processMap(rawMon.Teammates, 12),
                teras: processMap(teraData), 
                natureSpread: Object.entries(rawMon.Spreads || {})
                    .sort(([, a], [, b]) => (b as number) - (a as number))
                    .slice(0, 6)
                    .map(([k, v]) => {
                        const [nature, evsStr] = k.split(':');
                        const evs = evsStr.split('/').map(Number);
                        return {
                            nature,
                            usage: toPercent(v as number),
                            evs: { hp: evs[0], atk: evs[1], def: evs[2], spa: evs[3], spd: evs[4], spe: evs[5] }
                        };
                    })
            },
            matchups: {
                counters: processCounters(rawMon['Checks and Counters'])
            }
        };

        return NextResponse.json(response);

    } catch (error) {
        console.error(`Error procesando ${fileId}:`, error);
        return NextResponse.json({ error: 'Processing error' }, { status: 500 });
    }
}