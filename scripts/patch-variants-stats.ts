import fs from 'fs/promises';
import path from 'path';
import axios from 'axios';

const DATA_DIR = path.join(process.cwd(), 'public', 'data');
const BASE_STATS_PATH = path.join(DATA_DIR, 'pokedex_base_stats.json');
const IDS_PATH = path.join(DATA_DIR, 'pokedex_ids.json');

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

const runPatch = async () => {
    console.log('=== INICIANDO PARCHE DE ESTADÍSTICAS PARA VARIANTES ===\n');

    try {
        const idsRaw = await fs.readFile(IDS_PATH, 'utf8');
        const idsMap = JSON.parse(idsRaw);

        const baseStatsRaw = await fs.readFile(BASE_STATS_PATH, 'utf8');
        const baseStats = JSON.parse(baseStatsRaw);

        // Filtramos solo los IDs que son Variantes (>= 10000)
        const variantEntries = Object.entries(idsMap).filter(([_, id]) => typeof id === 'number' && id >= 10000);
        console.log(`>> Detectados ${variantEntries.length} IDs de formas alternativas en pokedex_ids.json.`);

        let added = 0;

        for (const [name, id] of variantEntries) {
            const numericId = id as number;
            
            // Si no existe en el base_stats, lo descargamos e inyectamos
            if (!baseStats[numericId.toString()]) {
                process.stdout.write(`Fetching PokeAPI para ${name} (ID: ${numericId})... `);
                
                try {
                    const res = await axios.get(`https://pokeapi.co/api/v2/pokemon/${numericId}`);
                    const data = res.data;
                    
                    const statsObj = {
                        hp: data.stats.find((s: any) => s.stat.name === 'hp').base_stat,
                        atk: data.stats.find((s: any) => s.stat.name === 'attack').base_stat,
                        def: data.stats.find((s: any) => s.stat.name === 'defense').base_stat,
                        spa: data.stats.find((s: any) => s.stat.name === 'special-attack').base_stat,
                        spd: data.stats.find((s: any) => s.stat.name === 'special-defense').base_stat,
                        spe: data.stats.find((s: any) => s.stat.name === 'speed').base_stat,
                    };
                    
                    const bst = Object.values(statsObj).reduce((a: any, b: any) => a + b, 0);
                    const types = data.types.map((t: any) => t.type.name);
                    
                    // Extraer ID de la especie base para el agrupar luego
                    const speciesUrlParts = data.species.url.split('/').filter(Boolean);
                    const speciesId = parseInt(speciesUrlParts[speciesUrlParts.length - 1], 10);

                    baseStats[numericId.toString()] = {
                        id: numericId,
                        name: data.name,
                        types: types,
                        stats: statsObj,
                        bst: bst,
                        speciesId: speciesId,
                        gen: baseStats[speciesId.toString()]?.gen || 9, // Hereda la Gen de la forma base
                        evolution: { to: [] } // Forzamos a que actúe como Fully Evolved en el Grid por seguridad
                    };
                    
                    added++;
                    console.log('OK');
                    await delay(100); // Respetar rate limits
                } catch (e: any) {
                    console.log(`ERROR (${e.message})`);
                }
            }
        }

        if (added > 0) {
            await fs.writeFile(BASE_STATS_PATH, JSON.stringify(baseStats, null, 2));
            console.log(`\n[ÉXITO] Se inyectaron ${added} nuevas variantes en pokedex_base_stats.json.`);
        } else {
            console.log('\n[INFO] Todas las variantes ya estaban presentes o no hubo cambios.');
        }

    } catch (err: any) {
        console.error('Fallo Crítico:', err.message);
    }
};

runPatch();