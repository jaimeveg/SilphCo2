import fs from 'fs';
import path from 'path';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { pipeline } from 'stream/promises';

// --- CONFIGURACIÓN BASE ---
const TARGET_DIR = path.join(process.cwd(), 'public', 'images', 'pokemon');
const DIRS = {
  icon: path.join(TARGET_DIR, 'icon'),
  highRes: path.join(TARGET_DIR, 'high-res'),
  highResShiny: path.join(TARGET_DIR, 'high-res-shiny'),
  models3D: path.join(TARGET_DIR, '3d-model')
};

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const apiClient = axios.create({ headers: { 'User-Agent': USER_AGENT }, timeout: 15000 });

// --- UTILIDADES ---
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const ensureDirectories = () => {
  Object.values(DIRS).forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  });
};

const downloadFile = async (url: string, destPath: string, sourceName: string): Promise<boolean> => {
  if (fs.existsSync(destPath)) return true;

  try {
    const response = await apiClient.get(url, { responseType: 'stream' });
    await pipeline(response.data, fs.createWriteStream(destPath));
    return true;
  } catch (error: any) {
    if (error.response?.status === 404) {
      console.error(`[${sourceName}] 404 No encontrado: ${url}`);
    } else {
      console.error(`[${sourceName}] Error descargando ${url}: ${error.message}`);
    }
    return false;
  }
};

// --- MAPPERS DE NOMENCLATURA (TRADUCTORES LÉXICOS) ---

// 1. Traductor PokeAPI -> PokemonDB
const getPokemonDbName = (pokeApiName: string): string => {
  return pokeApiName
    .replace('-alola', '-alolan')
    .replace('-galar', '-galarian')
    .replace('-hisui', '-hisuian')
    .replace('-paldea-combat-breed', '-paldean-combat')
    .replace('-paldea-blaze-breed', '-paldean-blaze')
    .replace('-paldea-aqua-breed', '-paldean-aqua')
    .replace('-paldea', '-paldean');
};

// 2. Traductor PokeAPI -> WikiDex (Formato Capitalizado + Modificadores en Español)
const getWikiDexName = (pokeApiName: string): string => {
  let name = pokeApiName.toLowerCase();

  // Casos especiales fijos: Rotom
  const rotomMap: Record<string, string> = {
    'rotom-wash': 'Rotom_lavado',
    'rotom-heat': 'Rotom_calor',
    'rotom-frost': 'Rotom_frío',
    'rotom-mow': 'Rotom_corte',
    'rotom-fan': 'Rotom_ventilador'
  };
  if (rotomMap[name]) return rotomMap[name];

  // Identificar el nombre base (antes del primer guion)
  const baseNameRaw = name.split('-')[0];
  const baseName = baseNameRaw.charAt(0).toUpperCase() + baseNameRaw.slice(1);

  // Megas
  if (name.includes('-mega')) {
    if (name.endsWith('-x')) return `Mega-${baseName}_X`;
    if (name.endsWith('-y')) return `Mega-${baseName}_Y`;
    if (name.endsWith('-z')) return `Mega-${baseName}_Z`;
    return `Mega-${baseName}`;
  }

  // Gigamax
  if (name.includes('-gmax')) return `${baseName}_Gigamax`;

  // Formas Regionales
  if (name.includes('-alola')) return `${baseName}_de_Alola`;
  if (name.includes('-galar')) return `${baseName}_de_Galar`;
  if (name.includes('-hisui')) return `${baseName}_de_Hisui`;
  if (name.includes('-paldea')) return `${baseName}_de_Paldea`;

  // Formas genéricas (Fallback capitalizado)
  return name.split('-').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join('_');
};

// --- PIPELINES DE DESCARGA ---

const downloadVariantAssets = async (id: number, name: string) => {
  const iconDest = path.join(DIRS.icon, `${id}.png`);
  const resDest = path.join(DIRS.highRes, `${id}.png`);
  const shinyResDest = path.join(DIRS.highResShiny, `${id}.png`);
  const modelNormalDest = path.join(DIRS.models3D, `${id}.webm`);
  const modelShinyDest = path.join(DIRS.models3D, `${id}_shiny.webm`);

  if (fs.existsSync(iconDest) && fs.existsSync(resDest) && fs.existsSync(shinyResDest) && fs.existsSync(modelNormalDest) && fs.existsSync(modelShinyDest)) {
    console.log(`[SKIP] Assets de la Variante ID ${id} ya están completos.`);
    return;
  }

  const dbName = getPokemonDbName(name);
  const wikiName = encodeURIComponent(getWikiDexName(name));

  console.log(`\n>> Procesando Variante: ${name} (ID: ${id})`);
  console.log(`   - DB Mapped: ${dbName} | Wiki Mapped: ${decodeURIComponent(wikiName)}`);

  // 1. Icono (PokemonDB)
  const iconUrl = `https://img.pokemondb.net/sprites/scarlet-violet/icon/${dbName}.png`;
  if (!fs.existsSync(iconDest)) {
    await downloadFile(iconUrl, iconDest, 'PokemonDB Icon');
    await delay(300); // Throttle
  }

  // 2. High-Res Normal y Shiny (PokeAPI)
  if (!fs.existsSync(resDest) || !fs.existsSync(shinyResDest)) {
    try {
      const pokeApiRes = await apiClient.get(`https://pokeapi.co/api/v2/pokemon/${id}`);
      const sprites = pokeApiRes.data.sprites?.other['official-artwork'];

      if (sprites?.front_default) {
        await downloadFile(sprites.front_default, resDest, 'PokeAPI HighRes');
      }
      if (sprites?.front_shiny) {
        await downloadFile(sprites.front_shiny, shinyResDest, 'PokeAPI HighRes Shiny');
      }
    } catch (err: any) {
      console.error(`[PokeAPI] Error fetching variant data for ${name}: ${err.message}`);
    }
  }

  // 3. Modelos 3D (WikiDex)
  const fetchWikiUrl = async (pageUrl: string) => {
    try {
      const res = await apiClient.get(pageUrl);
      const $ = cheerio.load(res.data);
      const mediaUrl = $('.fullMedia a').attr('href');
      return mediaUrl ? (mediaUrl.startsWith('//') ? `https:${mediaUrl}` : mediaUrl) : null;
    } catch {
      return null;
    }
  };

  if (!fs.existsSync(modelNormalDest)) {
    const rawUrl = await fetchWikiUrl(`https://www.wikidex.net/wiki/Archivo:${wikiName}_HOME.webm`);
    if (rawUrl) await downloadFile(rawUrl, modelNormalDest, 'WikiDex Model');
    else console.error(`[WikiDex] 404: ${decodeURIComponent(wikiName)}_HOME.webm`);
    await delay(600); // Throttle pesado
  }

  if (!fs.existsSync(modelShinyDest)) {
    const rawShinyUrl = await fetchWikiUrl(`https://www.wikidex.net/wiki/Archivo:${wikiName}_HOME_variocolor.webm`);
    if (rawShinyUrl) await downloadFile(rawShinyUrl, modelShinyDest, 'WikiDex Shiny Model');
    else console.error(`[WikiDex] 404: ${decodeURIComponent(wikiName)}_HOME_variocolor.webm`);
    await delay(600); // Throttle pesado
  }
};

// --- ORQUESTADOR PRINCIPAL ---
const runVariantsETL = async () => {
  console.log('=== INICIANDO EXTRACCIÓN DE FORMAS ALTERNATIVAS (VARIANTS) ===\n');
  ensureDirectories();

  try {
    // Obtenemos la lista completa de Pokémon para aislar las variantes (IDs > 10000)
    console.log('[PokeAPI] Obteniendo registro maestro de formas...');
    const res = await apiClient.get('https://pokeapi.co/api/v2/pokemon?limit=10000');

    const variants = res.data.results.map((p: any) => {
      const urlParts = p.url.split('/').filter(Boolean);
      return { id: parseInt(urlParts[urlParts.length - 1], 10), name: p.name };
    }).filter((p: any) => p.id >= 10000); // Solo Formas Alternativas / Megas / Gmax / Regiones

    console.log(`[OK] Detectadas ${variants.length} formas alternativas en PokeAPI.`);

    for (const variant of variants) {
      // Evitamos tótems o formas puramente visuales menores que suelen romper scrapers (opcional)
      if (variant.name.includes('-totem') || variant.name.includes('-gmax')) {
        console.log(`[SKIP] Omitiendo forma de evento/especial: ${variant.name}`);
        continue;
      }

      await downloadVariantAssets(variant.id, variant.name);
    }

  } catch (err: any) {
    console.error('[FATAL ERROR] Falló la obtención inicial del registro maestro:', err.message);
  }

  console.log('\n=== PIPELINE DE EXTRACCIÓN DE VARIANTES FINALIZADO ===');
};

runVariantsETL().catch(err => {
  console.error('[FATAL ERROR] El script colapsó:', err);
  process.exit(1);
});