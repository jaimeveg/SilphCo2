import fs from 'fs/promises';
import path from 'path';
import { IMacroDashboardData } from '../src/types/competitive';
import { determineRoles, ROLE_KEYS } from '../src/lib/utils/competitive-analysis';

const DATA_DIR = path.join(process.cwd(), 'public', 'data');
const SMOGON_DIR = path.join(DATA_DIR, 'smogon');
const POKEDEX_STATS = path.join(DATA_DIR, 'pokedex_base_stats.json');
const COMPETITIVE_DIR = path.join(DATA_DIR, 'competitive');

const runSmogonDashboardBuilder = async () => {
    console.log('\n=== INICIANDO ETL: SHOWDOWN META DASHBOARDS (ALL FORMATS) ===\n');

    await fs.mkdir(COMPETITIVE_DIR, { recursive: true });

    try {
        const files = await fs.readdir(COMPETITIVE_DIR);
        for (const file of files) {
            if (file.toLowerCase().includes('showdown')) {
                const filePath = path.join(COMPETITIVE_DIR, file);
                const stat = await fs.lstat(filePath);
                if (stat.isDirectory()) {
                    await fs.rm(filePath, { recursive: true, force: true });
                } else {
                    await fs.unlink(filePath);
                }
            }
        }
        console.log('  [\u2713] Directorio public/data/competitive limpiado (ficheros showdown)');
    } catch (e) {
        console.log('  [!] No se pudo limpiar el directorio competitivo:', e);
    }

    // 1. Load Pokedex for Types & Names (keyed by numeric ID string)
    let pokedexMap: Record<string, any> = {};
    try {
        pokedexMap = JSON.parse(await fs.readFile(POKEDEX_STATS, 'utf8'));
    } catch (e) {
        console.error('🔥 ERROR: No se encontró pokedex_base_stats.json');
        process.exit(1);
    }

    let traitsMap: Record<string, string> = {};
    try {
        traitsMap = JSON.parse(await fs.readFile(path.join(DATA_DIR, 'traits_map.json'), 'utf8'));
    } catch(e) { }

    let aliasMap: Record<string, number> = {};
    try {
        aliasMap = JSON.parse(await fs.readFile(path.join(DATA_DIR, 'alias_map.json'), 'utf8'));
    } catch(e) { }

    // Cree reverse map para lookup rápido (id -> slug)
    const reverseAliasMap: Record<string, string> = {};
    for (const [slug, id] of Object.entries(aliasMap)) {
        reverseAliasMap[id.toString()] = slug;
    }

    // 1b. Load Movedex for move category classification (physical/special/status)
    const moveCategoryMap = new Map<string, string>();
    try {
        const movedexRaw = JSON.parse(await fs.readFile(path.join(DATA_DIR, 'movedex_index.json'), 'utf8'));
        for (const m of movedexRaw) {
            moveCategoryMap.set(m.id, m.category); // 'physical' | 'special' | 'status'
        }
        console.log(`  [✓] Movedex cargado: ${moveCategoryMap.size} movimientos`);
    } catch (e) {
        console.error('🔥 ERROR: No se encontró movedex_index.json');
        process.exit(1);
    }

    const getPkmTypes = (id: string): string[] => {
        const pkm = pokedexMap[id];
        return pkm?.types || [];
    };

    const getPkmName = (id: string): string => {
        const pkm = pokedexMap[id];
        if (pkm?.name) return pkm.name.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        
        // Reverse lookup fallback
        const slug = reverseAliasMap[id];
        if (slug) return slug.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        
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
        
        if (!formatGroups[formatBase]) formatGroups[formatBase] = [];
        formatGroups[formatBase].push(f);
    }

    // For each format group, process EVERY ELO file individually
    const selectedFiles: { formatSlug: string; filePath: string; displayName: string; baseName: string }[] = [];
    for (const [formatBase, fileList] of Object.entries(formatGroups)) {
        for (const file of fileList) {
            const elo = file.replace('.json', '').split('-').pop() || '0';
            const displayName = formatBase
                .replace(/gen([1-9]|1\d)/, 'Gen $1 ')
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
                        nature: nature.toLowerCase(),
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

        const extractTraitUsageArr = (source: any, baseWeight: number) => {
            if (!source || !baseWeight) return [];
            return Object.entries(source).map(([k, v]) => ({
                name: k,
                value: ((v as number) / baseWeight) * 100
            }));
        };

        const TOTAL_BATTLES = rawData.info?.['number of battles'] || 1;
        const pkmEntries = Object.entries(rawData.data || {}) as [string, any][];
        if (pkmEntries.length === 0) { console.log(`  -> Skipping: No pokemon data`); continue; }

        pkmEntries.sort((a, b) => b[1]['Raw count'] - a[1]['Raw count']);
        const top100 = pkmEntries.slice(0, 100);

        const TOTAL_TEAMS = TOTAL_BATTLES * 2;
        const top6UsageRaw = pkmEntries.slice(0, 6).reduce((acc, curr) => acc + curr[1]['Raw count'], 0);
        const centralizationIndex = Math.min(Math.round((top6UsageRaw / (TOTAL_TEAMS * 6)) * 100), 100);

        // Type Ecosystem
        const typeEcosystem: Record<string, any> = {};
        for (const [id, stats] of top100) {
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
            // High-ELO 'Raw count' is unweighted, so we leave it divided by TOTAL_TEAMS
            typeEcosystem[ts].usage_rate = (typeEcosystem[ts].raw_count / TOTAL_TEAMS) * 100;
        }

        // -- Gimmicks Ecosystem --
        // NOTE: In high-ELO Smogon files, Items/TeraTypes/Abilities are WEIGHTED
        // but Raw count and number of battles are UNWEIGHTED. We must use Abilities sum
        // (weighted base_weight) as denominator for all gimmick usage rates.
        let rawMegasTotal = 0;
        const megaMap: Record<string, { id: string, name: string, usages: number, base_weight: number }> = {};
        
        let rawZTotal = 0;
        const zCrystalMap: Record<string, number> = {};
        const zPkmMap: Record<string, { id: string, name: string, crystal: string, usages: number, base_weight: number }> = {};

        let rawTeraTotal = 0;
        const teraTypeMap: Record<string, number> = {};
        const teraPkmMap: Record<string, { id: string, name: string, tera_type: string, usages: number, pkm_total: number }> = {};
        
        // Accumulate weighted team total for threshold checks
        let weightedTeamTotal = 0;

        for (const [id, stats] of top100) {
            const pkmName = getPkmName(id);
            const pkmBaseWeight = Object.values(stats.Abilities || {}).reduce((acc: number, curr: any) => acc + (curr as number), 0) || stats['Raw count'];
            weightedTeamTotal += pkmBaseWeight;
            
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
                        if (!zPkmMap[zKey]) zPkmMap[zKey] = { id, name: pkmName, crystal: item, usages: 0, base_weight: pkmBaseWeight };
                        zPkmMap[zKey].usages += count;
                    }
                    // Megas
                    else if (isMegaStone) {
                        rawMegasTotal += count;
                        if (!megaMap[id]) megaMap[id] = { id, name: pkmName, usages: 0, base_weight: pkmBaseWeight };
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
                    // Use weighted base_weight (sum of Abilities) as denominator, NOT Raw count.
                    // In high-ELO files, Raw count is UNWEIGHTED (global) while TeraType values
                    // are WEIGHTED — causing usage_rate to be near 0%. Abilities sum is weighted
                    // to the same scale as TeraTypes, giving correct percentages across all ELOs.
                    const pkmTotal = pkmBaseWeight || bestTeraCount; // fallback chain
                    teraPkmMap[id] = { id, name: pkmName, tera_type: bestTera, usages: bestTeraCount, pkm_total: pkmTotal };
                }
            }
        }

        const gimmicksObj: any = {};
        
        // Use weighted total for threshold comparison (consistent with weighted item counts)
        const WEIGHTED_TEAMS = weightedTeamTotal / 6; // approximate weighted team count
        const thresholdDenom = WEIGHTED_TEAMS > 0 ? WEIGHTED_TEAMS : TOTAL_TEAMS;

        if (rawMegasTotal / thresholdDenom > 0.005) {
            gimmicksObj.megas = {
                total_usage: rawMegasTotal,
                top_pkm: Object.values(megaMap)
                    .sort((a,b) => b.usages - a.usages)
                    .slice(0, 10)
                    .map(data => ({
                        id: data.id,
                        name: data.name,
                        usage_rate: (data.usages / thresholdDenom) * 100
                    }))
            };
        }

        if (rawZTotal / thresholdDenom > 0.005) {
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
                        usage_rate: (data.usages / data.base_weight) * 100
                    }))
            };
        }

        if (rawTeraTotal / thresholdDenom > 0.005) {
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

        // ---- ROLES ANALYSIS ----
        // Uses the centralized determineRoles() from competitive-analysis.ts
        const ROLE_LABELS: Record<string, { label: string; category: 'OFF' | 'SUP' | 'DEF' }> = {
            [ROLE_KEYS.OFFENSIVE.SWEEPER_PHYSICAL]: { label: 'Physical Sweeper', category: 'OFF' },
            [ROLE_KEYS.OFFENSIVE.SWEEPER_SPECIAL]: { label: 'Special Sweeper', category: 'OFF' },
            [ROLE_KEYS.OFFENSIVE.TR_ATTACKER]: { label: 'Trick Room Attacker', category: 'OFF' },
            [ROLE_KEYS.OFFENSIVE.PRIORITY]: { label: 'Priority User', category: 'OFF' },
            [ROLE_KEYS.OFFENSIVE.SETUP]: { label: 'Setup Sweeper', category: 'OFF' },
            [ROLE_KEYS.OFFENSIVE.WALLBREAKER]: { label: 'Wallbreaker', category: 'OFF' },
            [ROLE_KEYS.OFFENSIVE.SWEEPER_MIXED]: { label: 'Mixed Sweeper', category: 'OFF' },
            [ROLE_KEYS.SUPPORTIVE.REDIRECTION]: { label: 'Redirector', category: 'SUP' },
            [ROLE_KEYS.SUPPORTIVE.SPEED_CONTROL]: { label: 'Speed Control', category: 'SUP' },
            [ROLE_KEYS.SUPPORTIVE.TR_SETTER]: { label: 'Trick Room Setter', category: 'SUP' },
            [ROLE_KEYS.SUPPORTIVE.WEATHER]: { label: 'Weather Setter', category: 'SUP' },
            [ROLE_KEYS.SUPPORTIVE.TERRAIN]: { label: 'Terrain Setter', category: 'SUP' },
            [ROLE_KEYS.SUPPORTIVE.WIDE_GUARD]: { label: 'Wide Guard', category: 'SUP' },
            [ROLE_KEYS.SUPPORTIVE.CLERIC]: { label: 'Cleric / Heal', category: 'SUP' },
            [ROLE_KEYS.SUPPORTIVE.DISRUPTOR]: { label: 'Disruptor', category: 'SUP' },
            [ROLE_KEYS.SUPPORTIVE.SCREENER]: { label: 'Screener', category: 'SUP' },
            [ROLE_KEYS.DEFENSIVE.WALL_PHYSICAL]: { label: 'Physical Wall', category: 'DEF' },
            [ROLE_KEYS.DEFENSIVE.WALL_SPECIAL]: { label: 'Special Wall', category: 'DEF' },
            [ROLE_KEYS.DEFENSIVE.STALLER]: { label: 'Staller', category: 'DEF' },
            [ROLE_KEYS.DEFENSIVE.PIVOT]: { label: 'Pivot', category: 'DEF' },
        };

        const getPkmRoles = (pkmId: string, stats: any, baseWeight: number) => {
            const pkm = pokedexMap[pkmId] || {
                id: pkmId,
                name: getPkmName(pkmId),
                types: [],
                stats: { hp: 100, atk: 100, def: 100, spa: 100, spd: 100, spe: 100 } // Baseline para permitir cálculos de rol
            };
            
            const movesUsage = extractTraitUsageArr(stats.Moves || {}, baseWeight);
            const abilitiesUsage = extractTraitUsageArr(stats.Abilities || {}, baseWeight);
            const itemsUsage = extractTraitUsageArr(stats.Items || {}, baseWeight);
            const spreadsUsage = extractSpreads(stats.Spreads, baseWeight);
            
            // Execute the centralized roles engine!
            const mappedPkm = {
                ...pkm,
                stats: Array.isArray(pkm.stats) ? pkm.stats : [
                    { value: pkm.stats.hp },
                    { value: pkm.stats.atk },
                    { value: pkm.stats.def },
                    { value: pkm.stats.spa },
                    { value: pkm.stats.spd },
                    { value: pkm.stats.spe }
                ]
            } as any;

            return determineRoles(mappedPkm, movesUsage, abilitiesUsage, itemsUsage, spreadsUsage, Object.fromEntries(moveCategoryMap), traitsMap);
        };

        // Aggregate roles across top 100, weighted by usage rate
        const roleCountMap: Record<string, number> = {};
        const rolesCache: Record<string, string[]> = {};
        let physicalWeight = 0, specialWeight = 0, mixedWeight = 0;

        for (const [id, stats] of top100) {
            const bw = Object.values(stats.Abilities || {}).reduce((acc: number, curr: any) => acc + (curr as number), 0) || stats['Raw count'];
            const usageRate = (bw / thresholdDenom) * 100;
            const roles = getPkmRoles(id, stats, bw);
            rolesCache[id] = roles;
            for (const role of roles) {
                roleCountMap[role] = (roleCountMap[role] || 0) + usageRate;
            }
            // Physical vs Mixed vs Special split (weighted by usage)
            if (roles.includes(ROLE_KEYS.OFFENSIVE.SWEEPER_MIXED)) {
                mixedWeight += usageRate;
            } else {
                if (roles.includes(ROLE_KEYS.OFFENSIVE.SWEEPER_PHYSICAL) || (roles.includes(ROLE_KEYS.OFFENSIVE.TR_ATTACKER) && (pokedexMap[id]?.atk || 0) > (pokedexMap[id]?.spa || 0))) {
                    physicalWeight += usageRate;
                }
                if (roles.includes(ROLE_KEYS.OFFENSIVE.SWEEPER_SPECIAL) || (roles.includes(ROLE_KEYS.OFFENSIVE.TR_ATTACKER) && (pokedexMap[id]?.spa || 0) >= (pokedexMap[id]?.atk || 0))) {
                    specialWeight += usageRate;
                }
            }
        }

        const totalAttackWeight = physicalWeight + mixedWeight + specialWeight;
        const rolesArray = Object.entries(roleCountMap)
            .filter(([role]) => ROLE_LABELS[role])
            .map(([role, count]) => ({
                role,
                label: ROLE_LABELS[role].label,
                category: ROLE_LABELS[role].category,
                count,
                pct: 0 // will be computed below
            }))
            .sort((a, b) => b.count - a.count);
        
        const totalRoleWeight = rolesArray.reduce((sum, r) => sum + r.count, 0);
        rolesArray.forEach(r => { r.pct = totalRoleWeight > 0 ? (r.count / totalRoleWeight) * 100 : 0; });

        const rolesAnalysis = rolesArray.length > 0 ? {
            physical_pct: totalAttackWeight > 0 ? (physicalWeight / totalAttackWeight) * 100 : 45,
            mixed_pct: totalAttackWeight > 0 ? (mixedWeight / totalAttackWeight) * 100 : 10,
            special_pct: totalAttackWeight > 0 ? (specialWeight / totalAttackWeight) * 100 : 45,
            roles: rolesArray
        } : undefined;

        // 3-Pokemon Cores
        const coreMap: Record<string, number> = {};
        const pairWeights: Record<string, number> = {};

        // Limita a Top 30 para evitar O(n^3) en 100!
        const top30 = top100.slice(0, 30);
        
        for (const [id, stats] of top30) {
            if (stats.Teammates) {
                for (const [mateIdRaw, percentRaw] of Object.entries(stats.Teammates)) {
                    // Try to resolve name to ID
                    let mateId = mateIdRaw.toLowerCase().replace(/[^a-z0-9]/g, '');
                    // Verify the mate exists in top30 array to match logic
                    if (!top30.find(p => p[0] === mateId)) continue;
                    const pair = [id, mateId].sort();
                    pairWeights[`${pair[0]}|${pair[1]}`] = percentRaw as number;
                }
            }
        }

        const top30Ids = top30.map(p => p[0]);
        for (let i = 0; i < top30Ids.length; i++) {
            for (let j = i + 0; j < top30Ids.length; j++) {
                if (i === j) continue;
                for (let k = j + 0; k < top30Ids.length; k++) {
                    if (i === k || j === k) continue;
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
                usage_rate: (count / thresholdDenom) * 100
            }));

        const dashboardData: IMacroDashboardData = {
            format_id: formatSlug,
            total_teams_analyzed: TOTAL_BATTLES,
            centralization_index: centralizationIndex,
            type_ecosystem: typeEcosystem,
            gimmicks: Object.keys(gimmicksObj).length > 0 ? gimmicksObj : undefined,
            roles_analysis: rolesAnalysis,
            top_pokemon: top100.map(([id, stats]) => ({
                id,
                name: getPkmName(id),
                types: getPkmTypes(id),
                roles: rolesCache[id] || [],
                usage_rate: (Object.values(stats.Abilities || {}).reduce((acc: number, curr: any) => acc + (curr as number), 0) || stats['Raw count']) / thresholdDenom * 100,
                raw_count: stats['Raw count'],
                speed: Array.isArray(pokedexMap[id]?.stats) ? pokedexMap[id]?.stats.find((s:any)=>s.name==='spe')?.value || pokedexMap[id]?.stats[5]?.value || 0 : pokedexMap[id]?.stats?.spe || 0
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

        for (const [pkmId, stats] of top100) {
            const base_weight = Object.values(stats.Abilities || {}).reduce((acc: number, curr: any) => acc + (curr as number), 0) || stats['Raw count'];
            const pkmRoles = getPkmRoles(pkmId, stats, base_weight);
            
            const deepDiveData = {
                id: pkmId,
                name: getPkmName(pkmId),
                format_id: formatSlug,
                usage_metrics: {
                    raw: stats['Raw count'],
                    base_weight: base_weight,
                    percent: (stats['Raw count'] / TOTAL_TEAMS) * 100
                },
                roles: rolesCache[pkmId].map(r => ({ role: r, label: ROLE_LABELS[r]?.label || r, category: ROLE_LABELS[r]?.category || 'OFF' })),
                items: extractTrait(stats.Items),
                abilities: extractTrait(stats.Abilities),
                moves: extractTrait(stats.Moves),
                teras: extractTrait(stats.TeraTypes || stats['Tera Types'] || stats.Teras),
                spreads: extractSpreads(stats.Spreads, base_weight),
                teammates: stats.Teammates || {}
            };
            await fs.writeFile(path.join(formatDir, `${pkmId}.json`), JSON.stringify(deepDiveData, null, 2));
        }

        console.log(`  -> ✅ Generated: ${formatSlug}.json + ${top100.length} deep dives`);
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
