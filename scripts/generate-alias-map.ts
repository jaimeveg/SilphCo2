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
    "oricorio-pa'u": 10124,

    // Simplificaciones de Smogon (Asumen forma base)
    'minior': 774,
    'minior-meteor': 774,
    'minior-core': 10136,
    'oricorio': 741,
    'oricorio-baile': 741,
    'oricorio-pom-pom': 10123,
    'oricorio-sensu': 10125,
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
    'lycanroc-dusk': 10152,
    'wishiwashi': 746,
    'wishiwashi-solo': 746,
    'wishiwashi-school': 10127,

    // Nombres de Género
    'indeedee': 876,
    'indeedee-m': 876,
    'indeedee-male': 876,
    'indeedee-f': 10186,
    'indeedee-female': 10185,
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
    'oinkologne-f': 10254,
    'oinkologne-female': 10254,

    // Urshifu
    'urshifu': 892,
    'urshifu-single-strike': 892,
    'urshifu-single-strike-style': 892,
    'urshifu-rapid-strike': 10191,
    'urshifu-rapid-strike-style': 10191,

    // Ogerpon
    'ogerpon': 1017,
    'ogerpon-teal': 1017,
    'ogerpon-teal-mask': 1017,
    'ogerpon-wellspring': 10273,
    'ogerpon-wellspring-mask': 10273,
    'ogerpon-hearthflame': 10274,
    'ogerpon-hearthflame-mask': 10274,
    'ogerpon-cornerstone': 10275,
    'ogerpon-cornerstone-mask': 10275,

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
    'landorus-therian': 10021,
    'thundurus': 642,
    'thundurus-incarnate': 642,
    'thundurus-therian': 10020,
    'tornadus': 641,
    'tornadus-incarnate': 641,
    'tornadus-therian': 10019,
    'enamorus': 905,
    'enamorus-incarnate': 905,
    'enamorus-therian': 10249,

    // Formas origen
    'giratina': 487,
    'giratina-altered': 10007,
    'dialga': 483,
    'palkia': 484,

    // Varios
    'basculin': 550,
    'basculin-red-striped': 550,
    'basculin-blue-striped': 10016,
    'basculin-white-striped': 10247,
    'meloetta': 648,
    'meloetta-aria': 648,
    'meloetta-pirouette': 10018,
    'gourgeist': 711,
    'gourgeist-average': 711,
    'pumpkaboo': 710,
    'pumpkaboo-average': 710,
    'zacian': 791,
    'zacian-crowned': 10188,
    'zamazenta': 792,
    'zamazenta-crowned': 10189,
    'calyrex': 898,
    'calyrex-ice': 10193,
    'calyrex-shadow': 10194,
    'palafin': 964,
    'palafin-zero': 964,
    'palafin-hero': 10256,
    'gimmighoul': 999,
    'gimmighoul-chest': 999,
    'gimmighoul-roaming': 10263,
    'terapagos': 1024,
    'terapagos-normal': 1024,
    'terapagos-terastal': 10276,
    'terapagos-stellar': 10277,

    "arceus-bug": 493,
    "arceus-dark": 493,
    "arceus-dragon": 493,
    "arceus-electric": 493,
    "arceus-fairy": 493,
    "arceus-fighting": 493,
    "arceus-fire": 493,
    "arceus-flying": 493,
    "arceus-ghost": 493,
    "arceus-grass": 493,
    "arceus-ground": 493,
    "arceus-ice": 493,
    "arceus-poison": 493,
    "arceus-psychic": 493,
    "arceus-rock": 493,
    "arceus-steel": 493,
    "arceus-water": 493,
    "deoxys": 386,
    "dudunsparce": 982,
    "eiscue": 875,
    "empty": 132,
    "maushold": 925,
    "mimikyu": 778,
    "morpeko": 877,
    "necrozma-dawn-wings": 10156,
    "necrozma-dusk-mane": 10155,
    "rockruff-dusk": 744,
    "shaymin": 492,
    "silvally-bug": 773,
    "silvally-dark": 773,
    "silvally-dragon": 773,
    "silvally-electric": 773,
    "silvally-fairy": 773,
    "silvally-fighting": 773,
    "silvally-fire": 773,
    "silvally-flying": 773,
    "silvally-ghost": 773,
    "silvally-grass": 773,
    "silvally-ground": 773,
    "silvally-ice": 773,
    "silvally-poison": 773,
    "silvally-psychic": 773,
    "silvally-rock": 773,
    "silvally-steel": 773,
    "silvally-water": 773,
    "squawkabilly": 931,
    "tatsugiri": 978,
    "toxtricity": 849,
    "wormadam": 413,
    "zygarde": 718,

    //REVISAR FORMA TOTEM
    "marowak-alola-totem": 10149,
    "mimikyu-totem": 10144,

    "arcanine-hisuian": 10230,
    "articuno-galarian": 10169,
    "goodra-hisuian": 10242,
    "lilligant-hisuian": 10237,
    "moltres-galarian": 10171,
    "muk-alolan": 10113,
    "ninetales-alolan": 10104,
    "sinistcha-masterpiece": 1013,
    "sinistcha-unremarkable": 1013,
    "slowking-galarian": 10172,
    "weezing-galarian": 10167,
    "zapdos-galarian": 10170,
    "zoroark-hisuian": 10239,

    "dugtrio-alolan": 10106,
    "rotom-heat-rotom": 10008,
    "rotom-wash-rotom": 10009,
    "rotom-frost-rotom": 10010,
    "rotom-fan-rotom": 10011,
    "rotom-mow-rotom": 10012,
    "typhlosion-hisuian": 10233,

    "exeggutor-alolan": 10114,
    "samurott-hisuian": 10236,
    "golem-alolan": 10111
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