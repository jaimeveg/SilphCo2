import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { IPokemon, IStat } from '@/types/interfaces';
import { Lang, POKEDEX_DICTIONARY } from '@/lib/pokedexDictionary';
import { IEvolutionNode, IEvolutionDetail, ILocationEncounter } from '@/types/interfaces';

const POKEAPI_BASE = 'https://pokeapi.co/api/v2';
const FALLBACK_SPRITE = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/0.png';

// --- CONSTANTES DE MAPEO UX ---
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

const FORM_TRANSLATIONS: Record<string, { es: string, en: string }> = {
  'mega': { es: 'Mega', en: 'Mega' }, 'mega-x': { es: 'Mega X', en: 'Mega X' }, 'mega-y': { es: 'Mega Y', en: 'Mega Y' },
  'gmax': { es: 'Gigamax', en: 'Gigamax' }, 'alola': { es: 'Alola', en: 'Alola' }, 'galar': { es: 'Galar', en: 'Galar' },
  'hisui': { es: 'Hisui', en: 'Hisui' }, 'paldea': { es: 'Paldea', en: 'Paldea' }, 'wash': { es: 'Lavadora', en: 'Wash' },
  'heat': { es: 'Horno', en: 'Heat' }, 'mow': { es: 'Cortacésped', en: 'Mow' }, 'fan': { es: 'Ventilador', en: 'Fan' },
  'frost': { es: 'Frigorífico', en: 'Frost' }, 'origin': { es: 'Origen', en: 'Origin' }, 'therian': { es: 'Tótem', en: 'Therian' },
  'sky': { es: 'Cielo', en: 'Sky' }, 'eternal': { es: 'Eterna', en: 'Eternal' }, 'crowned': { es: 'Suprema', en: 'Crowned' },
  'rapid-strike': { es: 'Fluida', en: 'Rapid Strike' }, 'single-strike': { es: 'Brusca', en: 'Single Strike' },
  'dusk': { es: 'Crepuscular', en: 'Dusk' }, 'dawn': { es: 'Alba', en: 'Dawn' }, 'midnight': { es: 'Noche', en: 'Midnight' },
  'low-key': { es: 'Grave', en: 'Low Key' }, 'roaming': { es: 'Andante', en: 'Roaming' }, 'bloodmoon': { es: 'Luna Carmesí', en: 'Bloodmoon' }
};

// --- MANUAL OVERRIDES (ID POKEMON -> CLAVE DICCIONARIO) ---
const MANUAL_OVERRIDE_KEYS: Record<number, keyof typeof POKEDEX_DICTIONARY['es']['labels']['evo_overrides']> = {
  // GEN 9
  979: 'rage_fist',       // Annihilape
  983: 'bisharp_leaders', // Kingambit
  1000: 'coins',          // Gholdengo
  923: 'steps',           // Pawmot
  947: 'steps',           // Brambleghast
  954: 'steps',           // Rabsca
  964: 'union_circle',    // Palafin
  925: 'combat',          // Maushold
  931: 'stone_fire',      // Scovillain
  939: 'stone_thunder',   // Bellibolt
  1011: 'syrupy_apple',   // Dipplin
  1019: 'dragon_cheer',   // Hydrapple
  1013: 'teacup',         // Sinistcha
  1018: 'metal_alloy',    // Archaludon

  // GALAR (GEN 8)
  865: 'galar_crits',     // Sirfetch'd
  867: 'galar_damage',    // Runerigus
  892: 'scroll_dark',     // Urshifu Single
  893: 'scroll_water',    // Urshifu Rapid

  // HISUI (LEYENDAS)
  904: 'hisui_barrage',   // Overqwil
  899: 'hisui_psyshield', // Wyrdeer
  902: 'hisui_recoil',    // Basculegion
  900: 'black_augurite'   // Kleavor
};

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

const formatVarietyName = (rawName: string, speciesName: string, lang: Lang): string => {
  let suffix = rawName.replace(speciesName, '').replace(/^-/, ''); 
  const translation = FORM_TRANSLATIONS[suffix];
  if (translation) return translation[lang];
  return suffix.replace(/-/g, ' ').toUpperCase();
};

const processEvolutionChain = (chainNode: any, lang: Lang): IEvolutionNode => {
  const speciesUrlParts = chainNode.species.url.split('/');
  const speciesId = parseInt(speciesUrlParts[speciesUrlParts.length - 2]);
  
  // LECTURA SEGURA DEL DICCIONARIO
  // Usamos '?.' para evitar crash si falta la clave en el archivo de idioma
  const dictOverrides = POKEDEX_DICTIONARY[lang]?.labels?.evo_overrides || {};
  
  let details: IEvolutionDetail[] = chainNode.evolution_details.map((det: any) => {
    
    const baseDetail: IEvolutionDetail = {
        trigger: det.trigger.name,
        minLevel: det.min_level,
        item: det.item?.name,
        heldItem: det.held_item?.name,
        minHappiness: det.min_happiness,
        minAffection: det.min_affection,
        minBeauty: det.min_beauty,
        timeOfDay: det.time_of_day,
        knownMove: det.known_move?.name,
        knownMoveType: det.known_move_type?.name,
        location: det.location?.name,
        condition: det.trigger.name,
        gender: det.gender,
        relativePhysicalStats: det.relative_physical_stats,
        needsOverworldRain: det.needs_overworld_rain,
        turnUpsideDown: det.turn_upside_down,
        partySpecies: det.party_species?.name,
        partyType: det.party_type?.name,
        tradeSpecies: det.trade_species?.name,
        customReq: undefined
    };

    // INYECCIÓN DE OVERRIDE
    // @ts-ignore
    if (MANUAL_OVERRIDE_KEYS[speciesId]) {
        // @ts-ignore
        const key = MANUAL_OVERRIDE_KEYS[speciesId];
        // @ts-ignore
        const overrideText = dictOverrides[key];
        if (overrideText) baseDetail.customReq = overrideText;
    }

    return baseDetail;
  });

  // CASO ESPECIAL: SI ARRAY VACÍO PERO TENEMOS OVERRIDE (Ej: Sirfetch'd o DLCs nuevos)
  // @ts-ignore
  if (details.length === 0 && MANUAL_OVERRIDE_KEYS[speciesId]) {
      // @ts-ignore
      const key = MANUAL_OVERRIDE_KEYS[speciesId];
      // @ts-ignore
      const overrideText = dictOverrides[key];
      
      if (overrideText) {
        details.push({
            trigger: 'manual_override',
            customReq: overrideText
        });
      }
  }

  // CASO ESPECIAL: SHEDINJA
  if (speciesId === 292 && details.length === 0) {
      details.push({ trigger: 'shed' });
  }

  const sprite = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${speciesId}.png`;
  const icon = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${speciesId}.png`;

  return {
    speciesId,
    speciesName: chainNode.species.name,
    sprite,
    icon, 
    types: [], 
    details,
    evolvesTo: chainNode.evolves_to.map((child: any) => processEvolutionChain(child, lang))
  };
};

const fetchPokemon = async (id: string | number, lang: Lang = 'es'): Promise<IPokemon> => {
  const pokemonRes = await fetch(`${POKEAPI_BASE}/pokemon/${id}`);
  if (!pokemonRes.ok) throw new Error('Pokemon not found');
  const pokemonData = await pokemonRes.json();

  const speciesRes = await fetch(pokemonData.species.url);
  const speciesData = await speciesRes.json();
  const speciesId = speciesData.id;

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
    const nameEntry = abData.names.find((n: any) => n.language.name === lang) || abData.names.find((n: any) => n.language.name === 'en');
    const translatedName = nameEntry ? nameEntry.name : item.ability.name.replace(/-/g, ' ');
    
    let description = null;
    const flavorEntries = abData.flavor_text_entries.filter((e: any) => e.language.name === lang);
    if (flavorEntries.length > 0) description = flavorEntries[flavorEntries.length - 1].flavor_text;
    if (!description) {
        const effectEntry = abData.effect_entries.find((e: any) => e.language.name === lang);
        if (effectEntry) description = effectEntry.short_effect;
    }
    if (!description) {
        const enFlavor = abData.flavor_text_entries.find((e: any) => e.language.name === 'en');
        const enEffect = abData.effect_entries.find((e: any) => e.language.name === 'en');
        description = enFlavor ? enFlavor.flavor_text : (enEffect ? enEffect.short_effect : null);
    }
    description = description ? description.replace(/[\n\f]/g, ' ') : (lang === 'es' ? "Sin descripción." : "No description.");

    return {
      name: translatedName,
      isHidden: item.is_hidden,
      description
    };
  });
  const abilities = await Promise.all(abilitiesPromises);

  const stats = pokemonData.stats.map((s: any) => ({
    label: STAT_LABELS[s.stat.name] || s.stat.name,
    value: s.base_stat,
    max: 255, 
  }));
  const sprite = pokemonData.sprites.other?.['official-artwork']?.front_default || pokemonData.sprites.other?.home?.front_default || pokemonData.sprites.front_default || FALLBACK_SPRITE;

  const varieties = speciesData.varieties.map((v: any) => {
    const urlParts = v.pokemon.url.split('/');
    const translatedFormName = v.is_default ? (lang === 'es' ? 'FORMA BASE' : 'BASE FORM') : formatVarietyName(v.pokemon.name, speciesData.name, lang);
    return {
      isDefault: v.is_default,
      name: translatedFormName,
      pokemonId: urlParts[urlParts.length - 2]
    };
  });

  let evolutionChain: IEvolutionNode | undefined;
  if (speciesData.evolution_chain?.url) {
    try {
        const evoRes = await fetch(speciesData.evolution_chain.url);
        const evoData = await evoRes.json();
        evolutionChain = processEvolutionChain(evoData.chain, lang);
    } catch (e) { console.error("Evo error", e); }
  }

  let locations: ILocationEncounter[] = [];
  try {
    const locRes = await fetch(`${POKEAPI_BASE}/pokemon/${id}/encounters`);
    const locData = await locRes.json();
    locData.forEach((area: any) => {
        area.version_details.forEach((ver: any) => {
            const conditions = ver.encounter_details[0].condition_values?.map((c: any) => c.name) || [];
            locations.push({
                region: "Unknown",
                locationName: area.location_area.name,
                version: ver.version.name,
                method: ver.encounter_details[0].method.name,
                chance: ver.encounter_details[0].chance,
                minLevel: ver.encounter_details[0].min_level,
                maxLevel: ver.encounter_details[0].max_level,
                conditions: conditions
            });
        });
    });
  } catch (e) { console.error("Loc error", e); }

  return {
    id: pokemonData.id,
    speciesId,
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
    dexIds,
    evolutionChain,
    locations
  };
};

export const usePokemon = (id: string | number, lang: Lang = 'es') => {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ['pokemon', id, lang],
    queryFn: () => fetchPokemon(id, lang),
    enabled: !!id,
    staleTime: 0, // Forzamos recarga para ver los cambios inmediatos
  });

  useEffect(() => {
    if (query.data?.varieties) {
      query.data.varieties.forEach((v) => {
        const variantId = v.pokemonId;
        if (variantId !== String(id)) {
           queryClient.prefetchQuery({
              queryKey: ['pokemon', variantId, lang],
              queryFn: () => fetchPokemon(variantId, lang),
              staleTime: 0
           });
        }
      });
    }
  }, [query.data, queryClient, id, lang]);

  return query;
};

export const usePokedexEntries = (context: string) => {
  return useQuery({
    queryKey: ['pokedex_entries', context],
    queryFn: () => fetchPokedexEntries(context),
    enabled: context !== 'NATIONAL',
    staleTime: 1000 * 60 * 60 * 24,
  });
};