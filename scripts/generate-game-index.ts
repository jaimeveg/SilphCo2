import fs from 'fs';
import path from 'path';

// LEER de public (donde están los juegos)
const PUBLIC_GAMES_DIR = path.join(process.cwd(), 'public', 'data', 'games');
// GUARDAR en src (para importar directo)
const OUTPUT_FILE = path.join(process.cwd(), 'src', 'data', 'games_index.json');

interface GameIndexEntry {
  id: string;
  name: string;
  type: string;
  path: string;
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1).replace(/-/g, ' ');
}

async function generateGameIndex() {
  console.log('🔍 Indexando juegos para importación directa...');
  
  if (!fs.existsSync(PUBLIC_GAMES_DIR)) {
    console.error(`❌ No existe carpeta de juegos en: ${PUBLIC_GAMES_DIR}`);
    return;
  }

  // Asegurar que existe el directorio de destino src/data
  const srcDataDir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(srcDataDir)) {
    fs.mkdirSync(srcDataDir, { recursive: true });
  }

  const index: GameIndexEntry[] = [];
  const types = ['vanilla', 'romhack'];

  for (const type of types) {
    const typeDir = path.join(PUBLIC_GAMES_DIR, type);
    if (fs.existsSync(typeDir)) {
      const games = fs.readdirSync(typeDir, { withFileTypes: true });
      for (const dirent of games) {
        if (dirent.isDirectory()) {
          if (fs.existsSync(path.join(typeDir, dirent.name, 'manifest.json'))) {
            index.push({
              id: dirent.name,
              name: capitalize(dirent.name),
              type: type,
              // Mantenemos la ruta relativa a public para los fetches posteriores
              path: `${type}/${dirent.name}` 
            });
          }
        }
      }
    }
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(index, null, 2));
  console.log(`✅ Índice generado en: ${OUTPUT_FILE}`);
  console.log(`🎮 Juegos encontrados: ${index.length}`);
}

generateGameIndex();