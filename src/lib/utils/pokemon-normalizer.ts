// src/lib/utils/pokemon-normalizer.ts

/**
 * MAPA DE TRADUCCIÓN: POKEAPI (Input URL) -> SMOGON (Data Keys)
 * Convierte los slugs técnicos de PokeAPI a los nombres simplificados que usa Smogon.
 * Incluye la re-inserción de apóstrofes para Smogon.
 */
const POKEAPI_TO_SMOGON: Record<string, string> = {
    // --- CASOS CON APÓSTROFES (PokeAPI no tiene, Smogon sí) ---
    'farfetchd': "farfetch'd",
    'farfetchd-galar': "farfetch'd-galar",
    'sirfetchd': "sirfetch'd",
    'oricorio-pau': "oricorio-pa'u",
    
    // --- GÉNEROS ---
    'indeedee-male': 'indeedee',
    'indeedee-female': 'indeedee-f',
    'basculegion-male': 'basculegion',
    'basculegion-female': 'basculegion-f',
    'meowstic-male': 'meowstic',
    'meowstic-female': 'meowstic-f',
    'oinkologne-male': 'oinkologne',
    'oinkologne-female': 'oinkologne-f',
    'jellicent-male': 'jellicent',
    'jellicent-female': 'jellicent-f',
    'frillish-male': 'frillish',
    'frillish-female': 'frillish-f',
    'pyroar-male': 'pyroar',
    'pyroar-female': 'pyroar-f',

    // --- FORMAS BASE Y VARIANTES ---
    'urshifu-single-strike': 'urshifu', 
    'darmanitan-standard': 'darmanitan',
    'darmanitan-galar-standard': 'darmanitan-galar',

    // OGERPON (Reglas explícitas de máscaras)
    'ogerpon-teal-mask': 'ogerpon',            // Base en Smogon
    'ogerpon-wellspring-mask': 'ogerpon-wellspring',
    'ogerpon-hearthflame-mask': 'ogerpon-hearthflame',
    'ogerpon-cornerstone-mask': 'ogerpon-cornerstone',

    // Genios
    'landorus-incarnate': 'landorus',
    'tornadus-incarnate': 'tornadus',
    'thundurus-incarnate': 'thundurus',
    'enamorus-incarnate': 'enamorus',

    // Otros
    'basculin-red-striped': 'basculin',
    'basculin-blue-striped': 'basculin', 
    'basculin-white-striped': 'basculin-white-striped',
    'lycanroc-midday': 'lycanroc',
    'toxtricity-amped': 'toxtricity',
    'eiscue-ice': 'eiscue',
    'morpeko-full-belly': 'morpeko',
    'wishiwashi-solo': 'wishiwashi',
    'mimikyu-disguised': 'mimikyu',
    'aegislash-shield': 'aegislash',
    'keldeo-ordinary': 'keldeo',
    'meloetta-aria': 'meloetta',
    'gourgeist-average': 'gourgeist',
    'pumpkaboo-average': 'pumpkaboo',
    'oricorio-baile': 'oricorio',
    'wormadam-plant': 'wormadam',
    'giratina-altered': 'giratina',
    'shaymin-land': 'shaymin',
    
    // Gen 9
    'tatsugiri-curly': 'tatsugiri',
    'dudunsparce-two-segment': 'dudunsparce',
    'maushold-family-of-four': 'maushold',
    'squawkabilly-green-plumage': 'squawkabilly',
    'palafin-zero': 'palafin',
    'gimmighoul-chest': 'gimmighoul',
};

/**
 * Normaliza un nombre de Pokémon al formato Slug estándar usado por Smogon.
 */
export const toSlug = (name: string): string => {
    if (!name) return '';

    // 0. Pre-limpieza básica
    let rawSlug = name.toLowerCase().trim();

    // 1. TRADUCCIÓN DIRECTA (Prioridad Máxima: Restaurar apóstrofes y simplificar)
    if (POKEAPI_TO_SMOGON[rawSlug]) {
        return POKEAPI_TO_SMOGON[rawSlug];
    }

    // 2. REGLAS ESPECIALES (Patrones)
    if (rawSlug.startsWith('minior-')) return 'minior';

    // 3. Limpieza estándar (Permite apóstrofes si ya venían)
    let slug = rawSlug
        .replace(/[\.]/g, '')     
        .replace(/[:]/g, '')
        .replace(/[^a-z0-9\s-']/g, '') // Mantenemos apóstrofe
        .replace(/\s+/g, '-');

    // 4. Reglas Heurísticas (Sufijos comunes)
    const suffixesToRemove = [
        '-standard', '-incarnate', '-ordinary', '-altered', '-aria', 
        '-midday', '-solo', '-disguised', '-shield', '-average', '-plant', '-land'
    ];

    for (const suffix of suffixesToRemove) {
        if (slug.endsWith(suffix)) {
            return slug.slice(0, -suffix.length);
        }
    }

    // Reglas cosméticas
    if (slug === 'nidoran♂') return 'nidoran-m';
    if (slug === 'nidoran♀') return 'nidoran-f';
    if (slug === 'flabébé') return 'flabebe';

    return slug;
};