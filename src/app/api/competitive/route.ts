// src/app/api/competitive/route.ts
import { NextResponse } from 'next/server';
import { toSlug } from '@/lib/utils/pokemon-normalizer'; // Tu normalizador existente

const SMOGON_BASE = 'https://www.smogon.com/stats';

// Cache de Archivos JSON Chaos (Son grandes, cachear agresivamente)
// Usar Map para O(1) access
const JSON_CACHE = new Map<string, { data: any, ts: number }>();

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const pokemon = searchParams.get('pokemon');
    const date = searchParams.get('date');     // "2024-12"
    const fileId = searchParams.get('fileId'); // "gen9vgc2024regg-1760"

    if (!pokemon || !date || !fileId) {
        return NextResponse.json({ error: 'Missing params' }, { status: 400 });
    }

    const cacheKey = `${date}/${fileId}`;
    let chaosData = JSON_CACHE.get(cacheKey)?.data;

    // Fetch del JSON Gigante (si no está en cache)
    if (!chaosData || (Date.now() - (JSON_CACHE.get(cacheKey)?.ts || 0) > 1000 * 60 * 60)) {
        try {
            const url = `${SMOGON_BASE}/${date}/chaos/${fileId}.json`;
            console.log(`[API] Fetching RAW Chaos: ${url}`);
            const res = await fetch(url, { next: { revalidate: 3600 } });
            
            if (!res.ok) throw new Error('Smogon Chaos File not found');
            
            chaosData = await res.json();
            
            // Guardamos en memoria (Cuidado con la RAM en producción, idealmente usar Redis)
            // Para este proyecto, memoria está bien, limpiando viejos si crece mucho.
            if (JSON_CACHE.size > 20) JSON_CACHE.clear(); // Limpieza simple
            JSON_CACHE.set(cacheKey, { data: chaosData, ts: Date.now() });

        } catch (e) {
            return NextResponse.json({ error: 'Failed to fetch external stats' }, { status: 502 });
        }
    }

    // --- PROCESAMIENTO DE DATOS RAW ---
    // Chaos Data Key: El nombre del pokemon en Smogon (ej: "Flutter Mane", "Urshifu-*")
    // Necesitamos encontrar la key correcta en chaosData.data
    
    // Normalizamos inputs y keys para buscar
    const targetSlug = toSlug(pokemon);
    const availableMons = Object.keys(chaosData.data);
    const realKey = availableMons.find(k => toSlug(k) === targetSlug);

    if (!realKey) {
        return NextResponse.json({ error: `Pokemon not found in ${fileId}`, available: availableMons.slice(0,5) }, { status: 404 });
    }

    const rawMon = chaosData.data[realKey];
    const totalBattles = rawMon['Raw count']; // Base para porcentajes

    // Helpers para transformar Raw Count -> Porcentaje
    const toPercent = (val: number) => Math.round((val / totalBattles) * 100);
    const processMap = (map: any, limit = 10) => Object.entries(map || {})
        .sort(([, a], [, b]) => (b as number) - (a as number))
        .slice(0, limit)
        .map(([k, v]) => ({ name: k, value: toPercent(v as number), slug: toSlug(k) }));

    // Transformación a nuestra Interface CompetitiveResponse
    const response = {
        meta: { pokemon: realKey, format: fileId, gen: 9 }, // Simplificado
        general: {
            usage: ((rawMon['Usage %'] || 0) * 100).toFixed(2), // Smogon ya da el % a veces, o calculamos
            rawCount: totalBattles
        },
        stats: {
            moves: processMap(rawMon.Moves),
            items: processMap(rawMon.Items),
            abilities: processMap(rawMon.Abilities),
            teammates: processMap(rawMon.Teammates),
            teras: processMap(rawMon.TeraTypes), // Solo si existe
            natureSpread: Object.entries(rawMon.Spreads || {})
                .sort(([, a], [, b]) => (b as number) - (a as number))
                .slice(0, 6)
                .map(([k, v]) => {
                    // Chaos Spread Key: "Nature:HP/Atk/Def/SpA/SpD/Spe"
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
            // Chaos tiene "Checks and Counters" complejos con fórmula de KO/Switch
            counters: Object.entries(rawMon['Checks and Counters'] || {})
                .sort(([, a], [, b]) => ((b as any).score || 0) - ((a as any).score || 0))
                .slice(0, 10)
                .map(([k, v]) => ({ name: k, score: Math.round((v as any).score * 100) || 0, slug: toSlug(k) }))
        }
    };

    return NextResponse.json(response);
}