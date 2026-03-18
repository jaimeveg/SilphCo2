import { promises as fs } from 'fs';
import path from 'path';
import { ItemData, IItemDetail, IItemIndex, IItemUser } from '../src/types/items';
import { IRawStatData } from '../src/types/smogon';

// Definición de las rutas
const DATA_DIR = path.join(process.cwd(), 'public', 'data');
const SMOGON_DIR = path.join(DATA_DIR, 'smogon');
const ITEMS_DIR = path.join(DATA_DIR, 'items');
const ITEM_DEX_PATH = path.join(DATA_DIR, 'item_dex.json');
const OUTPUT_INDEX_PATH = path.join(DATA_DIR, 'itemdex_index.json');

// Umbral mínimo de uso para considerar (15%)
const MIN_USAGE_THRESHOLD = 0.15;

async function ensureDirExists(dirPath: string) {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
  }
}

async function enrichItemDex() {
  console.log('🔄 Iniciando enriquecimiento del ItemDex...');
  
  // 1. Leer el ItemDex base
  let itemDexData: Record<string, ItemData>;
  try {
    const itemDexRaw = await fs.readFile(ITEM_DEX_PATH, 'utf-8');
    itemDexData = JSON.parse(itemDexRaw);
  } catch (error) {
    console.error('❌ Error leyendo item_dex.json:', error);
    process.exit(1);
  }

  // 2. Preparar el diccionario enriquecido en memoria
  const enrichedItemDex: Record<string, IItemDetail> = {};
  for (const [id, itemData] of Object.entries(itemDexData)) {
    enrichedItemDex[id] = {
      ...itemData,
      best_users: [], // Inicializamos vacío
    };
  }

  // 3. Obtener todos los archivos de Smogon y filtrar por la última generación activa de VGC
  let smogonFiles: string[] = [];
  let maxGen = 0;
  
  try {
    const files = await fs.readdir(SMOGON_DIR);
    
    // Identificar la última generación de VGC disponble (ej. gen9, gen10, etc.)
    const vgcFilesRegex = /^gen(\d+)vgc/i;
    
    for (const f of files) {
      if (!f.endsWith('.json') || f.includes('meta.json')) continue;
      
      const match = f.match(vgcFilesRegex);
      if (match) {
        const gen = parseInt(match[1], 10);
        if (gen > maxGen) {
          maxGen = gen;
        }
      }
    }
    
    if (maxGen > 0) {
      console.log(`🔍 Última generación VGC detectada: Gen ${maxGen}`);
      // Quedarse solo con los archivos que coincidan con genXvgc (donde X es maxGen)
      smogonFiles = files.filter(f => {
        if (!f.endsWith('.json') || f.includes('meta.json')) return false;
        const prefix = `gen${maxGen}vgc`;
        return f.toLowerCase().startsWith(prefix);
      });
    } else {
      console.warn('⚠️ No se encontraron archivos de formato VGC en la carpeta.');
      smogonFiles = [];
    }
    
  } catch (error) {
    console.error('❌ Error leyendo directorio smogon:', error);
    process.exit(1);
  }

  console.log(`📊 Procesando ${smogonFiles.length} archivos de VGC de la Gen ${maxGen}...`);

  // 4. Iterar sobre los datos competitivos
  for (const file of smogonFiles) {
    try {
      const rawData = await fs.readFile(path.join(SMOGON_DIR, file), 'utf-8');
      const statData: IRawStatData = JSON.parse(rawData);
      
      const format = statData.info.metagame;
      const fileGlobalUsage: Record<string, number> = {};
      
      // Iterar sobre cada Pokémon en ese formato
      for (const [pokemonId, pkmnData] of Object.entries(statData.data)) {
        if (!pkmnData.Items) continue;
        
        // Calcular el uso de cada ítem
        let totalItems = 0;
        for (const count of Object.values(pkmnData.Items)) {
          totalItems += count;
        }

        if (totalItems === 0) continue;
        const pkmnUsage = pkmnData.usage || 0;

        for (const [itemId, count] of Object.entries(pkmnData.Items)) {
          if (itemId === 'nothing') continue;
          
          const usageRate = count / totalItems;
          const trueGlobalUsage = usageRate * pkmnUsage;
          
          fileGlobalUsage[itemId] = (fileGlobalUsage[itemId] || 0) + trueGlobalUsage;
          
          // CRÍTICO: Umbral > 15%
          if (usageRate > MIN_USAGE_THRESHOLD) {
            if (enrichedItemDex[itemId]) {
               enrichedItemDex[itemId].best_users.push({
                 pokemon_id: pokemonId,
                 format: format,
                 usage_rate: Number((usageRate * 100).toFixed(2)),
                 pokemon_usage: Number((pkmnUsage * 100).toFixed(2))
               });
            }
          }
        }
      }
      
      // Update global usage using the maximum footprint across files
      for (const [itemId, usage] of Object.entries(fileGlobalUsage)) {
        const numUsage = Number(usage);
        if (enrichedItemDex[itemId]) {
          if (!enrichedItemDex[itemId].global_usage) enrichedItemDex[itemId].global_usage = 0;
          if (numUsage > enrichedItemDex[itemId].global_usage!) {
             enrichedItemDex[itemId].global_usage = numUsage;
          }
        }
      }
    } catch (error) {
       console.error(`⚠️ Error procesando ${file}:`, error);
    }
  }

  // 5. Ordenar usuarios de cada item de mayor a menor uso
  console.log('🧹 Ordenando top users...');
  for (const item of Object.values(enrichedItemDex)) {
    // Sort and deduplicate by pokemon_id
    const uniqueUsers = new Map<string, IItemUser>();
    for (const user of item.best_users) {
      const existing = uniqueUsers.get(user.pokemon_id);
      if (!existing || (existing.pokemon_usage || 0) < (user.pokemon_usage || 0)) {
        uniqueUsers.set(user.pokemon_id, user);
      }
    }
    
    item.best_users = Array.from(uniqueUsers.values());
    item.best_users.sort((a, b) => (b.pokemon_usage || 0) - (a.pokemon_usage || 0));
    item.best_users = item.best_users.slice(0, 20); // Limit to top 20
  }

  // 6. Generar las salidas
  console.log('💾 Guardando resultados...');
  await ensureDirExists(ITEMS_DIR);

  const itemIndexList: IItemIndex[] = [];

  for (const [id, item] of Object.entries(enrichedItemDex)) {
    // 6a. Guardar el IItemIndex para la lista rápida O(1)
    const primaryCategory = item.categories.length > 0 ? item.categories[0] : 'miscellaneous';
    const topUsage = item.global_usage ? Number((item.global_usage * 100).toFixed(2)) : 0;
    
    itemIndexList.push({
      id: item.id,
      name: item.name,
      category: primaryCategory,
      effect: item.effect,
      local_image_path: item.sprites.high_res || item.sprites.low_res,
      max_usage: topUsage
    });

    // 6b. Guardar el documento individual del detalla de item
    const itemPath = path.join(ITEMS_DIR, `item_${id}.json`);
    await fs.writeFile(itemPath, JSON.stringify(item, null, 2));
  }

  // Ordenar el índice por mayor uso competitivo
  itemIndexList.sort((a, b) => (b.max_usage || 0) - (a.max_usage || 0));

  // 6c. Guardar el Index completo
  await fs.writeFile(OUTPUT_INDEX_PATH, JSON.stringify(itemIndexList, null, 2));

  console.log(`✅ ¡ItemDex enriquecido exitosamente!`);
  console.log(`📝 Se generó itemdex_index.json con ${itemIndexList.length} objetos.`);
  console.log(`📂 Se guardaron ${Object.keys(enrichedItemDex).length} archivos individuales en public/data/items/`);
}

enrichItemDex().catch(console.error);
