import { calculateTypeMatchups, getEffectiveness, TYPES } from '@/lib/typeLogic';
import { IPokemon } from '@/types/interfaces';
import { group } from 'node:console';
import { get } from 'node_modules/axios/index.cjs';

// ============================================================================
// TYPES
// ============================================================================

export type PhaseRating = 'good' | 'avg' | 'bad' | 'unavailable';

export interface PhaseStats {
    totalBattles: number;
    participatedBattles: number;
    aceKillRate: number;
    oneToOneRate: number;
    speedControlRate: number;
    OHKoRate: number;
    outspeedRate: number;
    safePivotRate: number;
    safeBuffRate: number;
    safeHazardsRate: number;
    safeStatusRate: number;
    stallRate: number;
    wallRate: number;
    riskRate: number;
    riskyPivotRate: number;
    enemyOHKORate: number;
    coverage: number;
    weaknessCoverage: number;
    weaknesses: number;    
}

export interface PhaseData {
    tier: string;
    score: number;
    rating: PhaseRating;
    reason: string;
    stats: PhaseStats;
}

export interface SimulationResult {
    score: number;
    tier: string;
    role: string;
    highlights: string[];
    phases: {
        early: PhaseData;
        mid: PhaseData;
        late: PhaseData;
    };
    meta: {
        availabilityStatus: 'available' | 'late' | 'postgame' | 'unavailable';
        origin: string | null;
        originStage: string | null;
    };
    debugLog: string[];
}

// ============================================================================
// MOVES CATEGORIZATION
// ============================================================================

//META
const offensiveBuffs = new Set ([
    'dragon-dance', 'swords-dance', 'nasty-plot', 'calm-mind', 'bulk-up', 'quiver-dance', 'shell-smash', 'agility', 'belly-drum', 'fillet-away', 'tail-glow', 'geomancy'
]);

const statusMoves = new Set ([
    'spore', 'thunder-wave','hypnosis', 'will-o-wisp', 'glare', 'nuzzle', 'yawn', 'baneful-bunker', 'toxic-thread'
]);

const hazardMoves = new Set ([
    'stealth-rock', 'spikes', 'toxic-spikes', 'sticky-web'
]);

const speedControlMoves = new Set ([
    'icy-wind', 'rock-tomb', 'bulldoze', 'thunder-wave', 'nuzzle', 'tailwind', 'trick-room'
]);

const priorityMoves = new Set ([
    'quick-attack', 'mach-punch', 'extreme-speed', 'fake-out', 'sucker-punch', 'vacuum-wave', 'bullet-punch', 'ice-shard', 'shadow-sneak', 'aqua-jet', 'water-shuriken', 'first-impression', 'accelerock', 'zippy-zap', 'jet-punch', 'thunderclap'
]);

//STALL
const stallMoves = new Set  ([
    'toxic', 'salt-cure', 'infestation', 'magma-storm', 'whirlpool', 'sand-tomb', 'leech-seed', 'baneful-bunker'
]);

const recoveryMoves = new Set ([
    'recover', 'roost', 'slack-off', 'soft-boiled', 'milk-drink', 'shore-up', 'moonlight', 'synthesis', 'wish', 'morning-sun', 'heal-order', 'floral-healing'
]);

const defensiveBuffs = new Set ([
    'iron-defense', 'amnesia', 'cotton-guard', 'cosmic-power', 'stock-pile', 'defend-order', 'barrier'
]);

const getBuffStat = (statChanges: any): Set<String> => {
    let buffStat = new Set<String> ([]);
    for (let i = 0; i < statChanges.length; i++) {
            const stat = statChanges[i].stat;
            buffStat.add(stat);
        }
    return buffStat;
};

// ============================================================================
// HELPERS
// ============================================================================

const createLogger = () => {
    const logs: string[] = [];
    return {
        add: (msg: string) => logs.push(msg),
        get: () => logs
    };
};

// Generador de Frases Contextuales (Prioridad BST)
const generatePhaseReason = (stats: PhaseStats, rating: PhaseRating, pokeBst: number, bstAvg: number, phase: string): string => {
    if (rating === 'unavailable') return "Not available in this phase.";
    
    //aceKillRate: Ratio de Aces derrotados
    //oneToOneRate: Ratio de barridos 1v1
    //speedControlRate: Tiene Speed Control (Tailwind, Trick Room, etc)
    //OHKoRate: Ratio de OHKO a bosses
    //outspeedRate: Ratio de outspeeds a bosses
    //safePivotRate: ratio de pivotes seguros (>25% HP después de recibir max damage)
    //safeBuffRate: ratio de buff seguros (>30% HP después de recibir max damage)
    //afeHazardsRate: ratio de colocación segura de hazards (>30% HP después de recibir max damage)
    //safeStatusRate: ratio de colocación segura de status (>30% HP después de recibir max damage)
    //stallRate: ratio de poder hacer estrategia de stall (toxic, leech seed, etc) de forma segura
    //wallRate: ratio de ser un muro efectivo (>30% HP después de recibir max damage)
    //riskRate: ratio de perder el 1 vs 1
    //riskyPivotRate: ratio de perder el 1 vs 1 por pivotar
    //enemyOHKORate: ratio de ser OHKO por bosses (métrica de fragilidad)
    //coverage: numero de tipos a los que cubre de los que es débil
    //weaknesses: numero de debilidades del poke

    let reason = "";
    switch (rating) {
        case 'good':
            if (stats.aceKillRate > 85) reason = "Top-tier counter to Gym Leaders Aces.";    
            if (stats.oneToOneRate > 75 && stats.riskRate < 20) reason = "Exceptional pick with dominant performance and low risk.";
            if (stats.OHKoRate > 45 && stats.outspeedRate > 40) reason = "Powerful offensive threat with strong matchups.";
            if (stats.safePivotRate > 50 && stats.wallRate > 50) reason = "Reliable defensive pivot and wall.";
            if (reason === "") reason = "Strong pick with solid performance and good matchups.";
            if (stats.riskRate > 30 && stats.enemyOHKORate < 10) reason += " However, be cautious of its fragility.";
            if (stats.enemyOHKORate > 30) reason += " However, it has a high risk of being OHKO'd by bosses.";
            break
        case 'avg':
            if (stats.aceKillRate > 45) reason = "Solid counter to some Gym Leaders Aces.";
            if (stats.oneToOneRate > 50 && stats.riskRate < 30) reason = "Good offensive option with decent matchups.";
            if (stats.OHKoRate > 25 && stats.outspeedRate > 25) reason = "Threatening offensive presence in the right matchups.";
            if (stats.safePivotRate > 30 && stats.wallRate > 30) reason = "Decent defensive option with some utility.";
            if (reason === "") reason = "Average pick with a mix of strengths and weaknesses.";
            if (stats.riskRate > 40 && stats.enemyOHKORate < 25) reason += " However, it can be quite risky to use in critical moments.";
            if (stats.enemyOHKORate > 25) reason += " However, it has a noticeable risk of being OHKO'd by bosses.";
            if (phase === 'late' && pokeBst+100 < bstAvg) reason = "Stats falling behind the curve.";
            if (phase === 'mid' && pokeBst+90 < bstAvg) reason = "Stats falling behind the curve.";
            break;
        case 'bad':
            if (stats.aceKillRate < 10) reason = "Poor counter to Gym Leaders Aces.";    
            if (stats.wallRate < 20) reason = "Ineffective as a defensive option.";
            if (stats.riskRate > 50) reason = "High risk of death makes it a liability.";
            if (stats.oneToOneRate < 20 && stats.riskRate > 35) reason = "Struggles to secure kills and can be a liability.";
            if (reason === "") reason = "Below average pick with significant weaknesses.";
            if (stats.riskRate < 30 && stats.enemyOHKORate < 20) reason += " However, it can still find niche uses in the right matchups.";
            if (stats.enemyOHKORate > 20) reason += " Additionally, it has a high risk of being OHKO'd by bosses.";
            if (phase === 'late' && pokeBst+130 < bstAvg) reason = " Stats falling hard behind the curve.";
            if (phase === 'mid' && pokeBst+120 < bstAvg) reason = " Stats falling hard behind the curve.";
    }

    return reason;
};

// --- DATA HELPERS ---

const getMinEvolutionLevel = (pokemonId: number, baseDex: any): number => {
    const entry = baseDex[pokemonId];
    if (!entry) return 1;
    if (entry.evolution?.from?.level) return entry.evolution.from.level;
    return 1;
};

const checkLineageAvailability = (pokemonId: number, baseDex: any, manifest: any, logger: any): { found: boolean, segmentIndex: number, name: string, stage: string, minlevel: number } => {
    if (!manifest?.segments) return { found: false, segmentIndex: 9999, name: '', stage: '', minlevel: 999 };

    let currentId = pokemonId;
    let depth = 0;

    while (currentId && depth < 5) {
        const entry = baseDex[currentId];
        if (!entry) break;
        
        const slug = entry.name.toLowerCase();
        
        for (let i = 0; i < manifest.segments.length; i++) {
            const seg = manifest.segments[i];
            const match = seg.encounters.find((e: any) => e.pokemon_id === slug || e.pokemon_id == currentId);
            if (match) {
                let mLevel = 999;
                for (let j = 0; j < match.method.length; j++){
                    if (match.method[j].min_level < mLevel){
                        mLevel = match.method[j].min_level;
                    }
                }
                logger.add(`[AVAIL] Found ancestor ${entry.name} in Segment #${i}`);
                return { found: true, segmentIndex: i, name: seg.name, stage: entry.name, minlevel: mLevel };
            }
        }
        
        if (entry.evolution?.from?.pokemonId) {
            currentId = entry.evolution.from.pokemonId;
            depth++;
        } else {
            break;
        }
    }
    return { found: false, segmentIndex: 9999, name: '', stage: '', minlevel: 999};
};

// --- MATH HELPERS ---

const getCategory = (type: string, cat: string, gen: number) => {
    if(cat === 'status') return cat;
    const GEN3_SPECIAL = new Set(['water', 'grass', 'fire', 'ice', 'electric', 'psychic', 'dragon', 'dark']);
    if (gen <= 3) return GEN3_SPECIAL.has(type) ? 'special' : 'physical';
    return cat;
};

const calculateStat = (base: number, level: number, isHp: boolean, iv: number) => {
    if (isHp) return Math.floor(((2 * base + iv) * level) / 100) + level + 10;
    return Math.floor(((2 * base + iv) * level) / 100) + 5;
};

const calculateDamage = (lvl: number, power: number, atk: number, def: number, stab: boolean, effectiveness: number, logger:any) => {
    if (power <= 0) return 0;
    const levelFactor = Math.floor(0.2 * lvl)  + 1;
    const safeDef = def > 0 ? def : 1;
    let damage = Math.floor((levelFactor * power * atk) / (safeDef*25)) + 2;
    if (stab) damage = Math.floor(damage * 1.5);
    damage = Math.floor(damage * effectiveness * 95 * 0.01);

    return damage;
};

const getMetaScore = () => {
    //LÓGICA PARA METASCORE
};

// ============================================================================
// ENGINE PRINCIPAL
// ============================================================================

export const analyzeNuzlockeViability = (
    rootPokemon: IPokemon,
    bosses: any[],
    manifest: any,
    baseDex: any,
    moveDex: any,
    movepoolDex: any,
    pokedexIds: any,
): SimulationResult => {
    
    const logger = createLogger();

    // 1. AVAILABILITY
    const lineage = checkLineageAvailability(rootPokemon.id, baseDex, manifest, logger);
    const gameGen = manifest?.base_generation || 3;
    const rootMinLevel = getMinEvolutionLevel(rootPokemon.id, baseDex);
    const minlWildLevel = lineage.minlevel;


    if (!lineage.found) {
        const emptyStats: PhaseStats = {
            totalBattles: 0, participatedBattles: 0, aceKillRate: 0, oneToOneRate: 0, wallRate: 0, riskRate: 0,
            speedControlRate: 0,
            OHKoRate: 0,
            outspeedRate: 0,
            safePivotRate: 0,
            safeBuffRate: 0,
            safeHazardsRate: 0,
            safeStatusRate: 0,
            stallRate: 0,
            riskyPivotRate: 0,
            enemyOHKORate: 0,
            coverage: 0,
            weaknesses: 0,
            weaknessCoverage: 0
        };
        const emptyPhase: PhaseData = { tier: 'N/A', score: 0, rating: 'unavailable', reason: 'Unavailable', stats: emptyStats };
        return {
            score: 0, tier: 'N/A', role: 'Unavailable', highlights: [],
            phases: { early: emptyPhase, mid: emptyPhase, late: emptyPhase },
            meta: { availabilityStatus: 'unavailable', origin: null, originStage: null },
            debugLog: logger.get()
        };
    }

    // Sort Bosses
    const segmentOrderMap = new Map<string, number>();
    manifest.segments.forEach((seg: any, idx: number) => segmentOrderMap.set(seg.id, idx));

    const sortedBosses = [...bosses].sort((a, b) => {
        const orderA = segmentOrderMap.get(a.segment_id) ?? 9999;
        const orderB = segmentOrderMap.get(b.segment_id) ?? 9999;
        return orderA - orderB;
    });

    const startBossIndex = sortedBosses.findIndex(b => (segmentOrderMap.get(b.segment_id) ?? 9999) >= lineage.segmentIndex);

    // Status Global
    const totalSegments = manifest.segments.length || 1;
    const progress = lineage.segmentIndex / totalSegments;
    let availabilityStatus: SimulationResult['meta']['availabilityStatus'] = 'available';
    if (progress > 0.95) availabilityStatus = 'postgame';
    else if (progress > 0.65) availabilityStatus = 'late';

    if (availabilityStatus === 'postgame') {
        const emptyStats: PhaseStats = {
            totalBattles: 0, participatedBattles: 0, aceKillRate: 0, oneToOneRate: 0, wallRate: 0, riskRate: 0,
            speedControlRate: 0,
            OHKoRate: 0,
            outspeedRate: 0,
            safePivotRate: 0,
            safeBuffRate: 0,
            safeHazardsRate: 0,
            safeStatusRate: 0,
            stallRate: 0,
            riskyPivotRate: 0,
            enemyOHKORate: 0,
            coverage: 0,
            weaknesses: 0,
            weaknessCoverage: 0
        };
        const emptyPhase: PhaseData = { tier: 'N/A', score: 0, rating: 'unavailable', reason: 'Post-Game Only', stats: emptyStats };
        return {
            score: 0, tier: 'N/A', role: 'Post-Game', highlights: [],
            phases: { early: emptyPhase, mid: emptyPhase, late: emptyPhase },
            meta: { availabilityStatus: 'postgame', origin: lineage.name, originStage: lineage.stage },
            debugLog: logger.get()
        };
    }

    // 2. PHASE CUTOFFS
    let gymCount = 0;
    let endEarlyIndex = -1; 
    let endMidIndex = -1;

    sortedBosses.forEach((b, i) => {
        const isGym = b.category?.includes('leader') || b.name.toLowerCase().includes('leader');
        if (isGym) {
            gymCount++;
            if (gymCount === 3) endEarlyIndex = i;
            if (gymCount === 6) endMidIndex = i;
        }
    });
    if (endEarlyIndex === -1) endEarlyIndex = Math.floor(sortedBosses.length * 0.3);
    if (endMidIndex === -1) endMidIndex = Math.floor(sortedBosses.length * 0.65);

    // 3. TRACKERS
    const createEmptyPhaseTracker = () => ({ 
        score: 0, max: 0, 
        battles: 0,
        participated: 0, 
        //BATTLE
        aceKills: 0, 
        friendlyOHKO : 0, //Mato al poke de 1 
        oneToOneKills: 0, //Mato en el 1 contra 1 (básico)
        outspeeds: 0, //Outspeeds
        pivot: 0, //Pivotar ante min damage bien
        safePivot: 0, //Entro safe (>25%) (ante max damage)
        //MOVES
        safeBuff : 0, //Max damage pequeño (>30%) y puedo buffarme
        safeStatus :0, //Max damage pequeño (>30%) y puedo poner status
        safeHazards: 0, //Max damage pequeño (>40%) y puedo poner hazards
        speedControl: 0, //Tiene movimientos de control de velocidad
        stall: 0, //Max damage pequeño (>20%) y recovery + stall
        //RIESGOS
        risks: 0, //No gano el 1 vs 1 ni limpio
		riskyPivot: 0, // No gano el 1vs1 con pivot
		badPivot: 0, // Entro mal (más 50% en min damage)
        enemyOHKO : 0,  //Me mata en 1HKO 
        coverage: 0, // Cobertura general (efectividad x cantidad de movimientos útiles)
        weaknessCoverage: 0, // Cobertura de debilidades (efectividad x cantidad de tipos a los que cubro de mis debilidades)
        weaknesses: 0, //Cantidad de tipos a los que soy débil
        totalAces: 0, 
        totalMons: 0,
        bstPoke: 0, bstSum: 0, bstCount: 0 // Para calcular media de BST usado
    });

    const phasesTracker = {
        early: createEmptyPhaseTracker(),
        mid: createEmptyPhaseTracker(),
        late: createEmptyPhaseTracker()
    };

    // 4. ROBUST GROUPING (Para evitar duplicados de Rivales)
    // Agrupamos por battle_id O por (segment_id + name) si battle_id no existe
    const groupedBattles = new Map<string, any[]>();
    sortedBosses.forEach((b, i) => {
        let groupId = b.battle_id;
        if (!groupId) {
            // Fallback grouping: Segment + Name (limpio de variantes)
            const cleanName = b.name.replace(/\s\((fire|water|grass|electric)\)/i, '').trim();
            groupId = `${b.segment_id}_${cleanName}`;
        }
        if (!groupedBattles.has(groupId)) groupedBattles.set(groupId, []);
        groupedBattles.get(groupId)?.push({ ...b, originalIndex: i });
    });

    const myType = baseDex[rootPokemon.id]?.types[0];
    const isStarter = ['grass', 'fire', 'water'].includes(myType);

    // 5. MAIN LOOP
    for (const [groupId, variants] of groupedBattles.entries()) {
        const referenceBoss = variants[0];
        const idx = referenceBoss.originalIndex;

        let phaseKey: 'early' | 'mid' | 'late' = 'late';
        if (idx <= endEarlyIndex) phaseKey = 'early';
        else if (idx <= endMidIndex) phaseKey = 'mid';

        phasesTracker[phaseKey].battles++;

        // A. Availability Check
        // REGLA DE ORO: Si es Late Game y la línea evolutiva se consiguió antes, ESTÁ DISPONIBLE.
        // Ignoramos el índice específico del boss para Late Game si ya tenemos el lineage.
        let isObtained = false;
        if (phaseKey === 'late') {
            isObtained = true; // Asumimos que para la liga ya lo tienes si es capturable
        } else {
            // Para Early/Mid, chequeamos cronología estricta
            const bossSegmentIndex = segmentOrderMap.get(referenceBoss.segment_id) ?? 9999;
            isObtained = bossSegmentIndex >= lineage.segmentIndex;
        }

        if (!isObtained) continue;

        // B. Form Check
        const levelCap = referenceBoss.level_cap || 50;
        // Si el nivel del boss es menor al requerido para existir -> Skip (No disponible AÚN)
        if (levelCap < rootMinLevel || levelCap < minlWildLevel) continue;

        // Usamos el Pokémon LITERAL consultado. No evolucionamos automáticamente.
        // Si el usuario consulta Combusken, calculamos Combusken en la liga.
        const activeForm = baseDex[rootPokemon.id];
        
        phasesTracker[phaseKey].participated++;

        // C. Stat Decay & BST Penalty (Objetivización)
        const stats = activeForm.stats || { hp:50, atk:50, def:50, spa:50, spd:50, spe:50 };
        const bst = stats.hp + stats.atk + stats.def + stats.spa + stats.spd + stats.spe;
        
        // Registrar BST para media de la fase
        phasesTracker[phaseKey].bstPoke = bst;

        let powerCreepPenalty = 1.0;
        // Penalización agresiva para un-evolved mons en late
        if (phaseKey === 'mid') {
            if (bst < 250) powerCreepPenalty = 0.6; // Muy débil
            else if (bst < 330) powerCreepPenalty = 0.8; 
        }
        if (phaseKey === 'late') {
            if (bst < 380) powerCreepPenalty = 0.5; // Inviable (Combusken en Liga)
            else if (bst < 450) powerCreepPenalty = 0.75; // Sub-par (Mightyena)
            else if (bst < 500) powerCreepPenalty = 0.9; // Decent
            else if (bst >= 600) powerCreepPenalty = 1.1; // Pseudo/Legend
        }

        // Stats (Player 20 IVs) - Plantear un selector en web para elegir IVs o usar un promedio
        const pStats = {
            hp: calculateStat(stats.hp, levelCap, true, 20),
            atk: calculateStat(stats.atk, levelCap, false, 20),
            def: calculateStat(stats.def, levelCap, false, 20),
            spa: calculateStat(stats.spa, levelCap, false, 20),
            spd: calculateStat(stats.spd, levelCap, false, 20),
            spe: calculateStat(stats.spe, levelCap, false, 20),
        };

        // Meter análisis de movepool (buffs, recover si wall, hazards, status, stall si wall)

        const movesData = movepoolDex[activeForm.id]?.[gameGen] || movepoolDex[activeForm.id]?.[3] || [];
        let movePower = 100000;
        if(phaseKey === 'early'){
            movePower = 55;
        }
        if(phaseKey === 'mid'){
            movePower = 75;
        }
        const movesCap = movesData.filter((m: any) => (m.level <= levelCap));
        const moveNoEgg = movesCap.filter((m: any) => (m.learning_method !== "egg"));
        const moves = moveNoEgg.filter((m: any) => (!(m['learning-method']==="machine" && m.power>movePower)))
        if (moves.length === 0) moves.push({ name: 'struggle', power: 50, type: 'normal' });


        //1.1 MOVEPOOL ANALYSIS
        let weakenesses = calculateTypeMatchups(activeForm.types).weaknesses || [""]
        let offBuff = false;
        let status = false;
        let hazards = false;
        let speedControl = false;
        let priority = false;
        let defBuff = false;
        let recovery = false;
        let stall = false;
        let stallStrategy = false;
        let coverage = new Set<String> ([]);
        let weaknessCoverage = new Set<String> ([]);

        moves.forEach((m: any) => {
            //Recorremos los moves
            const moveData = moveDex[m.name];
            let buffStats = new Set<String>;
            if(moveData.tactics.statChanges != null){
                buffStats = getBuffStat(moveData.tactics.statChanges)
            }
            if(offensiveBuffs.has(moveData.name)){
                //Hay que hacerlo recorriendo bucle, porque el statsChanges es un array
                if((stats.atk > (stats.spa+20))){
                    if(buffStats.has("attack")) offBuff = true;
                }else if((stats.spa > (stats.atk+20))){
                    if(buffStats.has("special-attack")) offBuff = true;
                }else{
                    offBuff = true;
                }
            }
            if(statusMoves.has(moveData.name)){
                status = true;
            }
            if(hazardMoves.has(moveData.name)){
                hazards = true;
            }
            if(speedControlMoves.has(moveData.name)){
                speedControl = true;
            }
            if(priorityMoves.has(moveData.name)){
                priority = true;
            }
            if(stallMoves.has(moveData.name)){
                stall = true;
            }
            if(defensiveBuffs.has(moveData.name)){
                defBuff = true;
            }
            if(recoveryMoves.has(moveData.name)){
                recovery = true;
            }
            for(let i = 0; i < weakenesses.length; i++){
                if (getEffectiveness(moveData.type, weakenesses[i]) >= 2 && moveData.power >= 70 && !coverage.has(weakenesses[i])) weaknessCoverage.add(weakenesses[i]);
            }
            for(let i = 0; i < TYPES.length; i++){
                //PARA CUANTOS TIPOS TENGO ACCESO A COBERTURA
                if (getEffectiveness(moveData.type, TYPES[i]) >= 2 && moveData.power >= 70 && !coverage.has(TYPES[i])) coverage.add(TYPES[i]);
            }  
        });

        if(stall && (recovery || defBuff) && (stats.hp >=90 || stats.def >= 90 || stats.spd >= 90 )){
            stallStrategy = true;
        }


        // D. Variant Logic (Averaging)
        let variantsToProcess = variants;
        if (isStarter && variants.some(v => v.variant)) {
            const match = variants.find(v => v.variant && v.variant.type === myType);
            if (match) variantsToProcess = [match]; 
        }

        let groupScoreSum = 0;
        let groupMaxSum = 0;
        // REVISAR GROUP STATS
        let groupStats = { 
            aceKills: 0, //Mata al ACE
            friendlyOHKO : 0, //Mato al poke de 1
            oneToOneKills: 0, //Mato en el 1 contra 1 (básico)
            outspeeds: 0, // Outspeedeo
            pivot: 0, //Pivotar ante min damage bien
            safePivot: 0, //Entro safe (>25%) (ante max damage)
            safeBuff : 0, //Max damage pequeño (>30%) y puedo buffarme
            safeStatus :0, //Max damage pequeño (>30%) y puedo poner status
            safeHazards: 0, //Max damage pequeño (>40%) y puedo poner hazards
            stall: 0, //Max damage pequeño (>20%) y recovery + stall
            risks: 0, //No gano el 1 vs 1
            riskyPivot: 0, // No gano el 1vs1 con pivot
			badPivot: 0, // Entro mal (más 50% en min damage)
            enemyOHKO : 0,  //Me mata en 1HKO
            coverage: 0,
            weaknessCoverage: 0,
            weakenesses: 0,
            totalAces: 0, 
            totalMons: 0 
        };
        let variantsProcessed = 0;
        groupStats.coverage = coverage.size;
        groupStats.weaknessCoverage = weaknessCoverage.size;
        groupStats.weakenesses = weakenesses.length;


        for (const bossVariant of variantsToProcess) {
            let bossScore = 0;
            let importance = 1.5;
            if (bossVariant.category?.includes('rival')) importance = 2.0;
            if (bossVariant.category?.includes('leader')) importance = 2.5;
            if (bossVariant.category?.includes('elite') || bossVariant.category?.includes('champion')) importance = 3.0;

            bossVariant.team.forEach((enemy: any, eIdx: number) => {
                const enemyId = pokedexIds[enemy.pokemon_id];
                const isAce = eIdx === bossVariant.team.length - 1;
                groupStats.totalMons++;
                if (isAce) groupStats.totalAces++;

                // Habría que poner aquí el procesado del parche para romhacks
                const eBase = baseDex[enemyId]?.stats || { hp:50, atk:50, def:50, spa:50, spd:50, spe:50 };
                const eBST = eBase.hp + eBase.atk + eBase.def + eBase.spa + eBase.spd + eBase.spe;
                phasesTracker[phaseKey].bstSum += eBST;
                phasesTracker[phaseKey].bstCount++;
                let arrayIVs = { hp:0, atk:0, def:0, spa:0, spd:0, spe:0 };
                if(phaseKey === 'early') arrayIVs = { hp:12, atk:12, def:12, spa:12, spd:12, spe:12 };
                if(phaseKey === 'mid') arrayIVs = { hp:22, atk:22, def:22, spa:22, spd:22, spe:22 };
                if(phaseKey === 'late') arrayIVs = { hp:30, atk:30, def:30, spa:30, spd:30, spe:30 };
                let eIVs = arrayIVs;
                if (JSON.stringify(enemy.ivs) != '{}') { eIVs = enemy.ivs } 
                const eStats = {
                    hp: calculateStat(eBase.hp, levelCap, true, eIVs.hp),
                    atk: calculateStat(eBase.atk, levelCap, false, eIVs.atk),
                    def: calculateStat(eBase.def, levelCap, false, eIVs.def),
                    spa: calculateStat(eBase.spa, levelCap, false, eIVs.spa),
                    spd: calculateStat(eBase.spd, levelCap, false, eIVs.spd),
                    spe: calculateStat(eBase.spe, levelCap, false, eIVs.spe),
                };
                const eTypes = baseDex[enemyId]?.types || ['normal'];
                const eMoves = enemy.moves;

                let maxDmg = 0;
                moves.forEach((m: any) => {
                    if (!m.power) return;
                    const cat = getCategory(m.type, m.cat, gameGen);
                    const atk = cat === 'physical' ? pStats.atk : pStats.spa;
                    const def = cat === 'physical' ? eStats.def : eStats.spd;
                    const stab = activeForm.types.includes(m.type);
                    let eff = 1;
                    eTypes.forEach((t: string) => eff *= getEffectiveness(m.type, t));
                    const dmg = calculateDamage(levelCap, m.power, atk, def, stab, eff, logger);
                    if (dmg > maxDmg) maxDmg = dmg;
                });

                let maxIncoming = 0;
                let minIncoming = 0;
                eMoves.forEach((em: string) => {
                    const emPlus = moveDex[em]
                    const cat = getCategory(emPlus.type, emPlus.category, gameGen);
                    const atk = cat === 'physical' ? eStats.atk : eStats.spa;
                    const def = cat === 'physical' ? pStats.def : pStats.spd;
                    const stab = eTypes.includes(emPlus.type);
                    let eff = 1;
                    activeForm.types.forEach((mt: string) => eff *= getEffectiveness(emPlus.type, mt));
                    const dmg = calculateDamage(levelCap, emPlus.power, atk, def, stab, eff, logger);
                    minIncoming = dmg;
                    if (dmg > maxIncoming) maxIncoming = dmg;
                    if (dmg < minIncoming) minIncoming = dmg;
                });

                const pctDmg = (maxDmg / eStats.hp) * 100;
                const pctMaxTaken = (maxIncoming / pStats.hp) * 100;
                const pctMinTaken = (minIncoming/pStats.hp) * 100;
                const outspeeds = pStats.spe > eStats.spe;
                if (outspeeds) groupStats.outspeeds++;

                let points = 0;
                let pLife = 100;
                let eLife = 100;
                let pivotScenario = true;
                let turns = 0;
                // Ajuste de Puntuación (Max 4, pero hay más posibles, si eres muy bueno ofensivamente los consigues fácil, si eres muy bueno defensivamente también, si tienes mix mejor) - 
                //OFENSIVA
                // ESCENARIO PIVOTANDO
                while(pLife > 0 && points == 0 && turns < 50){
                    turns++;
                    if (pctMaxTaken <= 0 && pctDmg <= 0) break;
                    // Si el enemigo no hace daño, ganamos eventualmente o es stall
                    if (pctMaxTaken <= 0) {
                        // Lógica opcional: si yo hago daño y él no, gano.
                        if (pctDmg > 0) {
                            eLife -= pctDmg;
                            if(eLife <= 0) { points +=2.8; groupStats.oneToOneKills++; if(isAce) groupStats.aceKills++; groupStats.pivot++; break; } // OnetoOneKills
                        } else {
                            break; // Nadie hace daño
                        }
                    }
                    //Primero quito vida por el pivote "seguro"
                    if(pivotScenario){ pLife -= pctMinTaken; pivotScenario=false}
                    // Escenario que soy más rápido (me da 0.25 más por serlo y ganar)
                    if (outspeeds){
                        // Si pudeo pivotarle, soy más rápido y le hago OHKO - perfecto
                        if(pctDmg >= 100) {points +=3.3; groupStats.friendlyOHKO++; if(isAce) groupStats.aceKills++; groupStats.pivot++; break;}
                        eLife -= pctDmg;
                        // Como soy más rápido, le quito vida, si le acabo ganando, marco 1v1 win
                        if(eLife <= 0) {points +=2.8; groupStats.oneToOneKills++; if(isAce) groupStats.aceKills++; groupStats.pivot++; break;}
                        if(pctMaxTaken >= 100) {groupStats.enemyOHKO++; break;}
                        pLife -= pctMaxTaken;
                        // Si pierdo, riskypivot
                        if(pLife <= 0){groupStats.riskyPivot++; continue;}
                    }else{
                        if(pctMaxTaken >= 100) {groupStats.enemyOHKO++; break;}
                        pLife -= pctMaxTaken;
                        if (pLife <= 0) {groupStats.riskyPivot++; continue; }
                        if(pctDmg >= 100) {points += 2.2; groupStats.friendlyOHKO++; if(isAce) groupStats.aceKills++; groupStats.pivot++; break;}
                        eLife -= pctDmg;
                        if(eLife <= 0) {points +=2; groupStats.oneToOneKills++; if(isAce) groupStats.aceKills++; groupStats.pivot++; break;}
                    }
                }
                // Devolvemos la vida al 100
                pLife = 100;
                eLife = 100;
                turns = 0;
                // Si no hemos podido ganarle en pivot; seguimos a ver si le ganamos sin pivotar
                while(pLife > 0 && points == 0 && turns < 50){
                    turns++;
                    if (pctMaxTaken <= 0 && pctDmg <= 0) break;
                    // Si el enemigo no hace daño, ganamos eventualmente o es stall
                    if (pctMaxTaken <= 0) {
                        // Lógica opcional: si yo hago daño y él no, gano.
                        if (pctDmg > 0) {
                            eLife -= pctDmg;
                            if(eLife <= 0) { points +=2.5; groupStats.oneToOneKills++; if(isAce) groupStats.aceKills++; groupStats.pivot++; break; } // OnetoOneKills
                        } else {
                            break; // Nadie hace daño
                        }
                    }
                    // Escenario que soy más rápido (me da 0.25 más por serlo y ganar)
                    if (outspeeds){
                        // Aquí penalizamos muy poco, porque puedo ser lead y ganar
                        if(pctDmg >= 100) {points +=3; groupStats.friendlyOHKO++; if(isAce) groupStats.aceKills++; break;}
                        eLife -= pctDmg;
                        // Como soy más rápido, le quito vida, si le acabo ganando, marco 1v1 win
                        if(eLife <= 0) {points +=2.5; groupStats.oneToOneKills++; if(isAce) groupStats.aceKills++; break;}
                        if(groupStats.enemyOHKO > 0){break;}
                        pLife -= pctMaxTaken;
                        // Si pierdo, risks
                        if(pLife <= 0){groupStats.risks++; continue;}
                    }else{
                        if(groupStats.enemyOHKO > 0){break;}
                        pLife -= pctMaxTaken;
                        if (pLife <= 0) {groupStats.risks++; continue; }
                        if(pctDmg >= 100) {points += 2; groupStats.friendlyOHKO++; if(isAce) groupStats.aceKills++; break;}
                        eLife -= pctDmg;
                        if(eLife <= 0) {points +=1.75; groupStats.oneToOneKills++; if(isAce) groupStats.aceKills++; break;}
                    }
                }
            
                //DEFENSIVO (hardcore) - Reset vida de nuestro poke
                pLife = 100
                if(Math.floor(pLife/pctMaxTaken)>4){
                    groupStats.safePivot++;
                    points += 2.0;
                    if(offBuff){
                        points +=0.4
                    }
                    if(stallStrategy){
                        groupStats.stall++;
                        points+=1
                    }
                }else if (Math.floor(pLife/pctMaxTaken)>2){
                    if(offBuff){
                        groupStats.safeBuff++;
                        points +=0.2
                    }
                    if(status){
                        groupStats.safeStatus++;
                        points+=0.25
                    }
                    if(hazards){
                        groupStats.safeHazards++;
                        points+=0.2
                    }
                }

                logger.add(`=== PUNTOS DEL ENFRENTAMIENTO: ${points} (V11.0) ===`);
                if(points > 4.0) points = 4.0;
                bossScore += points;
            });

            groupScoreSum += (bossScore * importance * powerCreepPenalty);
            groupMaxSum += (bossVariant.team.length * 4.0 * importance); // Max points per mon is 4
            variantsProcessed++;
        }

        if (variantsProcessed > 0) {
            phasesTracker[phaseKey].score += (groupScoreSum / variantsProcessed);
            phasesTracker[phaseKey].max += (groupMaxSum / variantsProcessed);
            //VER CÓMO SUMO A LA FASE COMPLETA POR TENER PRIORITY Y/O SPEED CONTROL Y POSIBILIDAD DE COBERTURAS ANTES TIPOS DÉBILES
            
            // Average Stats
            // PONERLE UN CONTADOR DE SPEED CONTROL SI MOVE O PRIORITY (Y SUBIMOS)
            phasesTracker[phaseKey].aceKills += (groupStats.aceKills / variantsProcessed);
            phasesTracker[phaseKey].friendlyOHKO += (groupStats.friendlyOHKO / variantsProcessed);
            phasesTracker[phaseKey].oneToOneKills += (groupStats.oneToOneKills / variantsProcessed);
            phasesTracker[phaseKey].outspeeds += (groupStats.outspeeds/variantsProcessed);
            if(priority || speedControl) phasesTracker[phaseKey].speedControl += 1;
            phasesTracker[phaseKey].pivot += (groupStats.pivot / variantsProcessed);
            phasesTracker[phaseKey].safePivot += (groupStats.safePivot / variantsProcessed);         
            phasesTracker[phaseKey].safeBuff += (groupStats.safeBuff / variantsProcessed);
            phasesTracker[phaseKey].safeHazards += (groupStats.safeHazards / variantsProcessed);
            phasesTracker[phaseKey].safeStatus += (groupStats.safeStatus / variantsProcessed);
            phasesTracker[phaseKey].stall += (groupStats.stall / variantsProcessed);
            phasesTracker[phaseKey].risks += (groupStats.risks / variantsProcessed);
            phasesTracker[phaseKey].riskyPivot += (groupStats.riskyPivot / variantsProcessed);
            phasesTracker[phaseKey].enemyOHKO += (groupStats.enemyOHKO / variantsProcessed);
            phasesTracker[phaseKey].coverage = groupStats.coverage;
            phasesTracker[phaseKey].weaknessCoverage = groupStats.weaknessCoverage;
            phasesTracker[phaseKey].weaknesses = groupStats.weakenesses;
            //phasesTracker[phaseKey].badPivot += (groupStats.badPivot / variantsProcessed);
            phasesTracker[phaseKey].totalAces += (groupStats.totalAces / variantsProcessed);
            phasesTracker[phaseKey].totalMons += (groupStats.totalMons / variantsProcessed);
            
            if (variantsProcessed > 1) {
                logger.add(`[GROUP] ${referenceBoss.name} (${phaseKey}): Merged ${variantsProcessed} variants.`);
            }
        }
    }

    // 6. PROCESS RESULTS
    const processPhase = (p: typeof phasesTracker['early'], phaseName: string): PhaseData => {
        const participationRatio = p.battles > 0 ? (p.participated / p.battles) : 0;
        
        // Bloqueo: Si no participa en al menos 20%
        if (participationRatio < 0.2 || p.max === 0) {
            const emptyStats: PhaseStats = {
                totalBattles: p.battles, participatedBattles: p.participated, aceKillRate: 0, oneToOneRate: 0, wallRate: 0, riskRate: 0,
                speedControlRate: 0,
                OHKoRate: 0,
                outspeedRate: 0,
                safePivotRate: 0,
                safeBuffRate: 0,
                safeHazardsRate: 0,
                safeStatusRate: 0,
                stallRate: 0,
                riskyPivotRate: 0,
                enemyOHKORate: 0,
                coverage: 0,
                weaknessCoverage: 0,
                weaknesses: 0,
            };
            return { tier: 'N/A', score: 0, rating: 'unavailable', reason: 'Not available in this phase', stats: emptyStats };
        }

        //Meta calc - Coverage and Speed Control son los únicos que no se calculan como rate de participación, porque son atributos intrínsecos del poke, no dependen de si participo o no en el enfrentamiento
        let metaScore = 0;
        if(p.weaknessCoverage/p.weaknesses > 0.75) metaScore += 5; // Buen ratio de cobertura (cubro al menos 3/4 de mis debilidades)
        if(p.coverage/TYPES.length > 0.4) metaScore += 3
        if(p.speedControl > 0) metaScore += 5; // Tiene control de velocidad

        const scoreVal = Math.round((p.score / p.max) * 87) + metaScore; // Escalamos a 90 puntos base + bonus de meta
        const safeScore = Math.max(0, Math.min(100, scoreVal));
        
        let tier = 'C';
        let rating: PhaseRating = 'bad';

        if (safeScore >= 85) { tier = 'S'; rating = 'good'; }
        else if (safeScore >= 70) { tier = 'A'; rating = 'good'; }
        else if (safeScore >= 55) { tier = 'B'; rating = 'avg'; }
        else if (safeScore >= 40) { tier = 'C'; rating = 'avg'; }
        else if (safeScore >= 25) { tier = 'D'; rating = 'bad'; }
        else { tier = 'F'; rating = 'bad'; }

        // HAY QUE reVISAR TODA ESTA LÓGICA QUE ES LA QUE LUEGO DA LOS MENSAJES
        // QUIZÄ HAY QUE AÑADIR UNA lÖGICA DE OUTSPEED (PARA AJUSTAR MENSAJES)
        const stats: PhaseStats = {
            totalBattles: p.battles,
            participatedBattles: p.participated,
            aceKillRate: p.totalAces > 0 ? Math.round((p.aceKills / p.totalAces) * 100) : 0,
            oneToOneRate: p.totalMons > 0 ? Math.round((p.oneToOneKills / p.totalMons) * 100) : 0,
            speedControlRate: p.speedControl > 0 ? p.speedControl : 0,
            OHKoRate: p.totalMons > 0 ? Math.round((p.friendlyOHKO / p.totalMons) * 100) : 0,
            outspeedRate: p.totalMons > 0 ? Math.round((p.outspeeds / p.totalMons) * 100) : 0,
            safePivotRate: p.totalMons > 0 ? Math.round((p.safePivot / p.totalMons) * 100) : 0,
            safeBuffRate: p.totalMons > 0 ? Math.round((p.safeBuff / p.totalMons) * 100) : 0,
            safeHazardsRate: p.totalMons > 0 ? Math.round((p.safeHazards / p.totalMons) * 100) : 0,
            safeStatusRate: p.totalMons > 0 ? Math.round((p.safeStatus / p.totalMons) * 100) : 0,
            stallRate: p.totalMons > 0 ? Math.round((p.stall / p.totalMons) * 100) : 0,
            wallRate: p.totalMons > 0 ? Math.round((p.pivot / p.totalMons) * 100) : 0,
            riskRate: p.totalMons > 0 ? Math.round((p.risks / p.totalMons) * 100) : 0,
            riskyPivotRate: p.totalMons > 0 ? Math.round((p.riskyPivot / p.totalMons) * 100) : 0,
            enemyOHKORate: p.totalMons > 0 ? Math.round((p.enemyOHKO / p.totalMons) * 100) : 0,
            coverage: p.coverage,
            weaknessCoverage: p.weaknessCoverage,
            weaknesses: p.weaknesses
        };

        // EL BST SUM ESTÁ BIEN? SI SE HACE CPN EL MISMO POKE SIEMPRE SALDrÁ IGUAL, NO?
        const avgBst = p.bstCount > 0 ? Math.round(p.bstSum / p.bstCount) : 0;
        const pokeBst = p.bstPoke;
        const reason = generatePhaseReason(stats, rating, pokeBst, avgBst, phaseName);

        return { tier, score: safeScore, rating, reason, stats };
    };

    const resultPhases = {
        early: processPhase(phasesTracker.early, 'early'),
        mid: processPhase(phasesTracker.mid, 'mid'),
        late: processPhase(phasesTracker.late, 'late')
    };

    // Role Global (DARLE UN POCO MÁS DE LÓGICA)
    const finalForm = baseDex[rootPokemon.id];
    let role = 'Filler';
    if (finalForm.stats.atk >= finalForm.stats.spa + 30) {
        if(finalForm.stats.spe > 95){
            role = "Physical Sweeper";
        }else if(finalForm.stats.def + finalForm.stats.spd +finalForm.stats.hp > 280){
            role = "Bulky Physical Attacker";
        } else {
            role = "Physical Attacker";
        }
    }else if (finalForm.stats.spa >= finalForm.stats.atk + 30) {
        if(finalForm.stats.spe > 95){
            role = "Special Sweeper";
        }else if(finalForm.stats.def + finalForm.stats.spd +finalForm.stats.hp > 280){
            role = "Bulky Special Attacker";
        } else {
            role = "Special Attacker";
        }
    }else{
        if(finalForm.stats.spe > 95){
            role = "Mixed Sweeper";
        }else if(finalForm.stats.def + finalForm.stats.hp > 230){
            role = "Physical Wall";
        }else if(finalForm.stats.spd + finalForm.stats.hp > 230){
            role = "Special Wall";
        }else if(finalForm.stats.def + finalForm.stats.spd +finalForm.stats.hp > 300){
            role = "Bulky Generalist";
        }else if (finalForm.stats.spe > 65){
            role = "Mixed Attacker";
        }
    }

    return {
        score: resultPhases.late.score,
        tier: 'N/A',
        role,
        highlights: [],
        phases: resultPhases,
        meta: { availabilityStatus, origin: lineage.name, originStage: lineage.stage },
        debugLog: logger.get()
    };
};