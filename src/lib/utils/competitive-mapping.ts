// src/lib/utils/competitive-mapping.ts

/**
 * DICCIONARIO MAESTRO DE FORMAS COMPETITIVAS (Smogon Slug -> PokeAPI ID)
 * Mapea nombres de formatos competitivos a los IDs de "variantes" de PokeAPI.
 * Incluye formas de género, regionales, megas y variantes de combate.
 */
export const COMPETITIVE_FORM_IDS: Record<string, number> = {
    // --- CASOS CON APÓSTROFES (Smogon Keys) ---
    "farfetch'd": 83,
    "farfetch'd-galar": 10166,
    "sirfetch'd": 865,
    "oricorio-pa'u": 743,

    // --- SMOGON SIMPLIFICATIONS (Formas base implícitas) ---
    'minior': 774,              // Meteor
    'minior-meteor': 774,
    'minior-core': 10136,
    'oricorio': 741,            // Baile
    'oricorio-baile': 741,
    'oricorio-pom-pom': 742,
    'oricorio-sensu': 744,
    'darmanitan': 555,          // Standard
    'darmanitan-galar': 10177,
    'darmanitan-zen': 10017,
    'darmanitan-galar-zen': 10178,
    'eiscue': 875,              // Ice
    'eiscue-ice': 875,
    'eiscue-noice': 10185,
    'mimikyu': 778,             // Disguised
    'mimikyu-disguised': 778,
    'mimikyu-busted': 10143,
    'wishiwashi': 746,          // Solo
    'wishiwashi-solo': 746,
    'wishiwashi-school': 10127,
    'basculin': 550,            // Red
    'basculin-red-striped': 550,
    'basculin-blue-striped': 10016,
    'basculin-white-striped': 10247,
    'lycanroc': 745,            // Midday
    'lycanroc-midday': 745,
    'lycanroc-midnight': 10126,
    'lycanroc-dusk': 10152,
    'toxtricity': 849,          // Amped
    'toxtricity-amped': 849,
    'toxtricity-low-key': 10184,
    'morpeko': 877,             // Full Belly
    'morpeko-hangry': 10187,
    'pumpkaboo': 710,           // Average
    'gourgeist': 711,           // Average
    'aegislash': 681,           // Shield
    'aegislash-blade': 10026,
    'keldeo': 647,              // Ordinary
    'keldeo-resolute': 10024,
    'zygarde': 718,             // 50%
    'urshifu': 892,             // Single
    'landorus': 645,            // Incarnate
    'tornadus': 641,
    'thundurus': 642,
    'enamorus': 905,

    // --- GEN 9: GÉNERO & FORMAS ---
    'oinkologne': 916,
    'oinkologne-m': 916,
    'oinkologne-f': 10254,
    'maushold': 925,
    'maushold-four': 925,
    'maushold-three': 10256,
    'dudunsparce': 982,
    'dudunsparce-three-segment': 10255,
    'squawkabilly': 931,
    'squawkabilly-blue': 10260,
    'squawkabilly-yellow': 10261,
    'squawkabilly-white': 10262,
    'tatsugiri': 978,
    'tatsugiri-droopy': 10264,
    'tatsugiri-stretchy': 10265,
    'gimmighoul': 999,
    'gimmighoul-roaming': 10263,
    'palafin': 964,
    'palafin-hero': 10257,

    // --- GEN 8: GÉNERO & FORMAS ---
    'indeedee': 876,
    'indeedee-m': 876,
    'indeedee-f': 10186,
    'basculegion': 902,
    'basculegion-m': 902,
    'basculegion-f': 10248,

    // --- GEN 6/7: GÉNERO & FORMAS ---
    'meowstic': 678,
    'meowstic-m': 678,
    'meowstic-f': 10025,

    // --- GEN 9: DISCO & MÁSCARAS ---
    'ogerpon': 1017,            // Teal
    'ogerpon-teal': 1017,
    'ogerpon-wellspring': 10273,
    'ogerpon-hearthflame': 10274,
    'ogerpon-cornerstone': 10275,
    'ursaluna': 901,
    'ursaluna-bloodmoon': 10272,
    'tauros-paldea-combat': 10250,
    'tauros-paldea-blaze': 10251,
    'tauros-paldea-aqua': 10252,
    'tauros-paldea': 10250,
    'wooper-paldea': 10253,
    'terapagos': 1024,
    'terapagos-terastal': 10276,
    'terapagos-stellar': 10277,

    // --- LEGENDS ARCEUS (HISUI) ---
    'growlithe-hisui': 10229,
    'arcanine-hisui': 10230,
    'voltorb-hisui': 10231,
    'electrode-hisui': 10232,
    'typhlosion-hisui': 10233,
    'qwilfish-hisui': 10234,
    'sneasel-hisui': 10235,
    'samurott-hisui': 10236,
    'lilligant-hisui': 10237,
    'zorua-hisui': 10238,
    'zoroark-hisui': 10239,
    'braviary-hisui': 10240,
    'sliggoo-hisui': 10241,
    'goodra-hisui': 10242,
    'avalugg-hisui': 10243,
    'decidueye-hisui': 10244,
    'dialga-origin': 10245,
    'palkia-origin': 10246,

    // --- GALAR ---
    'meowth-galar': 10161,
    'ponyta-galar': 10162,
    'rapidash-galar': 10163,
    'slowpoke-galar': 10164,
    'slowbro-galar': 10171,
    'slowking-galar': 10172,
    'farfetchd-galar': 10166,
    'weezing-galar': 10167,
    'mr-mime-galar': 10168,
    'articuno-galar': 10174,
    'zapdos-galar': 10175,
    'moltres-galar': 10176,
    'corsola-galar': 10173,
    'zigzagoon-galar': 10177,
    'linoone-galar': 10178,
    'darumaka-galar': 10179,
    'yamask-galar': 10182,
    'stunfisk-galar': 10183,
    'urshifu-single-strike': 892,
    'urshifu-rapid-strike': 10191, // ID Galar file
    'calyrex-ice': 10193,          // ID Galar file
    'calyrex-shadow': 10194,       // ID Galar file
    'zacian': 888,
    'zamazenta': 889,
    'zacian-crowned': 10188,
    'zamazenta-crowned': 10189,
    'eternatus-eternamax': 10190,
    'enamorus-therian': 10249,
    'zarude-dada': 10192,

    // --- ALOLA ---
    'rattata-alola': 10091,
    'raticate-alola': 10092,
    'raichu-alola': 10100,
    'sandshrew-alola': 10101,
    'sandslash-alola': 10102,
    'vulpix-alola': 10103,
    'ninetales-alola': 10104,
    'diglett-alola': 10105,
    'dugtrio-alola': 10106,
    'meowth-alola': 10107,
    'persian-alola': 10108,
    'geodude-alola': 10109,
    'graveler-alola': 10110,
    'golem-alola': 10111,
    'grimer-alola': 10112,
    'muk-alola': 10113,
    'exeggutor-alola': 10114,
    'marowak-alola': 10115,

    // --- MEGAS ---
    'venusaur-mega': 10033,
    'charizard-mega-x': 10034,
    'charizard-mega-y': 10035,
    'blastoise-mega': 10036,
    'beedrill-mega': 10090,
    'pidgeot-mega': 10073,
    'alakazam-mega': 10037,
    'slowbro-mega': 10071,
    'gengar-mega': 10038,
    'kangaskhan-mega': 10039,
    'pinsir-mega': 10040,
    'gyarados-mega': 10041,
    'aerodactyl-mega': 10042,
    'mewtwo-mega-x': 10043,
    'mewtwo-mega-y': 10044,
    'ampharos-mega': 10045,
    'steelix-mega': 10072,
    'scizor-mega': 10046,
    'heracross-mega': 10047,
    'houndoom-mega': 10048,
    'tyranitar-mega': 10049,
    'sceptile-mega': 10065,
    'blaziken-mega': 10066,
    'swampert-mega': 10067,
    'gardevoir-mega': 10051,
    'sableye-mega': 10068,
    'mawile-mega': 10055,
    'aggron-mega': 10056,
    'medicham-mega': 10057,
    'manectric-mega': 10058,
    'sharpedo-mega': 10069,
    'camerupt-mega': 10070,
    'altaria-mega': 10060,
    'banette-mega': 10059,
    'absol-mega': 10061,
    'glalie-mega': 10074,
    'salamence-mega': 10089,
    'metagross-mega': 10076,
    'latias-mega': 10062,
    'latios-mega': 10063,
    'rayquaza-mega': 10079,
    'lopunny-mega': 10088,
    'garchomp-mega': 10064,
    'lucario-mega': 10059,
    'abomasnow-mega': 10060,
    'gallade-mega': 10087,
    'audino-mega': 10086,
    'diancie-mega': 10075,

    // --- PRIMAL & FORMAS CLÁSICAS ---
    'kyogre-primal': 10077,
    'groudon-primal': 10078,
    'greninja-ash': 10117,
    'floette-eternal': 10061, 
    'rotom-heat': 10007,
    'rotom-wash': 10008,
    'rotom-frost': 10009,
    'rotom-fan': 10010,
    'rotom-mow': 10011,
    'deoxys-attack': 10001,
    'deoxys-defense': 10002,
    'deoxys-speed': 10003,
    'wormadam-sandy': 10004,
    'wormadam-trash': 10005,
    'giratina-origin': 10007,
    'shaymin-sky': 10006,
    'tornadus-therian': 10019,
    'thundurus-therian': 10020,
    'landorus-therian': 10021,
    'kyurem-black': 10022,
    'kyurem-white': 10023,
    'meloetta-pirouette': 10018,
    'pumpkaboo-small': 10027,
    'pumpkaboo-large': 10028,
    'pumpkaboo-super': 10029,
    'gourgeist-small': 10030,
    'gourgeist-large': 10031,
    'gourgeist-super': 10032,
    'zygarde-10': 10118,
    'zygarde-complete': 10120,
    'necrozma-dusk': 10155,
    'necrozma-dawn': 10156,
    'necrozma-ultra': 10157,
    'gastrodon-east': 10031,
};

// Helper
export const resolvePokemonId = (slug: string, dexMap?: Record<string, number>): number | null => {
    if (COMPETITIVE_FORM_IDS[slug]) return COMPETITIVE_FORM_IDS[slug];
    if (dexMap && dexMap[slug]) return dexMap[slug];
    return null;
};