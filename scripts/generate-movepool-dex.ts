import fs from 'fs';
import path from 'path';

const POKEAPI_GQL = 'https://beta.pokeapi.co/graphql/v1beta';
const CHUNK_SIZE = 1000; // Aumentado ligeramente para reducir peticiones totales
const MAX_RETRIES = 5;

// IDs de métodos de aprendizaje en PokeAPI:
// 1: Level up
// 2: Egg
// 3: Tutor
// 4: Machine (TM/HM)
const QUERY = `
  query GetMovepools($limit: Int, $offset: Int) {
    pokemon_v2_pokemonmove(
      where: {
        move_learn_method_id: {_in: [1, 2, 3, 4]}, 
        pokemon_v2_versiongroup: {generation_id: {_lte: 9}}
      } 
      limit: $limit, 
      offset: $offset, 
      order_by: {pokemon_id: asc, level: asc}
    ) {
      pokemon_id
      level
      pokemon_v2_versiongroup {
        generation_id
      }
      pokemon_v2_movelearnmethod {
        name
      }
      pokemon_v2_move {
        name
        power
        pokemon_v2_type {
            name
        }
        pokemon_v2_movedamageclass {
            name
        }
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

        const text = await response.text();

        if (!response.ok) {
            throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
        }

        try {
            const json = JSON.parse(text);
            if (json.errors) throw new Error(JSON.stringify(json.errors));
            return json;
        } catch (e) {
            throw new Error(`Respuesta inválida (No es JSON): ${text.substring(0, 100)}...`);
        }

    } catch (error: any) {
        if (retries < MAX_RETRIES) {
            const delay = 2000 * (retries + 1);
            console.warn(`⚠️ Error en chunk (Intento ${retries + 1}/${MAX_RETRIES}). Esperando ${delay/1000}s... Error: ${error.message}`);
            await wait(delay);
            return fetchWithRetry(query, variables, retries + 1);
        } else {
            throw error;
        }
    }
}

async function fetchAllMovepools() {
    let allData: any[] = [];
    let offset = 0;
    let fetchMore = true;

    console.log(`📚 Iniciando descarga masiva de Movepools (Nivel, MT, Huevo, Tutor)...`);

    while (fetchMore) {
        try {
            const json = await fetchWithRetry(QUERY, { limit: CHUNK_SIZE, offset });
            
            const chunk = json.data.pokemon_v2_pokemonmove;
            allData = [...allData, ...chunk];
            
            process.stdout.write(`   ↳ Progreso: ${allData.length} movimientos descargados (Offset: ${offset})...\r`);

            if (chunk.length < CHUNK_SIZE) {
                fetchMore = false;
            } else {
                offset += CHUNK_SIZE;
            }

        } catch (e) {
            console.error(`\n❌ Error FATAL en offset ${offset}. Se detiene la descarga.`);
            throw e;
        }
    }
    console.log(`\n✅ Descarga completada: ${allData.length} registros totales.`);
    return allData;
}

async function generateMovepoolDex() {
    try {
        const rawData = await fetchAllMovepools();
        
        console.log('⚡ Procesando y comprimiendo datos...');
        
        // Estructura: { [pokemonId]: { [genId]: [Moves] } }
        const output: Record<number, Record<number, any[]>> = {};

        rawData.forEach((entry: any) => {
            const pId = entry.pokemon_id;
            const genId = entry.pokemon_v2_versiongroup.generation_id;
            const move = entry.pokemon_v2_move;
            const method = entry.pokemon_v2_movelearnmethod.name; // 'level-up', 'machine', 'egg', 'tutor'

            if (!output[pId]) output[pId] = {};
            if (!output[pId][genId]) output[pId][genId] = [];

            // Filtro de duplicados:
            // Ahora permitimos el mismo movimiento si el método es diferente o el nivel es diferente.
            // (Ej: Aprende Lanzallamas por nivel y por MT -> Guardamos ambos, el de MT tendrá nivel 0)
            const exists = output[pId][genId].find((m: any) => 
                m.name === move.name && 
                m.level === entry.level && 
                m["learning-method"] === method
            );
            
            if (!exists) {
                output[pId][genId].push({
                    name: move.name,
                    level: entry.level,
                    power: move.power,
                    type: move.pokemon_v2_type?.name,
                    cat: move.pokemon_v2_movedamageclass?.name,
                    "learning-method": method // Nueva clave solicitada
                });
            }
        });

        const dir = path.join(process.cwd(), 'public', 'data');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

        const outputPath = path.join(dir, 'movepool_dex.json');
        fs.writeFileSync(outputPath, JSON.stringify(output));
        console.log(`💾 Guardado exitoso: ${outputPath}`);

    } catch (error) {
        console.error('❌ Error en el script:', error);
    }
}

generateMovepoolDex();