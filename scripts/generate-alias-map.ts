import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'public', 'data');
const IDS_PATH = path.join(DATA_DIR, 'pokedex_ids.json');
const OUTPUT_PATH = path.join(DATA_DIR, 'alias_map.json');

// Excepciones manuales heredadas de tu competitive-mapping.ts y quirks de Smogon
const MANUAL_OVERRIDES: Record<string, number> = {
    // Casos con apóstrofes (Smogon Keys)
    "farfetch'd": 83,
    "farfetch'd-galar": 10166,
    "sirfetch'd": 865,
    "oricorio-pa'u": 743,

    // Simplificaciones de Smogon (Asumen forma base)
    'minior': 774,
    'minior-meteor': 774,
    'minior-core': 10136,
    'oricorio': 741,
    'oricorio-baile': 741,
    'oricorio-pom-pom': 742,
    'oricorio-sensu': 744,
    'darmanitan': 555,
    'darmanitan-galar': 10177,
    'darmanitan-zen': 10017,
    'darmanitan-galar-zen': 10178,
    'aegislash': 681,
    'aegislash-shield': 681,
    'aegislash-blade': 10026,
    'keldeo': 647,
    'keldeo-ordinary': 647,
    'keldeo-resolute': 10024,
    'lycanroc': 745,
    'lycanroc-midday': 745,
    'lycanroc-midnight': 10126,
    'lycanroc-dusk': 10127,
    'wishiwashi': 746,
    'wishiwashi-solo': 746,
    'wishiwashi-school': 10128,

    // Nombres de Género
    'indeedee': 876,
    'indeedee-m': 876,
    'indeedee-male': 876,
    'indeedee-f': 10177,
    'indeedee-female': 10177,
    'meowstic': 678,
    'meowstic-m': 678,
    'meowstic-male': 678,
    'meowstic-f': 10025,
    'meowstic-female': 10025,
    'basculegion': 902,
    'basculegion-m': 902,
    'basculegion-male': 902,
    'basculegion-f': 10248,
    'basculegion-female': 10248,
    'oinkologne': 916,
    'oinkologne-m': 916,
    'oinkologne-male': 916,
    'oinkologne-f': 10255,
    'oinkologne-female': 10255,

    // Urshifu
    'urshifu': 892,
    'urshifu-single-strike': 892,
    'urshifu-single-strike-style': 892,
    'urshifu-rapid-strike': 10226,
    'urshifu-rapid-strike-style': 10226,

    // Ogerpon
    'ogerpon': 1017,
    'ogerpon-teal': 1017,
    'ogerpon-teal-mask': 1017,
    'ogerpon-wellspring': 10118,
    'ogerpon-wellspring-mask': 10118,
    'ogerpon-hearthflame': 10119,
    'ogerpon-hearthflame-mask': 10119,
    'ogerpon-cornerstone': 10120,
    'ogerpon-cornerstone-mask': 10120,

    // Formas Paldea Tauros
    'tauros-paldea': 10250, // Combat breed por defecto en SV
    'tauros-paldea-combat': 10250,
    'tauros-paldea-blaze': 10251,
    'tauros-paldea-aqua': 10252,
    'tauros-paldean-combat-breed': 10250,
    'tauros-paldean-blaze-breed': 10251,
    'tauros-paldean-aqua-breed': 10252,

    // Formas Therian y encarnadas
    'landorus': 645,
    'landorus-incarnate': 645,
    'landorus-therian': 10020,
    'thundurus': 642,
    'thundurus-incarnate': 642,
    'thundurus-therian': 10019,
    'tornadus': 641,
    'tornadus-incarnate': 641,
    'tornadus-therian': 10018,
    'enamorus': 905,
    'enamorus-incarnate': 905,
    'enamorus-therian': 10249,

    // Formas origen
    'giratina': 487,
    'giratina-altered': 487,
    'dialga': 483,
    'palkia': 484,

    // Varios
    'basculin': 550,
    'basculin-red-striped': 550,
    'basculin-blue-striped': 10016,
    'meloetta': 648,
    'meloetta-aria': 648,
    'meloetta-pirouette': 10018,
    'gourgeist': 711,
    'gourgeist-average': 711,
    'pumpkaboo': 710,
    'pumpkaboo-average': 710,
    'zacian': 791,
    'zacian-hero': 791,
    'zamazenta': 792,
    'zamazenta-hero': 792,
    'calyrex': 898,
    'palafin': 964,
    'palafin-zero': 964,
    'palafin-hero': 10256,
    'gimmighoul': 999,
    'gimmighoul-chest': 999,
    'gimmighoul-roaming': 10264,
    'terapagos': 1024,
    'terapagos-normal': 1024,
    'terapagos-terastal': 10265,
    'terapagos-stellar': 10266,
};

const generateAliasMap = () => {
    console.log('=== GENERANDO PIEDRA ROSETTA (ALIAS MAP) ===');

    try {
        const idsRaw = fs.readFileSync(IDS_PATH, 'utf8');
        const idsMap: Record<string, number> = JSON.parse(idsRaw);
        
        const aliasMap: Record<string, number> = {};

        // 1. Ingestar la base de datos oficial (pokedex_ids.json)
        for (const [slug, id] of Object.entries(idsMap)) {
            aliasMap[slug] = id;
            
            // Variaciones automáticas para atrapar problemas comunes de strings
            aliasMap[slug.replace(/-/g, '')] = id; // ej. fluttermane
            aliasMap[slug.replace(/-/g, ' ')] = id; // ej. flutter mane
        }

        // 2. Ingestar y sobrescribir con las excepciones manuales (Smogon / RK9 quirks)
        for (const [slug, id] of Object.entries(MANUAL_OVERRIDES)) {
            aliasMap[slug] = id;
            aliasMap[slug.replace(/-/g, '')] = id;
            aliasMap[slug.replace(/-/g, ' ')] = id;
        }

        fs.writeFileSync(OUTPUT_PATH, JSON.stringify(aliasMap, null, 2), 'utf8');
        
        console.log(`[ÉXITO] Generados ${Object.keys(aliasMap).length} alias únicos.`);
        console.log(`Guardado en: ${OUTPUT_PATH}`);
        
    } catch (error) {
        console.error('[ERROR] No se pudo generar el diccionario de alias:', error);
    }
};

generateAliasMap();