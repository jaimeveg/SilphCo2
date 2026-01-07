import { useQuery } from '@tanstack/react-query';
import { IPokemon, IStat } from '@/types/interfaces';

const POKEAPI_BASE = 'https://pokeapi.co/api/v2';

// FALLBACK IMAGE: Previene el crash de Next/Image si la API no tiene sprite
const FALLBACK_SPRITE = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/0.png';

// 1. MAPEO DE CONTEXTO UX
const DEX_MAP: Record<string, string> = {
  'national': 'NATIONAL', 'kanto': 'KANTO',
  'original-johto': 'JOHTO', 'updated-johto': 'JOHTO',
  'hoenn': 'HOENN', 'updated-hoenn': 'HOENN',
  'original-sinnoh': 'SINNOH', 'extended-sinnoh': 'SINNOH',
  'original-unova': 'UNOVA', 'updated-unova': 'UNOVA',
  'kalos-central': 'KALOS', 'kalos-coastal': 'KALOS', 'kalos-mountain': 'KALOS',
  'original-alola': 'ALOLA', 'updated-alola': 'ALOLA', 
  'galar': 'GALAR', 'isle-of-armor': 'GALAR', 'crown-tundra': 'GALAR',
  'hisui': 'HISUI',
  'paldea': 'PALDEA', 'kitakami': 'PALDEA', 'blueberry': 'PALDEA'
};

const DEX_PRIORITY: Record<string, number> = {
  'kanto': 1,
  'updated-johto': 1, 'original-johto': 2,
  'updated-hoenn': 1, 'hoenn': 2,
  'extended-sinnoh': 1, 'original-sinnoh': 2,
  'updated-unova': 1, 'original-unova': 2,
  'kalos-central': 1, 'kalos-coastal': 2, 'kalos-mountain': 3,
  'updated-alola': 1, 'original-alola': 2,
  'galar': 1, 'isle-of-armor': 2, 'crown-tundra': 3,
  'hisui': 1,
  'paldea': 1, 'kitakami': 2, 'blueberry': 3
};

const CONTEXT_TO_DEX_IDS: Record<string, number[]> = {
  'NATIONAL': [1],
  'KANTO': [2], 'JOHTO': [7], 'HOENN': [4], 'SINNOH': [6], 'UNOVA': [9],
  'KALOS': [12, 13, 14], 'ALOLA': [21], 'GALAR': [27, 28, 29], 
  'HISUI': [30],
  'PALDEA': [31, 32, 33] 
};

const STAT_LABELS: Record<string, string> = { 'hp': 'HP', 'attack': 'ATK', 'defense': 'DEF', 'special-attack': 'SPA', 'special-defense': 'SPD', 'speed': 'SPE' };
const ROMAN_GEN_MAP: Record<string, string> = { 'generation-i': 'I', 'generation-ii': 'II', 'generation-iii': 'III', 'generation-iv': 'IV', 'generation-v': 'V', 'generation-vi': 'VI', 'generation-vii': 'VII', 'generation-viii': 'VIII', 'generation-ix': 'IX' };

// --- FETCHERS ---

export const fetchPokedexEntries = async (context: string): Promise<string[]> => {
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

const fetchPokemon = async (id: string | number): Promise<IPokemon> => {
  const pokemonRes = await fetch(`${POKEAPI_BASE}/pokemon/${id}`);
  if (!pokemonRes.ok) throw new Error('Pokemon not found');
  const pokemonData = await pokemonRes.json();

  const speciesRes = await fetch(pokemonData.species.url);
  const speciesData = await speciesRes.json();

  // === FIX CRÍTICO DE SINCRONIZACIÓN ===
  // Usamos speciesData.id directamente como ancla
  const speciesId = speciesData.id; 
  // =====================================

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

  const abilitiesPromises = pokemonData.abilities.map(async (item: any) => {
    const abRes = await fetch(item.ability.url);
    const abData = await abRes.json();
    const entry = abData.effect_entries.find((e: any) => e.language.name === 'en');
    return {
      name: item.ability.name.replace(/-/g, ' '),
      isHidden: item.is_hidden,
      description: entry ? entry.short_effect : "Tactical data unavailable."
    };
  });
  const abilities = await Promise.all(abilitiesPromises);

  const stats = pokemonData.stats.map((s: any) => ({
    label: STAT_LABELS[s.stat.name] || s.stat.name,
    value: s.base_stat,
    max: 255, 
  }));

  // === FIX CRÍTICO DE IMAGEN (Fallback) ===
  const sprite = 
    pokemonData.sprites.other?.['official-artwork']?.front_default ||
    pokemonData.sprites.other?.home?.front_default ||
    pokemonData.sprites.other?.showdown?.front_default ||
    pokemonData.sprites.front_default ||
    FALLBACK_SPRITE; // Previene Next/Image error "src is null"

  const varieties = speciesData.varieties.map((v: any) => {
    const urlParts = v.pokemon.url.split('/');
    return {
      isDefault: v.is_default,
      name: v.pokemon.name.replace(speciesData.name, '').replace(/-/g, ' ').trim() || 'BASE FORM',
      pokemonId: urlParts[urlParts.length - 2]
    };
  });

  return {
    id: pokemonData.id,
    speciesId, // Retornamos el ancla seguro
    name: pokemonData.name,
    speciesName: speciesData.name,
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

export const usePokemon = (id: string | number) => {
  return useQuery({
    queryKey: ['pokemon', id],
    queryFn: () => fetchPokemon(id),
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