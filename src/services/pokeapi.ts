import { useQuery } from '@tanstack/react-query';
import { IPokemon, IStat } from '@/types/interfaces';
import { Lang } from '@/lib/pokedexDictionary';

const POKEAPI_BASE = 'https://pokeapi.co/api/v2';
const FALLBACK_SPRITE = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/0.png';

// --- MAPEO DE SUFIJOS DE FORMAS (TRADUCCIÓN MANUAL PARA RENDIMIENTO) ---
// Evita hacer fetch a /pokemon-form/ por cada variante.
const FORM_TRANSLATIONS: Record<string, { es: string, en: string }> = {
  'mega': { es: 'Mega', en: 'Mega' },
  'mega-x': { es: 'Mega X', en: 'Mega X' },
  'mega-y': { es: 'Mega Y', en: 'Mega Y' },
  'gmax': { es: 'Gigamax', en: 'Gigamax' },
  'alola': { es: 'Alola', en: 'Alola' },
  'galar': { es: 'Galar', en: 'Galar' },
  'hisui': { es: 'Hisui', en: 'Hisui' },
  'paldea': { es: 'Paldea', en: 'Paldea' },
  'wash': { es: 'Lavadora', en: 'Wash' },
  'heat': { es: 'Horno', en: 'Heat' },
  'mow': { es: 'Cortacésped', en: 'Mow' },
  'fan': { es: 'Ventilador', en: 'Fan' },
  'frost': { es: 'Frigorífico', en: 'Frost' },
  'origin': { es: 'Origen', en: 'Origin' },
  'therian': { es: 'Tótem', en: 'Therian' },
  'sky': { es: 'Cielo', en: 'Sky' },
  'eternal': { es: 'Eterna', en: 'Eternal' },
  'crowned': { es: 'Suprema', en: 'Crowned' },
  'rapid-strike': { es: 'Fluida', en: 'Rapid Strike' },
  'single-strike': { es: 'Brusca', en: 'Single Strike' },
  'dusk': { es: 'Crepuscular', en: 'Dusk' },
  'dawn': { es: 'Alba', en: 'Dawn' },
  'midnight': { es: 'Noche', en: 'Midnight' },
  'low-key': { es: 'Grave', en: 'Low Key' },
  'roaming': { es: 'Andante', en: 'Roaming' },
  'bloodmoon': { es: 'Luna Carmesí', en: 'Bloodmoon' }
};

// ... (DEX_MAP, DEX_PRIORITY, CONTEXT_TO_DEX_IDS, STAT_LABELS, ROMAN_GEN_MAP se mantienen IGUAL que antes) ...
// (Por brevedad, asumo que el código de constantes de dex sigue aquí)
// ----------------------------------------------------------------------
const DEX_MAP: Record<string, string> = {
  'national': 'NATIONAL', 'kanto': 'KANTO', 'original-johto': 'JOHTO', 'updated-johto': 'JOHTO',
  'hoenn': 'HOENN', 'updated-hoenn': 'HOENN', 'original-sinnoh': 'SINNOH', 'extended-sinnoh': 'SINNOH',
  'original-unova': 'UNOVA', 'updated-unova': 'UNOVA', 'kalos-central': 'KALOS', 'kalos-coastal': 'KALOS', 'kalos-mountain': 'KALOS',
  'original-alola': 'ALOLA', 'updated-alola': 'ALOLA', 'galar': 'GALAR', 'isle-of-armor': 'GALAR', 'crown-tundra': 'GALAR',
  'hisui': 'HISUI', 'paldea': 'PALDEA', 'kitakami': 'PALDEA', 'blueberry': 'PALDEA'
};

const DEX_PRIORITY: Record<string, number> = {
  'kanto': 1, 'updated-johto': 1, 'original-johto': 2, 'updated-hoenn': 1, 'hoenn': 2,
  'extended-sinnoh': 1, 'original-sinnoh': 2, 'updated-unova': 1, 'original-unova': 2,
  'kalos-central': 1, 'kalos-coastal': 2, 'kalos-mountain': 3, 'updated-alola': 1, 'original-alola': 2,
  'galar': 1, 'isle-of-armor': 2, 'crown-tundra': 3, 'hisui': 1, 'paldea': 1, 'kitakami': 2, 'blueberry': 3
};

const CONTEXT_TO_DEX_IDS: Record<string, number[]> = {
  'NATIONAL': [1], 'KANTO': [2], 'JOHTO': [7], 'HOENN': [4], 'SINNOH': [6], 'UNOVA': [9],
  'KALOS': [12, 13, 14], 'ALOLA': [21], 'GALAR': [27, 28, 29], 'HISUI': [30], 'PALDEA': [31, 32, 33] 
};

const STAT_LABELS: Record<string, string> = { 'hp': 'HP', 'attack': 'ATK', 'defense': 'DEF', 'special-attack': 'SPA', 'special-defense': 'SPD', 'speed': 'SPE' };
const ROMAN_GEN_MAP: Record<string, string> = { 'generation-i': 'I', 'generation-ii': 'II', 'generation-iii': 'III', 'generation-iv': 'IV', 'generation-v': 'V', 'generation-vi': 'VI', 'generation-vii': 'VII', 'generation-viii': 'VIII', 'generation-ix': 'IX' };


export const fetchPokedexEntries = async (context: string): Promise<string[]> => {
  // ... (Código de fetchPokedexEntries igual que antes) ...
  if (context === 'NATIONAL') return [];
  const dexIds = CONTEXT_TO_DEX_IDS[context];
  if (!dexIds) return [];
  try {
    const promises = dexIds.map(id => fetch(`${POKEAPI_BASE}/pokedex/${id}`).then(r => r.json()));
    const results = await Promise.all(promises);
    const allIds = new Set<string>();
    results.forEach(dex => {
      dex.pokemon_entries.forEach((entry: any) => {
        const urlParts = entry.pokemon_species.url.split('/');
        allIds.add(urlParts[urlParts.length - 2]);
      });
    });
    return Array.from(allIds);
  } catch (e) { return []; }
};

// Función Helper para traducir nombres de formas
const formatVarietyName = (rawName: string, speciesName: string, lang: Lang): string => {
  // rawName: "rotom-wash", speciesName: "rotom" -> suffix: "wash"
  let suffix = rawName.replace(speciesName, '').replace(/^-/, ''); 
  
  // Buscar en el diccionario
  const translation = FORM_TRANSLATIONS[suffix];
  if (translation) {
    return translation[lang];
  }
  
  // Fallback: Devolver el sufijo limpio capitalizado
  return suffix.replace(/-/g, ' ').toUpperCase();
};

const fetchPokemon = async (id: string | number, lang: Lang = 'es'): Promise<IPokemon> => {
  const pokemonRes = await fetch(`${POKEAPI_BASE}/pokemon/${id}`);
  if (!pokemonRes.ok) throw new Error('Pokemon not found');
  const pokemonData = await pokemonRes.json();

  const speciesRes = await fetch(pokemonData.species.url);
  const speciesData = await speciesRes.json();
  const speciesId = speciesData.id;

  // ... (Dex Logic igual) ...
  const dexIds: Record<string, number> = {};
  const currentPriorities: Record<string, number> = {};
  speciesData.pokedex_numbers.forEach((entry: any) => {
    const rawDexName = entry.pokedex.name;
    const contextKey = DEX_MAP[rawDexName];
    if (contextKey) {
      const priority = DEX_PRIORITY[rawDexName] || 99;
      if (!dexIds[contextKey] || priority < (currentPriorities[contextKey] || 100)) {
        dexIds[contextKey] = entry.entry_number;
        currentPriorities[contextKey] = priority;
      }
    }
  });
  if (!dexIds['NATIONAL']) dexIds['NATIONAL'] = speciesData.id;

  // === FIX HABILIDADES: PRIORIDAD FLAVOR TEXT ===
  const abilitiesPromises = pokemonData.abilities.map(async (item: any) => {
    const abRes = await fetch(item.ability.url);
    const abData = await abRes.json();
    
    // 1. Nombre
    const nameEntry = abData.names.find((n: any) => n.language.name === lang) 
                   || abData.names.find((n: any) => n.language.name === 'en');
    const translatedName = nameEntry ? nameEntry.name : item.ability.name.replace(/-/g, ' ');

    // 2. Descripción (Buscamos Flavor Text primero, que es más probable que esté en español moderno)
    // Filtramos todas las entradas que coincidan con el idioma
    const flavorEntries = abData.flavor_text_entries.filter((e: any) => e.language.name === lang);
    
    // Tomamos la última (suele ser la más reciente/actualizada)
    let description = flavorEntries.length > 0 
        ? flavorEntries[flavorEntries.length - 1].flavor_text 
        : null;

    // Si no hay flavor text en español, intentamos effect_entries (técnico) en español (raro en gen nuevas)
    if (!description) {
        const effectEntry = abData.effect_entries.find((e: any) => e.language.name === lang);
        if (effectEntry) description = effectEntry.short_effect;
    }

    // Fallback a Inglés
    if (!description) {
        const enFlavor = abData.flavor_text_entries.find((e: any) => e.language.name === 'en');
        const enEffect = abData.effect_entries.find((e: any) => e.language.name === 'en');
        description = enFlavor ? enFlavor.flavor_text : (enEffect ? enEffect.short_effect : null);
    }

    // Limpieza de saltos de línea raros de la API
    if (description) {
        description = description.replace(/[\n\f]/g, ' ');
    } else {
        description = lang === 'es' ? "Sin descripción disponible." : "No description available.";
    }

    return {
      name: translatedName,
      isHidden: item.is_hidden,
      description
    };
  });
  const abilities = await Promise.all(abilitiesPromises);

  // ... (Stats & Sprite igual) ...
  const stats = pokemonData.stats.map((s: any) => ({
    label: STAT_LABELS[s.stat.name] || s.stat.name,
    value: s.base_stat,
    max: 255, 
  }));
  const sprite = 
    pokemonData.sprites.other?.['official-artwork']?.front_default ||
    pokemonData.sprites.other?.home?.front_default ||
    pokemonData.sprites.front_default ||
    FALLBACK_SPRITE;

  // === VARIETIES (FORMAS) TRADUCIDAS ===
  const varieties = speciesData.varieties.map((v: any) => {
    const urlParts = v.pokemon.url.split('/');
    // Usamos el helper formatVarietyName
    const translatedFormName = v.is_default 
        ? (lang === 'es' ? 'FORMA BASE' : 'BASE FORM')
        : formatVarietyName(v.pokemon.name, speciesData.name, lang);

    return {
      isDefault: v.is_default,
      name: translatedFormName, // <--- NOMBRE LIMPIO Y TRADUCIDO
      pokemonId: urlParts[urlParts.length - 2]
    };
  });

  return {
    id: pokemonData.id,
    speciesId,
    name: pokemonData.name,
    speciesName: speciesData.name, // Nombre técnico
    types: pokemonData.types.map((t: any) => t.type.name),
    sprite,
    stats,
    height: pokemonData.height,
    weight: pokemonData.weight,
    abilities,
    generation: ROMAN_GEN_MAP[speciesData.generation.name] || '?',
    varieties,
    dexIds
  };
};

export const usePokemon = (id: string | number, lang: Lang = 'es') => {
  return useQuery({
    queryKey: ['pokemon', id, lang],
    queryFn: () => fetchPokemon(id, lang),
    enabled: !!id,
    staleTime: 1000 * 60 * 60,
  });
};

export const usePokedexEntries = (context: string) => {
  return useQuery({
    queryKey: ['pokedex_entries', context],
    queryFn: () => fetchPokedexEntries(context),
    enabled: context !== 'NATIONAL',
    staleTime: 1000 * 60 * 60 * 24,
  });
};