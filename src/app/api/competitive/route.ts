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
        
        // --- USAGE RATE ---
        const totalBattles = chaosData.info?.['number of battles'] || 0;
        const pkmCount = rawMon['Raw count'] || 0;
        let usageRate = 0;
        if (rawMon['Usage %']) {
            usageRate = rawMon['Usage %'] * 100;
        } else if (totalBattles > 0) {
            usageRate = (pkmCount / totalBattles) * 100;
        }

        const toPercent = (val: number) => ((val / pkmCount) * 100).toFixed(2);
        
        const processMap = (map: any, limit = 10) => Object.entries(map || {})
            .sort(([, a], [, b]) => (b as number) - (a as number))
            .slice(0, limit)
            .map(([k, v]) => ({ 
                name: k, 
                value: parseFloat(toPercent(v as number)), 
                displayValue: toPercent(v as number),
                slug: toSlug(k) 
            }));

        // --- FIX COUNTERS (NaN) ---
        // Smogon Chaos returns [n, p, d] arrays usually. p is the "score" (0-1).
        const processCounters = (countersMap: any) => {
            return Object.entries(countersMap || {})
                .map(([name, data]: [string, any]) => {
                    let numericScore = 0;
                    
                    if (Array.isArray(data)) {
                        // Formato Array: [count, probability, deviation]
                        // probability (index 1) es el score (0.85 = 85%)
                        numericScore = data[1] || 0;
                    } else if (typeof data === 'object' && data !== null) {
                        // Formato Objeto Legacy: { score: 0.85 } o { p: 0.85 }
                        numericScore = data.score || data.p || 0;
                    }

                    return { name, rawScore: numericScore };
                })
                .sort((a, b) => b.rawScore - a.rawScore) // Ordenar por score real
                .slice(0, 10) // Top 10 counters
                .map(c => ({
                    name: c.name,
                    score: (c.rawScore * 100).toFixed(2), // Convertir 0.85 -> "85.00"
                    slug: toSlug(c.name)
                }));
        };

        // --- FIX TERAS (Missing) ---
        // A veces es "Tera Types", a veces "TeraTypes"
        const teraData = rawMon['Tera Types'] || rawMon.TeraTypes || {};

        const response = {
            meta: { pokemon: realKey, format: fileId, gen: 9 }, // Simplified gen
            general: {
                usage: usageRate.toFixed(2),
                rawCount: pkmCount
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