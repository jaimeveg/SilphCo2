import { chromium } from 'playwright';
import * as cheerio from 'cheerio';
import fs from 'fs/promises';
import path from 'path';
import { IMacroDashboardData, ITopCutTeam, ITeamMember } from '../src/types/competitive';
import { generatePokePaste } from './utils/pokepaste';

const DATA_DIR = path.join(process.cwd(), 'public', 'data');
const TOURNAMENTS_DIR = path.join(DATA_DIR, 'tournaments');
const POKEDEX_STATS = path.join(DATA_DIR, 'pokedex_base_stats.json');
const COMPETITIVE_DIR = path.join(DATA_DIR, 'competitive');

// Utils
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const toSlug = (name: string) => name.toLowerCase().replace(/['’\.]/g, '').replace(/[\s:]+/g, '-').replace(/[^a-z0-9-]/g, '');

const runDashboardBuilder = async () => {
    console.log('\n=== INICIANDO ETL: MACRO META DASHBOARD ===\n');

    await fs.mkdir(COMPETITIVE_DIR, { recursive: true });

    // 1. CARGA DE DEPENDENCIAS LOCALES
    let pokedexMap: Record<string, any> = {};
    const slugToNumericMap: Record<string, string> = {};
    try { 
        pokedexMap = JSON.parse(await fs.readFile(POKEDEX_STATS, 'utf8')); 
        for (const [id, data] of Object.entries(pokedexMap)) {
            if (data.name) slugToNumericMap[toSlug(data.name)] = id;
        }
    }
    catch (e) { console.error('🔥 ERROR: No se encontró pokedex_base_stats.json'); process.exit(1); }

    let rk9Index: any[] = [];
    try { rk9Index = JSON.parse(await fs.readFile(path.join(TOURNAMENTS_DIR, 'rk9_index.json'), 'utf8')); }
    catch (e) { console.log('⚠️ Aviso: rk9_index.json no encontrado o vacío.'); return; }

    const aliasMap = JSON.parse(await fs.readFile(path.join(DATA_DIR, 'alias_map.json'), 'utf8').catch(() => '{}'));

    const getPkmTypes = (id: string): string[] => {
        const pkm = pokedexMap[id];
        return pkm?.types || [];
    };

    const getPkmName = (id: string): string => {
        const pkm = pokedexMap[id];
        if (pkm?.name) return pkm.name.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        return id;
    };

    // 2. PLAYWRIGHT SETUP PARA TOP CUT
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
    const page = await context.newPage();

    for (const tournament of rk9Index) {
        console.log(`\n[+] Procesando Torneo: ${tournament.name} (${tournament.id})`);
        
        let RK9_DATA;
        try {
            const rk9Path = path.join(TOURNAMENTS_DIR, `rk9_${tournament.id}.json`);
            RK9_DATA = JSON.parse(await fs.readFile(rk9Path, 'utf8'));
        } catch (e) {
            console.log(`  -> Saltando: No se encontró stats rk9_${tournament.id}.json`);
            continue;
        }

        const TOTAL_TEAMS = RK9_DATA.battles || 1; 

        // 3. CÁLCULOS MACRO
        const pkmEntries = Object.entries(RK9_DATA.pokemon) as [string, any][];
        
        // Sorting top pokemon
        pkmEntries.sort((a, b) => b[1].usage.raw - a[1].usage.raw);
        
        const top50 = pkmEntries.slice(0, 50);

        // -- Centralization Index (Top 6 absolute usage) --
        const top6UsageRaw = pkmEntries.slice(0, 6).reduce((acc, curr) => acc + curr[1].usage.raw, 0);
        // Normalized usage = (top6 count) / (TOTAL_TEAMS * 6) * 100
        const centralizationRaw = (top6UsageRaw / (TOTAL_TEAMS * 6)) * 100;
        const centralizationIndex = Math.min(Math.round(centralizationRaw), 100);

        // -- Type Ecosystem --
        const typeEcosystem: Record<string, any> = {};
        for (const [id, stats] of top50) {
            const types = getPkmTypes(id);
            const comboSlug = types.map(t => t.toLowerCase()).sort().join('-');
            
            for (const t of types) {
                const typeSlug = t.toLowerCase();
                if (!typeEcosystem[typeSlug]) {
                    typeEcosystem[typeSlug] = {
                        usage_rate: 0,
                        raw_count: 0,
                        combinations: {},
                        teammates: {},
                        top_pkm: []
                    };
                }

                typeEcosystem[typeSlug].raw_count += stats.usage.raw;
                typeEcosystem[typeSlug].combinations[comboSlug] = (typeEcosystem[typeSlug].combinations[comboSlug] || 0) + stats.usage.raw;

                // Top Pokémon
                if (typeEcosystem[typeSlug].top_pkm.length < 5) {
                    typeEcosystem[typeSlug].top_pkm.push({
                        id,
                        name: getPkmName(id),
                        usage_rate: (stats.usage.raw / TOTAL_TEAMS) * 100,
                        raw_count: stats.usage.raw
                    });
                }
                
                // Teammates
                if (stats.teammates) {
                    for (const [mateIdStr, mateCount] of Object.entries(stats.teammates)) {
                        const mateId = mateIdStr.toString();
                        if (mateId === id) continue; // skip self
                        const mateTypes = getPkmTypes(mateId);
                        for (const mt of mateTypes) {
                            const mtSlug = mt.toLowerCase();
                            typeEcosystem[typeSlug].teammates[mtSlug] = (typeEcosystem[typeSlug].teammates[mtSlug] || 0) + (mateCount as number);
                        }
                    }
                }
            }
        }
        
        // Calculate global usage rates for each ecosystem
        for (const ts of Object.keys(typeEcosystem)) {
            typeEcosystem[ts].usage_rate = (typeEcosystem[ts].raw_count / TOTAL_TEAMS) * 100;
        }

        // -- Gimmicks Ecosystem --
        let rawMegasTotal = 0;
        const megaMap: Record<string, { id: string, name: string, usages: number }> = {};
        
        let rawZTotal = 0;
        const zCrystalMap: Record<string, number> = {};
        const zPkmMap: Record<string, { id: string, name: string, crystal: string, usages: number }> = {};

        let rawTeraTotal = 0;
        const teraTypeMap: Record<string, number> = {};
        const teraPkmMap: Record<string, { id: string, name: string, tera_type: string, usages: number, pkm_total: number }> = {};

        for (const [id, stats] of top50) {
            const pkmName = getPkmName(id);
            
            // 1 & 2. Megas & Z-Crystals
            if (stats.items) {
                for (const [item, countStr] of Object.entries(stats.items)) {
                    const count = Number(countStr);
                    const itemName = item.toLowerCase();
                    
                    // Define strict Gimmick patterns as discussed
                    const isIteZ = itemName.endsWith('ite z') || itemName.endsWith('ite-z');
                    const isZCrystal = (itemName.endsWith(' z') || itemName.endsWith('-z')) && !isIteZ;
                    
                    // TODO [Future]: Replace this string-matching logic with a robust, direct query to the Itemdex 
                    // once Mega Stones, Z-Crystals, and newer items are fully formalized in the codebase.
                    const isMegaStone = (itemName.endsWith('ite') || itemName.endsWith('ite x') || itemName.endsWith('ite y') || itemName.endsWith('ite-x') || itemName.endsWith('ite-y') || isIteZ) && itemName !== 'eviolite';

                    // Z-Moves
                    if (isZCrystal) {
                        rawZTotal += count;
                        zCrystalMap[item] = (zCrystalMap[item] || 0) + count;
                        
                        const zKey = `${id}|${item}`;
                        if (!zPkmMap[zKey]) zPkmMap[zKey] = { id, name: pkmName, crystal: item, usages: 0 };
                        zPkmMap[zKey].usages += count;
                    }
                    // Megas
                    else if (isMegaStone) {
                        rawMegasTotal += count;
                        if (!megaMap[id]) megaMap[id] = { id, name: pkmName, usages: 0 };
                        megaMap[id].usages += count;
                    }
                }
            }

            // 3. Teras
            const teras = stats.teras || stats.TeraTypes || stats['Tera Types'];
            if (teras) {
                let bestTera = '';
                let bestTeraCount = 0;

                for (const [teraType, countStr] of Object.entries(teras)) {
                    if (teraType.toLowerCase() === 'nothing') continue;
                    const count = Number(countStr);
                    rawTeraTotal += count;
                    const teraSlug = teraType.toLowerCase();
                    teraTypeMap[teraSlug] = (teraTypeMap[teraSlug] || 0) + count;
                    
                    if (count > bestTeraCount) {
                        bestTeraCount = count;
                        bestTera = teraType;
                    }
                }

                if (bestTeraCount > 0) {
                    const pkmTotal = stats.usage.raw || bestTeraCount;
                    teraPkmMap[id] = { id, name: pkmName, tera_type: bestTera, usages: bestTeraCount, pkm_total: pkmTotal };
                }
            }
        }

        const gimmicksObj: any = {};
        
        // Threshold forced at >0.5% (0.005)
        if (rawMegasTotal / TOTAL_TEAMS > 0.005) {
            gimmicksObj.megas = {
                total_usage: rawMegasTotal,
                top_pkm: Object.values(megaMap)
                    .sort((a,b) => b.usages - a.usages)
                    .slice(0, 10)
                    .map(data => ({
                        id: data.id,
                        name: data.name,
                        usage_rate: (data.usages / TOTAL_TEAMS) * 100
                    }))
            };
        }

        if (rawZTotal / TOTAL_TEAMS > 0.005) {
            gimmicksObj.z_moves = {
                total_usage: rawZTotal,
                top_crystals: Object.entries(zCrystalMap)
                    .sort((a,b) => b[1] - a[1])
                    .slice(0, 10)
                    .map(([name, count]) => ({ name, count })),
                top_pkm: Object.values(zPkmMap)
                    .sort((a,b) => b.usages - a.usages)
                    .slice(0, 10)
                    .map(data => ({
                        id: data.id,
                        name: data.name,
                        crystal: data.crystal,
                        usage_rate: (data.usages / TOTAL_TEAMS) * 100
                    }))
            };
        }

        if (rawTeraTotal / TOTAL_TEAMS > 0.005) {
            gimmicksObj.teras = {
                total_usage: rawTeraTotal,
                top_types: Object.entries(teraTypeMap)
                    .sort((a,b) => b[1] - a[1])
                    .slice(0, 20)
                    .map(([type, count]) => ({ type, count })),
                top_pkm: Object.values(teraPkmMap)
                    .sort((a,b) => b.usages - a.usages)
                    .slice(0, 50)
                    .map(data => ({
                        id: data.id,
                        name: data.name,
                        tera_type: data.tera_type,
                        usage_rate: (data.usages / (data as any).pkm_total) * 100
                    }))
            };
        }
        
        // -- Top Cores (Aproximación de 3-Pokemon a partir de pares) --
        const coreMap: Record<string, number> = {};
        const pairWeights: Record<string, number> = {};

        for (const [id, stats] of top50) {
            if (stats.teammates) {
                for (const [mateId, count] of Object.entries(stats.teammates)) {
                    if (!top50.find(p => p[0] === mateId)) continue;
                    const pair = [id, mateId].sort();
                    pairWeights[`${pair[0]}|${pair[1]}`] = count as number;
                }
            }
        }

        const top30Ids = top50.slice(0, 30).map(p => p[0]);
        for (let i = 0; i < top30Ids.length; i++) {
            for (let j = i + 1; j < top30Ids.length; j++) {
                for (let k = j + 1; k < top30Ids.length; k++) {
                    const a = top30Ids[i]; const b = top30Ids[j]; const c = top30Ids[k];
                    
                    const w_ab = pairWeights[[a, b].sort().join('|')] || 0;
                    const w_ac = pairWeights[[a, c].sort().join('|')] || 0;
                    const w_bc = pairWeights[[b, c].sort().join('|')] || 0;

                    if (w_ab > 0 && w_ac > 0 && w_bc > 0) {
                        const minWeight = Math.min(w_ab, w_ac, w_bc);
                        const coreHash = [a, b, c].sort().join('|');
                        coreMap[coreHash] = Math.max(coreMap[coreHash] || 0, minWeight);
                    }
                }
            }
        }

        const sortedCores = Object.entries(coreMap)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([hash, count]) => ({
                core: hash.split('|'),
                usage_rate: (count / TOTAL_TEAMS) * 100
            }));

        // -- Construyendo Estructura Output Base --
        const format_id = `vgc_${tournament.id}`;
        
        const dashboardData: IMacroDashboardData = {
            format_id,
            total_teams_analyzed: TOTAL_TEAMS,
            centralization_index: centralizationIndex,
            type_ecosystem: typeEcosystem,
            gimmicks: Object.keys(gimmicksObj).length > 0 ? gimmicksObj : undefined,
            top_pokemon: top50.map(([id, stats]) => ({
                id,
                name: getPkmName(id),
                usage_rate: (stats.usage.raw / TOTAL_TEAMS) * 100,
                raw_count: stats.usage.raw
            })),
            top_cores: sortedCores,
            rogue_picks: [],
            top_cut: []
        };

        try {
            console.log(`  -> Obteniendo Top Cut de: https://rk9.gg/roster/${tournament.id}`);
            await page.goto(`https://rk9.gg/roster/${tournament.id}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
            await page.waitForTimeout(2000);
            
            try {
                // Find the DataTables length select and set to -1 (All)
                const selects = await page.$$('select');
                for (const select of selects) {
                    const name = await select.getAttribute('name');
                    if (name && name.includes('length')) {
                        console.log('    [*] Forzando visualización de todos los jugadores...');
                        await page.selectOption(`select[name="${name}"]`, '-1');
                        await page.waitForTimeout(3000); // Wait for DataTables to render
                        break;
                    }
                }
            } catch (e: any) {
                console.log('    [!] No se pudo cambiar a All (quizás tabla pequeña)', e.message);
            }
            
            const html = await page.content();
            const $ = cheerio.load(html);

            const topCutTeams: ITopCutTeam[] = [];

            // Find column indexes for First Name and Last Name
            const headers = $('th').map((_, el) => $(el).text().trim()).get();
            const firstIdx = headers.findIndex(h => h.toLowerCase().includes('first name'));
            const lastIdx = headers.findIndex(h => h.toLowerCase().includes('last name'));
            const standingIdx = headers.findIndex(h => h.toLowerCase().includes('standing'));

            // Buscamos a los jugadores top. A veces los rosters tienen tabla.
            const allRows = $('tr').filter((_, el) => $(el).text().includes('Master')).toArray();

            const playersWithStanding = allRows.map((el) => {
                const tr = $(el);
                const standingText = standingIdx >= 0 ? tr.find('td').eq(standingIdx).text().trim() : '';
                const standing = parseInt(standingText, 10);
                return { el, standing };
            });

            let topRows = [];
            const validStandings = playersWithStanding.filter(p => !isNaN(p.standing) && p.standing >= 1 && p.standing <= 8);

            if (validStandings.length > 0) {
                validStandings.sort((a, b) => a.standing - b.standing);
                topRows = validStandings.map(p => p.el).slice(0, 8);
            } else {
                topRows = allRows.slice(0, 8);
            }
            
            for (let i = 0; i < topRows.length; i++) {
                const row = topRows[i];
                let playerName = '';
                if (firstIdx >= 0 && lastIdx >= 0) {
                    const first = $(row).find('td').eq(firstIdx).text().trim();
                    const last = $(row).find('td').eq(lastIdx).text().trim();
                    if (first || last) playerName = `${first} ${last}`.trim();
                }
                
                if (!playerName) {
                    playerName = $(row).find('td').eq(0).find('div > a').first().text().trim() || 
                                 $(row).find('td').eq(0).text().replace(/\n/g, '').replace('Master', '').replace('Division', '').trim() || 
                                 `Player ${i+1}`;
                }
                
                const teamLink = $(row).find('a[href*="/teamlist/public/"]').attr('href');

                if (teamLink) {
                    const absLink = teamLink.startsWith('http') ? teamLink : `https://rk9.gg${teamLink}`;
                    const teamPage = await context.newPage();
                    try {
                        await teamPage.goto(absLink, { waitUntil: 'domcontentloaded' });
                        const teamHtml = await teamPage.content();
                        const $$ = cheerio.load(teamHtml);
                        const pkmBlocks = $$('#lang-EN .pokemon');

                        const teamMembers: ITeamMember[] = [];

                        pkmBlocks.each((_, el) => {
                            const clone = $$(el).clone();
                            const bTagExtract = (tag: string) => {
                                const b = clone.find(`b:contains("${tag}")`);
                                return b.length ? (b[0].nextSibling as any)?.nodeValue?.trim() || 'Unknown' : 'Unknown';
                            };

                            const tera = bTagExtract('Tera Type:');
                            const ability = bTagExtract('Ability:');
                            let item = bTagExtract('Held Item:');
                            if (!item || item === 'Unknown') item = 'No Item';

                            const moves = clone.find('.badge').map((_, badge) => $$(badge).text().trim()).get();

                            clone.children().remove();
                            let nameText = clone.text().trim().split('\n')[0]?.replace(/\([MF]\)/i, '').replace(/\[|\]/g, '').replace(/\s+(Forme?|Mask|Style)$/i, '').replace(/\s+/g, ' ').trim() || '';
                            const rawSlug = toSlug(nameText);
                            const maybeAlias = aliasMap[rawSlug] || aliasMap[rawSlug.replace(/-/g, '')] || rawSlug;
                            const mappedId = slugToNumericMap[maybeAlias] || maybeAlias;

                            teamMembers.push({
                                pokemon_id: mappedId.toString(),
                                pokemon_name: nameText,
                                item, ability, tera_type: tera, moves
                            });
                        });
                        
                        if (teamMembers.length > 0) {
                            topCutTeams.push({
                                player_name: playerName,
                                placement: i + 1,
                                team: teamMembers,
                                poke_paste: generatePokePaste(teamMembers)
                            });

                            // CHECK PARA ROGUE PICKS
                            for (const member of teamMembers) {
                                const usageInMeta = dashboardData.top_pokemon.find(p => p.id === member.pokemon_id);
                                const usageRateGlobal = usageInMeta ? usageInMeta.usage_rate : 0;
                                
                                // Si uso < 4% y no está ya en rogue picks
                                if (usageRateGlobal < 4.0 && !dashboardData.rogue_picks.find(r => r.id === member.pokemon_id)) {
                                    dashboardData.rogue_picks.push({
                                        id: member.pokemon_id,
                                        player: playerName,
                                        placement: i + 1,
                                        usage_rate_global: usageRateGlobal
                                    });
                                }
                            }
                        }

                    } catch (err: any) {
                        console.log(`    -> Error scrapeando equipo de ${playerName}: ${err.message}`);
                    } finally {
                        await teamPage.close();
                    }
                }
                await delay(1000); // polite crawling
            }

            dashboardData.top_cut = topCutTeams;

        } catch (err: any) {
             console.log(`  -> Error obteniendo Top Cut Roster: ${err.message}`);
        }

        // 5. EXPORT DEL FORMATO
        const destPath = path.join(COMPETITIVE_DIR, `meta_${format_id}.json`);
        await fs.writeFile(destPath, JSON.stringify(dashboardData, null, 2));
        console.log(`  -> Generado dashboard macro VGC en: ${destPath}`);
        
        // ---- DEEP DIVE ISOLATED STATIC APIS ----
        // Opcional: Escribir para el Tactical Drawer el deep_dive por cada pokemon del top 50
        console.log(`  -> Construyendo Deep Dive pre-caché para los Top 50...`);
        const formatDir = path.join(COMPETITIVE_DIR, format_id);
        await fs.mkdir(formatDir, { recursive: true });

        for (const [pkmId, stats] of top50) {
            const deepDivePath = path.join(formatDir, `${pkmId}.json`);
            // Only keeping the essential combat stats for the drawer 
            const deepDiveData = {
                id: pkmId,
                name: getPkmName(pkmId),
                format_id,
                usage_metrics: {
                   raw: stats.usage.raw,
                   percent: (stats.usage.raw / TOTAL_TEAMS) * 100
                },
                items: stats.items || {},
                abilities: stats.abilities || {},
                moves: stats.moves || {},
                teras: stats.teras || {},
                teammates: stats.teammates || {}
            };
            await fs.writeFile(deepDivePath, JSON.stringify(deepDiveData, null, 2));
        }
    }

    await browser.close();
    console.log('\n✅ [MACRO METRICS ETL] Sincronización finalizada.');
};

runDashboardBuilder().catch(e => {
    console.error('Fatal ETL Error:', e);
    process.exit(1);
});
