/**
 * SILPH LEGACY PARSER v18.2 (Fix Scope Error)
 * Transforma datos de nuzlocke.data a Silph JSONs.
 * * * FIX:
 * - Solucionado error "Cannot find name 'hasPatch'".
 * - La detección del parche se realiza antes del prompt de metadatos para sugerir correctamente "romhack".
 * * * FEATURES:
 * - Patch Linked to League.
 * - Manual Input Mode.
 * - Full Suite logic.
 * * * EJECUCIÓN:
 * npx ts-node --project tsconfig.scripts.json scripts/legacy-parser.ts
 */

import fs from 'fs';
import path from 'path';
import inquirer from 'inquirer';
import slugify from 'slugify';
import chalk from 'chalk';
import Pokedex from 'pokedex-promise-v2';

// --- IMPORTAR TIPOS ---
import { 
    GameManifest, 
    GameSegment, 
    Encounter, 
    BossDatabase, 
    BossBattle, 
    BossPokemon,
    BossCategory,
    EncounterMethod,
    BalancePatch,
    PokemonChange,
    MoveChange,
    AbilityChange,
    NuzlockeStats,
    StatKey
} from '../src/types/nuzlocke';

// --- CONFIGURACIÓN ---
const INPUT_ROOT = path.join(process.cwd(), 'nuzlocke.data-main');
const OUTPUT_ROOT = path.join(process.cwd(), 'public/data/games');
const P = new Pokedex();

// --- UTILS ---
const toSlug = (str: string) => slugify(str, { lower: true, strict: true, remove: /[*+~.()'"!:@]/g });

const cleanString = (str: string): string => {
    if (!str) return '';
    return str.split('>')[0].split('@')[0].trim();
};

const mapBossCategory = (raw: string): BossCategory => {
    if (!raw) return 'null';
    const r = raw.toLowerCase();
    
    if (r.includes('rival')) return 'rival';
    if (r.includes('leader') || r.includes('gym')) return 'gym_leader';
    if (r.includes('elite')) return 'elite_four';
    if (r.includes('champion')) return 'champion';
    if (r.includes('admin')) return 'evil_team_admin';
    
    if (r.includes('boss') || r.includes('giovanni') || r.includes('archer')
        || r.includes('archie') || r.includes('maxie') || r.includes('cyrus')
        || r.includes('ghetsis') || r.includes('lysandre')
        || r.includes('guzma') || r.includes('piers') || r.includes('penny')) {
            return 'evil_team_boss';
    }

    if (r.includes('team') || r.includes('rocket') || r.includes('plasma') || r.includes('magma')) {
        return 'evil_team_admin';
    }

    if (r.includes('totem')) return 'totem';
    if (r.includes('optional')) return 'optional';
    
    return 'null';
};

const getSpecialRoleByName = (name: string): BossCategory | null => {
    const n = name.toLowerCase();
    if (n.includes('giovanni') || n.includes('archer') || n.includes('archie') || 
        n.includes('maxie') || n.includes('cyrus') || n.includes('ghetsis') || 
        n.includes('lysandre') || n.includes('guzma') || n.includes('piers') || 
        n.includes('penny') || n.includes('volo') || n.includes('rose') || 
        n.includes('colress') || n.includes('lusamine') || n.includes('n ') || n === 'n') {
        return 'evil_team_boss';
    }
    if (n.includes('lance') || n.includes('steven') || n.includes('wallace') || 
        n.includes('cynthia') || n.includes('alder') || n.includes('iris') || 
        n.includes('diantha') || n.includes('leon') || n.includes('geeta')) {
        return 'champion';
    }
    return null;
};

interface BossMetadata {
    id: string;
    segmentId: string;
    category: BossCategory;
    displayName: string; 
    enemyName: string;   
}

// --- LOGIC: VARIANT PROCESSING ---
const processBossVariants = (boss: BossBattle): BossBattle[] => {
    const variantsFound = new Set<string>();
    boss.team.forEach((p: any) => {
        if (p._variant_tag && p._variant_tag.trim() !== '') {
            variantsFound.add(p._variant_tag);
        }
    });

    if (variantsFound.size === 0) {
        boss.team = boss.team.map((p: any) => {
            const { _variant_tag, ...rest } = p;
            return rest as BossPokemon;
        });
        if (boss.team.length > 0) {
            boss.level_cap = Math.max(...boss.team.map(p => p.level));
        }
        return [boss];
    }

    const generatedBosses: BossBattle[] = [];
    variantsFound.forEach(variant => {
        const newBoss: BossBattle = { 
            ...boss,
            team: [],
            id: `${boss.id}_${variant}`,
            variant: {
                type: 'starter',
                slug: `starter-${variant}`,
                description: `Starter: ${variant.charAt(0).toUpperCase() + variant.slice(1)}`
            }
        };
        newBoss.team = boss.team.filter((p: any) => {
            return !p._variant_tag || p._variant_tag === variant;
        }).map((p: any) => {
            const { _variant_tag, ...rest } = p;
            return rest as BossPokemon;
        });
        if (newBoss.team.length > 0) {
            newBoss.level_cap = Math.max(...newBoss.team.map(p => p.level));
        }
        generatedBosses.push(newBoss);
    });
    return generatedBosses;
};

// --- SMART LINKER ---
const getSmartCandidate = (routesFileName: string, leaguesDir: string): string | null => {
    const baseName = routesFileName.replace('.txt', '');
    const mappings: Record<string, string> = {
        'ruby': 'rs.txt', 'saph': 'rs.txt', 'sapphire': 'rs.txt',
        'red': 'rb.txt', 'blue': 'rb.txt',
        'gold': 'gsc.txt', 'silver': 'gsc.txt', 'crystal': 'gsc.txt',
        'diamond': 'dp.txt', 'pearl': 'dp.txt',
        'black': 'bw.txt', 'white': 'bw.txt',
        'x': 'xy.txt', 'y': 'xy.txt',
        'sun': 'sm.txt', 'moon': 'sm.txt',
        'usun': 'usum.txt', 'umoon': 'usum.txt',
        'sword': 'swsh.txt', 'shield': 'swsh.txt',
        'scarlet': 'sv.txt', 'violet': 'sv.txt'
    };
    if (mappings[baseName]) {
        const candidate = mappings[baseName];
        if (fs.existsSync(path.join(leaguesDir, candidate))) return candidate;
    }
    return null;
};

// --- LOGIC: METHOD DETECTION & MAPPING ---
const detectLegacyMethod = (pokeString: string): { cleanName: string, method: EncounterMethod } => {
    let cleanName = pokeString;
    let method: EncounterMethod = 'walk'; 
    if (pokeString.includes('(')) {
        const match = pokeString.match(/(.*)\((.*)\)/);
        if (match) {
            cleanName = match[1];
            const rawMethod = match[2].toLowerCase();
            if (rawMethod.includes('surf')) method = 'surf';
            else if (rawMethod.includes('old')) method = 'old-rod';
            else if (rawMethod.includes('good')) method = 'good-rod';
            else if (rawMethod.includes('super')) method = 'super-rod';
            else if (rawMethod.includes('fish') || rawMethod.includes('rod')) method = 'super-rod';
            else if (rawMethod.includes('rock')) method = 'rock-smash';
            else if (rawMethod.includes('static')) method = 'static';
            else if (rawMethod.includes('gift')) method = 'gift';
            else if (rawMethod.includes('egg')) method = 'gift-egg';
            else if (rawMethod.includes('trade')) method = 'npc-trade';
            else if (rawMethod.includes('headbutt')) method = 'headbutt';
            else if (rawMethod.includes('horde')) method = 'horde';
            else if (rawMethod.includes('swarm')) method = 'swarm';
            else if (rawMethod.includes('radar')) method = 'pokeradar';
            else if (rawMethod.includes('dexnav')) method = 'dexnav';
            else if (rawMethod.includes('sos')) method = 'sos-encounter';
            else if (rawMethod.includes('island')) method = 'island-scan';
            else if (rawMethod.includes('walk') || rawMethod.includes('grass')) method = 'walk';
        }
    }
    return { cleanName: cleanString(cleanName), method };
};

const mapApiMethodToEnum = (apiMethod: string): EncounterMethod => {
    if (apiMethod === 'walk') return 'walk';
    if (apiMethod === 'dark-grass') return 'dark-grass';
    if (apiMethod === 'surf') return 'surf';
    if (apiMethod === 'old-rod') return 'old-rod';
    if (apiMethod === 'good-rod') return 'good-rod';
    if (apiMethod === 'super-rod') return 'super-rod';
    if (apiMethod === 'rock-smash') return 'rock-smash';
    if (apiMethod === 'headbutt') return 'headbutt';
    if (apiMethod === 'headbutt-normal') return 'headbutt-normal';
    if (apiMethod === 'headbutt-low') return 'headbutt-low';
    if (apiMethod === 'headbutt-high') return 'headbutt-high';
    if (apiMethod === 'squirt-bottle') return 'squirt-bottle';
    if (apiMethod === 'wailmer-pail') return 'wailmer-pail';
    if (apiMethod === 'seaweed') return 'seaweed';
    if (apiMethod === 'gift') return 'gift';
    if (apiMethod === 'gift-egg') return 'gift-egg';
    if (apiMethod === 'pokeflute') return 'pokeflute';
    if (apiMethod === 'devon-scope') return 'devon-scope';
    if (apiMethod === 'feebas-tile-fishing') return 'feebas-tile-fishing';
    if (apiMethod === 'roaming-grass') return 'roaming-grass';
    if (apiMethod === 'roaming-water') return 'roaming-water';
    if (apiMethod === 'only-one') return 'only-one';
    if (apiMethod === 'rough-terrain') return 'rough-terrain';
    if (apiMethod === 'yellow-flowers') return 'yellow-flowers';
    if (apiMethod === 'red-flowers') return 'red-flowers';
    if (apiMethod === 'purple-flowers') return 'purple-flowers';
    if (apiMethod === 'grass-spots') return 'grass-spots'; 
    if (apiMethod === 'cave-spots') return 'cave-spots'; 
    if (apiMethod === 'bridge-spots') return 'bridge-spots'; 
    if (apiMethod === 'super-rod-spots') return 'super-rod-spots';
    if (apiMethod === 'surf-spots') return 'surf-spots';
    if (apiMethod === 'sos-encounter') return 'sos-encounter';
    if (apiMethod === 'island-scan') return 'island-scan';
    if (apiMethod === 'bubbling-spots') return 'bubbling-spots';
    if (apiMethod === 'berry-piles') return 'berry-piles';
    if (apiMethod.includes('overworld')) return 'overworld';
    if (apiMethod.includes('trade')) return 'npc-trade';
    return 'walk';
};

// --- POKEAPI ENRICHER ---
const normalizeApiVersion = (gameSlug: string): string => {
    const s = gameSlug.replace('pokemon-', '');
    if (s === 'fire-red') return 'firered';
    if (s === 'leaf-green') return 'leafgreen';
    if (s === 'heart-gold') return 'heartgold';
    if (s === 'soul-silver') return 'soulsilver';
    if (s === 'black-2') return 'black-2'; 
    if (s === 'white-2') return 'white-2';
    return s;
};

const locationMatches = (segmentName: string, apiLocationName: string): boolean => {
    const segSlug = toSlug(segmentName).replace(/-/g, ''); 
    const apiSlug = apiLocationName.replace(/-/g, '');     
    return apiSlug.includes(segSlug);
};

const enrichEncounter = async (encounter: Encounter, segmentName: string, gameVersionSlug: string): Promise<{encounter: Encounter, status: string}> => {
    let status = 'NONE';
    const apiVersion = normalizeApiVersion(gameVersionSlug);
    try {
        const pokemon = await P.getPokemonByName(encounter.pokemon_id);
        if (pokemon.held_items && pokemon.held_items.length > 0) {
            const versionItems: { item_id: string, chance: number }[] = [];
            pokemon.held_items.forEach((hi: any) => {
                const verDetail = hi.version_details.find((v: any) => v.version.name === apiVersion);
                if (verDetail) versionItems.push({ item_id: hi.item.name, chance: verDetail.rarity });
            });
            if (versionItems.length > 0) encounter.held_items = versionItems;
        }
        try {
            const species = await P.getPokemonSpeciesByName(pokemon.species.name);
            if (species.capture_rate) {
                encounter.capture_rate = species.capture_rate;
                status = 'PARTIAL'; 
            }
        } catch (e) {}
        const encountersUrl = pokemon.location_area_encounters;
        if (encountersUrl) {
            const locationAreas: any[] = await P.getResource(encountersUrl);
            const areaMatch = locationAreas.find((area: any) => {
                const locMatch = locationMatches(segmentName, area.location_area.name);
                const verMatch = area.version_details.some((v: any) => v.version.name === apiVersion);
                return locMatch && verMatch;
            });
            if (areaMatch) {
                const verDetails = areaMatch.version_details.find((v: any) => v.version.name === apiVersion);
                if (verDetails && verDetails.encounter_details.length > 0) {
                    const methodsMap = new Map<string, { rate: number, min: number, max: number, conditions: Set<string> }>();
                    verDetails.encounter_details.forEach((d: any) => {
                        const mName = d.method.name;
                        if (!methodsMap.has(mName)) methodsMap.set(mName, { rate: 0, min: 100, max: 0, conditions: new Set() });
                        const entry = methodsMap.get(mName)!;
                        entry.rate += d.chance;
                        if (d.min_level < entry.min) entry.min = d.min_level;
                        if (d.max_level > entry.max) entry.max = d.max_level;
                        if (d.condition_values) d.condition_values.forEach((c: any) => entry.conditions.add(c.name));
                    });
                    encounter.method = []; 
                    methodsMap.forEach((val, key) => {
                        encounter.method.push({
                            encounter_method: mapApiMethodToEnum(key),
                            min_level: val.min,
                            max_level: val.max,
                            rate: Math.min(val.rate, 100),
                            time: '', 
                            condition: Array.from(val.conditions).join(', ')
                        });
                    });
                    status = 'FULL MATCH';
                }
            }
        }
    } catch (e) {
        status = 'FAILED';
    }
    return { encounter, status };
};

// --- PARSERS ---
const Parsers = {
    parseRoutes: async (content: string, gameId: string, gen: number, isVanilla: boolean): Promise<{ segments: GameSegment[], bossRegistry: Record<string, BossMetadata> }> => {
        const lines = content.split('\n').filter(l => l.trim().length > 0);
        const segments: GameSegment[] = [];
        const bossRegistry: Record<string, BossMetadata> = {}; 
        let order = 1;
        let currentSegmentId = '';
        if (isVanilla) console.log(chalk.gray(`      (Enriqueciendo datos vía PokeAPI...)`));

        for (const line of lines) {
            const parts = line.split('|').map(p => p.trim());
            if (line.startsWith('#')) continue; 
            if (line.startsWith('--')) {
                const battleName = parts[0].replace(/^--/, ''); 
                const battleId = parts[1];
                const battleType = parts[2] || 'null';
                const enemyName = parts[3] || '';
                if (battleId) {
                    const bossSegmentId = toSlug(battleName);
                    let existingSegment = segments.find(s => s.id === bossSegmentId);
                    if (!existingSegment) {
                        const bossSegment: GameSegment = {
                            id: bossSegmentId,
                            name: battleName, 
                            order: order++,
                            encounters: [] 
                        };
                        segments.push(bossSegment);
                        existingSegment = bossSegment;
                    }
                    bossRegistry[battleId] = {
                        id: battleId,
                        segmentId: bossSegmentId,
                        category: mapBossCategory(battleType),
                        displayName: battleName,
                        enemyName: enemyName
                    };
                    currentSegmentId = bossSegmentId;
                }
                continue;
            }
            const segName = parts[0];
            const rawEncounters = parts[1] ? parts[1].split(',') : [];
            const segmentId = toSlug(segName); 
            const encounters: Encounter[] = [];
            for (const poke of rawEncounters) {
                const { cleanName, method: legacyMethod } = detectLegacyMethod(poke);
                let encounter: Encounter = {
                    pokemon_id: toSlug(cleanName),
                    method: [{
                        encounter_method: legacyMethod,
                        min_level: 0,
                        max_level: 0,
                        rate: 0,
                        time: '',
                        condition: ''
                    }],
                    capture_rate: 0,
                    held_items: []
                };
                if (isVanilla && encounter.pokemon_id && encounter.pokemon_id !== 'none') {
                    const result = await enrichEncounter(encounter, segName, gameId);
                    encounter = result.encounter;
                }
                if (encounter.pokemon_id && encounter.pokemon_id !== 'none') {
                    encounters.push(encounter);
                }
            }
            let existingSegment = segments.find(s => s.id === segmentId);
            if (existingSegment) {
                if (encounters.length > 0) existingSegment.encounters.push(...encounters);
                currentSegmentId = existingSegment.id;
            } else {
                const segment: GameSegment = {
                    id: segmentId,
                    name: segName,
                    order: order++,
                    encounters: encounters
                };
                segments.push(segment);
                currentSegmentId = segmentId;
            }
        }
        return { segments, bossRegistry };
    },

    parseLeagues: (content: string, bossRegistry: Record<string, BossMetadata>): BossDatabase => {
        const lines = content.split('\n').filter(l => l.trim().length > 0);
        const bosses: BossDatabase = [];
        let currentBoss: BossBattle | null = null;
        let currentSectionCategory: BossCategory = 'null';

        lines.forEach(line => {
            const parts = line.split('|').map(p => p.trim());
            if (line.startsWith('#')) {
                const rawSection = line.replace(/#/g, '').trim().toLowerCase();
                if (rawSection.includes('rival')) currentSectionCategory = 'rival';
                else if (rawSection.includes('leader') || rawSection.includes('gym') || rawSection.includes('badges')) currentSectionCategory = 'gym_leader';
                else if (rawSection.includes('elite') || rawSection.includes('e4')) currentSectionCategory = 'elite_four';
                else if (rawSection.includes('champion')) currentSectionCategory = 'champion';
                else if (rawSection.includes('team') || rawSection.includes('admin') || rawSection.includes('boss') || rawSection.includes('rocket') || rawSection.includes('magma') || rawSection.includes('aqua') || rawSection.includes('galactic') || rawSection.includes('plasma') || rawSection.includes('flare') || rawSection.includes('skull')) currentSectionCategory = 'evil_team_admin';
                else if (rawSection.includes('totem')) currentSectionCategory = 'totem';
                else currentSectionCategory = 'optional';
                return;
            }
            if (line.startsWith('--')) {
                if (currentBoss) {
                    bosses.push(...processBossVariants(currentBoss));
                }
                const bossId = parts[0].replace(/^--/, '');
                const registryData = bossRegistry[bossId];
                const name = registryData && registryData.enemyName ? registryData.enemyName : (parts[1] || bossId);
                let baseCategory: BossCategory = 'null';
                const explicitCat = parts[2];
                if (registryData && registryData.category !== 'null') baseCategory = registryData.category;
                else if (explicitCat && explicitCat !== 'null') baseCategory = mapBossCategory(explicitCat);
                else baseCategory = currentSectionCategory;
                let finalCategory = baseCategory;
                const specialRole = getSpecialRoleByName(name);
                if (specialRole) {
                    const protectGymLeader = (baseCategory === 'gym_leader' && (name.toLowerCase().includes('wallace') || name.toLowerCase().includes('iris')));
                    if (!protectGymLeader) finalCategory = specialRole;
                }
                if (finalCategory === 'null') finalCategory = 'optional';
                const segmentId = registryData ? registryData.segmentId : 'unknown-location';
                currentBoss = {
                    id: bossId,
                    segment_id: segmentId,
                    name: name,
                    category: finalCategory,
                    level_cap: 0, 
                    team: [],
                    format: 'single'
                };
            }
            else if (line.startsWith('==') && currentBoss) {
                const metaString = line.replace(/^==/, '');
                const props = metaString.split(/,|;/); 
                props.forEach(prop => {
                    const [key, val] = prop.split(/[:=]/).map(s => s.trim().toLowerCase());
                    if (key.includes('double') && val === 'true') currentBoss!.format = 'double';
                    else if (key.includes('triple') && val === 'true') currentBoss!.format = 'multi';
                    else currentBoss!.format = 'single';
                    if (key === 'weather' || key === 'effect') currentBoss!.weather = val;
                    if (key === 'terrain') currentBoss!.terrain = val;
                });
            }
            else if (currentBoss) {
                const nameRaw = parts[0];
                let levelRaw = parts[1];
                const movesRaw = parts[2];
                const itemRaw = parts[4]; 
                const abilityRaw = parts[3];
                const variantRaw = parts[5]; 
                let evsRaw = parts[7]; 
                let evs: Partial<NuzlockeStats> = {};
                if (levelRaw && levelRaw.includes('@')) {
                    const splitLvl = levelRaw.split('@');
                    levelRaw = splitLvl[0];
                    if (splitLvl[1]) {
                        const parsed = splitLvl[1].split('/').map(n => parseInt(n));
                        if (parsed.length === 6) evs = { hp: parsed[0], atk: parsed[1], def: parsed[2], spa: parsed[3], spd: parsed[4], spe: parsed[5] };
                    }
                }
                const pokemon: any = {
                    pokemon_id: toSlug(cleanString(nameRaw)),
                    level: parseInt(cleanString(levelRaw)) || 0,
                    moves: movesRaw ? movesRaw.split(',').map(m => toSlug(cleanString(m))).filter(m => m) : [],
                    item: itemRaw ? toSlug(cleanString(itemRaw)) : '',
                    ability: abilityRaw ? toSlug(cleanString(abilityRaw)) : '',
                    nature: '', 
                    evs: evs,
                    ivs: {}, 
                    happiness: 0,
                    dynamax_level: 0,
                    tera_type: '',
                    _variant_tag: variantRaw ? cleanString(variantRaw).toLowerCase() : ''
                };
                currentBoss.team.push(pokemon);
            }
        });
        if (currentBoss) {
            bosses.push(...processBossVariants(currentBoss));
        }
        return bosses;
    },

    parsePatch: (content: string, patchId: string): BalancePatch => {
        const patch: BalancePatch = {
            patch_id: patchId,
            pokemon: {},
            moves: {},
            abilities: {}
        };
        let currentSection = '';

        const lines = content.split('\n');
        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;

            if (trimmed.startsWith('--')) {
                currentSection = trimmed.substring(2).trim().toLowerCase();
                continue;
            }

            const parts = line.split('|').map(p => p.trim());
            if (parts.length < 2) continue; 

            if (currentSection === 'pokemon') {
                const statsRaw = parts[0]; 
                const name = parts[1];
                const typesRaw = parts[2];

                if (!name) continue;
                const slug = toSlug(name);
                
                const changes: PokemonChange = { id: slug };

                if (statsRaw) {
                    const s = statsRaw.split(',');
                    const statKeys: StatKey[] = ['hp', 'atk', 'def', 'spa', 'spd', 'spe'];
                    const stats: any = {};
                    
                    s.forEach((val, i) => {
                        if (val && val.trim() !== '') {
                            const num = parseInt(val.trim());
                            if (!isNaN(num) && i < statKeys.length) {
                                stats[statKeys[i]] = num;
                            }
                        }
                    });

                    if (Object.keys(stats).length > 0) {
                        changes.base_stats = stats as NuzlockeStats; 
                    }
                }

                if (typesRaw) {
                    const types = typesRaw.split(',').map(t => t.toLowerCase().trim()).filter(t => t);
                    if (types.length > 0) {
                        changes.types = [types[0], types[1] || ''] as [string, string];
                    }
                }

                if (!patch.pokemon) patch.pokemon = {};
                patch.pokemon[slug] = changes;
            } 
            else if (currentSection === 'move') {
                const name = parts[0];
                if (!name) continue;
                const slug = toSlug(name);

                const changes: MoveChange = { id: slug };
                if (parts[1]) changes.type = parts[1].toLowerCase();
                if (parts[2]) changes.power = parseInt(parts[2]) || 0;
                
                if (!patch.moves) patch.moves = {};
                patch.moves[slug] = changes;
            }
            else if (currentSection === 'ability') {
                const name = parts[0];
                if (!name) continue;
                const slug = toSlug(name);

                const changes: AbilityChange = { id: slug, description: parts[1] || '' };
                
                if (!patch.abilities) patch.abilities = {};
                patch.abilities[slug] = changes;
            }
        }
        return patch;
    }
};

// --- LOGIC: GAME PROCESSING WORKER ---
async function processGameFile(file: string, routesDir: string, leaguesDir: string, isIterator: boolean = false): Promise<void> {
    const fileId = file.replace('.txt', '');
    console.log(chalk.gray('---------------------------------------------'));
    console.log(chalk.yellow(`🔍 ${file}`));

    let leagueFileToUse: string | null = null;
    if (fs.existsSync(path.join(leaguesDir, file))) leagueFileToUse = file;

    let action = 'process';
    if (isIterator) {
        const answers = await inquirer.prompt([{
            type: 'list',
            name: 'action',
            message: `¿Procesar '${fileId}'?`,
            choices: [
                { name: '✅ Procesar', value: 'process' },
                { name: '⏭️ Saltar', value: 'skip' },
                { name: '🚪 Salir al Menú', value: 'exit' }
            ]
        }]);
        if (answers.action === 'exit') throw new Error('EXIT_LOOP');
        action = answers.action;
    }

    if (action === 'skip') return;

    const candidate = getSmartCandidate(file, leaguesDir);
    if (!leagueFileToUse) {
        if (candidate) {
            const linkAnswer = await inquirer.prompt([{ 
                type: 'list', 
                name: 'choice', 
                message: `Candidato: '${candidate}'. ¿Usar?`, 
                choices: [
                    { name: 'Sí, usar candidato', value: 'yes' },
                    { name: 'Introducir manual', value: 'manual' },
                    { name: 'Omitir (Sin Liga)', value: 'none' }
                ] 
            }]);
            
            if (linkAnswer.choice === 'yes') leagueFileToUse = candidate;
            else if (linkAnswer.choice === 'manual') {
                const m = await inquirer.prompt([{ type: 'input', name: 'f', message: 'Nombre archivo:' }]);
                leagueFileToUse = m.f;
            }
        } else {
            const linkAnswer = await inquirer.prompt([{ 
                type: 'list', 
                name: 'choice', 
                message: `⚠️ No se detectó Liga.`, 
                choices: [
                    { name: 'Introducir manual', value: 'manual' },
                    { name: 'Omitir (Sin Liga)', value: 'none' }
                ] 
            }]);
            if (linkAnswer.choice === 'manual') {
                const m = await inquirer.prompt([{ type: 'input', name: 'f', message: 'Nombre archivo:' }]);
                leagueFileToUse = m.f;
            }
        }
    }

    // PATCH CHECKING (Scope Fix: Moved before metadata prompt)
    const patchesDir = path.join(INPUT_ROOT, 'patches');
    const patchFileToUse = leagueFileToUse ? leagueFileToUse : file;
    const hasPatch = fs.existsSync(path.join(patchesDir, patchFileToUse));

    const metadata = await inquirer.prompt([
        { type: 'input', name: 'title', default: fileId },
        { type: 'number', name: 'gen', default: 3 },
        { type: 'input', name: 'region', default: 'unknown' },
        { type: 'list', name: 'type', choices: ['vanilla', 'romhack'], default: hasPatch ? 'romhack' : 'vanilla' }
    ]);

    try {
        const gameSlug = toSlug(metadata.title);
        process.stdout.write(chalk.cyan(`   ⚙️  Procesando... `));

        const routeContent = fs.readFileSync(path.join(routesDir, file), 'utf-8');
        const { segments, bossRegistry } = await Parsers.parseRoutes(
            routeContent, 
            gameSlug, 
            metadata.gen,
            metadata.type === 'vanilla'
        );

        const manifest: GameManifest = {
            game_id: gameSlug,
            name: metadata.title,
            region: toSlug(metadata.region),
            base_generation: metadata.gen,
            segments: segments
        };

        let bosses: BossDatabase = [];
        if (leagueFileToUse) {
            const leaguePath = path.join(leaguesDir, leagueFileToUse);
            if (fs.existsSync(leaguePath)) {
                const leagueContent = fs.readFileSync(leaguePath, 'utf-8');
                bosses = Parsers.parseLeagues(leagueContent, bossRegistry);
            } else {
                console.log(chalk.red(`\n   ❌ Error lectura Liga: ${leagueFileToUse}`));
            }
        }

        const gameDir = path.join(OUTPUT_ROOT, metadata.type, gameSlug);
        if (!fs.existsSync(gameDir)) fs.mkdirSync(gameDir, { recursive: true });

        fs.writeFileSync(path.join(gameDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
        fs.writeFileSync(path.join(gameDir, 'bosses.json'), JSON.stringify(bosses, null, 2));

        // PATCH OUTPUT
        if (hasPatch) {
            const patchContent = fs.readFileSync(path.join(patchesDir, patchFileToUse), 'utf-8');
            const patchData = Parsers.parsePatch(patchContent, gameSlug);
            fs.writeFileSync(path.join(gameDir, 'patch.json'), JSON.stringify(patchData, null, 2));
            console.log(chalk.magenta(`      - Patch: Included from ${patchFileToUse} (${Object.keys(patchData.pokemon || {}).length} changes)`));
        }

        console.log(chalk.green('OK'));
        console.log(chalk.gray(`      - Segmentos: ${manifest.segments.length}`));
        console.log(chalk.gray(`      - Bosses: ${bosses.length}`));

    } catch (e) {
        console.error(chalk.red(`\n   ❌ Error: ${e}`));
    }
}

// --- ORQUESTADOR PRINCIPAL ---

async function main() {
    const routesDir = path.join(INPUT_ROOT, 'routes');
    const leaguesDir = path.join(INPUT_ROOT, 'leagues');
    
    if (!fs.existsSync(routesDir)) {
        console.error(chalk.red(`❌ No se encuentra: ${routesDir}`));
        process.exit(1);
    }

    const files = fs.readdirSync(routesDir).filter(f => f.endsWith('.txt'));

    while (true) {
        console.clear();
        console.log(chalk.green.bold('============================================='));
        console.log(chalk.green.bold('   SILPH CO. LEGACY PARSER v18.2 (MANUAL)   '));
        console.log(chalk.green.bold('=============================================\n'));
        console.log(chalk.blue(`📂 Archivos disponibles: ${files.length}`));

        const menu = await inquirer.prompt([{
            type: 'list',
            name: 'mode',
            message: 'Selecciona una operación:',
            choices: [
                { name: '🔍 Seleccionar Juego Específico', value: 'select' },
                { name: '🔄 Iterar Carpeta (Legacy Mode)', value: 'iterate' },
                { name: '🚪 Salir', value: 'exit' }
            ]
        }]);

        if (menu.mode === 'exit') break;

        if (menu.mode === 'select') {
            while (true) {
                const input = await inquirer.prompt([{
                    type: 'input',
                    name: 'filename',
                    message: 'Escribe el nombre del archivo (ej: ruby) o "salir":'
                }]);

                let targetFile = input.filename.trim();
                if (targetFile.toLowerCase() === 'salir' || targetFile === '') break;

                if (!targetFile.endsWith('.txt')) targetFile += '.txt';

                if (files.includes(targetFile)) {
                    await processGameFile(targetFile, routesDir, leaguesDir, false);
                    break; 
                } else {
                    console.log(chalk.red(`❌ El archivo '${targetFile}' no existe en ${routesDir}. Inténtalo de nuevo.`));
                }
            }
        } 
        else if (menu.mode === 'iterate') {
            try {
                for (const file of files) {
                    await processGameFile(file, routesDir, leaguesDir, true);
                }
            } catch (e: any) {
                if (e.message !== 'EXIT_LOOP') console.error(e);
            }
        }

        const cont = await inquirer.prompt([{
            type: 'confirm',
            name: 'again',
            message: '¿Volver al menú principal?',
            default: true
        }]);

        if (!cont.again) break;
    }
}

main().catch(console.error);