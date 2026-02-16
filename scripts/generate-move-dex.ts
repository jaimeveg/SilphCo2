import fs from 'fs';
import path from 'path';

const POKEAPI_GQL = 'https://beta.pokeapi.co/graphql/v1beta';
const CHUNK_SIZE = 500; 

const QUERY_MOVES = `
  query GetMoveDex($limit: Int, $offset: Int) {
    pokemon_v2_move(limit: $limit, offset: $offset, order_by: {id: asc}) {
      id
      name
      power
      accuracy
      pp
      priority
      # effect_chance ELIMINADO: No existe en la raíz en GraphQL
      pokemon_v2_type {
        name
      }
      pokemon_v2_movedamageclass {
        name
      }
      pokemon_v2_movetarget {
        name
      }
      pokemon_v2_moveeffect {
        pokemon_v2_moveeffecteffecttexts(where: {language_id: {_eq: 9}}) {
          short_effect
        }
      }
      # META DATA
      pokemon_v2_movemeta {
        ailment_chance
        flinch_chance
        stat_chance 
        crit_rate
        drain
        healing
        min_hits
        max_hits
        min_turns
        max_turns
        pokemon_v2_movemetaailment {
          name
        }
        pokemon_v2_movemetacategory {
          name
        }
      }
      # CAMBIOS DE STATS
      pokemon_v2_movemetastatchanges {
        change
        pokemon_v2_stat {
          name
        }
      }
      # APRENDICES
      pokemon_v2_pokemonmoves(distinct_on: pokemon_id) {
        pokemon_id
      }
    }
  }
`;

const detectTacticalTags = (move: any, effectText: string) => {
    const tags = {
        terrain: false,
        weather: false,
        redirection: false,
        protection: false,
        hazard: false,
        screen: false
    };

    const name = move.name.toLowerCase();
    const text = effectText.toLowerCase();

    if (name.includes('terrain') || text.includes('terrain')) tags.terrain = true;
    if (['rain-dance', 'sunny-day', 'sandstorm', 'hail', 'snow-scape', 'chilly-reception'].includes(name)) tags.weather = true;
    if (['follow-me', 'rage-powder', 'spotlight'].includes(name) || text.includes('center of attention')) tags.redirection = true;
    if (['protect', 'detect', 'wide-guard', 'quick-guard', 'spiky-shield', 'kings-shield', 'baneful-bunker', 'silky-trap'].includes(name)) tags.protection = true;
    if (['stealth-rock', 'spikes', 'toxic-spikes', 'sticky-web', 'stone-axe', 'ceaseless-edge'].includes(name)) tags.hazard = true;
    if (['reflect', 'light-screen', 'aurora-veil'].includes(name)) tags.screen = true;

    return tags;
};

async function fetchAllMoves() {
    let allMoves: any[] = [];
    let offset = 0;
    let fetchMore = true;

    console.log(`📡 Iniciando descarga del Move Dex Táctico (Fixed)...`);

    while (fetchMore) {
        try {
            const response = await fetch(POKEAPI_GQL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    query: QUERY_MOVES, 
                    variables: { limit: CHUNK_SIZE, offset } 
                })
            });

            const json = await response.json();
            if (json.errors) throw new Error(JSON.stringify(json.errors));

            const chunk = json.data.pokemon_v2_move;
            allMoves = [...allMoves, ...chunk];
            process.stdout.write(`   ↳ Recibidos ${allMoves.length} movimientos...\r`);

            if (chunk.length < CHUNK_SIZE) fetchMore = false;
            else offset += CHUNK_SIZE;

        } catch (e) {
            console.error(`\n❌ Error en chunk ${offset}:`, e);
            throw e;
        }
    }
    console.log(`\n✅ Descarga completada: ${allMoves.length} movimientos.`);
    return allMoves;
}

async function generateMoveDex() {
  try {
    const rawMoves = await fetchAllMoves();
    const output: Record<string, any> = {};

    console.log('⚡ Procesando y parametrizando efectos...');

    rawMoves.forEach((m: any) => {
        const slug = m.name.toLowerCase().replace(/\s+/g, '-');
        const meta = m.pokemon_v2_movemeta[0] || null; 
        let effectText = m.pokemon_v2_moveeffect?.pokemon_v2_moveeffecteffecttexts[0]?.short_effect || "";

        // CALCULAR PROBABILIDAD DE EFECTO
        // Si hay meta, buscamos cual es el chance relevante (estado, retroceso o stats)
        const calculatedChance = meta ? (meta.ailment_chance || meta.flinch_chance || meta.stat_chance || 0) : 0;
        
        // Reemplazar $effect_chance en el texto
        if (calculatedChance > 0) {
            effectText = effectText.replace(/\$effect_chance/g, String(calculatedChance));
        } else {
            // Si es 0 o null, a veces es 100% implícito, limpiamos la variable del texto
            effectText = effectText.replace(/\$effect_chance/g, ""); 
        }

        // 1. Stats
        const statChanges = m.pokemon_v2_movemetastatchanges.map((sc: any) => ({
            stat: sc.pokemon_v2_stat.name,
            stages: sc.change, 
        }));

        // 2. Ailments
        let status = null;
        if (meta && meta.pokemon_v2_movemetaailment?.name !== 'none') {
            status = {
                condition: meta.pokemon_v2_movemetaailment.name,
                chance: meta.ailment_chance || 100 
            };
        }

        // 3. Healing
        let healing = null;
        if (meta) {
            if (meta.healing > 0) healing = { type: 'restore', percent: meta.healing };
            if (meta.drain > 0) healing = { type: 'drain', percent: meta.drain }; 
        }

        // 4. Flags
        const tags = detectTacticalTags(m, effectText);

        output[slug] = {
            id: m.id,
            name: m.name,
            type: m.pokemon_v2_type?.name || 'normal',
            category: m.pokemon_v2_movedamageclass?.name || 'status',
            power: m.power,
            accuracy: m.accuracy,
            pp: m.pp,
            priority: m.priority,
            target: m.pokemon_v2_movetarget?.name || 'selected-pokemon',
            effectText: effectText,
            tactics: {
                status,
                statChanges: statChanges.length > 0 ? statChanges : null,
                healing,
                flinchChance: meta?.flinch_chance || 0,
                critRate: meta?.crit_rate || 0,
                minHits: meta?.min_hits,
                maxHits: meta?.max_hits,
                ...tags 
            },
            learners: m.pokemon_v2_pokemonmoves.map((pm: any) => pm.pokemon_id)
        };
    });

    const dir = path.join(process.cwd(), 'public', 'data');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    fs.writeFileSync(path.join(dir, 'move_dex.json'), JSON.stringify(output));
    console.log(`💾 Move Dex Táctico guardado: move_dex.json (${Object.keys(output).length} entradas)`);

  } catch (error) {
    console.error('❌ Error Fatal:', error);
  }
}

generateMoveDex();