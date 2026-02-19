import fs from 'fs';
import path from 'path';
import { analyzeNuzlockeViability } from '../src/lib/utils/nuzlockeEngine';
import { PokemonTierData } from '../src/types/nuzlocke';

const DATA_DIR = path.join(process.cwd(), 'public', 'data');
const GAMES_DIR = path.join(DATA_DIR, 'games');

const staticBaseDex = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'pokedex_base_stats.json'), 'utf-8'));
const staticMoveDex = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'move_dex.json'), 'utf-8'));
const staticMovepoolDex = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'movepool_dex.json'), 'utf-8'));
const staticPokedexIds = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'pokedex_ids.json'), 'utf-8'));

async function main() {
    console.log('🚀 Iniciando Pre-computación de Tiering Nuzlocke...');

    const gameTypes = fs.readdirSync(GAMES_DIR).filter(f => !f.includes('.'));
    const globalAvailability: Record<string, string[]> = {}; 
    
    for (const type of gameTypes) {
        const typePath = path.join(GAMES_DIR, type);
        const games = fs.readdirSync(typePath).filter(f => !f.includes('.'));

        for (const game of games) {
            console.log(`\n⏳ Procesando juego: [${type}] ${game}...`);
            const gamePath = path.join(typePath, game);
            
            let manifest = null, bosses = null, patchData = null;
            try { manifest = JSON.parse(fs.readFileSync(path.join(gamePath, 'manifest.json'), 'utf-8')); } catch (e) { continue; }
            try { bosses = JSON.parse(fs.readFileSync(path.join(gamePath, 'bosses.json'), 'utf-8')); } catch (e) { continue; }
            try { patchData = JSON.parse(fs.readFileSync(path.join(gamePath, 'patch.json'), 'utf-8')); } catch (e) {}

            // NUEVO: Flaggar si es juego Oficial para restringir cruces de generaciones
            if (manifest) {
                manifest.isVanilla = (type === 'vanilla');
            }

            const patchedBaseDex = JSON.parse(JSON.stringify(staticBaseDex));
            const patchedMoveDex = JSON.parse(JSON.stringify(staticMoveDex));

            if (patchData) {
                if (patchData.pokemon) {
                    for (const [key, changes] of Object.entries<any>(patchData.pokemon)) {
                        let id = key;
                        if (isNaN(Number(key))) id = staticPokedexIds[key] || staticPokedexIds[key.replace(/[^a-z0-9-]/g, '')];
                        if (id && patchedBaseDex[id]) {
                            if (changes.base_stats) patchedBaseDex[id].stats = { ...patchedBaseDex[id].stats, ...changes.base_stats };
                            if (changes.types) patchedBaseDex[id].types = changes.types;
                            if (changes.abilities) patchedBaseDex[id].abilities = changes.abilities;
                        }
                    }
                }
                
                if (patchData.moves) {
                    for (const [mKey, mChanges] of Object.entries<any>(patchData.moves)) {
                        const moveEntry = patchedMoveDex[mKey];
                        if (moveEntry) {
                            patchedMoveDex[mKey] = { ...moveEntry, ...mChanges };
                        } else {
                            patchedMoveDex[mKey] = {
                                name: mKey, type: mChanges.type || 'normal', category: mChanges.category || 'physical',
                                power: mChanges.power || 0, accuracy: mChanges.accuracy || 100, pp: mChanges.pp || 10,
                                tactics: mChanges.tactics || {}, ...mChanges
                            };
                        }
                    }
                }
            }

            const tieringOutput: Record<string, PokemonTierData> = {};
            const pokemonIds = Object.keys(staticBaseDex);
            const gameId = `${type}/${game}`;

            for (const pid of pokemonIds) {
                try {
                    const poke = patchedBaseDex[pid];
                    if (!poke) continue;

                    const rootPokemon = { id: Number(pid), name: poke.name, types: poke.types, stats: poke.stats };

                    const result = analyzeNuzlockeViability(
                        rootPokemon as any, bosses, manifest,
                        patchedBaseDex, patchedMoveDex, staticMovepoolDex, staticPokedexIds
                    );

                    const isAvailable = result.meta.availabilityStatus !== 'unavailable' && result.meta.availabilityStatus !== 'postgame';

                    if (isAvailable) {
                        if (!globalAvailability[pid]) globalAvailability[pid] = [];
                        globalAvailability[pid].push(gameId);
                    }

                    tieringOutput[pid] = {
                        tier: result.tier, score: result.score,
                        isAvailable, origin: result.meta.origin, phaseLabels: result.phaseLabels,
                        phases: {
                            early: { ...result.phases.early, available: result.phases.early.rating !== 'unavailable' },
                            mid: { ...result.phases.mid, available: result.phases.mid.rating !== 'unavailable' },
                            late: { ...result.phases.late, available: result.phases.late.rating !== 'unavailable' }
                        },
                        roles: [result.role]
                    };

                } catch (err) {
                    console.error(`   ❌ Error calculando ID ${pid}: ${err}`);
                }
            }

            fs.writeFileSync(path.join(gamePath, 'tiering.json'), JSON.stringify(tieringOutput, null, 2));
            console.log(`   ✅ Guardado tiering.json para ${game}.`);
        }
    }

    fs.writeFileSync(path.join(DATA_DIR, 'nuzlocke_availability.json'), JSON.stringify(globalAvailability));
    console.log('\n🎉 Generación de Tiers finalizada. Mapa de disponibilidad creado con éxito.');
}

main();