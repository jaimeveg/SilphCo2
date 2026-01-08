// src/lib/pokedexDictionary.ts

export type Lang = 'es' | 'en';

export const POKEDEX_DICTIONARY = {
  es: {
    labels: {
      // ...
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
      locations: "UBICACIONES",
      loc_method: "Método",
      loc_chance: "Prob.",
      unknown_loc: "HÁBITAT DESCONOCIDO / EVENTO",
      no_data: "DATOS NO DISPONIBLES",
      next_evo: "SIGUIENTE",
      prev_evo: "ANTERIOR",
      variant_select: "MÉTODO:",
      unavailable: "NO DISPONIBLE",

      evo_methods: {
        level: "Nivel",
        trade: "Intercambio",
        item: "Usar Objeto",
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

      evo_overrides: {
        rage_fist: "Usar Puño Furia x20",
        bisharp_leaders: "Vencer 3 Líderes Bisharp",
        coins: "999 Monedas Gimmighoul",
        steps: "Caminar 1000 pasos (Let's Go)",
        union_circle: "Círculo Unión (Lvl 38+)",
        combat: "Nivel 25 (En combate)",
        stone_fire: "Usar: Piedra Fuego",
        stone_thunder: "Usar: Piedra Trueno",
        syrupy_apple: "Usar: Manzana Melosa",
        dragon_cheer: "Subir Nivel (Bramido Dragón)",
        teacup: "Usar: Taza de Té",
        'cracked-pot': "Usar: Tetera Agrietada",
        'chipped-pot': "Usar: Tetera Rota (Forma Genuina)",
        'unremarkable-teacup': "Usar: Cuenco Mediocre",
        'masterpiece-teacup': "Usar: Cuenco Exquisito (Forma Maestra)",
        metal_alloy: "Usar: Metal Compuesto",
        galar_crits: "3 Críticos en un combate",
        galar_damage: "Perder 49+ PS y cruzar Zona Silvestre",
        hisui_barrage: "Mil Púas Tóxicas (Estilo Fuerte) x20",
        hisui_psyshield: "Asalto Barrera (Estilo Ágil) x20",
        hisui_recoil: "Perder 294 PS por recoil sin debilitarse",
        black_augurite: "Usar: Mineral Negro",
        peat_block: "Usar: Bloque de Turba (Luna Llena)",
        'scroll-of-darkness': "Usar: Manuscrito Sombras",
        'scroll-of-waters': "Usar: Manuscrito Aguas",
        sweet_apple: "Usar: Manzana Dulce",
        tart_apple: "Usar: Manzana Ácida",
        galar_cuff: "Usar: Brazal Galano",
        galar_wreath: "Usar: Corona Galana",
        alola_rat: "Nivel 20 (Noche)",
        alola_raichu: "Usar: Piedra Trueno (En Alola)",
        alola_marowak: "Nivel 28 (Noche en Alola)",
        alola_exeggutor: "Usar: Piedra Hoja (En Alola)",
        rockruff_dusk: "Nivel 25 (Crepúsculo + Ritmo Propio)",
        goodra_hisui: "Nivel 50 (Lluvia o Niebla en Hisui)",
        sneasler_evo: "Usar: Garra Afilada (Día)",
        weavile_evo: "Usar: Garra Afilada (Noche)",
        feebas_prism: "Intercambio (Escama Bella)",
        feebas_beauty: "Belleza Máxima (Pokochos)",
        mantyke_party: "Tener Remoraid en equipo",
        pancham_party: "Tener tipo Siniestro en equipo",
        cosmoem_sun: "Nivel 53 (Juego Sol/Ultra Sol/Espada)",
        cosmoem_moon: "Nivel 53 (Juego Luna/Ultra Luna/Escudo)"
      },

      evo_locations: {
        magnetic_field: {
            label: "CAMPO MAGNÉTICO",
            tooltip: {
                1: "N/A", 2: "N/A", 3: "N/A",
                4: "Sinnoh: Monte Corona (Interior)",
                5: "Unova: Cueva Electrolit",
                6: "Kalos: Ruta 13 / Hoenn: New Mauville",
                7: "Alola: Cañón de Poni",
                8: "Hisui: Ladera Corona / Galar: Piedra Trueno",
                9: "Paldea: Piedra Trueno"
            }
        },
        moss_rock: {
            label: "ROCA MUSGO",
            tooltip: {
                1: "N/A", 2: "N/A", 3: "N/A",
                4: "Sinnoh: Bosque Vetusto",
                5: "Unova: Bosque Azulejo",
                6: "Kalos: Ruta 20 / Hoenn: Bosque Petalia",
                7: "Alola: Jungla Umbría",
                8: "Hisui: Campo Prístino / Galar: Piedra Hoja",
                9: "Paldea: Piedra Hoja"
            }
        },
        ice_rock: {
            label: "ROCA HIELO",
            tooltip: {
                1: "N/A", 2: "N/A", 3: "N/A",
                4: "Sinnoh: Ruta 217",
                5: "Unova: Monte Tuerca (Nivel inferior)",
                6: "Kalos: Gruta Helada / Hoenn: Cueva Cardumen (Marea Baja)",
                7: "Alola: Monte Lanakila",
                8: "Hisui: Témpano Avalugg / Galar: Piedra Hielo",
                9: "Paldea: Piedra Hielo"
            }
        },
        mt_coronet: {
            label: "MONTE CORONA",
            tooltip: {
                4: "Sinnoh: Subir de nivel dentro del Monte Corona",
                8: "Hisui: Ladera Corona",
                9: "N/A"
            }
        }
      },
      
      evo_conditions: {
        atk_gt_def: "ATK > DEF",
        atk_lt_def: "ATK < DEF",
        atk_eq_def: "ATK = DEF",
        party_dark: "Equipo: Siniestro",
        party_remoraid: "Equipo: Remoraid",
        trade_prism: "Intercambio + Escama",
        beauty_max: "Belleza Max",
        galar_only: "Forma Galar",
        hisui_only: "Forma Hisui",
        paldea_only: "Forma Paldea",
        female_only: "Solo Hembra",
        male_only: "Solo Macho"
      },
      
      evo_tooltips: {
        upside_down: "Sostén el dispositivo boca abajo al subir de nivel (Nivel 30+).",
        rain: "Requiere clima lluvioso en el mundo abierto.",
        beauty: "Sube la condición 'Belleza' al máximo (Concursos).",
        affection: "Requiere 2 corazones de afecto (Poké Recreo/Campamento) o Amistad Alta (Gen 8+).",
        ancient_power: "Debe conocer el movimiento 'Poder Pasado'.",
        party_remoraid: "Debe haber un Remoraid en el equipo.",
        dark_type: "Debe haber un Pokémon de tipo Siniestro en el equipo.",
        hold_item: "Equipar Objeto",
        day: "Día",
        night: "Noche",
        shed: "Nivel 20, con 1 espacio libre en el equipo y 1 Poké Ball en la bolsa.",
        spin: "Girar al personaje tras un combate (varía según duración y hora).",
        crit: "Asestar 3 golpes críticos en un solo combate."
      }
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
        const map: Record<string, string> = { 'level-up': 'Nivel', 'trade': 'Intercambio', 'use-item': 'Usar Objeto', 'shed': 'Muda' };
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
      locations: "LOCATIONS",
      loc_method: "Method",
      loc_chance: "Odds",
      unknown_loc: "UNKNOWN HABITAT / EVENT",
      no_data: "NO DATA AVAILABLE",
      next_evo: "NEXT",
      prev_evo: "PREV",
      variant_select: "METHOD:",
      unavailable: "NOT AVAILABLE",

      evo_methods: {
        level: "Level",
        trade: "Trade",
        item: "Use Item",
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
        stone_fire: "Use: Fire Stone",
        stone_thunder: "Use: Thunder Stone",
        syrupy_apple: "Use: Syrupy Apple",
        dragon_cheer: "Level Up (Dragon Cheer)",
        teacup: "Use: Teacup",
        'cracked-pot': "Use: Cracked Pot",
        'chipped-pot': "Use: Chipped Pot (Authentic)",
        'unremarkable-teacup': "Use: Unremarkable Teacup",
        'masterpiece-teacup': "Use: Masterpiece Teacup (Masterpiece)",
        metal_alloy: "Use: Metal Alloy",
        galar_crits: "3 Critical Hits in one battle",
        galar_damage: "Lose 49+ HP & cross Dusty Bowl",
        hisui_barrage: "Barb Barrage (Strong) x20",
        hisui_psyshield: "Psyshield Bash (Agile) x20",
        hisui_recoil: "Lose 294 HP from recoil",
        black_augurite: "Use: Black Augurite",
        peat_block: "Use: Peat Block (Full Moon)",
        'scroll-of-darkness': "Use: Scroll of Darkness",
        'scroll-of-waters': "Use: Scroll of Waters",
        sweet_apple: "Use: Sweet Apple",
        tart_apple: "Use: Tart Apple",
        galar_cuff: "Use: Galar Cuff",
        galar_wreath: "Use: Galar Wreath",
        alola_rat: "Level 20 (Night)",
        alola_raichu: "Use: Thunder Stone (In Alola)",
        alola_marowak: "Level 28 (Night in Alola)",
        alola_exeggutor: "Use: Leaf Stone (In Alola)",
        rockruff_dusk: "Level 25 (Dusk + Own Tempo)",
        goodra_hisui: "Level 50 (Rain or Fog in Hisui)",
        sneasler_evo: "Use: Razor Claw (Day)",
        weavile_evo: "Use: Razor Claw (Night)",
        feebas_prism: "Trade (Prism Scale)",
        feebas_beauty: "Max Beauty (Poffins)",
        mantyke_party: "Remoraid in Party",
        pancham_party: "Dark-type in Party",
        cosmoem_sun: "Level 53 (Sun/Ultra Sun/Sword)",
        cosmoem_moon: "Level 53 (Moon/Ultra Moon/Shield)"
      },

      evo_locations: {
        magnetic_field: {
            label: "MAGNETIC FIELD",
            tooltip: {
                1: "N/A", 2: "N/A", 3: "N/A",
                4: "Sinnoh: Mt. Coronet (Inside)",
                5: "Unova: Chargestone Cave",
                6: "Kalos: Route 13 / Hoenn: New Mauville",
                7: "Alola: Vast Poni Canyon",
                8: "Hisui: Coronet Highlands / Galar: Thunder Stone",
                9: "Paldea: Thunder Stone"
            }
        },
        moss_rock: {
            label: "MOSS ROCK",
            tooltip: {
                1: "N/A", 2: "N/A", 3: "N/A",
                4: "Sinnoh: Eterna Forest",
                5: "Unova: Pinwheel Forest",
                6: "Kalos: Route 20 / Hoenn: Petalburg Woods",
                7: "Alola: Lush Jungle",
                8: "Hisui: The Heartwood / Galar: Leaf Stone",
                9: "Paldea: Leaf Stone"
            }
        },
        ice_rock: {
            label: "ICE ROCK",
            tooltip: {
                1: "N/A", 2: "N/A", 3: "N/A",
                4: "Sinnoh: Route 217",
                5: "Unova: Twist Mountain (Bottom Floor)",
                6: "Kalos: Frost Cavern / Hoenn: Shoal Cave (Low Tide)",
                7: "Alola: Mount Lanakila",
                8: "Hisui: Icepeak Arena / Galar: Ice Stone",
                9: "Paldea: Ice Stone"
            }
        },
        mt_coronet: {
            label: "MT. CORONET",
            tooltip: {
                4: "Sinnoh: Level Up inside Mt. Coronet",
                8: "Hisui: Coronet Highlands",
                9: "N/A"
            }
        }
      },
      
      evo_conditions: {
        atk_gt_def: "ATK > DEF",
        atk_lt_def: "ATK < DEF",
        atk_eq_def: "ATK = DEF",
        party_dark: "Party: Dark Type",
        party_remoraid: "Party: Remoraid",
        trade_prism: "Trade + Scale",
        beauty_max: "Max Beauty",
        galar_only: "Galar Form",
        hisui_only: "Hisui Form",
        paldea_only: "Paldea Form",
        female_only: "Female Only",
        male_only: "Male Only"
      },
      evo_tooltips: {
        upside_down: "Hold device upside down while leveling up (Level 30+).",
        rain: "Requires rainy weather in the overworld.",
        beauty: "Max out 'Beauty' condition (Contests) or Trade with Prism Scale.",
        affection: "Requires 2 hearts of Affection (Amie/Camp) or High Friendship.",
        ancient_power: "Must learn 'Ancient Power'.",
        party_remoraid: "Remoraid must be in the party.",
        dark_type: "Dark-type Pokémon must be in the party.",
        hold_item: "Hold Item",
        day: "Day",
        night: "Night",
        shed: "Level 20, with 1 empty party slot and 1 Poké Ball in bag.",
        spin: "Spin your character after battle (duration/time varies).",
        crit: "Land 3 critical hits in a single battle."
      },
      getDexLabel: (regionKey: string) => {
        // @ts-ignore
        const name = POKEDEX_DICTIONARY.en.regions[regionKey] || regionKey;
        return `${name} DEX`;
      },
      getEvoTrigger: (trigger: string) => {
          const map: Record<string, string> = { 'level-up': 'Level', 'trade': 'Trade', 'use-item': 'Use Item', 'shed': 'Shed' };
          return map[trigger] || 'Special';
      }
    },
    // ... (regions, types, natures IGUALES) ...
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
    }
  }
};