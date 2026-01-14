import { promises as fs } from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';
import { toSlug } from '@/lib/utils/pokemon-normalizer';
import { COMPETITIVE_FORM_IDS } from '@/lib/utils/competitive-mapping';

// Cache simple en memoria
let speedMapCache: Record<string, number> | null = null;
let idsMapCache: Record<string, number> | null = null;

// Helper para cargar JSONs con reintento
async function loadJsonMap(filename: string, cacheVar: any) {
    if (cacheVar && Object.keys(cacheVar).length > 0) return cacheVar;
    
    const filePath = path.join(process.cwd(), 'public/data', filename);
    try {
        await fs.access(filePath);
        const fileContent = await fs.readFile(filePath, 'utf-8');
        const data = JSON.parse(fileContent);
        console.log(`✅ [API] Loaded ${filename} (${Object.keys(data).length} entries)`);
        return data;
    } catch (e) {
        console.warn(`⚠️ [API] Failed to load ${filename}. Check if file exists in /public/data/`);
        return null; 
    }
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const pokemon = searchParams.get('pokemon');
    const fileId = searchParams.get('fileId'); 

    if (!pokemon || !fileId) {
        return NextResponse.json({ error: 'Missing params' }, { status: 400 });
    }

    try {
        // 1. Cargar datos de Smogon
        const filePath = path.join(process.cwd(), 'public/data/smogon', `${fileId}.json`);
        try {
            await fs.access(filePath);
        } catch {
            return NextResponse.json({ error: 'Data not ingested' }, { status: 404 });
        }
        const fileContent = await fs.readFile(filePath, 'utf-8');
        const chaosData = JSON.parse(fileContent);

        // 2. Resolver Pokémon objetivo
        const targetSlug = toSlug(pokemon);
        const availableMons = Object.keys(chaosData.data);
        const realKey = availableMons.find(k => toSlug(k) === targetSlug);

        if (!realKey) {
            return NextResponse.json({ error: 'Pokemon not found in format' }, { status: 404 });
        }

        const rawMon = chaosData.data[realKey];

        // --- CÁLCULOS ESTADÍSTICOS ---
        const abilities = rawMon.Abilities || {};
        const totalPresence = Object.values(abilities).reduce((a: any, b: any) => a + b, 0) as number;
        const totalBattles = chaosData.info?.['number of battles'] || 0;
        const totalTeams = totalBattles * 2; 
        
        let usageRate = 0;
        if (rawMon['Usage %'] !== undefined) usageRate = rawMon['Usage %'] * 100;
        else if (rawMon['usage'] !== undefined) usageRate = rawMon['usage'] * 100;
        else if (totalTeams > 0) usageRate = (totalPresence / totalTeams) * 100;

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

        // --- CÁLCULO DINÁMICO DE SPEED TIER ---
        if (!speedMapCache) speedMapCache = await loadJsonMap('pokedex_speed_map.json', speedMapCache);
        if (!idsMapCache) idsMapCache = await loadJsonMap('pokedex_ids.json', idsMapCache);

        const speedMap = speedMapCache || {};
        const idsMap = idsMapCache || {};

        const resolveId = (slug: string): number | null => {
            if (COMPETITIVE_FORM_IDS[slug]) return COMPETITIVE_FORM_IDS[slug];
            if (idsMap[slug]) return idsMap[slug];
            return null;
        };

        let debugMsg = "OK";
        let speedAnalysis = {
            tier: 'F',
            percentile: 0,
            baseSpeed: 0,
            context: { en: 'Loading...', es: 'Cargando...' }
        };

        const targetId = resolveId(targetSlug);

        if (Object.keys(speedMap).length === 0) {
            debugMsg = "Speed Map Missing";
            speedAnalysis.context = { en: "Server Error: Missing Speed Dex", es: "Error: Falta mapa de velocidades" };
        } else if (Object.keys(idsMap).length === 0 && !COMPETITIVE_FORM_IDS[targetSlug]) {
            debugMsg = "IDs Map Missing";
            speedAnalysis.context = { en: "Server Error: Missing IDs Dex", es: "Error: Falta mapa de IDs" };
        } else if (!targetId) {
            debugMsg = `ID not found for ${targetSlug}`;
            speedAnalysis.context = { en: `ID not found: ${targetSlug}`, es: `ID no encontrado: ${targetSlug}` };
        } else if (!speedMap[targetId]) {
            debugMsg = `Speed not found for ID ${targetId}`;
            speedAnalysis.context = { en: `Speed missing for ID ${targetId}`, es: `Sin velocidad para ID ${targetId}` };
        } else {
            const targetSpeed = speedMap[targetId];
            
            // Arrays para cálculos
            const metaSpeeds: number[] = []; 
            let globalMaxSpeed = 0;          
            let globalMinSpeed = 999;        
            
            Object.keys(chaosData.data).forEach(monName => {
                const monData = chaosData.data[monName];
                let u = 0;
                if (monData['Usage %'] !== undefined) u = monData['Usage %'];
                else if (monData['usage'] !== undefined) u = monData['usage'];
                
                const mSlug = toSlug(monName);
                const mId = resolveId(mSlug);
                
                if (mId && speedMap[mId]) {
                    const s = speedMap[mId];
                    if (s > globalMaxSpeed) globalMaxSpeed = s;
                    if (s < globalMinSpeed) globalMinSpeed = s;

                    // Meta: Usage > 1%
                    if (u > 0.01) {
                        metaSpeeds.push(s);
                    }
                }
            });

            metaSpeeds.sort((a, b) => a - b);

            if (metaSpeeds.length > 0) {
                const slowerMons = metaSpeeds.filter(s => s < targetSpeed).length;
                const percentile = (slowerMons / metaSpeeds.length) * 100;

                const isFastest = targetSpeed >= globalMaxSpeed;
                const isSlowest = targetSpeed <= globalMinSpeed;

                // Asignar Tier
                let tier = 'C';
                if (percentile >= 95) tier = 'S+';
                else if (percentile >= 85) tier = 'S';
                else if (percentile >= 70) tier = 'A';
                else if (percentile >= 50) tier = 'B';
                else if (targetSpeed < 50) tier = 'TR'; 
                else tier = 'C';

                if (isFastest) tier = 'S+';
                if (isSlowest) tier = 'TR';

                // Cálculo de textos
                const rawTopPercent = 100 - percentile;
                
                // Formateo del Top %
                let topPercentStr = rawTopPercent.toFixed(0);
                if (rawTopPercent < 1) {
                    if (rawTopPercent <= 0.01) {
                        topPercentStr = "< 0.01";
                    } else {
                        topPercentStr = rawTopPercent.toFixed(2);
                    }
                }

                const slowerPercentStr = percentile.toFixed(0);
                
                let contextEn = `Faster than ${slowerPercentStr}% of the format`;
                let contextEs = `Más rápido que el ${slowerPercentStr}% del formato`;

                if (isFastest) {
                    contextEn = "The fastest Pokémon in the format";
                    contextEs = "El Pokémon más rápido del formato";
                } else if (isSlowest) {
                    contextEn = "The slowest Pokémon in the format";
                    contextEs = "El Pokémon más lento del formato";
                } else if (tier === 'TR') {
                    // Para TR mostramos el Top % de lentitud (rawTopPercent)
                    // Ej: "Slower than 90% (Top 10% slow)" 
                    // No, "Slower than 99%" means Top 1% speed.
                    // TR is bottom. So we use the Top % logic inverted or simply reuse topPercentStr which is (100 - percentile).
                    // If percentile is 0 (slowest), rawTop is 100.
                    // We want "Slower than X%". 
                    // If percentile is 5 (slower than 5%). Then it is slower than 95% of mons? No.
                    // Slower than 5 mons out of 100 -> Faster than 5%.
                    // If tier TR, it is slow.
                    // Let's stick to standard percentile for consistency or "Slower than X%".
                    // If I am percentile 10. I am faster than 10%. Slower than 90%.
                    const fasterThanMeStr = rawTopPercent.toFixed(0); // aprox
                    contextEn = `Slower than ${fasterThanMeStr}% (Trick Room viable)`;
                    contextEs = `Más lento que el ${fasterThanMeStr}% (Viable en Espacio Raro)`;
                } else if (percentile > 90) {
                    contextEn = `Top ${topPercentStr}% fastest in the format`;
                    contextEs = `Top ${topPercentStr}% más rápidos del formato`;
                }

                speedAnalysis = {
                    tier,
                    percentile,
                    baseSpeed: targetSpeed,
                    context: { en: contextEn, es: contextEs }
                };
            } else {
                debugMsg = "Empty Meta Speeds";
                speedAnalysis.context = { 
                    en: "Insufficient data to calculate Speed Tier", 
                    es: "Datos insuficientes para calcular Speed Tier" 
                };
            }
        }

        if (debugMsg !== "OK") {
            console.log(`[API Speed Calc] ${debugMsg} | Pokemon: ${pokemon}`);
        }

        const teraData = rawMon['Tera Types'] || rawMon.TeraTypes || {};

        const response = {
            meta: { pokemon: realKey, format: fileId, gen: 9 },
            general: {
                usage: usageRate.toFixed(2),
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
            },
            speed: speedAnalysis
        };

        return NextResponse.json(response);

    } catch (error) {
        console.error(`Error procesando ${fileId}:`, error);
        return NextResponse.json({ error: 'Processing error' }, { status: 500 });
    }
}