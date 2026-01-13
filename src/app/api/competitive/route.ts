import { promises as fs } from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';
import { toSlug } from '@/lib/utils/pokemon-normalizer';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const pokemon = searchParams.get('pokemon');
    const fileId = searchParams.get('fileId'); // "gen9ou-1695"

    if (!pokemon || !fileId) {
        return NextResponse.json({ error: 'Missing params' }, { status: 400 });
    }

    try {
        // RUTA AL ARCHIVO LOCAL
        // En Vercel/Next.js, public/ se sirve estáticamente, pero para leerlo con fs
        // usamos process.cwd() + public/data/...
        const filePath = path.join(process.cwd(), 'public/data/smogon', `${fileId}.json`);
        
        // Leemos el archivo físico
        const fileContent = await fs.readFile(filePath, 'utf-8');
        const chaosData = JSON.parse(fileContent);

        // --- LÓGICA DE PROCESAMIENTO (Igual que antes) ---
        const targetSlug = toSlug(pokemon);
        const availableMons = Object.keys(chaosData.data);
        const realKey = availableMons.find(k => toSlug(k) === targetSlug);

        if (!realKey) {
            return NextResponse.json({ error: 'Pokemon not found in format' }, { status: 404 });
        }

        const rawMon = chaosData.data[realKey];
        const totalBattles = rawMon['Raw count'];
        const toPercent = (val: number) => Math.round((val / totalBattles) * 100);
        
        const processMap = (map: any, limit = 10) => Object.entries(map || {})
            .sort(([, a], [, b]) => (b as number) - (a as number))
            .slice(0, limit)
            .map(([k, v]) => ({ name: k, value: toPercent(v as number), slug: toSlug(k) }));

        const response = {
            meta: { pokemon: realKey, format: fileId, gen: 9 },
            general: {
                usage: ((rawMon['Usage %'] || 0) * 100).toFixed(2),
                rawCount: totalBattles
            },
            stats: {
                moves: processMap(rawMon.Moves),
                items: processMap(rawMon.Items),
                abilities: processMap(rawMon.Abilities),
                teammates: processMap(rawMon.Teammates),
                teras: processMap(rawMon.TeraTypes),
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
                counters: Object.entries(rawMon['Checks and Counters'] || {})
                    .sort(([, a], [, b]) => ((b as any).score || 0) - ((a as any).score || 0))
                    .slice(0, 10)
                    .map(([k, v]) => ({ name: k, score: Math.round((v as any).score * 100) || 0, slug: toSlug(k) }))
            }
        };

        return NextResponse.json(response);

    } catch (error) {
        console.error(`Error leyendo archivo local ${fileId}:`, error);
        return NextResponse.json({ error: 'Data not found locally. Please run ingest script.' }, { status: 404 });
    }
}