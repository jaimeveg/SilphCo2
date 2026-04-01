import fs from 'fs';
import path from 'path';
import readline from 'readline';

const POKEAPI_GQL = 'https://graphql.pokeapi.co/v1beta2/v1/graphql';
const CHUNK_SIZE = 1000;
const MAX_RETRIES = 5;

const QUERY = `
  query GetMovepools($limit: Int, $offset: Int, $startGen: Int) {
    pokemonmove(
      where: {
        move_learn_method_id: {_in: [1, 2, 3, 4]}, 
        versiongroup: {generation_id: {_gte: $startGen, _lte: 9}}
      } 
      limit: $limit, 
      offset: $offset, 
      order_by: {pokemon_id: asc, level: asc}
    ) {
      pokemon_id
      level
      versiongroup {
        generation_id
      }
      movelearnmethod {
        name
      }
      move {
        name
        power
        type {
            name
        }
        movedamageclass {
            name
        }
      }
    }
  }
`;

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const askQuestion = (query: string): Promise<string> => {
    return new Promise(resolve => rl.question(query, resolve));
};

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

async function fetchAllMovepools(startGen: number) {
    let allData: any[] = [];
    let offset = 0;
    let fetchMore = true;

    console.log(`📚 Iniciando descarga masiva de Movepools desde Gen ${startGen} (Nivel, MT, Huevo, Tutor)...`);

    while (fetchMore) {
        try {
            const json = await fetchWithRetry(QUERY, { limit: CHUNK_SIZE, offset, startGen });
            
            const chunk = json.data.pokemonmove;
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
    console.log(`\n✅ Descarga completada: ${allData.length} registros obtenidos.`);
    return allData;
}

async function generateMovepoolDex() {
    try {
        let startGenStr = await askQuestion('¿Desde qué generación quieres descargar los movimientos? (ej: 9): ');
        let startGen = parseInt(startGenStr.trim(), 10);
        
        if (isNaN(startGen) || startGen < 1 || startGen > 9) {
            console.log('Generación inválida. Por defecto se usará Gen 9.');
            startGen = 9;
        }

        if (startGen < 9) {
            const confirm = await askQuestion(`⚠️ Vas a descargar desde la Gen ${startGen}, esto es pesado para la PokeAPI y sobreescribirá datos. ¿Continuar? (y/n): `);
            if (confirm.trim().toLowerCase() !== 'y') {
                console.log('Operación cancelada por el usuario.');
                rl.close();
                return;
            }
        }
        
        rl.close();

        const rawData = await fetchAllMovepools(startGen);
        
        console.log('⚡ Procesando e integrando datos...');
        
        const dir = path.join(process.cwd(), 'public', 'data');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        const outputPath = path.join(dir, 'movepool_dex.json');

        // Cargar archivo existente para append/merge
        let output: Record<number, Record<number, any[]>> = {};
        if (fs.existsSync(outputPath)) {
            console.log('📁 Cargando archivo movepool_dex.json existente para añadir datos...');
            const existingData = fs.readFileSync(outputPath, 'utf-8');
            try {
                output = JSON.parse(existingData);
            } catch(e) {
                console.warn('⚠️ No se pudo parsear el archivo existente. Se creará uno nuevo.');
                output = {};
            }
        } else {
            console.log('📁 No existe movepool_dex.json previo, se creará uno nuevo.');
        }

        let updatedPokemonCount = 0;

        rawData.forEach((entry: any) => {
            const pId = entry.pokemon_id;
            const genId = entry.versiongroup.generation_id;
            const move = entry.move;
            const method = entry.movelearnmethod.name;

            if (!output[pId]) output[pId] = {};
            
            // Si es la primera vez que procesamos este pokemon/gen en ESTA corrida (para evitar duplicados iniciales)
            // No resetearemos el array directamente porque estamos añadiendo,
            // pero si la idea es "reemplazar" la Gen 9, podríamos considerarlo.
            // Para ser seguros, chequeamos si existe el movimiento.
            if (!output[pId][genId]) output[pId][genId] = [];

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
                    type: move.type?.name,
                    cat: move.movedamageclass?.name,
                    "learning-method": method
                });
                updatedPokemonCount++;
            }
        });

        fs.writeFileSync(outputPath, JSON.stringify(output));
        console.log(`💾 Guardado exitoso: ${outputPath} (${updatedPokemonCount} nuevos registros añadidos)`);

    } catch (error) {
        console.error('❌ Error en el script:', error);
        rl.close();
    }
}

generateMovepoolDex();