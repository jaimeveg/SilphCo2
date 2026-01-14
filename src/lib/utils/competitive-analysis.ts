import { IPokemon } from '@/types/interfaces';

interface UsageItem {
    name: string;
    value: number;
}

interface SpreadAnalysis {
    evs: Record<string, number>;
    nature: string;
    usage?: string;
}

export const ROLE_KEYS = {
    OFFENSIVE: {
        SWEEPER_PHYSICAL: 'role_sweeper_physical',
        SWEEPER_SPECIAL: 'role_sweeper_special',
        TR_ATTACKER: 'role_tr_attacker',
        PRIORITY: 'role_priority',
        SETUP: 'role_setup',
    },
    SUPPORTIVE: {
        REDIRECTION: 'role_redirection',
        SPEED_CONTROL: 'role_speed_control',
        TR_SETTER: 'role_tr_setter',
        WEATHER: 'role_weather',
        TERRAIN: 'role_terrain',
        WIDE_GUARD: 'role_wide_guard',
        CLERIC: 'role_cleric',
        DISRUPTOR: 'role_disruptor',
        SCREENER: 'role_screener',
    },
    DEFENSIVE: {
        WALL_PHYSICAL: 'role_wall_physical',
        WALL_SPECIAL: 'role_wall_special',
        STALLER: 'role_staller',
        PIVOT: 'role_pivot',
    }
};

const ROLE_CATEGORY_MAP: Record<string, 'OFF' | 'SUP' | 'DEF'> = {};
Object.values(ROLE_KEYS.OFFENSIVE).forEach(k => ROLE_CATEGORY_MAP[k] = 'OFF');
Object.values(ROLE_KEYS.SUPPORTIVE).forEach(k => ROLE_CATEGORY_MAP[k] = 'SUP');
Object.values(ROLE_KEYS.DEFENSIVE).forEach(k => ROLE_CATEGORY_MAP[k] = 'DEF');

const CORE_OFFENSIVE_ROLES = [
    ROLE_KEYS.OFFENSIVE.SWEEPER_PHYSICAL, 
    ROLE_KEYS.OFFENSIVE.SWEEPER_SPECIAL, 
    ROLE_KEYS.OFFENSIVE.TR_ATTACKER
];
const CORE_DEFENSIVE_ROLES = [
    ROLE_KEYS.DEFENSIVE.WALL_PHYSICAL, 
    ROLE_KEYS.DEFENSIVE.WALL_SPECIAL,
    ROLE_KEYS.DEFENSIVE.STALLER 
];

const NON_ATTACKING_MOVES = new Set([
    'protect', 'detect', 'substitute', 'endure', 'sleep talk', 'metronome', 'helping hand', 'follow me', 'rage powder',
    'trick room', 'tailwind', 'icy wind', 'electro web', 'string shot', 'will-o-wisp', 'thunder wave', 'spore', 'taunt', 
    'encore', 'disable', 'hypnosis', 'yawn', 'leech seed', 'toxic', 'light screen', 'reflect', 'aurora veil', 
    'swords dance', 'nasty plot', 'calm mind', 'bulk up', 'dragon dance', 'shell smash', 'quiver dance', 'belly drum', 
    'curse', 'iron defense', 'amnesia', 'cotton guard', 'roost', 'recover', 'soft boiled', 'milk drink', 'slack off', 
    'moonlight', 'morning sun', 'synthesis', 'wish', 'healing wish', 'lunar dance', 'parting shot', 'baton pass',
    'haze', 'defog', 'rapid spin', 'stealth rock', 'spikes', 'toxic spikes', 'sticky web', 'wide guard', 'quick guard',
    'fake out', 'sunny day', 'rain dance', 'sandstorm', 'snowscape', 'trick', 'switcheroo', 'ally switch', 'transform',
    'salt cure', 'infestation', 'magma storm', 'whirlpool', 'sand tomb', 'baneful bunker', 'spiky shield', 'king shield',
    'pollen puff', 'life dew', 'jungle healing' // Added healing moves that deal dmg or are generic
]);

export const calculateSilphRank = (usageRate: number) => {
    if (usageRate >= 40) return { rank: 'S+', color: 'text-yellow-400 drop-shadow-yellow' };
    if (usageRate >= 20) return { rank: 'S', color: 'text-purple-400' };
    if (usageRate >= 10) return { rank: 'A', color: 'text-cyan-400' };
    if (usageRate >= 5) return { rank: 'B', color: 'text-emerald-400' };
    if (usageRate >= 1) return { rank: 'C', color: 'text-slate-300' };
    return { rank: 'F', color: 'text-slate-600' };
};

export const calculateSpeedTier = (baseSpeed: number) => {
    const isTrickRoom = baseSpeed < 60;
    let tier = 'F';
    if (baseSpeed >= 135) tier = 'S+';      
    else if (baseSpeed >= 120) tier = 'S';  
    else if (baseSpeed >= 100) tier = 'A';  
    else if (baseSpeed >= 80) tier = 'B';   
    else if (baseSpeed >= 60) tier = 'C';   
    else tier = 'D';                        
    return { tier, isTrickRoom };
};

export const determineRoles = (
    pokemon: IPokemon, 
    movesUsage: UsageItem[], 
    abilitiesUsage: UsageItem[],
    spreads: SpreadAnalysis[] = [] 
): string[] => {
    
    const scores: Record<string, number> = {};
    const addScore = (role: string, points: number) => { scores[role] = (scores[role] || 0) + points; };

    // --- 1. DATA PREP ---
    const moveMap = new Map<string, number>();
    movesUsage.forEach(m => moveMap.set(m.name.toLowerCase().replace(/[\s-]/g, ''), m.value));
    const abilityMap = new Map<string, number>();
    abilitiesUsage.forEach(a => abilityMap.set(a.name.toLowerCase().replace(/[\s-]/g, ''), a.value));

    const getGroupUsage = (keywords: string[]) => {
        let total = 0;
        keywords.forEach(k => total += moveMap.get(k) || 0);
        return total;
    };
    const getAbilityUsage = (keywords: string[]) => {
        let total = 0;
        keywords.forEach(k => total += abilityMap.get(k) || 0);
        return total;
    };

    const hp = pokemon.stats[0].value;
    const atk = pokemon.stats[1].value;
    const def = pokemon.stats[2].value;
    const spa = pokemon.stats[3].value;
    const spd = pokemon.stats[4].value;
    const spe = pokemon.stats[5].value;

    // --- 2. EV SPREAD ANALYSIS (ALTA PRIORIDAD) ---
    const spreadsToAnalyze = spreads.slice(0, 3);
    
    // Flags de intención para filtrar ataques después
    let hasOffensiveInvestment = false;
    let hasBulkyInvestment = false;

    spreadsToAnalyze.forEach((spread, index) => {
        const weight = index === 0 ? 1 : (index === 1 ? 0.7 : 0.5); 
        const evs = spread.evs;
        const evSpe = evs.spe || 0;
        const evAtk = evs.atk || 0;
        const evSpa = evs.spa || 0;
        const evHp = evs.hp || 0;
        const evDef = evs.def || 0;
        const evSpd = evs.spd || 0;

        // A. HARD OFFENSIVE SIGNALS
        if (evSpe > 200) {
            hasOffensiveInvestment = true;
            if (evAtk > 150 || atk > spa) addScore(ROLE_KEYS.OFFENSIVE.SWEEPER_PHYSICAL, 25 * weight);
            if (evSpa > 150 || spa > atk) addScore(ROLE_KEYS.OFFENSIVE.SWEEPER_SPECIAL, 25 * weight);
            addScore(ROLE_KEYS.OFFENSIVE.TR_ATTACKER, -50 * weight);
            addScore(ROLE_KEYS.SUPPORTIVE.TR_SETTER, -20 * weight);
        } 
        // B. TRICK ROOM ATTACKER (Corrección Amoonguss: Exige inversión ofensiva)
        else if (evSpe < 20 && spe < 60) {
            if (evAtk > 100 || evSpa > 100) { // <--- FILTRO NUEVO
                hasOffensiveInvestment = true;
                addScore(ROLE_KEYS.OFFENSIVE.TR_ATTACKER, 15 * weight);
            }
        }

        // C. HARD DEFENSIVE SIGNALS
        if (evHp > 200) {
            hasBulkyInvestment = true;
            if (evDef > 100) addScore(ROLE_KEYS.DEFENSIVE.WALL_PHYSICAL, 15 * weight);
            if (evSpd > 100) addScore(ROLE_KEYS.DEFENSIVE.WALL_SPECIAL, 15 * weight);
            
            // Si tiene mucho bulk pero NADA de ataque, subimos potencial Support genérico
            if (evAtk < 50 && evSpa < 50) {
                addScore(ROLE_KEYS.SUPPORTIVE.DISRUPTOR, 5 * weight);
                addScore(ROLE_KEYS.SUPPORTIVE.SPEED_CONTROL, 5 * weight);
                addScore(ROLE_KEYS.SUPPORTIVE.REDIRECTION, 5 * weight);
            }
        }

        // D. BULKY PIVOT (Incineroar Case)
        // Mucha vida, algo de defensa, poca velocidad, ataque medio
        if (evHp > 200 && (evDef > 50 || evSpd > 50) && evSpe < 100) {
            addScore(ROLE_KEYS.DEFENSIVE.PIVOT, 10 * weight);
        }
    });

    // --- 3. MOVES ANALYSIS ---
    
    // DAMAGE (Solo si hay inversión ofensiva o stats base monstruosos)
    movesUsage.forEach(m => {
        const cleanName = m.name.toLowerCase(); 
        if (m.value > 30 && !NON_ATTACKING_MOVES.has(cleanName)) {
            // Solo sumamos si el spread acompaña O el stat base es muy alto (>115)
            // Esto evita que Incineroar (Flare Blitz) salga como Sweeper si lleva 252 HP
            if (hasOffensiveInvestment || atk > 115 || spa > 115) {
                if (scores[ROLE_KEYS.OFFENSIVE.SWEEPER_PHYSICAL] > 0 || atk > spa) {
                    addScore(ROLE_KEYS.OFFENSIVE.SWEEPER_PHYSICAL, m.value * 0.15);
                }
                if (scores[ROLE_KEYS.OFFENSIVE.SWEEPER_SPECIAL] > 0 || spa > atk) {
                    addScore(ROLE_KEYS.OFFENSIVE.SWEEPER_SPECIAL, m.value * 0.15);
                }
                if (scores[ROLE_KEYS.OFFENSIVE.TR_ATTACKER] > 0) {
                    addScore(ROLE_KEYS.OFFENSIVE.TR_ATTACKER, m.value * 0.15);
                }
            }
        }
    });

    // SUPPORT
    const trUsage = getGroupUsage(['trickroom']);
    if (trUsage > 15) addScore(ROLE_KEYS.SUPPORTIVE.TR_SETTER, 40);
    
    const redirectUsage = getGroupUsage(['followme', 'ragepowder']);
    if (redirectUsage > 20) addScore(ROLE_KEYS.SUPPORTIVE.REDIRECTION, 35);
    
    const wideGuardUsage = getGroupUsage(['wideguard']);
    if (wideGuardUsage > 25) addScore(ROLE_KEYS.SUPPORTIVE.WIDE_GUARD, 25);
    
    const speedControlUsage = getGroupUsage(['tailwind', 'icywind', 'electroweb', 'stringshot']);
    if (speedControlUsage > 30) addScore(ROLE_KEYS.SUPPORTIVE.SPEED_CONTROL, 20);
    
    // DISRUPTOR (Incluye Fake Out y Will-o-wisp ahora)
    const disruptUsage = getGroupUsage(['spore', 'thunderwave', 'taunt', 'encore', 'disable', 'hypnosis', 'fakeout', 'willowisp', 'glare', 'partingshot', 'snarl']);
    if (disruptUsage > 30) addScore(ROLE_KEYS.SUPPORTIVE.DISRUPTOR, 25); // Fake Out ayuda mucho aquí

    // CLERIC
    const clericUsage = getGroupUsage(['healpulse', 'aromatherapy', 'wish', 'lunardance', 'pollenpuff', 'lifedew', 'junglehealing']);
    if (clericUsage > 20) addScore(ROLE_KEYS.SUPPORTIVE.CLERIC, 25);

    // Weather/Terrain
    const weatherAbil = getAbilityUsage(['drizzle', 'drought', 'snowwarning', 'sandstream', 'orichalcumpulse']);
    if (weatherAbil > 40) addScore(ROLE_KEYS.SUPPORTIVE.WEATHER, 30);
    const terrainAbil = getAbilityUsage(['electricsurge', 'grassysurge', 'mistysurge', 'psychicsurge', 'hadronengine']);
    if (terrainAbil > 40) addScore(ROLE_KEYS.SUPPORTIVE.TERRAIN, 30);

    // PIVOT (Movimiento + Intención)
    const pivotMoveUsage = getGroupUsage(['partingshot', 'uturn', 'voltswitch', 'flipturn']);
    const pivotAbility = getAbilityUsage(['intimidate', 'regenerator']);
    if (pivotMoveUsage > 25) {
        let score = 20;
        if (pivotAbility > 50) score += 10; // Intimidate + Parting Shot = Dios Pivot
        addScore(ROLE_KEYS.DEFENSIVE.PIVOT, score);
    }

    // --- LOGICA STALLER (REVISADA) ---
    // 1. Daño Pasivo "Hard" (Tóxico, Salt Cure, Trapping) - Will-o-wisp eliminado de aquí
    const hardStallUsage = getGroupUsage(['toxic', 'saltcure', 'infestation', 'magmastorm', 'whirlpool', 'sandtomb', 'leechseed']);
    if (hardStallUsage > 15) addScore(ROLE_KEYS.DEFENSIVE.STALLER, hardStallUsage);

    // 2. Recovery fiable (Obligatorio para ser Staller puro generalmente)
    const recoveryUsage = getGroupUsage(['recover', 'roost', 'slackoff', 'softboiled', 'milkdrink', 'shoreup', 'moonlight', 'synthesis', 'wish']);
    
    // 3. Buffs Defensivos
    const defBuffUsage = getGroupUsage(['irondefense', 'amnesia', 'cottonguard', 'cosmicpower', 'stockpile']);
    
    // Regla: Para ser Staller, necesitas (Recovery O Buffs Defensivos) Y (Daño Pasivo O Bulk Extremo)
    if (recoveryUsage > 20 || defBuffUsage > 15) {
        if (hardStallUsage > 0 || hasBulkyInvestment) {
            addScore(ROLE_KEYS.DEFENSIVE.STALLER, 20);
        }
    }

    // --- 4. SELECCIÓN ---
    if (spe > 100) scores[ROLE_KEYS.OFFENSIVE.TR_ATTACKER] = -999;

    const candidates = Object.entries(scores)
        .filter(([, val]) => val > 10)
        .sort(([, valA], [, valB]) => valB - valA)
        .map(([role]) => role);

    const selectedRoles: string[] = [];
    const hasCoreOffensive = () => selectedRoles.some(r => CORE_OFFENSIVE_ROLES.includes(r));
    const hasCoreDefensive = () => selectedRoles.some(r => CORE_DEFENSIVE_ROLES.includes(r));

    for (const role of candidates) {
        if (selectedRoles.length >= 3) break;

        const isCoreOff = CORE_OFFENSIVE_ROLES.includes(role);
        const isCoreDef = CORE_DEFENSIVE_ROLES.includes(role);

        if (isCoreOff) {
            if (!hasCoreOffensive()) selectedRoles.push(role);
        } else if (isCoreDef) {
            if (!hasCoreDefensive()) selectedRoles.push(role);
        } else {
            selectedRoles.push(role);
        }
    }

    return selectedRoles;
};