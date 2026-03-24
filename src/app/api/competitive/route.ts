// src/app/api/competitive/route.ts

import { promises as fs } from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';
import { toSlug } from '@/lib/utils/pokemon-normalizer';

let speedMapCache: Record<string, number> | null = null;

async function loadJsonMap(filename: string, cacheVar: any) {
    if (cacheVar && Object.keys(cacheVar).length > 0) return cacheVar;
    
    const filePath = path.join(process.cwd(), 'public/data', filename);
    try {
        await fs.access(filePath);
        const fileContent = await fs.readFile(filePath, 'utf-8');
        return JSON.parse(fileContent);
    } catch (e) {
        return null; 
    }
}

// NUEVO: Formateador Visual ('close-combat' -> 'Close Combat')
const formatDisplayName = (slug: string) => {
    if (!slug) return '';
    return slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const pokemonId = searchParams.get('pokemon');
    const fileId = searchParams.get('fileId'); 

    if (!pokemonId || !fileId) {
        return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    try {
        const filePath = path.join(process.cwd(), 'public/data/smogon', fileId);
        const fileContent = await fs.readFile(filePath, 'utf-8');
        const chaosData = JSON.parse(fileContent);

        // Búsqueda O(1) directa
        const rawMon = chaosData.data[pokemonId];

        if (!rawMon) {
            return NextResponse.json({ error: 'Pokemon not found in format' }, { status: 404 });
        }

        const rawCount = rawMon['Raw count'];
        const baseWeight = Object.values(rawMon.Abilities || {}).reduce((acc: number, curr: any) => acc + (curr as number), 0) || rawCount;

        const totalBattles = chaosData.info?.['number of battles'] || 0;
        const totalTeams = totalBattles * 2;
        let usageRate = 0;
        if (rawMon['usage'] !== undefined) {
            usageRate = rawMon['usage'] * 100;
        } else if (rawMon['Usage %'] !== undefined) {
            usageRate = rawMon['Usage %'];
        } else if (totalTeams > 0) {
            usageRate = (rawCount / totalTeams) * 100;
        }

        const toPercent = (val: number) => ((val / (baseWeight as number)) * 100).toFixed(2);

        // APLICAMOS EL FORMATEADOR Y RETENEMOS EL SLUG
        const processMap = (obj: any, limit = 15) => {
            if (!obj) return [];
            return Object.entries(obj)
                .map(([k, v]) => ({
                    name: formatDisplayName(k), // Visual bonito
                    slug: k,                    // Retenemos el ID original
                    value: ((v as number) / (baseWeight as number)) * 100,
                    displayValue: toPercent(v as number)
                }))
                .sort((a, b) => b.value - a.value)
                .slice(0, limit);
        };

        const processTeammates = (obj: any, limit = 15) => {
            if (!obj) return [];
            return Object.entries(obj)
                .map(([idStr, count]) => ({
                    id: parseInt(idStr, 10), 
                    value: ((count as number) / (baseWeight as number)) * 100,
                    displayValue: toPercent(count as number)
                }))
                .sort((a, b) => b.value - a.value)
                .slice(0, limit);
        };

        const processCounters = (obj: any) => {
            if (!obj) return [];
            return Object.entries(obj)
                .map(([idStr, scores]) => {
                    const s = scores as number[];
                    const rawScore = s[0] - 4 * s[1];
                    return {
                        id: parseInt(idStr, 10),
                        score: toPercent(rawScore)
                    };
                })
                .filter(c => parseFloat(c.score) > 0)
                .sort((a, b) => parseFloat(b.score) - parseFloat(a.score))
                .slice(0, 10);
        };

        // CORRECCIÓN TERA TYPES: Priorizamos la llave oficial de Smogon
        let teraData = rawMon['Tera Types'] || rawMon.TeraTypes || {};
        
        if (Object.keys(teraData).length === 0 && rawMon.Items) {
            const teraKeys = Object.keys(rawMon.Items).filter(k => k.toLowerCase().includes('tera shard') || k.toLowerCase().includes('terashard'));
            teraKeys.forEach(k => {
                let typeName = k.replace(/Tera Shard/ig, '').replace(/terashard/ig, '').replace(/-/g, '').trim();
                typeName = typeName.charAt(0).toUpperCase() + typeName.slice(1);
                (teraData as any)[typeName] = rawMon.Items[k];
            });
        }

        // =========================================================
        // 🚀 CÁLCULO DINÁMICO DE SPEED TIER (RESTAURADO)
        // =========================================================
        if (!speedMapCache) speedMapCache = await loadJsonMap('pokedex_speed_map.json', speedMapCache);
        const speedMap = speedMapCache || {};

        let speedAnalysis = {
            tier: 'F',
            percentile: 0,
            baseSpeed: 0,
            context: { en: 'Insufficient data', es: 'Datos insuficientes' }
        };

        if (speedMap[pokemonId]) {
            const targetSpeed = speedMap[pokemonId];
            
            const metaSpeeds: number[] = []; 
            let globalMaxSpeed = 0;          
            let globalMinSpeed = 999;        
            
            // Ya no hay que resolver los IDs, las llaves de chaosData.data YA SON los IDs
            Object.keys(chaosData.data).forEach(mId => {
                const monData = chaosData.data[mId];
                
                let u = 0;
                if (monData['Usage %'] !== undefined) u = monData['Usage %'];
                else if (monData['usage'] !== undefined) u = monData['usage'];
                else u = (monData['Raw count'] / totalBattles) * 100;
                
                if (speedMap[mId]) {
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

                // === LÓGICA SPEED TIER EXACTA ===
                let tier = 'C';
                
                if (targetSpeed < 55) {
                    tier = 'F';
                } else {
                    if (percentile >= 95) tier = 'S+';
                    else if (percentile >= 85) tier = 'S';
                    else if (percentile >= 70) tier = 'A';
                    else if (percentile >= 50) tier = 'B';
                    else tier = 'C';
                }

                // Extremos absolutos
                if (isFastest) tier = 'S+';
                if (isSlowest) tier = 'F';

                // Cálculo de textos
                const rawTopPercent = 100 - percentile;
                let topPercentStr = rawTopPercent.toFixed(0);
                if (rawTopPercent < 1) {
                    if (rawTopPercent <= 0.01) topPercentStr = "< 0.01";
                    else topPercentStr = rawTopPercent.toFixed(2);
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
                } else if (tier === 'F') { // TIER F = TRICK ROOM
                    const fasterThanMeStr = rawTopPercent.toFixed(0);
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
            }
        }
        // =========================================================

        const response = {
            meta: { pokemon: pokemonId, format: fileId, gen: 9 },
            general: {
                usage: usageRate.toFixed(2),
                rawCount: rawMon['Raw count']
            },
            stats: {
                moves: processMap(rawMon.Moves),
                items: processMap(rawMon.Items, 10),
                abilities: processMap(rawMon.Abilities, 10),
                teammates: processTeammates(rawMon.Teammates, 12),
                teras: processMap(teraData, 10), 
                natureSpread: Object.entries(rawMon.Spreads || {})
                    .sort(([, a], [, b]) => (b as number) - (a as number))
                    .slice(0, 6)
                    .map(([k, v]) => {
                        const [nature, evsStr] = k.split(':');
                        const evs = evsStr ? evsStr.split('/').map(Number) : [0,0,0,0,0,0];
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
        return NextResponse.json({ error: 'Processing error' }, { status: 500 });
    }
}