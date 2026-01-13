import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { IPokemon, IStat, IPokemonAssets, IPokemonMove} from '@/types/interfaces';
import { Lang, POKEDEX_DICTIONARY } from '@/lib/pokedexDictionary';
import { IEvolutionNode, IEvolutionDetail, ILocationEncounter } from '@/types/interfaces';
import { IMoveDetail, IMachineDetail } from '@/types/interfaces';

const POKEAPI_BASE = 'https://pokeapi.co/api/v2';
const FALLBACK_SPRITE = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/0.png';

// --- CONFIGURACIÓN DE CONTEXTOS --- 
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
const ROMAN_GEN_MAP: Record<string, string> = { 'generation-i': 'I', 'generation-ii': 'II', 'generation-iii': 'III', 'generation-iv': 'IV', 'generation-v': 'V', 'generation-vi': 'VI', 'generation-vii': 'VII', 'generation-viii': 'VIII', 'generation-ix': 'IX',
'generation-x': 'X','generation-xi': 'XI','generation-xii': 'XII','generation-xiii': 'XIII','generation-xiv': 'XIV','generation-xv': 'XV','generation-xvi': 'XVI','generation-xvii': 'XVII','generation-xviii': 'XVIII','generation-xix': 'XIX','generation-xx': 'XX',
'generation-xxi': 'XXI','generation-xxii': 'XXII', 'generation-xxiii': 'XXIII', 'generation-xxiv': 'XXIV', 'generation-xxv': 'XXV' };

const FORM_TRANSLATIONS: Record<string, { es: string, en: string }> = {
  'mega': { es: 'Mega', en: 'Mega' }, 'mega-x': { es: 'Mega X', en: 'Mega X' }, 'mega-y': { es: 'Mega Y', en: 'Mega Y' },
  'gmax': { es: 'Gigamax', en: 'Gigamax' }, 'alola': { es: 'Alola', en: 'Alola' }, 'galar': { es: 'Galar', en: 'Galar' },
  'hisui': { es: 'Hisui', en: 'Hisui' }, 'paldea': { es: 'Paldea', en: 'Paldea' }, 'wash': { es: 'Lavadora', en: 'Wash' },
  'heat': { es: 'Horno', en: 'Heat' }, 'mow': { es: 'Cortacésped', en: 'Mow' }, 'fan': { es: 'Ventilador', en: 'Fan' },
  'frost': { es: 'Frigorífico', en: 'Frost' }, 'origin': { es: 'Origen', en: 'Origin' }, 'therian': { es: 'Tótem', en: 'Therian' },
  'sky': { es: 'Cielo', en: 'Sky' }, 'eternal': { es: 'Eterna', en: 'Eternal' }, 'crowned': { es: 'Suprema', en: 'Crowned' },
  'rapid-strike': { es: 'Fluida', en: 'Rapid Strike' }, 'single-strike': { es: 'Brusca', en: 'Single Strike' },
  'dusk': { es: 'Crepuscular', en: 'Dusk' }, 'dawn': { es: 'Alba', en: 'Dawn' }, 'midnight': { es: 'Noche', en: 'Midnight' },
  'low-key': { es: 'Grave', en: 'Low Key' }, 'roaming': { es: 'Andante', en: 'Roaming' }, 'bloodmoon': { es: 'Luna Carmesí', en: 'Bloodmoon' },
  'male': { es: 'Macho', en: 'Male' }, 'female': { es: 'Hembra', en: 'Female' },
  'baile': { es: 'Estilo Baile', en: 'Baile Style' }, 'pom-pom': { es: 'Estilo Animadora', en: 'Pom-Pom Style' },
  'pau': { es: 'Estilo Plácido', en: 'Pa\'u Style' }, 'sensu': { es: 'Estilo Refinado', en: 'Sensu Style' }
};

const MANUAL_OVERRIDE_KEYS: Record<number, keyof typeof POKEDEX_DICTIONARY['es']['labels']['evo_overrides']> = {
  979: 'rage_fist', 983: 'bisharp_leaders', 1000: 'coins', 923: 'steps', 947: 'steps', 954: 'steps', 964: 'union_circle',
  925: 'combat', 931: 'stone_fire', 939: 'stone_thunder', 1011: 'syrupy_apple', 1019: 'dragon_cheer', 1013: 'teacup',
  1018: 'metal_alloy', 865: 'galar_crits', 867: 'galar_damage', 
  892: 'scroll-of-darkness', 893: 'scroll-of-waters',
  904: 'hisui_barrage', 899: 'hisui_psyshield', 902: 'hisui_recoil', 900: 'black_augurite'
};

// --- DICCIONARIO MAESTRO DE VERSIONES (ALL GENS + DLCs FIX) ---
export const VERSION_METADATA: Record<string, { name: string; group: string; gen: number; region: string; type: 'Original' | 'Remake' | 'Enhanced' | 'Spin-off' }> = {
    // GEN 1
    'red': { name: 'Red', group: 'RB', gen: 1, region: 'Kanto', type: 'Original' },
    'blue': { name: 'Blue', group: 'RB', gen: 1, region: 'Kanto', type: 'Original' },
    'yellow': { name: 'Yellow', group: 'Yellow', gen: 1, region: 'Kanto', type: 'Enhanced' },
    // GEN 2
    'gold': { name: 'Gold', group: 'GS', gen: 2, region: 'Johto', type: 'Original' },
    'silver': { name: 'Silver', group: 'GS', gen: 2, region: 'Johto', type: 'Original' },
    'crystal': { name: 'Crystal', group: 'Crystal', gen: 2, region: 'Johto', type: 'Enhanced' },
    // GEN 3
    'ruby': { name: 'Ruby', group: 'RS', gen: 3, region: 'Hoenn', type: 'Original' },
    'sapphire': { name: 'Sapphire', group: 'RS', gen: 3, region: 'Hoenn', type: 'Original' },
    'emerald': { name: 'Emerald', group: 'Emerald', gen: 3, region: 'Hoenn', type: 'Enhanced' },
    'firered': { name: 'FireRed', group: 'FRLG', gen: 3, region: 'Kanto', type: 'Remake' },
    'leafgreen': { name: 'LeafGreen', group: 'FRLG', gen: 3, region: 'Kanto', type: 'Remake' },
    // GEN 3 Spin-off
    'colosseum': { name: 'Colosseum', group: 'Orre', gen: 3, region: 'Orre', type: 'Spin-off' },
    'xd': { name: 'XD', group: 'Orre', gen: 3, region: 'Orre', type: 'Spin-off' },
    // GEN 4
    'diamond': { name: 'Diamond', group: 'DP', gen: 4, region: 'Sinnoh', type: 'Original' },
    'pearl': { name: 'Pearl', group: 'DP', gen: 4, region: 'Sinnoh', type: 'Original' },
    'platinum': { name: 'Platinum', group: 'Pt', gen: 4, region: 'Sinnoh', type: 'Enhanced' },
    'heartgold': { name: 'HeartGold', group: 'HGSS', gen: 4, region: 'Johto', type: 'Remake' },
    'soulsilver': { name: 'SoulSilver', group: 'HGSS', gen: 4, region: 'Johto', type: 'Remake' },
    // GEN 5
    'black': { name: 'Black', group: 'BW', gen: 5, region: 'Unova', type: 'Original' },
    'white': { name: 'White', group: 'BW', gen: 5, region: 'Unova', type: 'Original' },
    'black-2': { name: 'Black 2', group: 'B2W2', gen: 5, region: 'Unova', type: 'Enhanced' },
    'white-2': { name: 'White 2', group: 'B2W2', gen: 5, region: 'Unova', type: 'Enhanced' },
    // GEN 6
    'x': { name: 'X', group: 'XY', gen: 6, region: 'Kalos', type: 'Original' },
    'y': { name: 'Y', group: 'XY', gen: 6, region: 'Kalos', type: 'Original' },
    'omega-ruby': { name: 'Omega Ruby', group: 'ORAS', gen: 6, region: 'Hoenn', type: 'Remake' },
    'alpha-sapphire': { name: 'Alpha Sapphire', group: 'ORAS', gen: 6, region: 'Hoenn', type: 'Remake' },
    // GEN 7
    'sun': { name: 'Sun', group: 'SM', gen: 7, region: 'Alola', type: 'Original' },
    'moon': { name: 'Moon', group: 'SM', gen: 7, region: 'Alola', type: 'Original' },
    'ultra-sun': { name: 'Ultra Sun', group: 'USUM', gen: 7, region: 'Alola', type: 'Enhanced' },
    'ultra-moon': { name: 'Ultra Moon', group: 'USUM', gen: 7, region: 'Alola', type: 'Enhanced' },
    'lets-go-pikachu': { name: 'Let\'s Go Pikachu', group: 'LGPE', gen: 7, region: 'Kanto', type: 'Remake' },
    'lets-go-eevee': { name: 'Let\'s Go Eevee', group: 'LGPE', gen: 7, region: 'Kanto', type: 'Remake' },
    // GEN 8 (DLCs corregidos sin 'the-')
    'sword': { name: 'Sword', group: 'SwSh', gen: 8, region: 'Galar', type: 'Original' },
    'shield': { name: 'Shield', group: 'SwSh', gen: 8, region: 'Galar', type: 'Original' },
    'isle-of-armor': { name: 'Isle of Armor', group: 'SwSh', gen: 8, region: 'Galar', type: 'Enhanced' },
    'crown-tundra': { name: 'Crown Tundra', group: 'SwSh', gen: 8, region: 'Galar', type: 'Enhanced' },
    'brilliant-diamond': { name: 'Brilliant Diamond', group: 'BDSP', gen: 8, region: 'Sinnoh', type: 'Remake' },
    'shining-pearl': { name: 'Shining Pearl', group: 'BDSP', gen: 8, region: 'Sinnoh', type: 'Remake' },
    'legends-arceus': { name: 'Legends: Arceus', group: 'PLA', gen: 8, region: 'Hisui', type: 'Spin-off' },
    // GEN 9 (DLCs corregidos sin 'the-')
    'scarlet': { name: 'Scarlet', group: 'SV', gen: 9, region: 'Paldea', type: 'Original' },
    'violet': { name: 'Violet', group: 'SV', gen: 9, region: 'Paldea', type: 'Original' },
    'teal-mask': { name: 'Teal Mask', group: 'SV', gen: 9, region: 'Kitakami', type: 'Enhanced' },
    'indigo-disk': { name: 'Indigo Disk', group: 'SV', gen: 9, region: 'Blueberry', type: 'Enhanced' }
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
    if (MANUAL_OVERRIDE_KEYS[speciesId]) {
        // @ts-ignore
        const key = MANUAL_OVERRIDE_KEYS[speciesId];
        // @ts-ignore
        const overrideText = dictOverrides[key];
        if (overrideText) baseDetail.customReq = overrideText;
    }
    return baseDetail;
  });

  if (details.length === 0 && MANUAL_OVERRIDE_KEYS[speciesId]) {
      // @ts-ignore
      const key = MANUAL_OVERRIDE_KEYS[speciesId];
      // @ts-ignore
      const overrideText = dictOverrides[key];
      if (overrideText) details.push({ trigger: 'manual_override', customReq: overrideText });
  }
  if (speciesId === 292 && details.length === 0) details.push({ trigger: 'shed' });

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

// --- NUEVO: FETCHER INDIVIDUAL PARA MOVIMIENTOS ---
export const fetchMoveDetail = async (url: string): Promise<IMoveDetail> => {
  const res = await fetch(url);
  const data = await res.json();
  
  return {
      id: data.id,
      name: data.name,
      names: data.names, // <--- PASAMOS LOS NOMBRES LOCALIZADOS
      accuracy: data.accuracy,
      power: data.power,
      pp: data.pp,
      priority: data.priority,
      type: data.type.name,
      damage_class: data.damage_class.name,
      flavor_text_entries: data.flavor_text_entries,
      target: data.target.name,
      machines: data.machines
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

  const abilities = await Promise.all(pokemonData.abilities.map(async (item: any) => {
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

    return { name: translatedName, isHidden: item.is_hidden, description };
  }));

  const stats = pokemonData.stats.map((s: any) => ({
    label: STAT_LABELS[s.stat.name] || s.stat.name,
    value: s.base_stat,
    max: 255, 
  }));

  // ASSETS
  const other = pokemonData.sprites.other;
  const official = other?.['official-artwork'];
  
  const main = official?.front_default || pokemonData.sprites.front_default || FALLBACK_SPRITE;
  const shiny = official?.front_shiny || pokemonData.sprites.front_shiny || main;
  const female = official?.front_female || undefined; 
  const femaleShiny = official?.front_shiny_female || undefined;

  const assets: IPokemonAssets = { main, shiny, female, femaleShiny };

  const varieties = speciesData.varieties.map((v: any) => {
    const urlParts = v.pokemon.url.split('/');
    let translatedFormName = '';

    if (v.pokemon.name === speciesData.name) {
         translatedFormName = lang === 'es' ? 'FORMA BASE' : 'BASE FORM';
    } else {
         translatedFormName = formatVarietyName(v.pokemon.name, speciesData.name, lang);
         if (!translatedFormName || translatedFormName.trim() === '') {
             translatedFormName = lang === 'es' ? 'FORMA BASE' : 'BASE FORM';
         }
    }
    
    return { isDefault: v.is_default, name: translatedFormName, pokemonId: urlParts[urlParts.length - 2] };
  });

  let evolutionChain: IEvolutionNode | undefined;
  if (speciesData.evolution_chain?.url) {
    try {
        const evoRes = await fetch(speciesData.evolution_chain.url);
        const evoData = await evoRes.json();
        evolutionChain = processEvolutionChain(evoData.chain, lang);
    } catch (e) { console.error("Evo error", e); }
  }

  // --- LOCATION LOGIC BLINDADA (GEN 8/9/ORAS FIX) ---
  let locations: ILocationEncounter[] = [];
  try {
    const locRes = await fetch(`${POKEAPI_BASE}/pokemon/${id}/encounters`);
    const locData = await locRes.json();
    
    if (Array.isArray(locData)) {
        locData.forEach((area: any) => {
            area.version_details.forEach((ver: any) => {
                const verNameRaw = ver.version.name;
                const verName = verNameRaw.toLowerCase().trim();
                
                // 1. Intentamos obtener metadatos del mapa conocido
                let meta = VERSION_METADATA[verName];
                
                // 2. FALLBACK CRÍTICO: Si la versión no está en nuestro mapa, la capturamos dinámicamente
                if (!meta) {
                    let guessedGen = 99;
                    let guessedGroup = 'Others';
                    
                    if (verName.includes('scarlet') || verName.includes('violet')) { guessedGen = 9; guessedGroup = 'SV'; }
                    else if (verName.includes('sword') || verName.includes('shield')) { guessedGen = 8; guessedGroup = 'SwSh'; }
                    else if (verName.includes('alpha') || verName.includes('omega')) { guessedGen = 6; guessedGroup = 'ORAS'; }
                    
                    meta = {
                        name: verNameRaw.toUpperCase().replace(/-/g, ' '),
                        group: guessedGroup,
                        gen: guessedGen, 
                        region: 'Unknown',
                        type: 'Spin-off'
                    };
                }

                // 3. PROTECCIÓN: Verificar que encounter_details existe y no está vacío
                const details = ver.encounter_details && ver.encounter_details.length > 0 ? ver.encounter_details[0] : null;
                
                if (!details) return; // Saltamos este registro si está corrupto, sin romper el loop

                const conditions = details.condition_values?.map((c: any) => c.name) || [];
                let cleanLoc = area.location_area.name.replace(/-/g, ' ');
                
                locations.push({
                    region: meta.region,
                    version: meta.name,
                    versionGroup: meta.group,
                    generation: meta.gen,
                    gameType: meta.type,
                    locationName: cleanLoc,
                    method: details.method?.name || 'unknown',
                    chance: details.chance || 0,
                    minLevel: details.min_level || 0,
                    maxLevel: details.max_level || 0,
                    conditions: conditions
                });
            });
        });
    }
  } catch (e) { console.error("Loc error", e); }

  return {
    id: pokemonData.id,
    speciesId,
    name: pokemonData.name,
    speciesName: speciesData.name,
    types: pokemonData.types.map((t: any) => t.type.name),
    sprite: main,
    assets,
    genderRate: speciesData.gender_rate,
    stats,
    height: pokemonData.height,
    weight: pokemonData.weight,
    abilities,
    generation: ROMAN_GEN_MAP[speciesData.generation.name] || '?',
    varieties,
    dexIds,
    evolutionChain,
    locations,
    moves: pokemonData.moves // <--- ARRAY CRUDO PARA MOVE REGISTRY
  };
};

// --- NUEVO: FETCHER PARA MÁQUINAS (TMs) ---
export const fetchMachineDetail = async (url: string): Promise<IMachineDetail> => {
  const res = await fetch(url);
  const data = await res.json();
  return {
      id: data.id,
      item: data.item,
      version_group: data.version_group
  };
};

export const usePokemon = (id: string | number, lang: Lang = 'es') => {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ['pokemon', id, lang],
    queryFn: () => fetchPokemon(id, lang),
    enabled: !!id,
    staleTime: 0, 
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

// --- NUEVO HOOK PARA DETALLE DE MOVIMIENTOS ---
export const useMoveDetail = (url: string) => {
    return useQuery({
        queryKey: ['move', url],
        queryFn: () => fetchMoveDetail(url),
        staleTime: 1000 * 60 * 60 * 24, 
        enabled: !!url
    });
};

export const useMachine = (url?: string) => {
  return useQuery({
      queryKey: ['machine', url],
      queryFn: () => fetchMachineDetail(url!),
      staleTime: 1000 * 60 * 60 * 24,
      enabled: !!url
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

export const fetchNationalDexLookup = async (): Promise<Record<string, number>> => {
    try {
        const res = await fetch(`${POKEAPI_BASE}/pokedex/1`); // 1 = National Dex
        const data = await res.json();
        
        const lookup: Record<string, number> = {};
        
        data.pokemon_entries.forEach((entry: any) => {
            const speciesName = entry.pokemon_species.name;
            const urlParts = entry.pokemon_species.url.split('/');
            const id = parseInt(urlParts[urlParts.length - 2]);
            lookup[speciesName] = id;
        });

        return lookup;
    } catch (e) {
        console.error("Error fetching national dex lookup:", e);
        return {};
    }
};

export const useNationalDexLookup = () => {
    return useQuery({
        queryKey: ['nationalDexLookup'],
        queryFn: fetchNationalDexLookup,
        staleTime: 1000 * 60 * 60 * 24, // Cachear 24h
    });
};