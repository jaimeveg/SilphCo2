// src/lib/utils/pokemon-normalizer.ts

/**
 * DICCIONARIO DE TRADUCCIÓN: POKEAPI -> SMOGON
 * Mapea los slugs técnicos de PokeAPI a los keys usados en los JSON de Smogon.
 */
const SMOGON_OVERRIDES: Record<string, string> = {
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
    // Urshifu
    'urshifu-single-strike': 'urshifu', 
    
    // OGERPON (Corrección -mask)
    'ogerpon-teal-mask': 'ogerpon',
    'ogerpon-wellspring-mask': 'ogerpon-wellspring',
    'ogerpon-hearthflame-mask': 'ogerpon-hearthflame',
    'ogerpon-cornerstone-mask': 'ogerpon-cornerstone',
    // Por si acaso viene sin mask pero con teal
    'ogerpon-teal': 'ogerpon',
    'tatsugiri-curly': 'tatsugiri',
    'tatsugiri-droopy': 'tatsugiri',
    'tatsugiri-stretchy': 'tatsugiri',

    // Toxtricity
    'toxtricity-amped': 'toxtricity',

    // Lycanroc
    'lycanroc-midday': 'lycanroc',

    // Oriocorio
    'oriocorio-baile': 'oriocorio',

    // Otros
    'mimikyu-disguised': 'mimikyu',
    'eiscue-ice': 'eiscue',
    'morpeko-full-belly': 'morpeko',
    'wishiwashi-solo': 'wishiwashi',
    'aegislash-shield': 'aegislash',
    'minior-red-meteor': 'minior',
    'palafin-zero': 'palafin',
    'palafin-hero': 'palafin',
    'darmanitan-standard': 'darmanitan',
    'darmanitan-galar-standard': 'darmanitan-galar',
    'gourgeist-average': 'gourgeist',
    'pumpkaboo-average': 'pumpkaboo',
    'keldeo-ordinary': 'keldeo',
    'meloetta-aria': 'meloetta',
    'shaymin-land': 'shaymin',
    'tornadus-incarnate': 'tornadus',
    'thundurus-incarnate': 'thundurus',
    'landorus-incarnate': 'landorus',
    'enamorus-incarnate': 'enamorus',
    'giratina-altered': 'giratina',
    'dialga-pressure': 'dialga',
    'palkia-pressure': 'palkia',
    'basculin-red-striped': 'basculin',
    'basculin-blue-striped': 'basculin', // Smogon agrupa, PokeAPI separa
    'basculin-white-striped': 'basculin-white-striped', // Hisui sí tiene stats propios a veces
};

export const toSlug = (name: string): string => {
    if (!name) return '';

    // 1. Limpieza estándar
    let slug = name.toLowerCase().trim()
        .replace(/['’\.]/g, '') 
        .replace(/[:]/g, '')    
        .replace(/[^a-z0-9\s-]/g, '') 
        .replace(/\s+/g, '-');

    // 2. Diccionario Explícito (Prioridad Máxima)
    if (SMOGON_OVERRIDES[slug]) {
        return SMOGON_OVERRIDES[slug];
    }

    // 3. Reglas Generales de Sufijos
    if (slug.endsWith('-male')) return slug.replace('-male', '');
    if (slug.endsWith('-female')) return slug.replace('-female', '-f');
    if (slug.endsWith('-incarnate')) return slug.replace('-incarnate', '');
    if (slug.endsWith('-normal')) return slug.replace('-normal', '');
    if (slug.endsWith('-standard')) return slug.replace('-standard', '');
    if (slug.endsWith('-original')) return slug.replace('-original', '');
    
    // Regla extra de seguridad para máscaras si no entraron en el diccionario
    if (slug.startsWith('ogerpon') && slug.endsWith('-mask')) {
        const withoutMask = slug.replace('-mask', '');
        return withoutMask === 'ogerpon-teal' ? 'ogerpon' : withoutMask;
    }

    return slug;
};