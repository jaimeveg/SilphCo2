import fs from 'fs/promises';
import path from 'path';
import { IMacroDashboardData } from '../src/types/competitive';

const DATA_DIR = path.join(process.cwd(), 'public', 'data');
const SMOGON_DIR = path.join(DATA_DIR, 'smogon');
const POKEDEX_STATS = path.join(DATA_DIR, 'pokedex_base_stats.json');
const COMPETITIVE_DIR = path.join(DATA_DIR, 'competitive');

// Formats to skip entirely (mirroring update-smogon-data.ts IGNORED_FORMATS)
const IGNORED_SLUGS = [
    'custom', '1v1', '2v2', 'purehackmons', 'almostanyability',
    'pokebilities', 'mixandmega', 'godlygift', 'stabmons', 'nfe', 'zu',
    'tiershift', 'camomons', 'sketchmons', '3v3', 'balancedhackmons', 'cap',
    'chatbats', 'convergence', 'fortemons', 'legendszaou', 'metronomebattle',
    'sharedpower', 'anythinggoes', 'partnersincrime', 'crossevolution',
    'monotype', 'bh', 'hc', 'lc', 'ag', 'volt', 'biomech',
    'losers', 'solgaleo', 'flipped', 'nc', 'natdexcamovechaos',
    'ubersuu', 'doublesuu'
];

const runSmogonDashboardBuilder = async () => {
    console.log('\n=== INICIANDO ETL: SHOWDOWN META DASHBOARDS (ALL FORMATS) ===\n');

    await fs.mkdir(COMPETITIVE_DIR, { recursive: true });

    // 1. Load Pokedex for Types & Names (keyed by numeric ID string)
    let pokedexMap: Record<string, any> = {};
    try {
        pokedexMap = JSON.parse(await fs.readFile(POKEDEX_STATS, 'utf8'));
    } catch (e) {
        console.error('🔥 ERROR: No se encontró pokedex_base_stats.json');
        process.exit(1);
    }

    const getPkmTypes = (id: string): string[] => {
        const pkm = pokedexMap[id];
        return pkm?.types || [];
    };

    const getPkmName = (id: string): string => {
        const pkm = pokedexMap[id];
        if (pkm?.name) return pkm.name.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        return `#${id}`;
    };

    // 2. Discover all format files, group by format base name, pick highest ELO
    const files = await fs.readdir(SMOGON_DIR);
    const jsonFiles = files.filter(f => f.endsWith('.json') && f !== 'meta.json');

    // Group by format base (e.g. "gen9vgc2026regf" from "gen9vgc2026regf-1760.json")
    const formatGroups: Record<string, string[]> = {};
    for (const f of jsonFiles) {
        const baseName = f.replace('.json', '');
        const parts = baseName.split('-');
        const formatBase = parts.slice(0, -1).join('-') || baseName; // Everything before last hyphen
        const isIgnored = IGNORED_SLUGS.some(slug => formatBase.toLowerCase().includes(slug));
        if (isIgnored) continue;
        if (!formatGroups[formatBase]) formatGroups[formatBase] = [];
        formatGroups[formatBase].push(f);
    }

    // For each format group, process EVERY ELO file individually
    const selectedFiles: { formatSlug: string; filePath: string; displayName: string; baseName: string }[] = [];
    for (const [formatBase, fileList] of Object.entries(formatGroups)) {
        for (const file of fileList) {
            const elo = file.replace('.json', '').split('-').pop() || '0';
            const displayName = formatBase
                .replace(/gen(\d+)/, 'Gen $1 ')
                .replace('ou', 'OU')
                .replace('ubers', 'Ubers')
                .replace('doublesou', 'Doubles OU')
                .replace('doublesubers', 'Doubles Ubers')
                .replace('vgc', 'VGC ')
                .replace('nationaldex', 'National Dex')
                .replace('bssreg', 'BSS Reg ')
                .replace('nu', 'NU')
                .replace('pu', 'PU')
                .replace('ru', 'RU')
                .replace('uu', 'UU')
                .replace('regf', 'Reg F')
                .replace('regi', 'Reg I')
                .trim();
            const formatSlug = `showdown_${file.replace('.json', '')}`;
            selectedFiles.push({ formatSlug, filePath: file, displayName: `${displayName} (${elo} Elo)`, baseName: formatBase });
        }
    }

    console.log(`[+] Found ${selectedFiles.length} Showdown formats to process.\n`);

    // 3. Process each format
    for (const { formatSlug, filePath, displayName, baseName } of selectedFiles) {
        console.log(`[+] Processing: ${displayName} (${filePath})`);
        
        let rawData;
        try {
            rawData = JSON.parse(await fs.readFile(path.join(SMOGON_DIR, filePath), 'utf8'));
        } catch (e) {
            console.log(`  -> Skipping: Could not parse ${filePath}`);
            continue;
        }

        const TOTAL_BATTLES = rawData.info?.['number of battles'] || 1;
        const pkmEntries = Object.entries(rawData.data || {}) as [string, any][];
        if (pkmEntries.length === 0) { console.log(`  -> Skipping: No pokemon data`); continue; }

        pkmEntries.sort((a, b) => b[1]['Raw count'] - a[1]['Raw count']);
        const top50 = pkmEntries.slice(0, 50);

        const TOTAL_TEAMS = TOTAL_BATTLES * 2;
        const top6UsageRaw = pkmEntries.slice(0, 6).reduce((acc, curr) => acc + curr[1]['Raw count'], 0);
        const centralizationIndex = Math.min(Math.round((top6UsageRaw / (TOTAL_TEAMS * 6)) * 100), 100);

        // Type Ecosystem
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

                typeEcosystem[typeSlug].raw_count += stats['Raw count'];
                typeEcosystem[typeSlug].combinations[comboSlug] = (typeEcosystem[typeSlug].combinations[comboSlug] || 0) + stats['Raw count'];

                // Top Pokémon
                if (typeEcosystem[typeSlug].top_pkm.length < 5) {
                    typeEcosystem[typeSlug].top_pkm.push({
                        id,
                        name: getPkmName(id),
                        usage_rate: (stats['Raw count'] / TOTAL_TEAMS) * 100,
                        raw_count: stats['Raw count']
                    });
                }
                
                // Teammates
                if (stats.Teammates) {
                    for (const [mateIdStr, mateCount] of Object.entries(stats.Teammates)) {
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
            if (stats.Items) {
                for (const [item, countStr] of Object.entries(stats.Items)) {
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
            const teras = stats.TeraTypes || stats['Tera Types'] || stats.Teras;
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
                    const pkmTotal = stats['Raw count'] || stats.usage || bestTeraCount; // fallback
                    teraPkmMap[id] = { id, name: pkmName, tera_type: bestTera, usages: bestTeraCount, pkm_total: pkmTotal };
                }
            }
        }

        const gimmicksObj: any = {};
        
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

        // 3-Pokemon Cores
        const pairWeights: Record<string, number> = {};
        for (const [id, stats] of top50) {
            if (stats.Teammates) {
                for (const [mateId, count] of Object.entries(stats.Teammates)) {
                    if (!top50.find(p => p[0] === mateId)) continue;
                    const pair = [id, mateId].sort();
                    pairWeights[`${pair[0]}|${pair[1]}`] = count as number;
                }
            }
        }

        const coreMap: Record<string, number> = {};
        const top30Ids = top50.slice(0, 30).map(p => p[0]);
        for (let i = 0; i < top30Ids.length; i++) {
            for (let j = i + 1; j < top30Ids.length; j++) {
                for (let k = j + 1; k < top30Ids.length; k++) {
                    const a = top30Ids[i]; const b = top30Ids[j]; const c = top30Ids[k];
                    const w_ab = pairWeights[[a, b].sort().join('|')] || 0;
                    const w_ac = pairWeights[[a, c].sort().join('|')] || 0;
                    const w_bc = pairWeights[[b, c].sort().join('|')] || 0;
                    if (w_ab > 0 && w_ac > 0 && w_bc > 0) {
                        const avgWeight = (w_ab + w_ac + w_bc) / 3;
                        const coreHash = [a, b, c].sort().join('|');
                        coreMap[coreHash] = Math.max(coreMap[coreHash] || 0, avgWeight);
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

        const dashboardData: IMacroDashboardData = {
            format_id: formatSlug,
            total_teams_analyzed: TOTAL_BATTLES,
            centralization_index: centralizationIndex,
            type_ecosystem: typeEcosystem,
            gimmicks: Object.keys(gimmicksObj).length > 0 ? gimmicksObj : undefined,
            top_pokemon: top50.map(([id, stats]) => ({
                id,
                name: getPkmName(id),
                usage_rate: (stats['Raw count'] / TOTAL_TEAMS) * 100,
                raw_count: stats['Raw count']
            })),
            top_cores: sortedCores,
            rogue_picks: [],
            top_cut: []
        };

        await fs.writeFile(
            path.join(COMPETITIVE_DIR, `meta_${formatSlug}.json`),
            JSON.stringify(dashboardData, null, 2)
        );

        // Deep Dive files
        const formatDir = path.join(COMPETITIVE_DIR, formatSlug);
        await fs.mkdir(formatDir, { recursive: true });

        const extractTrait = (source: any) => {
            if (!source) return {};
            const res: Record<string, number> = {};
            for (const [k, v] of Object.entries(source)) {
                res[k.toLowerCase()] = v as number;
            }
            return res;
        };

        const extractSpreads = (source: any, baseWeight: number) => {
            if (!source || !baseWeight) return [];
            return Object.entries(source)
                .sort((a: any, b: any) => b[1] - a[1])
                .slice(0, 10)
                .map(([spread, count]) => {
                    const parts = spread.split(':');
                    const nature = parts[0] || 'Unknown';
                    const evStr = parts[1] || '0/0/0/0/0/0';
                    const evParts = evStr.split('/').map(Number);
                    return {
                        nature,
                        usage: ((count as number / baseWeight) * 100).toFixed(1),
                        evs: {
                            hp: evParts[0] || 0,
                            atk: evParts[1] || 0,
                            def: evParts[2] || 0,
                            spa: evParts[3] || 0,
                            spd: evParts[4] || 0,
                            spe: evParts[5] || 0
                        }
                    };
                });
        };

        for (const [pkmId, stats] of top50) {
            const base_weight = Object.values(stats.Abilities || {}).reduce((acc: number, curr: any) => acc + (curr as number), 0) || stats['Raw count'];
            
            const deepDiveData = {
                id: pkmId,
                name: getPkmName(pkmId),
                format_id: formatSlug,
                usage_metrics: {
                    raw: stats['Raw count'],
                    base_weight: base_weight,
                    percent: (stats['Raw count'] / TOTAL_TEAMS) * 100
                },
                items: extractTrait(stats.Items),
                abilities: extractTrait(stats.Abilities),
                moves: extractTrait(stats.Moves),
                teras: extractTrait(stats.TeraTypes || stats['Tera Types'] || stats.Teras),
                spreads: extractSpreads(stats.Spreads, base_weight),
                teammates: stats.Teammates || {}
            };
            await fs.writeFile(path.join(formatDir, `${pkmId}.json`), JSON.stringify(deepDiveData, null, 2));
        }

        console.log(`  -> ✅ Generated: meta_${formatSlug}.json + ${top50.length} deep dives`);
    }

    // 4. Write a showdown_index.json for the frontend to discover all formats  
    const indexData = selectedFiles.map(f => ({ id: f.formatSlug, name: f.displayName }));
    await fs.writeFile(
        path.join(DATA_DIR, 'competitive', 'showdown_index.json'),
        JSON.stringify(indexData, null, 2)
    );

    console.log(`\n✅ [SHOWDOWN METRICS ETL] Generated ${selectedFiles.length} format dashboards.`);
};

runSmogonDashboardBuilder().catch(e => {
    console.error('Fatal ETL Error:', e);
    process.exit(1);
});
