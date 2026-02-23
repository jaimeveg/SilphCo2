import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { ItemDatabase, ItemData, ItemMechanics, ItemCategory } from '../src/types/items';

// Rutas de archivos y carpetas
const CSV_PATH = path.join(process.cwd(), 'public', 'data', 'item-list-clean.csv');
const OUTPUT_JSON_PATH = path.join(process.cwd(), 'public', 'data', 'item_dex.json');
const SPRITES_DIR = path.join(process.cwd(), 'public', 'images', 'items', 'sprites');
const HIGH_RES_DIR = path.join(process.cwd(), 'public', 'images', 'items', 'high-res');

// Utilidad de Rate Limiting
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Parser robusto para CSV con valores envueltos en comillas (ej. "[steel;dragon]")
function parseCsvLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ';' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current.trim());
    return result;
}

// Transformadores de tipos para las mecánicas
const parseNum = (val: string) => val !== '' ? Number(val) : undefined;
const parseArray = (val: string) => {
    if (!val) return undefined;
    // Limpia comillas y corchetes, ej: "[steel;dragon]" -> ['steel', 'dragon']
    const clean = val.replace(/^"|"$|^\[|\]$/g, '');
    return clean.split(';').map(s => s.trim()).filter(Boolean);
};
const parseBool = (val: string) => val.toUpperCase() === 'TRUE' ? true : undefined;

// Descarga de imágenes mediante Stream
async function downloadImage(url: string, destPath: string): Promise<boolean> {
    try {
        const response = await axios({ url, responseType: 'stream', timeout: 10000 });
        const writer = fs.createWriteStream(destPath);
        response.data.pipe(writer);
        return new Promise((resolve, reject) => {
            writer.on('finish', () => resolve(true));
            writer.on('error', () => reject(false));
        });
    } catch (error) {
        return false;
    }
}

async function main() {
    console.log('🚀 Iniciando ETL de ItemDex...');

    // 1. Configuración de Directorios
    if (!fs.existsSync(SPRITES_DIR)) fs.mkdirSync(SPRITES_DIR, { recursive: true });
    if (!fs.existsSync(HIGH_RES_DIR)) fs.mkdirSync(HIGH_RES_DIR, { recursive: true });

    // 2. Lectura y Fusión (Agrupación en Memoria)
    const rawData = fs.readFileSync(CSV_PATH, 'utf-8');
    const lines = rawData.split('\n').map(l => l.trim()).filter(Boolean);
    
    const db: ItemDatabase = {};
    const itemsToProcess: { kebabId: string, serebiiUrl: string }[] = [];

    // Saltamos la cabecera (i = 1)
    for (let i = 1; i < lines.length; i++) {
        const row = parseCsvLine(lines[i]);
        if (row.length < 3) continue;

        const originalUrl = row[1];
        const kebabId = row[2];
        const name = row[3];
        const effectDesc = row[4];
        const category = row[5] as ItemCategory;

        // Construcción del objeto de Mecánicas basado en los índices exactos del CSV
        const mechanics: ItemMechanics = {
            category,
            hp: parseNum(row[6]), atk: parseNum(row[7]), def: parseNum(row[8]),
            spa: parseNum(row[9]), spd: parseNum(row[10]), spe: parseNum(row[11]),
            crit: parseNum(row[12]), acc: parseNum(row[13]), eva: parseNum(row[14]),
            priority: parseNum(row[15]), pp: parseNum(row[16]),
            boost: row[17] as any,
            affects: row[18] as any,
            condition_holder: row[19] || undefined,
            pokemon: parseArray(row[20]),
            evo_pokemon: parseArray(row[21]),
            immunity: parseArray(row[22]),
            type_related: parseArray(row[23]),
            effect_type: row[24] as any, // effect #2 (buff/debuff)
            move_acc: parseNum(row[25]),
            power: parseNum(row[26]),
            use: row[27] as any,
            status: row[28] || undefined,
            mode: row[29] as any,
            breeding: parseBool(row[30]),
            breeding_effect: row[31] || undefined,
        };

        // Eliminar undefined para que el JSON quede limpio
        Object.keys(mechanics).forEach(key => {
            if ((mechanics as any)[key] === undefined) delete (mechanics as any)[key];
        });

        // Lógica de Fusión (Merge si hay colisión)
        if (!db[kebabId]) {
            db[kebabId] = {
                id: kebabId,
                name,
                effect: effectDesc,
                sprites: { low_res: `/images/items/sprites/${kebabId}.png`, high_res: null },
                categories: [category],
                mechanics: [mechanics],
                available_in_gens: [],
                fling_power: null
            };
            itemsToProcess.push({ kebabId, serebiiUrl: originalUrl });
        } else {
            if (!db[kebabId].categories.includes(category)) {
                db[kebabId].categories.push(category);
            }
            db[kebabId].mechanics.push(mechanics);
        }
    }

    console.log(`📦 Encontrados ${itemsToProcess.length} items únicos. Procesando enriquecimiento y assets...`);

    // 3 & 4. Enriquecimiento y Descarga de Assets
    for (const [index, item] of itemsToProcess.entries()) {
        const data = db[item.kebabId];
        const fileName = item.serebiiUrl.split('/').pop() || `${item.kebabId}.png`;

        console.log(`[${index + 1}/${itemsToProcess.length}] Procesando: ${item.kebabId}`);

        // --- PokeAPI Enrichment ---
        try {
            const pokeApiRes = await axios.get(`https://pokeapi.co/api/v2/item/${item.kebabId}`);
            if (pokeApiRes.data.game_indices) {
                data.available_in_gens = pokeApiRes.data.game_indices.map((gi: any) => gi.version.name);
            }
            if (pokeApiRes.data.fling_power !== undefined) {
                data.fling_power = pokeApiRes.data.fling_power;
            }
        } catch (error: any) {
            console.error(`  ⚠️ PokeAPI 404/Error para ${item.kebabId}. Ignorando enriquecimiento.`);
        }

        // --- Descarga Low-Res ---
        const lowResPath = path.join(SPRITES_DIR, `${item.kebabId}.png`);
        if (!fs.existsSync(lowResPath)) {
            await downloadImage(item.serebiiUrl, lowResPath);
        }

        // --- Descarga High-Res (Fallback SV -> PGL) ---
        const highResPath = path.join(HIGH_RES_DIR, `${item.kebabId}.png`);
        if (!fs.existsSync(highResPath)) {
            const svUrl = `https://www.serebii.net/itemdex/sprites/sv/${fileName}`;
            const pglUrl = `https://www.serebii.net/itemdex/sprites/pgl/${fileName}`;
            
            let hrSuccess = await downloadImage(svUrl, highResPath);
            if (!hrSuccess) {
                hrSuccess = await downloadImage(pglUrl, highResPath);
            }

            if (hrSuccess) {
                data.sprites.high_res = `/images/items/high-res/${item.kebabId}.png`;
            } else {
                console.error(`  ⚠️ No se encontró High-Res para ${item.kebabId}`);
                data.sprites.high_res = null; // Confirmamos null si fallan ambas
            }
        } else {
            // Si el archivo ya existía de una ejecución anterior
            data.sprites.high_res = `/images/items/high-res/${item.kebabId}.png`;
        }

        // Rate Limit estricto: Esperar 400ms antes del siguiente request
        await delay(400);
    }

    // 5. Guardado del JSON final
    fs.writeFileSync(OUTPUT_JSON_PATH, JSON.stringify(db, null, 2), 'utf-8');
    console.log(`✅ ¡ETL completado! Base de datos de Items generada en ${OUTPUT_JSON_PATH}`);
}

main();