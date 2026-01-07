export type Lang = 'es' | 'en';

export const POKEDEX_DICTIONARY = {
  es: {
    labels: {
      abilities: "Habilidades",
      height: "ALT",
      weight: "PES",
      gen: "GEN",
      morph: "VARIANTE:",
      local_id: "ID LOCAL",
      system_context: "SISTEMA",
      type: "TIPO"
    },
    regions: {
      NATIONAL: "NACIONAL",
      KANTO: "KANTO",
      JOHTO: "JOHTO",
      HOENN: "HOENN",
      SINNOH: "SINNOH",
      UNOVA: "TESELIA",
      KALOS: "KALOS",
      ALOLA: "ALOLA",
      GALAR: "GALAR",
      HISUI: "HISUI",
      PALDEA: "PALDEA"
    },
    // Diccionario de Tipos
    types: {
      normal: "Normal", fire: "Fuego", water: "Agua", grass: "Planta",
      electric: "Eléctrico", ice: "Hielo", fighting: "Lucha", poison: "Veneno",
      ground: "Tierra", flying: "Volador", psychic: "Psíquico", bug: "Bicho",
      rock: "Roca", ghost: "Fantasma", dragon: "Dragón", steel: "Acero",
      dark: "Siniestro", fairy: "Hada", stellar: "Estelar", unknown: "???"
    },
    getDexLabel: (regionKey: string) => {
      // @ts-ignore
      const name = POKEDEX_DICTIONARY.es.regions[regionKey] || regionKey;
      return regionKey === 'NATIONAL' ? 'POKÉDEX NACIONAL' : `POKÉDEX DE ${name}`;
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
      type: "TYPE"
    },
    regions: {
      NATIONAL: "NATIONAL",
      KANTO: "KANTO",
      JOHTO: "JOHTO",
      HOENN: "HOENN",
      SINNOH: "SINNOH",
      UNOVA: "UNOVA",
      KALOS: "KALOS",
      ALOLA: "ALOLA",
      GALAR: "GALAR",
      HISUI: "HISUI",
      PALDEA: "PALDEA"
    },
    types: {
      normal: "Normal", fire: "Fire", water: "Water", grass: "Grass",
      electric: "Electric", ice: "Ice", fighting: "Fighting", poison: "Poison",
      ground: "Ground", flying: "Flying", psychic: "Psychic", bug: "Bug",
      rock: "Rock", ghost: "Ghost", dragon: "Dragon", steel: "Steel",
      dark: "Dark", fairy: "Fairy", stellar: "Stellar", unknown: "???"
    },
    getDexLabel: (regionKey: string) => {
      // @ts-ignore
      const name = POKEDEX_DICTIONARY.en.regions[regionKey] || regionKey;
      return `${name} DEX`;
    }
  }
};