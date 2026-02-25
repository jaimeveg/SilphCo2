import fs from 'fs';
import path from 'path';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { pipeline } from 'stream/promises';

// --- CONFIGURACIÓN BASE ---
const TARGET_DIR = path.join(process.cwd(), 'public', 'images');
const DIRS = {
  icon: path.join(TARGET_DIR, 'icon'),
  highRes: path.join(TARGET_DIR, 'high-res'),
  models3D: path.join(TARGET_DIR, '3d-model')
};

// User-Agent real para evitar bloqueos 403 de Cloudflare/Anti-Scrapping
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const apiClient = axios.create({
  headers: { 'User-Agent': USER_AGENT },
  timeout: 15000
});

// --- UTILIDADES ---
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const ensureDirectories = () => {
  Object.values(DIRS).forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

const downloadFile = async (url: string, destPath: string, sourceName: string): Promise<boolean> => {
  if (fs.existsSync(destPath)) return true; // Skip si ya existe (Idempotencia)

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

// --- NORMALIZADORES DE NOMBRES ---
const normalizeForPokemonDB = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/['\u2019]/g, '') // Elimina apóstrofes (Farfetch'd -> farfetchd)
    .replace(/[\s_.:]+/g, '-') // Espacios y puntos a guiones (Mr. Mime -> mr-mime)
    .replace(/--+/g, '-');
};

const normalizeForWikiDex = (name: string): string => {
  // WikiDex usa capitalización inicial y mantiene caracteres especiales (codificados en la URL)
  const capitalized = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
  // Sustituir apóstrofo simple por el apóstrofo tipográfico usado en wikis hispanas si es necesario
  return encodeURIComponent(capitalized.replace(/'/g, '’'));
};

// --- MOTORES DE INGESTA POR FUENTE ---

// FASE 2: POKEMON DB (Iconos)
const downloadIcon = async (id: number, baseName: string) => {
  const cleanName = normalizeForPokemonDB(baseName);
  const url = `https://img.pokemondb.net/sprites/scarlet-violet/icon/${cleanName}.png`;
  const dest = path.join(DIRS.icon, `${id}.png`);
  
  await downloadFile(url, dest, 'PokemonDB');
};

// FASE 3: POKEAPI (Arte Alta Resolución)
const downloadHighRes = async (id: number) => {
  const dest = path.join(DIRS.highRes, `${id}.png`);
  if (fs.existsSync(dest)) return;

  try {
    const res = await apiClient.get(`https://pokeapi.co/api/v2/pokemon/${id}`);
    const artUrl = res.data.sprites?.other['official-artwork']?.front_default;
    
    if (artUrl) {
      await downloadFile(artUrl, dest, 'PokeAPI');
    } else {
      console.error(`[PokeAPI] Arte oficial no disponible para ID: ${id}`);
    }
  } catch (error: any) {
    console.error(`[PokeAPI] Error consultando ID ${id}: ${error.message}`);
  }
};

// FASE 4: WIKIDEX (Modelos 3D WebM)
const fetchWikiDexVideoUrl = async (pageUrl: string): Promise<string | null> => {
  try {
    const res = await apiClient.get(pageUrl);
    const $ = cheerio.load(res.data);
    // Extraer del contenedor nativo de MediaWiki
    const mediaUrl = $('.fullMedia a').attr('href');
    
    if (!mediaUrl) return null;
    return mediaUrl.startsWith('//') ? `https:${mediaUrl}` : mediaUrl;
  } catch (error: any) {
    if (error.response?.status !== 404) {
      console.error(`[WikiDex Scraper] Error parseando HTML: ${error.message}`);
    }
    return null;
  }
};

const download3DModels = async (id: number, baseName: string) => {
  const wikiName = normalizeForWikiDex(baseName);
  
  // Rutas de destino
  const destNormal = path.join(DIRS.models3D, `${id}.webm`);
  const destShiny = path.join(DIRS.models3D, `${id}_shiny.webm`);

  // URLs de las páginas de archivo de WikiDex
  const normalPageUrl = `https://www.wikidex.net/wiki/Archivo:${wikiName}_HOME.webm`;
  const shinyPageUrl = `https://www.wikidex.net/wiki/Archivo:${wikiName}_HOME_variocolor.webm`;

  // 1. Ingesta Normal
  if (!fs.existsSync(destNormal)) {
    const rawNormalUrl = await fetchWikiDexVideoUrl(normalPageUrl);
    if (rawNormalUrl) {
      await downloadFile(rawNormalUrl, destNormal, 'WikiDex Normal');
    } else {
      console.error(`[WikiDex] 404 (HTML): ${wikiName}_HOME.webm`);
    }
    await delay(600); // Throttle estricto Anti-Ban
  }

  // 2. Ingesta Shiny
  if (!fs.existsSync(destShiny)) {
    const rawShinyUrl = await fetchWikiDexVideoUrl(shinyPageUrl);
    if (rawShinyUrl) {
      await downloadFile(rawShinyUrl, destShiny, 'WikiDex Shiny');
    } else {
      console.error(`[WikiDex] 404 (HTML): ${wikiName}_HOME_variocolor.webm`);
    }
    await delay(600); // Throttle estricto Anti-Ban
  }
};

// --- ORQUESTADOR PRINCIPAL ---
const runETL = async () => {
  console.log('=== INICIANDO EXTRACCIÓN MASIVA DE ASSETS SILPH CO. ===\n');
  ensureDirectories();

  const START_ID = 1;
  const END_ID = 1025; // Pokedex Nacional actual (SV)

  for (let id = START_ID; id <= END_ID; id++) {
    console.log(`\n>> Procesando Pokémon ID: ${id} ...`);
    
    try {
      // 1. Obtener el nombre base canónico desde PokeAPI para derivar el resto de URLs
      const baseRes = await apiClient.get(`https://pokeapi.co/api/v2/pokemon-species/${id}`);
      // Asumimos el nombre base en inglés para compatibilidad cruzada de scrapers
      const baseName = baseRes.data.name; 
      
      await delay(300); // Throttle API

      // 2. Ejecución secuencial de pipelines de descarga
      await downloadIcon(id, baseName);
      await delay(400); 

      await downloadHighRes(id);
      await delay(400); 

      await download3DModels(id, baseName);
      
      console.log(`[OK] Extracción completada para ID: ${id} (${baseName})`);

    } catch (error: any) {
      console.error(`[CRÍTICO] Fallo general en el ciclo del ID ${id}:`, error.message);
      // Continuamos con el siguiente Pokémon sin abortar el ETL
      continue;
    }
  }

  console.log('\n=== PIPELINE DE EXTRACCIÓN FINALIZADO ===');
};

// Ejecución
runETL().catch(err => {
  console.error('[FATAL ERROR] El orquestador ETL colapsó:', err);
  process.exit(1);
});