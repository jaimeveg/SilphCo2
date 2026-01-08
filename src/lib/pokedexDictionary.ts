export type Lang = 'es' | 'en';

export const POKEDEX_DICTIONARY = {
  es: {
    labels: {
      // --- DATOS BÁSICOS ---
      abilities: "Habilidades",
      height: "ALT",
      weight: "PES",
      gen: "GEN",
      morph: "VARIANTE:",
      local_id: "ID LOCAL",
      system_context: "SISTEMA",
      type: "TIPO",

      // --- TÍTULOS ---
      stats_title: "MOTOR DE ESTADÍSTICAS",
      evo_title: "SECUENCIA GENÉTICA",
      loc_title: "MATRIZ DE HÁBITAT",

      // --- STATS ---
      level: "NIVEL",
      nature: "NATURALEZA",
      ivs: "IVs",
      evs: "EVs",
      stats_base: "BASE",
      stats_real: "REAL",
      total: "Total",

      // --- EVOLUTION ---
      evo_chain: "CADENA EVOLUTIVA",
      evo_branched: "RAMIFICACIÓN DETECTADA",
      evo_target: "SELECCIONAR OBJETIVO",
      no_evo: "ORGANISMO SIN EVOLUCIÓN CONOCIDA",
      
      // --- LOCATION MATRIX (RESTAURADO) ---
      locations: "UBICACIONES",
      loc_method: "Método",
      loc_chance: "Prob.",
      unknown_loc: "HÁBITAT DESCONOCIDO / EVENTO",
      no_data: "DATOS NO DISPONIBLES",

      // MÉTODOS DE EVOLUCIÓN
      evo_methods: {
        level: "Nivel",
        trade: "Intercambio",
        item: "Objeto",
        happiness: "Amistad",
        affection: "Afecto",
        beauty: "Belleza",
        time: "Hora",
        location: "Lugar",
        move: "Movimiento",
        gender: "Género",
        upside_down: "Consola Al Revés",
        rain: "Lluvia",
        party: "Equipo",
        spin: "Girar",
        critical: "Críticos",
        damage: "Daño Recibido",
        scroll: "Caminar",
        shed: "Muda (Espacio + Ball)",
        unknown: "???"
      },

      // AUDITORÍA COMPLETA (OVERRIDES)
      evo_overrides: {
        rage_fist: "Usar Puño Furia x20",
        bisharp_leaders: "Vencer 3 Líderes Bisharp",
        coins: "999 Monedas Gimmighoul",
        steps: "Caminar 1000 pasos (Let's Go)",
        union_circle: "Círculo Unión (Lvl 38+)",
        combat: "Nivel 25 (En combate)",
        stone_fire: "Piedra Fuego",
        stone_thunder: "Piedra Trueno",
        syrupy_apple: "Objeto: Manzana Melosa",
        dragon_cheer: "Subir Nivel (Bramido Dragón)",
        teacup: "Objeto: Taza de Té",
        metal_alloy: "Objeto: Metal Compuesto",
        galar_crits: "3 Críticos en un combate",
        galar_damage: "Perder 49+ PS y cruzar puente",
        hisui_barrage: "Mil Púas Tóxicas (Estilo Fuerte) x20",
        hisui_psyshield: "Asalto Barrera (Estilo Ágil) x20",
        hisui_recoil: "Perder 294 PS por recoil",
        scroll_dark: "Manuscrito Sombras",
        scroll_water: "Manuscrito Aguas",
        black_augurite: "Objeto: Mineral Negro"
      },
      
      evo_tooltips: {
        upside_down: "Sostén el dispositivo boca abajo al subir de nivel (Nivel 30+).",
        rain: "Requiere clima lluvioso en el mundo abierto.",
        beauty: "Sube la condición 'Belleza' al máximo (Concursos).",
        affection: "Requiere 2 corazones de afecto (Poké Recreo/Campamento).",
        ancient_power: "Debe conocer el movimiento 'Poder Pasado'.",
        party_remoraid: "Debe haber un Remoraid en el equipo.",
        dark_type: "Debe haber un Pokémon de tipo Siniestro en el equipo.",
        hold_item: "Equipado",
        day: "Día",
        night: "Noche",
        shed: "Nivel 20, con 1 espacio libre en el equipo y 1 Poké Ball en la bolsa."
      },

      next_evo: "SIGUIENTE",
      prev_evo: "ANTERIOR",
      variant_select: "MÉTODO:"
    },

    regions: {
      NATIONAL: "NACIONAL", KANTO: "KANTO", JOHTO: "JOHTO", HOENN: "HOENN",
      SINNOH: "SINNOH", UNOVA: "TESELIA", KALOS: "KALOS", ALOLA: "ALOLA",
      GALAR: "GALAR", HISUI: "HISUI", PALDEA: "PALDEA"
    },

    types: {
      normal: "Normal", fire: "Fuego", water: "Agua", grass: "Planta",
      electric: "Eléctrico", ice: "Hielo", fighting: "Lucha", poison: "Veneno",
      ground: "Tierra", flying: "Volador", psychic: "Psíquico", bug: "Bicho",
      rock: "Roca", ghost: "Fantasma", dragon: "Dragón", steel: "Acero",
      dark: "Siniestro", fairy: "Hada", stellar: "Estelar", unknown: "???"
    },

    natures: {
      hardy: "Fuerte", lonely: "Huraña", brave: "Audaz", adamant: "Firme", naughty: "Pícara",
      bold: "Osada", docile: "Dócil", relaxed: "Plácida", impish: "Agitada", lax: "Floja",
      timid: "Miedosa", hasty: "Activa", serious: "Seria", jolly: "Alegre", naive: "Ingenua",
      modest: "Modesta", mild: "Afable", quiet: "Mansa", bashful: "Tímida", rash: "Alocada",
      calm: "Serena", gentle: "Amable", sassy: "Grosera", careful: "Cauta", quirky: "Rara"
    },

    getDexLabel: (regionKey: string) => {
      // @ts-ignore
      const name = POKEDEX_DICTIONARY.es.regions[regionKey] || regionKey;
      return regionKey === 'NATIONAL' ? 'POKÉDEX NACIONAL' : `POKÉDEX DE ${name}`;
    },
    getEvoTrigger: (trigger: string) => {
        const map: Record<string, string> = { 'level-up': 'Nivel', 'trade': 'Intercambio', 'use-item': 'Objeto', 'shed': 'Muda' };
        return map[trigger] || 'Especial';
    }
  },

  en: {
    labels: {
      abilities: "Abilities",
      height: "HGT",
      weight: "WGT",
      gen: "GEN",
      morph: "MORPH_SEQ:",
      local_id: "LOCAL ID",
      system_context: "SYSTEM",
      type: "TYPE",

      stats_title: "STATS ENGINE",
      evo_title: "GENETIC SEQUENCE",
      loc_title: "HABITAT MATRIX",

      level: "LEVEL",
      nature: "NATURE",
      ivs: "IVs",
      evs: "EVs",
      stats_base: "BASE",
      stats_real: "REAL",
      total: "Total",

      evo_chain: "EVOLUTION CHAIN",
      evo_branched: "BRANCHED EVOLUTION DETECTED",
      evo_target: "SELECT EVOLUTION BRANCH",
      no_evo: "NO KNOWN EVOLUTION DATA",

      // --- LOCATION MATRIX (RESTORED) ---
      locations: "LOCATIONS",
      loc_method: "Method",
      loc_chance: "Odds",
      unknown_loc: "UNKNOWN HABITAT / EVENT",
      no_data: "NO DATA AVAILABLE",

      evo_methods: {
        level: "Level",
        trade: "Trade",
        item: "Item",
        happiness: "Friendship",
        affection: "Affection",
        beauty: "Beauty",
        time: "Time",
        location: "Location",
        move: "Move",
        gender: "Gender",
        upside_down: "Device Upside Down",
        rain: "Raining",
        party: "Party",
        spin: "Spin",
        critical: "Criticals",
        damage: "Recoil/Damage",
        scroll: "Walk",
        shed: "Shed (Slot + Ball)",
        unknown: "???"
      },

      evo_overrides: {
        rage_fist: "Use Rage Fist x20",
        bisharp_leaders: "Defeat 3 Bisharp Leaders",
        coins: "999 Gimmighoul Coins",
        steps: "Walk 1000 Steps (Let's Go)",
        union_circle: "Union Circle (Lvl 38+)",
        combat: "Level 25 (Combat)",
        stone_fire: "Fire Stone",
        stone_thunder: "Thunder Stone",
        syrupy_apple: "Item: Syrupy Apple",
        dragon_cheer: "Level Up (Dragon Cheer)",
        teacup: "Item: Teacup",
        metal_alloy: "Item: Metal Alloy",
        galar_crits: "3 Critical Hits in one battle",
        galar_damage: "Lose 49+ HP & under bridge",
        hisui_barrage: "Barb Barrage (Strong) x20",
        hisui_psyshield: "Psyshield Bash (Agile) x20",
        hisui_recoil: "Lose 294 HP from recoil",
        scroll_dark: "Scroll of Darkness",
        scroll_water: "Scroll of Waters",
        black_augurite: "Item: Black Augurite"
      },

      evo_tooltips: {
        upside_down: "Hold device upside down while leveling up (Level 30+).",
        rain: "Requires rainy weather in the overworld.",
        beauty: "Max out 'Beauty' condition (Contests).",
        affection: "Requires 2 hearts of Affection (Amie/Camp).",
        ancient_power: "Must learn 'Ancient Power'.",
        party_remoraid: "Remoraid must be in the party.",
        dark_type: "Dark-type Pokémon must be in the party.",
        hold_item: "Holding",
        day: "Day",
        night: "Night",
        shed: "Level 20, with 1 empty party slot and 1 Poké Ball in bag."
      },

      next_evo: "NEXT",
      prev_evo: "PREV",
      variant_select: "METHOD:"
    },
    // ... regions, types, natures igual que 'es' pero en inglés ...
    regions: {
      NATIONAL: "NATIONAL", KANTO: "KANTO", JOHTO: "JOHTO", HOENN: "HOENN",
      SINNOH: "SINNOH", UNOVA: "UNOVA", KALOS: "KALOS", ALOLA: "ALOLA",
      GALAR: "GALAR", HISUI: "HISUI", PALDEA: "PALDEA"
    },
    types: {
      normal: "Normal", fire: "Fire", water: "Water", grass: "Grass",
      electric: "Electric", ice: "Ice", fighting: "Fighting", poison: "Poison",
      ground: "Ground", flying: "Flying", psychic: "Psychic", bug: "Bug",
      rock: "Rock", ghost: "Ghost", dragon: "Dragon", steel: "Steel",
      dark: "Dark", fairy: "Fairy", stellar: "Stellar", unknown: "???"
    },
    natures: {
      hardy: "Hardy", lonely: "Lonely", brave: "Brave", adamant: "Adamant", naughty: "Naughty",
      bold: "Bold", docile: "Docile", relaxed: "Relaxed", impish: "Impish", lax: "Lax",
      timid: "Timid", hasty: "Hasty", serious: "Serious", jolly: "Jolly", naive: "Naive",
      modest: "Modest", mild: "Mild", quiet: "Quiet", bashful: "Bashful", rash: "Rash",
      calm: "Calm", gentle: "Gentle", sassy: "Sassy", careful: "Careful", quirky: "Quirky"
    },
    getDexLabel: (regionKey: string) => {
      // @ts-ignore
      const name = POKEDEX_DICTIONARY.en.regions[regionKey] || regionKey;
      return `${name} DEX`;
    },
    getEvoTrigger: (trigger: string) => {
        const map: Record<string, string> = { 'level-up': 'Level', 'trade': 'Trade', 'use-item': 'Item', 'shed': 'Shed' };
        return map[trigger] || 'Special';
    }
  }
};