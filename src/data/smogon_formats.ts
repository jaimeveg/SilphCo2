// src/data/smogon_formats.ts

export const SMOGON_FORMATS = {
    'gen9': {
        label: 'Gen 9 (Paldea)',
        categories: {
            'singles': {
                label: 'Singles',
                tiers: [
                    { label: 'OverUsed (OU)', value: 'gen9ou' },
                    { label: 'Ubers', value: 'gen9ubers' },
                    { label: 'UnderUsed (UU)', value: 'gen9uu' },
                    { label: 'RarelyUsed (RU)', value: 'gen9ru' },
                    { label: 'NeverUsed (NU)', value: 'gen9nu' },
                    { label: 'Monotype', value: 'gen9monotype' },
                    { label: 'Anything Goes', value: 'gen9ag' }
                ]
            },
            'doubles': {
                label: 'Doubles / VGC',
                tiers: [
                    { label: 'Doubles OU', value: 'gen9doublesou' },
                    { label: 'VGC 2024 Reg G', value: 'gen9vgc2024regg' },
                    { label: 'VGC 2024 Reg F', value: 'gen9vgc2024regf' }
                ]
            }
        }
    },
    'gen8': {
        label: 'Gen 8 (Galar)',
        categories: {
            'singles': {
                label: 'Singles',
                tiers: [
                    { label: 'OverUsed (OU)', value: 'gen8ou' },
                    { label: 'Ubers', value: 'gen8ubers' },
                    { label: 'UnderUsed (UU)', value: 'gen8uu' }
                ]
            },
            'doubles': {
                label: 'Doubles',
                tiers: [
                    { label: 'Doubles OU', value: 'gen8doublesou' },
                    { label: 'VGC 2022', value: 'gen8vgc2022' }
                ]
            }
        }
    }
    // Puedes añadir más gens siguiendo este esquema
};