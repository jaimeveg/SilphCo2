// scripts/update-smogon-data.ts
// EJECUTAR CON: npx tsx scripts/update-smogon-data.ts

import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';
import { finished } from 'stream/promises';

const SMOGON_BASE = 'https://www.smogon.com/stats';
const OUTPUT_DIR = path.join(process.cwd(), 'public/data/smogon');

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
    'bssregj', 'sharedpower', 'voltturnmayhem', 'orrecolosseum',

];

// --- 1. LÓGICA DE FECHAS ---
const calculateCandidateDates = (): string[] => {
    const now = new Date();
    const day = now.getDate();
    // Si estamos a día 1, 2 o 3, es probable que el mes anterior aún no esté.
    // Empezamos probando con mes -1 o mes -2.
    const startOffset = day >= 4 ? 1 : 2; 
    
    const dates = [];
    for (let i = 0; i < 3; i++) { // Probamos hasta 3 meses atrás
        const d = new Date();
        d.setMonth(d.getMonth() - (startOffset + i));
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        dates.push(`${y}-${m}`);
    }
    return dates;
};

// --- 2. SCRAPER DE DIRECTORIO ---
const fetchFileList = async (date: string): Promise<string[] | null> => {
    const url = `${SMOGON_BASE}/${date}/chaos/`;
    console.log(`🔍 Inspeccionando directorio: ${url}`);

    try {
        const res = await fetch(url, { headers: HEADERS });
        if (res.status === 404) return null;
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const html = await res.text();
        
        // Regex para extraer todos los .json del HTML de Apache
        const fileRegex = /href="([^"]+\.json)"/g;
        const matches = [...html.matchAll(fileRegex)];
        
        // Extraer nombres y filtrar basura
        const files = matches
            .map(m => m[1])
            .filter(f => !IGNORED_FORMATS.some(ig => f.toLowerCase().includes(ig)));

        return files.length > 0 ? files : null;
    } catch (e) {
        console.warn(`⚠️ Error leyendo ${date}: ${(e as Error).message}`);
        return null;
    }
};

// --- 3. DOWNLOADER ---
const downloadFile = async (date: string, filename: string) => {
    const url = `${SMOGON_BASE}/${date}/chaos/${filename}`;
    const destPath = path.join(OUTPUT_DIR, filename);

    // Si ya existe, saltar (Opcional: forzar si quieres actualizar)
    if (fs.existsSync(destPath)) {
        // console.log(`⏩ Saltando existente: ${filename}`);
        return;
    }

    try {
        const res = await fetch(url, { headers: HEADERS });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        if (!res.body) throw new Error('No body');

        // Escritura eficiente con Streams
        const fileStream = fs.createWriteStream(destPath, { flags: 'wx' });
        // @ts-ignore - ReadableStream web to Node stream
        await finished(Readable.fromWeb(res.body).pipe(fileStream));
        
        process.stdout.write('.'); // Barra de progreso simple
    } catch (e) {
        console.error(`❌ Fallo en ${filename}: ${(e as Error).message}`);
    }
};

// --- MAIN ---
const main = async () => {
    console.log('🚀 INICIANDO INGESTA DE DATOS COMPETITIVOS SMOGON');
    
    // 1. Preparar Directorio
    if (!fs.existsSync(OUTPUT_DIR)) {
        console.log(`📁 Creando directorio: ${OUTPUT_DIR}`);
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    } else {
        console.log(`📁 Directorio de destino: ${OUTPUT_DIR}`);
    }

    // 2. Encontrar la fecha válida
    const candidates = calculateCandidateDates();
    let targetDate = null;
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

    // 3. Guardar Metadatos (Para que la API sepa la fecha sin preguntar)
    const metaPath = path.join(process.cwd(), 'public/data/smogon/meta.json');
    fs.writeFileSync(metaPath, JSON.stringify({ 
        date: targetDate, 
        updatedAt: new Date().toISOString(),
        totalFiles: targetFiles.length 
    }, null, 2));
    console.log('💾 Metadatos guardados.');

    // 4. Descargar Archivos (En paralelo limitado para no saturar)
    console.log(`⬇️ Descargando ${targetFiles.length} archivos... (Esto puede tardar unos minutos)`);
    
    // Chunking para no matar la red (bloques de 10 descargas simultáneas)
    const chunkSize = 10;
    for (let i = 0; i < targetFiles.length; i += chunkSize) {
        const chunk = targetFiles.slice(i, i + chunkSize);
        await Promise.all(chunk.map(f => downloadFile(targetDate!, f)));
    }

    console.log('\n✨ INGESTA COMPLETADA CORRECTAMENTE');
};

main();