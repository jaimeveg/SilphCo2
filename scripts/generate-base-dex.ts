import fs from 'fs';
import path from 'path';

const POKEAPI_GQL = 'https://beta.pokeapi.co/graphql/v1beta';
const CHUNK_SIZE = 500; 

// 1. Query Stats (La que ya funcionaba)
const QUERY_STATS = `
  query GetPokemonStats($limit: Int, $offset: Int) {
    pokemon_v2_pokemon(where: {is_default: {_eq: true}}, limit: $limit, offset: $offset, order_by: {id: asc}) {
      id
      name
      pokemon_v2_pokemonstats {
        base_stat
        pokemon_v2_stat {
          name
        }
      }
      pokemon_v2_pokemontypes {
        pokemon_v2_type {
          name
        }
      }
      pokemon_v2_pokemonspecy {
        id
      }
    }
  }
`;

// 2. Query Evoluciones CORREGIDA (Sin trigger_id)
const QUERY_EVO = `
  query GetEvolutionData($limit: Int, $offset: Int) {
    pokemon_v2_pokemonspecies(limit: $limit, offset: $offset, order_by: {id: asc}) {
      id
      name
      evolves_from_species_id
      pokemon_v2_pokemonevolutions {
        min_level
        # trigger_id ELIMINADO: No es necesario y causaba error
        pokemon_v2_item {
          name
        }
        pokemon_v2_evolutiontrigger {
          name
        }
      }
    }
  }
`;

async function fetchAllPages(query: string, resourceKey: string, operationLabel: string) {
    let allData: any[] = [];
    let offset = 0;
    let fetchMore = true;

    console.log(`📡 Iniciando descarga de ${operationLabel}...`);

    while (fetchMore) {
        try {
            const response = await fetch(POKEAPI_GQL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    query, 
                    variables: { limit: CHUNK_SIZE, offset } 
                })
            });

            const json = await response.json();
            
            if (json.errors) {
                throw new Error(JSON.stringify(json.errors));
            }

            const dataChunk = json.data[resourceKey];
            allData = [...allData, ...dataChunk];
            
            process.stdout.write(`   ↳ Recibidos ${allData.length} registros...\r`);

            if (dataChunk.length < CHUNK_SIZE) {
                fetchMore = false; 
            } else {
                offset += CHUNK_SIZE;
            }

        } catch (e) {
            console.error(`\n❌ Error en chunk ${offset}:`, e);
            throw e;
        }
    }
    console.log(`\n✅ ${operationLabel} completado: ${allData.length} registros.`);
    return allData;
}

async function generateBaseDex() {
  console.log('🚀 Generando Dex Táctica (V3.2 Clean Schema)...');
  
  try {
    // 1. Descargar TODOS los datos
    const pokemonList = await fetchAllPages(QUERY_STATS, 'pokemon_v2_pokemon', 'Stats & Types');
    const speciesList = await fetchAllPages(QUERY_EVO, 'pokemon_v2_pokemonspecies', 'Evolution Trees');

    console.log('⚡ Cruzando referencias y construyendo grafos...');

    const output: Record<number, any> = {};
    
    // Mapa: SpeciesID -> PokemonID (Default)
    const speciesToPokemonId: Record<number, number> = {};
    pokemonList.forEach((p: any) => {
        if (p.pokemon_v2_pokemonspecy) {
            speciesToPokemonId[p.pokemon_v2_pokemonspecy.id] = p.id;
        }
    });

    // Mapa: Grafo de Evolución
    const evoGraph: Record<number, any> = {};
    speciesList.forEach((s: any) => {
        const evo = s.pokemon_v2_pokemonevolutions[0];
        evoGraph[s.id] = {
            id: s.id,
            fromSpeciesId: s.evolves_from_species_id,
            trigger: evo?.pokemon_v2_evolutiontrigger?.name,
            level: evo?.min_level,
            item: evo?.pokemon_v2_item?.name
        };
    });

    // 2. Procesar y Generar JSON Final
    pokemonList.forEach((p: any) => {
        const stats: any = {};
        let bst = 0;
        p.pokemon_v2_pokemonstats.forEach((s: any) => {
            const map: any = { 'hp':'hp', 'attack':'atk', 'defense':'def', 'special-attack':'spa', 'special-defense':'spd', 'speed':'spe' };
            const key = map[s.pokemon_v2_stat.name];
            if (key) {
                stats[key] = s.base_stat;
                bst += s.base_stat;
            }
        });

        const types = p.pokemon_v2_pokemontypes.map((t: any) => t.pokemon_v2_type.name);
        const speciesId = p.pokemon_v2_pokemonspecy?.id;

        // Resolver Línea Evolutiva
        let evolution = null;
        if (speciesId && evoGraph[speciesId]) {
            const selfNode = evoGraph[speciesId];
            
            const children = Object.values(evoGraph).filter((node: any) => node.fromSpeciesId === speciesId);
            
            evolution = {
                familyId: speciesId,
                from: selfNode.fromSpeciesId ? {
                    pokemonId: speciesToPokemonId[selfNode.fromSpeciesId],
                    level: selfNode.level,
                    trigger: selfNode.trigger,
                    item: selfNode.item
                } : null,
                to: children.map((child: any) => ({
                    pokemonId: speciesToPokemonId[child.id],
                    level: child.level,
                    trigger: child.trigger,
                    item: child.item
                })).filter((e: any) => e.pokemonId)
            };
        }

        output[p.id] = {
            id: p.id,
            name: p.name,
            stats,
            types,
            bst,
            evolution
        };
    });

    // Guardar
    const dir = path.join(process.cwd(), 'public', 'data');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    
    fs.writeFileSync(path.join(dir, 'pokedex_base_stats.json'), JSON.stringify(output));
    console.log(`💾 JSON Guardado: pokedex_base_stats.json (${Object.keys(output).length} entradas)`);

  } catch (error) {
    console.error('\n❌ ERROR FATAL:', error);
  }
}

generateBaseDex();