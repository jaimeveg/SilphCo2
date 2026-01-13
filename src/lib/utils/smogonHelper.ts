// src/lib/utils/smogonHelper.ts

export interface TierOption {
    label: string;
    value: string;
}

export interface CategoryConfig {
    label: string;
    tiers: TierOption[];
}

export interface GenConfig {
    label: string;
    categories: Record<string, CategoryConfig>;
}

export type SmogonStructure = Record<string, GenConfig>;

// ORDEN DE PRIORIDAD (De más jugado a menos - Lo que queremos ver arriba)
const TIER_PRIORITY = [
    'OverUsed (OU)',
    'Ubers',
    'UnderUsed (UU)',
    'RarelyUsed (RU)',
    'NeverUsed (NU)',
    'PU',
    'Little Cup (LC)',
    'Monotype',
    'Anything Goes (AG)',
    'National Dex',
    'Doubles OU',
    'VGC'
];

// LISTA NEGRA AGRESIVA (Formatos nicho/OMs a ocultar)
const IGNORED_FORMATS = [
    '1v1', '2v2', 'CAP', 'NFE', 'Zu', 'Free-For-All', 
    'Balanced Hackmons', 'Pure Hackmons', 'Hackmons',
    'Almost Any Ability', 'Mix and Mega', 'Stabmons',
    'Godly Gift', 'Inheritance', 'Partners in Crime', 
    'Camomons', 'Cross Evolution', 'Fortemons', 'Trademarked',
    'Sketchmons', 'Tier Shift', 'Metagamiate', 'Megamons',
    'Nature Swap', 'Linked', 'Revelation Mons', 'Sharing is Caring',
    'The Loser', 'Inverse', 'Draft', 'Custom', 'Lets Go'
];

export const parseFormatsFromIndex = (formatsRaw: string[]): SmogonStructure => {
    const structure: SmogonStructure = {};

    // 1. Limpieza y Filtrado robusto
    const cleanFormats = formatsRaw
        .map(f => f.replace('.json', ''))
        .filter(f => {
            const label = formatToLabel(f, 0).toLowerCase();
            // Si contiene alguna palabra de la lista negra, fuera.
            // Usamos includes para pillar variaciones como "Gen 9 Balanced Hackmons"
            return !IGNORED_FORMATS.some(ignored => label.includes(ignored.toLowerCase()));
        });

    // 2. Ordenar generaciones (9, 8, 7...)
    const sortedFormats = cleanFormats.sort((a, b) => extractGen(a) - extractGen(b)).reverse();

    sortedFormats.forEach(formatId => {
        const genNum = extractGen(formatId);
        if (genNum === 0) return;

        const genKey = `gen${genNum}`;
        const isDoubles = formatId.includes('doubles') || formatId.includes('vgc');
        const modeKey = isDoubles ? 'doubles' : 'singles';

        if (!structure[genKey]) {
            structure[genKey] = {
                label: `Gen ${genNum}`,
                categories: {
                    singles: { label: 'Singles', tiers: [] },
                    doubles: { label: 'Doubles / VGC', tiers: [] }
                }
            };
        }

        structure[genKey].categories[modeKey].tiers.push({
            label: formatToLabel(formatId, genNum),
            value: formatId
        });
    });

    // 3. Ordenamiento y Limpieza Final
    Object.keys(structure).forEach(gen => {
        const cats = structure[gen].categories;

        // Función de sort basada en prioridad
        const sortTiers = (a: TierOption, b: TierOption) => {
            // Buscamos el índice de prioridad basándonos en si el label CONTIENE la string prioritaria
            const idxA = TIER_PRIORITY.findIndex(p => a.label.includes(p.split(' ')[0])); 
            const idxB = TIER_PRIORITY.findIndex(p => b.label.includes(p.split(' ')[0]));
            
            // Si ambos están en prioridad, gana el índice menor (más arriba en la lista)
            if (idxA !== -1 && idxB !== -1) return idxA - idxB;
            // Si solo A está, A va primero
            if (idxA !== -1) return -1;
            // Si solo B está, B va primero
            if (idxB !== -1) return 1;
            
            // Si ninguno está en prioridad, alfabético
            return a.label.localeCompare(b.label);
        };

        if (cats.singles) {
            cats.singles.tiers.sort(sortTiers);
            if (cats.singles.tiers.length === 0) delete (cats as any).singles;
        }
        if (cats.doubles) {
            cats.doubles.tiers.sort(sortTiers);
            if (cats.doubles.tiers.length === 0) delete (cats as any).doubles;
        }
    });

    return structure;
};

// --- HELPERS ---
function extractGen(format: string): number {
    const match = format.match(/^gen(\d+)/i);
    return match ? parseInt(match[1]) : 0;
}

function formatToLabel(format: string, genNum: number): string {
    const prefix = `gen${genNum}`;
    let label = format.replace(prefix, '');
    
    if (label.startsWith('vgc')) return label.replace(/vgc(\d{4})(.*)/, 'VGC $1 $2').toUpperCase().trim();
    if (label.startsWith('doubles')) label = label.replace('doubles', 'Doubles ');
    if (label.startsWith('battle')) return 'Battle Stadium'; // Simplificación para BSS/BSD
    
    const TIERS: Record<string, string> = {
        'ou': 'OverUsed (OU)',
        'uu': 'UnderUsed (UU)',
        'ru': 'RarelyUsed (RU)',
        'nu': 'NeverUsed (NU)',
        'pu': 'PU',
        'lc': 'Little Cup (LC)',
        'monotype': 'Monotype',
        'ubers': 'Ubers',
        'ag': 'Anything Goes (AG)',
        'nationaldex': 'National Dex',
        'nationaldexou': 'National Dex OU',
        'nationaldexubers': 'National Dex Ubers'
    };

    if (TIERS[label]) return TIERS[label];
    // Capitalizar primera letra
    return label.charAt(0).toUpperCase() + label.slice(1);
}