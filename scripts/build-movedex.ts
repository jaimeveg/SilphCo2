// scripts/build-movedex.ts
// EJECUTAR CON: npx tsx scripts/build-movedex.ts

import fs from 'fs/promises';
import path from 'path';
import { IMoveIndexItem, IMoveDetail, ILearnerRecord, IMoveTactics } from '../src/types/movedex';

const POKEAPI_GQL = 'https://beta.pokeapi.co/graphql/v1beta';
const DATA_DIR = path.join(process.cwd(), 'public', 'data');
const MOVES_DIR = path.join(DATA_DIR, 'moves');
const CHUNK_SIZE = 200; 
const MAX_RETRIES = 3;

const MOVES_QUERY = `
query GetAllMoves($limit: Int, $offset: Int) {
  pokemon_v2_move(where: {generation_id: {_lte: 9}}, limit: $limit, offset: $offset, order_by: {id: asc}) {
    name
    power
    accuracy
    pp
    priority
    generation_id
    move_effect_chance
    pokemon_v2_type { name }
    pokemon_v2_movedamageclass { name }
    pokemon_v2_movetarget { name }
    pokemon_v2_moveflavortexts(where: {language_id: {_eq: 9}}, order_by: {version_group_id: desc}, limit: 1) {
      flavor_text
    }
    pokemon_v2_moveeffect {
      pokemon_v2_moveeffecteffecttexts(where: {language_id: {_eq: 9}}) {
        effect
      }
    }
    pokemon_v2_movemeta {
      ailment_chance
      flinch_chance
      stat_chance
      pokemon_v2_movemetaailment { name }
      pokemon_v2_movemetacategory { name }
    }
    pokemon_v2_movemetastatchanges {
      change
      pokemon_v2_stat { name }
    }
  }
}
`;

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchWithRetry(query: string, variables: any, retries = 0): Promise<any> {
    try {
        const response = await fetch(POKEAPI_GQL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query, variables })
        });
        const json = await response.json();
        if (json.errors) throw new Error('GraphQL Syntax Error');
        return json;
    } catch (error: any) {
        if (retries < MAX_RETRIES) {
            const delay = 2000 * (retries + 1);
            console.warn(`⚠️ Error en petición. Reintentando en ${delay/1000}s...`);
            await wait(delay);
            return fetchWithRetry(query, variables, retries + 1);
        } else throw error;
    }
}

async function fetchAllMoves() {
    let allMoves: any[] = [];
    let offset = 0;
    let fetchMore = true;
    console.log(`[1/4] Descargando mecánicas, flavor texts y probabilidades...`);
    while (fetchMore) {
        const json = await fetchWithRetry(MOVES_QUERY, { limit: CHUNK_SIZE, offset });
        const chunk = json.data?.pokemon_v2_move || [];
        allMoves = [...allMoves, ...chunk];
        process.stdout.write(`   ↳ Progreso: ${allMoves.length} movimientos descargados...\r`);
        if (chunk.length < CHUNK_SIZE) fetchMore = false;
        else offset += CHUNK_SIZE;
    }
    console.log('\n');
    return allMoves;
}

const runETL = async () => {
    try {
        const rawMoves = await fetchAllMoves();
        console.log('[2/4] Cargando movepool_dex.json y cruzando datos...');
        const movepoolDex = JSON.parse(await fs.readFile(path.join(DATA_DIR, 'movepool_dex.json'), 'utf8'));
        const moveLearners: Record<string, Record<string, ILearnerRecord[]>> = {};

        for (const [pokemonId, generations] of Object.entries(movepoolDex)) {
            if (typeof generations !== 'object' || generations === null) continue;
            for (const [genId, movesArray] of Object.entries(generations)) {
                if (!Array.isArray(movesArray)) continue;
                for (const moveData of movesArray) {
                    const { name, "learning-method": method, level = 0 } = moveData;
                    if (!name || !method) continue;
                    if (!moveLearners[name]) moveLearners[name] = {};
                    if (!moveLearners[name][genId]) moveLearners[name][genId] = [];
                    moveLearners[name][genId].push({ pokemon_id: pokemonId, method, level });
                }
            }
        }

        console.log('[3/4] Parseando tácticas y validando Sheer Force...');
        await fs.mkdir(MOVES_DIR, { recursive: true });
        const indexList: IMoveIndexItem[] = [];

        for (const m of rawMoves) {
            const typeName = m.pokemon_v2_type?.name || 'normal';
            if (typeName === 'shadow') continue;

            const meta = m.pokemon_v2_movemeta?.[0] || {};
            let flavorText = m.pokemon_v2_moveflavortexts?.[0]?.flavor_text || 'No description available.';
            flavorText = flavorText.replace(/\n|\f|\r/g, ' ');

            let effectDesc = m.pokemon_v2_moveeffect?.pokemon_v2_moveeffecteffecttexts?.[0]?.effect || 'No mechanic details.';
            if (m.move_effect_chance) effectDesc = effectDesc.replace(/\$effect_chance/g, String(m.move_effect_chance));

            const statChanges = (m.pokemon_v2_movemetastatchanges || []).map((sc: any) => ({
                stat: sc.pokemon_v2_stat?.name,
                change: sc.change
            }));

            const tactics: IMoveTactics = {
                ailment: meta.pokemon_v2_movemetaailment?.name || 'none',
                ailment_chance: meta.ailment_chance || 0,
                flinch_chance: meta.flinch_chance || 0,
                stat_chance: meta.stat_chance || 0,
                effect_chance: m.move_effect_chance || null,
                meta_category: meta.pokemon_v2_movemetacategory?.name || 'none',
                stat_changes: statChanges
            };

            const isSheerForce = (m.power > 0) && (tactics.flinch_chance > 0 || tactics.stat_chance > 0 || tactics.ailment_chance > 0);
            
            // Flags y Arrays de estadísticas para los filtros rápidos
            const statsAffected = statChanges.map((sc: any) => sc.stat);
            const priorityVal = m.priority || 0;

            const indexItem: IMoveIndexItem = {
                id: m.name,
                name: m.name,
                type: typeName,
                category: m.pokemon_v2_movedamageclass?.name || 'status',
                power: m.power,
                accuracy: m.accuracy,
                pp: m.pp,
                priority: priorityVal,
                flags: {
                    is_priority: priorityVal > 0, // Solo detecta prioridad positiva como "Prioritario"
                    has_status: tactics.ailment !== 'none',
                    has_buff: statChanges.some((sc: any) => sc.change > 0),
                    has_debuff: statChanges.some((sc: any) => sc.change < 0)
                },
                stats_affected: Array.from(new Set(statsAffected)) as string[]
            };
            indexList.push(indexItem);

            const detailItem: IMoveDetail = {
                ...indexItem,
                flavorText,
                effectText: effectDesc,
                target: m.pokemon_v2_movetarget?.name || 'selected-pokemon',
                tactics,
                is_sheer_force_boosted: !!isSheerForce,
                generation_introduced: m.generation_id || 1,
                learners_by_gen: moveLearners[m.name] || {}
            };
            await fs.writeFile(path.join(MOVES_DIR, `move_${m.name}.json`), JSON.stringify(detailItem));
        }

        console.log(`[4/4] Guardando movedex_index.json (${indexList.length} movimientos)...`);
        await fs.writeFile(path.join(DATA_DIR, 'movedex_index.json'), JSON.stringify(indexList));
        console.log(`\n✅ [ÉXITO] ETL Finalizado.`);
    } catch (error) {
        console.error('\n💥 FATAL ERROR en el Pipeline ETL de MoveDex:', error);
        process.exit(1);
    }
};

runETL();