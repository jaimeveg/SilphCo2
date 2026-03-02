// scripts/update-smogon-data.ts
// EJECUTAR CON: npx tsx scripts/update-smogon-data.ts

import fs from 'fs';
import path from 'path';

const SMOGON_BASE = 'https://www.smogon.com/stats';
const OUTPUT_DIR = path.join(process.cwd(), 'public/data/smogon');
const ALIAS_PATH = path.join(process.cwd(), 'public/data', 'alias_map.json');
const unmappedAliases = new Set<string>();

// --- CARGA DE LA PIEDRA ROSETTA (ALIAS MAP) ---
let aliasMap: Record<string, number> = {};
try {
    const aliasRaw = fs.readFileSync(ALIAS_PATH, 'utf8');
    aliasMap = JSON.parse(aliasRaw);
} catch (e) {
    console.error('🔥 ERROR FATAL: No se encontró alias_map.json. Ejecuta npx tsx scripts/generate-alias-map.ts primero.');
    process.exit(1);
}

// Headers para evitar bloqueo por User-Agent
const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/json'
};

// Filtro de seguridad para no descargar 1GB de formatos irrelevantes
const IGNORED_FORMATS = [
    'custom', '1v1', '2v2', 'purehackmons', 'almostanyability', 
    'pokebilities', 'mixandmega', 'godlygift', 'stabmons', 'nfe', 'zu',
    'tiershift', 'camomons', 'sketchmons', '3v3', 'balancedhackmons', 'cap',
    'chatbats', 'convergence', 'fortemons', 'legendszaou', 'metronomebattle', 
    'bssregj', 'sharedpower', 'anythinggoes', 'partnersincrime', 'crossevolution',
    'monotype', 'bh', 'hc', 'lc', 'ag', 'volt', 'biomech',
    'losers', 'solgaleo', 'flipped', 'nc' // Quitamos los pasados sin gen
];

// --- UTILIDADES LÉXICAS ---
const toSlug = (name: string) => name.toLowerCase().replace(/['’\.]/g, '').replace(/[\s:]+/g, '-').replace(/[^a-z0-9-]/g, '');

// --- INTERCEPTOR DE DATOS (EL ESCUDO) ---
const transformSmogonData = (rawData: any) => {
    if (!rawData.data) return rawData; 

    const newData: Record<string, any> = {};

    for (const [pkmName, pkmStats] of Object.entries(rawData.data)) {
        const slug = toSlug(pkmName);
        
        let pkmId = aliasMap[slug] || aliasMap[slug.replace(/-/g, '')];
        if (!pkmId) {
            unmappedAliases.add(slug);
            pkmId = slug as any; 
        }
        
        // 1. Traducir Teammates
        const newTeammates: Record<string, number> = {};
        if ((pkmStats as any).Teammates) {
            for (const [mateName, mateCount] of Object.entries((pkmStats as any).Teammates)) {
                const mateSlug = toSlug(mateName);
                
                let mateId = aliasMap[mateSlug] || aliasMap[mateSlug.replace(/-/g, '')];
                if (!mateId) {
                    unmappedAliases.add(mateSlug);
                    mateId = mateSlug as any;
                }
                
                newTeammates[mateId.toString()] = (newTeammates[mateId.toString()] || 0) + (mateCount as number);
            }
            (pkmStats as any).Teammates = newTeammates;
        }

        // 2. Traducir Checks and Counters (¡LA PIEZA QUE FALTABA!)
        const newCounters: Record<string, any> = {};
        if ((pkmStats as any)['Checks and Counters']) {
            for (const [counterName, scores] of Object.entries((pkmStats as any)['Checks and Counters'])) {
                const counterSlug = toSlug(counterName);
                
                let counterId = aliasMap[counterSlug] || aliasMap[counterSlug.replace(/-/g, '')];
                if (!counterId) {
                    unmappedAliases.add(counterSlug);
                    counterId = counterSlug as any;
                }
                
                newCounters[counterId.toString()] = scores;
            }
            (pkmStats as any)['Checks and Counters'] = newCounters;
        }
        
        // Guardar Pokémon principal
        if (newData[pkmId.toString()]) {
            newData[pkmId.toString()]["Raw count"] += (pkmStats as any)["Raw count"];
        } else {
            newData[pkmId.toString()] = pkmStats;
        }
    }
    
    rawData.data = newData;
    return rawData;
};

// ==========================================
// MOTOR SCRAPER
// ==========================================

const fetchHtml = async (url: string): Promise<string | null> => {
    try {
        const res = await fetch(url, { headers: HEADERS });
        if (!res.ok) return null;
        return await res.text();
    } catch (e) {
        return null;
    }
};

const getRecentMonths = async (): Promise<string[]> => {
    console.log('🔍 Buscando meses disponibles en Smogon...');
    const html = await fetchHtml(SMOGON_BASE);
    if (!html) return [];

    const regex = /<a href="(\d{4}-\d{2})\/">/g;
    const matches = [...html.matchAll(regex)];
    
    return matches
        .map(m => m[1])
        .sort((a, b) => b.localeCompare(a)); 
};

const fetchFileList = async (date: string): Promise<string[] | null> => {
    const url = `${SMOGON_BASE}/${date}/chaos/`;
    const html = await fetchHtml(url);
    if (!html) return null;

    const regex = /<a href="([^"]+\.json)">/g;
    const matches = [...html.matchAll(regex)];
    
    const validFiles = matches
        .map(m => m[1])
        .filter(f => !IGNORED_FORMATS.some(ignored => f.toLowerCase().includes(ignored)));

    return validFiles;
};

const run = async () => {
    console.log('=== INICIANDO ETL DE SMOGON CHAOS (CON RESOLUCIÓN DE IDs) ===\n');

    if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

    // 1. Obtener lista de meses
    const candidates = await getRecentMonths();
    if (candidates.length === 0) {
        console.error('❌ No se pudo conectar a Smogon.');
        process.exit(1);
    }

    // 2. Buscar el mes más reciente que tenga datos chaos
    let targetDate = '';
    let targetFiles: string[] = [];

    for (const date of candidates) {
        const files = await fetchFileList(date);
        if (files) {
            targetDate = date;
            targetFiles = files;
            console.log(`✅ FECHA VÁLIDA ENCONTRADA: ${date} (${files.length} formatos útiles)`);
            break;
        } else {
            console.log(`❌ Fecha ${date} sin datos chaos.`);
        }
    }

    if (!targetDate) {
        console.error('🔥 ERROR FATAL: No se encontraron datos en ninguna fecha reciente.');
        process.exit(1);
    }

    // 3. Guardar Metadatos
    const metaPath = path.join(process.cwd(), 'public/data/smogon/meta.json');
    fs.writeFileSync(metaPath, JSON.stringify({ 
        date: targetDate, 
        updatedAt: new Date().toISOString(),
        totalFiles: targetFiles.length 
    }, null, 2));
    console.log('💾 Metadatos guardados.');

    // 4. Descargar y Transformar Archivos
    console.log(`⬇️ Descargando e inyectando IDs en ${targetFiles.length} archivos...`);
    
    const chunkSize = 10;
    for (let i = 0; i < targetFiles.length; i += chunkSize) {
        const chunk = targetFiles.slice(i, i + chunkSize);
        
        await Promise.all(chunk.map(async (filename) => {
            const url = `${SMOGON_BASE}/${targetDate}/chaos/${filename}`;
            const destPath = path.join(OUTPUT_DIR, filename);

            try {
                const res = await fetch(url, { headers: HEADERS });
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                
                // Parseo, Traducción O(1) de Strings a IDs, y Guardado Minificado
                const rawJson = await res.json();
                const cleanJson = transformSmogonData(rawJson);
                
                fs.writeFileSync(destPath, JSON.stringify(cleanJson)); // Sin tabulaciones para ahorrar espacio
            } catch (err: any) {
                console.error(`  [!] Error en ${filename}: ${err.message}`);
            }
        }));

        process.stdout.write(`\r  -> Progreso: ${Math.min(i + chunkSize, targetFiles.length)} / ${targetFiles.length}`);
    }

    // --- REPORTE DE HUÉRFANOS ---
    if (unmappedAliases.size > 0) {
        console.warn('\n⚠️ ATENCIÓN: Se han encontrado Pokémon sin mapear a un ID oficial:');
        const unmappedArray = Array.from(unmappedAliases).sort();
        console.warn(unmappedArray);
        
        fs.writeFileSync(
            path.join(process.cwd(), 'public/data/unmapped_aliases.json'), 
            JSON.stringify(unmappedArray, null, 2)
        );
        console.log('-> Revisa "public/data/unmapped_aliases.json" y añade estos nombres al MANUAL_OVERRIDES de tu script generate-alias-map.ts');
    }

    console.log('\n\n[OK] Sincronización completada con éxito. Datos traducidos a IDs.');
};

run();