import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { pipeline } from 'stream/promises';

// --- NUEVA CONFIGURACIÓN DE RUTAS ---
// Adaptado a la nueva estructura: /public/images/pokemon/...
const TARGET_DIR = path.join(process.cwd(), 'public', 'images', 'pokemon', 'high-res-shiny');

const apiClient = axios.create({
  timeout: 10000 // Timeout corto para fallar rápido si hay cuelgues
});

// Micro-delay para no saturar los sockets TCP locales
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const ensureDirectory = () => {
  if (!fs.existsSync(TARGET_DIR)) {
    fs.mkdirSync(TARGET_DIR, { recursive: true });
  }
};

const downloadFile = async (url: string, destPath: string): Promise<boolean> => {
  if (fs.existsSync(destPath)) return true; // Idempotencia: salta si ya lo descargaste

  try {
    const response = await apiClient.get(url, { responseType: 'stream' });
    await pipeline(response.data, fs.createWriteStream(destPath));
    return true;
  } catch (error: any) {
    console.error(`[Error] Fallo descargando ${url}: ${error.message}`);
    return false;
  }
};

// --- ORQUESTADOR FAST-ETL ---
const runShinyETL = async () => {
  console.log('=== INICIANDO EXTRACCIÓN RÁPIDA: HIGH-RES SHINY ===\n');
  ensureDirectory();

  const START_ID = 1;
  const END_ID = 1025; // Pokedex Nacional (SV)

  for (let id = START_ID; id <= END_ID; id++) {
    const destPath = path.join(TARGET_DIR, `${id}.png`);
    
    // Si ya existe, nos saltamos la llamada a la API por completo
    if (fs.existsSync(destPath)) {
      console.log(`[SKIP] ID ${id} ya existe.`);
      continue;
    }

    try {
      // 1. Consultar el endpoint del Pokémon
      const res = await apiClient.get(`https://pokeapi.co/api/v2/pokemon/${id}`);
      
      // 2. Extraer la ruta exacta del arte oficial shiny
      const shinyUrl = res.data.sprites?.other['official-artwork']?.front_shiny;

      if (shinyUrl) {
        process.stdout.write(`>> Descargando Shiny ID ${id}... `);
        const success = await downloadFile(shinyUrl, destPath);
        if (success) {
          console.log('OK');
        }
      } else {
        console.log(`[AVISO] ID ${id} no tiene arte oficial shiny en PokeAPI.`);
      }

    } catch (error: any) {
      if (error.response?.status === 404) {
        console.error(`[404] Pokémon ID ${id} no encontrado en PokeAPI.`);
      } else {
        console.error(`\n[CRÍTICO] Fallo en ID ${id}:`, error.message);
      }
    }

    // Micro-throttle para cuidar el pool de conexiones de Node.js
    await delay(50); 
  }

  console.log('\n=== EXTRACCIÓN SHINY FINALIZADA ===');
};

// Ejecución
runShinyETL().catch(err => {
  console.error('[FATAL ERROR] El script colapsó:', err);
  process.exit(1);
});