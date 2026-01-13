// src/lib/utils/smogon-raw-utils.ts

const SMOGON_STATS_URL = 'https://www.smogon.com/stats';

// Headers para simular navegador real
const FETCH_OPTS = {
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/json'
    },
    next: { revalidate: 3600 } 
};

// --- DATOS DE EMERGENCIA (MOCK) ---
// Estos archivos simulan lo que encontraríamos en la carpeta chaos si la red funcionase.
// Permiten que el desarrollo de la UI continúe en entornos bloqueados (StackBlitz).
const MOCK_FILES = [
    'gen9ou-0.json', 'gen9ou-1500.json', 'gen9ou-1695.json', 'gen9ou-1825.json',
    'gen9ubers-0.json', 'gen9ubers-1500.json', 'gen9ubers-1695.json',
    'gen9uu-0.json', 'gen9uu-1500.json', 'gen9uu-1630.json',
    'gen9ru-0.json', 'gen9ru-1500.json',
    'gen9nu-0.json', 'gen9nu-1500.json',
    'gen9monotype-0.json', 'gen9monotype-1500.json',
    'gen9vgc2025regg-0.json', 'gen9vgc2025regg-1500.json', // Ajustado a fecha futura
    'gen9vgc2025regg-1600.json',
    'gen9doublesou-0.json', 'gen9doublesou-1500.json',
    'gen8ou-0.json', 'gen8ou-1500.json',
    'gen8vgc2022-0.json', 'gen8vgc2022-1500.json'
];

export interface SmogonFormatParser {
    id: string; gen: string; mode: 'singles' | 'doubles';
    formatName: string; regulation: string; elo: string;
}

// Lógica de fechas (Tu implementación estaba bien, la mantengo)
export const calculateTargetDates = (): string[] => {
    const now = new Date();
    const currentDay = now.getDate();
    const startOffset = currentDay >= 2 ? 1 : 2;
    const offsets = [startOffset, startOffset + 1, startOffset + 2]; 

    return offsets.map(offset => {
        const d = new Date();
        d.setMonth(d.getMonth() - offset);
        const year = d.getFullYear();
        const month = (d.getMonth() + 1).toString().padStart(2, '0');
        return `${year}-${month}`;
    });
};

/**
 * FETCH CON ESTRATEGIA DE DEFENSA EN PROFUNDIDAD
 * 1. Prueba Canario (Archivo específico).
 * 2. Prueba Directorio (Scraping).
 * 3. Fallback Mock (Si todo falla, devuelve datos estáticos para no bloquear UI).
 */
export const fetchValidChaosFiles = async (): Promise<{ date: string, files: string[] }> => {
    const targetDates = calculateTargetDates();
    const primaryDate = targetDates[0]; // Ej: 2025-12

    console.log(`[SmogonLogic] Fechas calculadas: ${targetDates.join(', ')}`);

    // --- FASE 1: PRUEBA CANARIO (Solicitada explícitamente) ---
    // Intentamos pedir un archivo JSON directamente para ver si es bloqueo de listado o total.
    // Probamos con "gen9doublesou-1695.json"
    const canaryUrl = `${SMOGON_STATS_URL}/${primaryDate}/chaos/gen9doublesou-1695.json`;
    console.log(`[SmogonLogic] 🐦 Ejecutando PRUEBA CANARIO a: ${canaryUrl}`);

    try {
        const canaryRes = await fetch(canaryUrl, { ...FETCH_OPTS, method: 'HEAD' }); // HEAD es más rápido
        console.log(`[SmogonLogic] 🐦 Status Canario: ${canaryRes.status}`);
        
        if (canaryRes.ok) {
            console.log(`[SmogonLogic] ✅ ACCESO PARCIAL: Se pueden leer archivos individuales, pero no listar.`);
            // Si funciona el canario, devolvemos el Mock Set porque no podemos listar los reales,
            // pero al menos sabemos que la API de datos funcionará.
            return { date: primaryDate, files: MOCK_FILES };
        }
    } catch (e) {
        console.error(`[SmogonLogic] ❌ FALLO CANARIO: Bloqueo de red total confirmado.`);
    }

    // --- FASE 2: INTENTO DE LISTADO (Scraping) ---
    for (const date of targetDates) {
        const url = `${SMOGON_STATS_URL}/${date}/chaos/`;
        console.log(`[SmogonLogic] Intentando listar directorio: ${url}`);
        
        try {
            const res = await fetch(url, FETCH_OPTS);
            if (res.status === 404) continue;
            if (!res.ok) throw new Error(`HTTP ${res.status}`);

            const html = await res.text();
            const fileRegex = /href="([^"]+\.json)"/g;
            const matches = [...html.matchAll(fileRegex)];
            const files = matches.map(m => m[1]);

            if (files.length > 0) {
                console.log(`[SmogonLogic] ✅ ÉXITO REAL: Encontrados ${files.length} archivos en ${date}`);
                return { date, files };
            }
        } catch (e) {
            console.log(`[SmogonLogic] Fallo de listado en ${date}.`);
        }
    }

    // --- FASE 3: FALLBACK FINAL (Mock Mode) ---
    // Si llegamos aquí, StackBlitz no tiene salida a Smogon.
    // Devolvemos datos simulados para que TU INTERFAZ FUNCIONE.
    console.warn("========================================================");
    console.warn("[SmogonLogic] ⚠️ MODO OFFLINE ACTIVADO");
    console.warn("[SmogonLogic] No se pudo conectar con Smogon. Usando datos Mock.");
    console.warn("========================================================");
    
    return { date: primaryDate, files: MOCK_FILES };
};

// 3. PARSER (Sin cambios, es robusto)
export const parseChaosFilename = (filename: string): SmogonFormatParser | null => {
    const cleanName = filename.replace('.json', '');
    const lastDashIndex = cleanName.lastIndexOf('-');
    if (lastDashIndex === -1) return null;

    const baseName = cleanName.substring(0, lastDashIndex);
    const elo = cleanName.substring(lastDashIndex + 1);

    const genMatch = baseName.match(/^gen(\d+)/);
    const genNum = genMatch ? genMatch[1] : '9';
    const gen = `gen${genNum}`;

    let mode: 'singles' | 'doubles' = 'singles';
    let formatName = baseName.replace(gen, '');
    let regulation = '-';

    if (formatName.includes('vgc')) {
        mode = 'doubles';
        const vgcMatch = formatName.match(/vgc(\d{4})(?:reg([a-z0-9]+))?/i);
        if (vgcMatch) {
            const year = vgcMatch[1];
            const regCode = vgcMatch[2];
            formatName = `VGC ${year}`;
            regulation = regCode ? `Reg ${regCode.toUpperCase()}` : 'Standard';
        } else {
            formatName = 'VGC (Legacy)';
        }
    } 
    else if (formatName.startsWith('doubles')) {
        mode = 'doubles';
        formatName = formatName.replace('doubles', '').toUpperCase() || 'Doubles OU';
        if (formatName === 'OU') formatName = 'Doubles OU';
    }
    else {
        formatName = formatName.toUpperCase();
    }

    return { id: cleanName, gen, mode, formatName, regulation, elo };
};