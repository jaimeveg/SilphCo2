'use client';

import { useState } from 'react';
import { IPokemon } from '@/types/interfaces';
import { Lang } from '@/lib/pokedexDictionary';
import { calculateSilphRank, determineRoles, ROLE_KEYS } from '@/lib/utils/competitive-analysis';
import { Timer, Zap, Shield, Swords, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

// --- DICCIONARIO ---
const COMPETITIVE_TRANSLATIONS = {
    en: {
        rankTooltip: 'Based on usage for the selected format',
        bestFit: 'Best-fit Roles',
        noRoles: 'Flexible / Generalist',
        roles: {
            [ROLE_KEYS.OFFENSIVE.SWEEPER_PHYSICAL]: { label: 'Phys. Sweeper', desc: 'Fast physical attacker designed to clean up late-game.' },
            [ROLE_KEYS.OFFENSIVE.SWEEPER_SPECIAL]: { label: 'Spec. Sweeper', desc: 'Fast special attacker designed to clean up late-game.' },
            [ROLE_KEYS.OFFENSIVE.TR_ATTACKER]: { label: 'TR Attacker', desc: 'Slow but powerful attacker optimized for Trick Room.' },
            [ROLE_KEYS.OFFENSIVE.PRIORITY]: { label: 'Priority', desc: 'Uses moves like Extreme Speed or Sucker Punch to move first.' },
            [ROLE_KEYS.OFFENSIVE.SETUP]: { label: 'Setup Sweeper', desc: 'Boosts stats (Swords Dance, Nasty Plot) to sweep.' },
            [ROLE_KEYS.OFFENSIVE.WALLBREAKER]: { label: 'Wallbreaker', desc: 'Heavy attacker to defeat bulky opponents, but not fast enough to sweep.' },            
            [ROLE_KEYS.SUPPORTIVE.REDIRECTION]: { label: 'Redirection', desc: 'Uses Follow Me / Rage Powder to protect partners.' },
            [ROLE_KEYS.SUPPORTIVE.SPEED_CONTROL]: { label: 'Speed Control', desc: 'Manages field speed (Tailwind, Icy Wind).' },
            [ROLE_KEYS.SUPPORTIVE.TR_SETTER]: { label: 'TR Setter', desc: 'Sets up Trick Room to reverse turn order.' },
            [ROLE_KEYS.SUPPORTIVE.WEATHER]: { label: 'Weather', desc: 'Sets or abuses weather conditions (Rain, Sun, etc).' },
            [ROLE_KEYS.SUPPORTIVE.TERRAIN]: { label: 'Terrain', desc: 'Sets Electric, Grassy, Psychic or Misty Terrain.' },
            [ROLE_KEYS.SUPPORTIVE.WIDE_GUARD]: { label: 'Wide Guard', desc: 'Protects the team from spread moves.' },
            [ROLE_KEYS.SUPPORTIVE.DISRUPTOR]: { label: 'Disruptor', desc: 'Uses status or moves to stop enemy plans.' },
            [ROLE_KEYS.SUPPORTIVE.SCREENER]: { label: 'Screener', desc: 'Reduces damage with Reflect, Light Screen or Aurora Veil.' },
            [ROLE_KEYS.SUPPORTIVE.CLERIC]: { label: 'Healer', desc: 'Heals teammates or cures status conditions.' },
            [ROLE_KEYS.DEFENSIVE.WALL_PHYSICAL]: { label: 'Phys. Wall', desc: 'Tanks physical hits extremely well.' },
            [ROLE_KEYS.DEFENSIVE.WALL_SPECIAL]: { label: 'Spec. Wall', desc: 'Tanks special hits extremely well.' },
            [ROLE_KEYS.DEFENSIVE.PIVOT]: { label: 'Pivot', desc: 'Switches frequently to maintain momentum and position.' },
            [ROLE_KEYS.DEFENSIVE.STALLER]: { label: 'Staller', desc: 'Wins by attrition using passive damage and high durability.' },
        }
    },
    es: {
        rankTooltip: 'Con base en el uso para el formato seleccionado',
        bestFit: 'Roles sugeridos (Best-fit)',
        noRoles: 'Flexible / Generalista',
        roles: {
            [ROLE_KEYS.OFFENSIVE.SWEEPER_PHYSICAL]: { label: 'Sweeper Físico', desc: 'Atacante físico rápido diseñado para cerrar partidas.' },
            [ROLE_KEYS.OFFENSIVE.SWEEPER_SPECIAL]: { label: 'Sweeper Esp.', desc: 'Atacante especial rápido diseñado para cerrar partidas.' },
            [ROLE_KEYS.OFFENSIVE.TR_ATTACKER]: { label: 'Atacante ER', desc: 'Atacante lento pero poderoso optimizado para Espacio Raro.' },
            [ROLE_KEYS.OFFENSIVE.PRIORITY]: { label: 'Prioridad', desc: 'Usa movimientos con prioridad para atacar primero.' },
            [ROLE_KEYS.OFFENSIVE.SETUP]: { label: 'Setup Sweeper', desc: 'Se boostea (Danza Espada, Maquinación) para sweepear.' },
            [ROLE_KEYS.OFFENSIVE.WALLBREAKER]: { label: 'Wallbreaker', desc: 'Atacante pesado para derrotar opoenentes defensivos, pero no lo suficientemete rápido para sweepear.' },            
            [ROLE_KEYS.SUPPORTIVE.REDIRECTION]: { label: 'Redirección', desc: 'Usa Señuelo / Polvo Ira para proteger al compañero.' },
            [ROLE_KEYS.SUPPORTIVE.SPEED_CONTROL]: { label: 'Control Velocidad', desc: 'Gestiona la velocidad (Viento Afín, Viento Hielo).' },
            [ROLE_KEYS.SUPPORTIVE.TR_SETTER]: { label: 'Inductor ER', desc: 'Pone Espacio Raro para invertir el orden de turnos.' },
            [ROLE_KEYS.SUPPORTIVE.WEATHER]: { label: 'Clima', desc: 'Pone o abusa de climas (Lluvia, Sol, etc).' },
            [ROLE_KEYS.SUPPORTIVE.TERRAIN]: { label: 'Campo', desc: 'Pone Campo Eléctrico, Hierba, Psíquico o Niebla.' },
            [ROLE_KEYS.SUPPORTIVE.WIDE_GUARD]: { label: 'Vastaguardia', desc: 'Protege al equipo de movimientos en área.' },
            [ROLE_KEYS.SUPPORTIVE.DISRUPTOR]: { label: 'Disruptor', desc: 'Usa estados o movimientos para frenar al rival.' },
            [ROLE_KEYS.SUPPORTIVE.SCREENER]: { label: 'Pantallas', desc: 'Reduce daño con Reflejo, Pantalla Luz o Velo Aurora.' },
            [ROLE_KEYS.SUPPORTIVE.CLERIC]: { label: 'Curador', desc: 'Cura vida o estados alterados de los compañeros.' },
            [ROLE_KEYS.DEFENSIVE.WALL_PHYSICAL]: { label: 'Muralla Física', desc: 'Tanquea golpes físicos extremadamente bien.' },
            [ROLE_KEYS.DEFENSIVE.WALL_SPECIAL]: { label: 'Muralla Esp.', desc: 'Tanquea golpes especiales extremadamente bien.' },
            [ROLE_KEYS.DEFENSIVE.PIVOT]: { label: 'Pivote', desc: 'Entra y sale del campo para mantener la posición.' },
            [ROLE_KEYS.DEFENSIVE.STALLER]: { label: 'Staller', desc: 'Gana por desgaste usando daño pasivo y alta durabilidad.' },
        }
    }
};

interface SpeedData {
    tier: string;
    percentile: number;
    baseSpeed: number;
    context: { en: string; es: string };
}

interface Props {
    pokemon: IPokemon;
    usageRate: string;
    topMoves: { name: string; value: number }[];
    topAbilities: { name: string; value: number }[];
    topItems: {name: string, value: number}[];
    spreads: { evs: Record<string, number>; nature: string }[];
    speedData?: SpeedData; // NUEVA PROP OPCIONAL (Mientras migra todo)
    lang: Lang;
}

export default function CompetitiveHeader({ pokemon, usageRate, topMoves, topAbilities, topItems, spreads, speedData, lang }: Props) {
    const t = COMPETITIVE_TRANSLATIONS[lang] || COMPETITIVE_TRANSLATIONS.en;
    const [tooltipData, setTooltipData] = useState<{ x: number, y: number, text: string } | null>(null);

    const usageNum = parseFloat(usageRate);
    const silphRank = calculateSilphRank(usageNum);
    
    // Roles Calculation (Local Logic preserved)
    const roles = determineRoles(pokemon, topMoves, topAbilities, topItems, spreads);

    // Speed Tier Display (Data-Driven from API)
    // Si no viene speedData (ej: fallback), usamos valores por defecto
    const tierDisplay = speedData?.tier || 'N/A';
    const isTrickRoom = tierDisplay === 'F';
    const tierTooltip = speedData?.context?.[lang] || (lang === 'es' ? 'Datos de velocidad no disponibles' : 'No speed data available');

    const handleMouseEnter = (e: React.MouseEvent, text: string) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setTooltipData({
            x: rect.left + (rect.width / 2),
            y: rect.bottom + 8, 
            text
        });
    };

    const handleMouseLeave = () => setTooltipData(null);

    return (
        <>
            <div className="relative bg-slate-950 border-b border-slate-800 p-4 flex flex-wrap gap-4 items-center justify-between z-40">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent pointer-events-none" />

                {/* 1. RANK BADGE */}
                <div 
                    className="group relative flex items-center gap-3 cursor-help"
                    onMouseEnter={(e) => handleMouseEnter(e, t.rankTooltip)}
                    onMouseLeave={handleMouseLeave}
                >
                    <div className={cn("w-12 h-12 flex items-center justify-center rounded-lg border-2 shadow-lg backdrop-blur-sm transition-transform group-hover:scale-105 bg-slate-900 border-slate-700")}>
                        <span className={cn("text-3xl font-black font-display", silphRank.color)}>{silphRank.rank}</span>
                    </div>
                    
                    <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                            SILPH RANK <Info size={10} className="text-slate-600" />
                        </span>
                        <span className="text-[9px] text-slate-600 font-mono">Format Analysis</span>
                    </div>
                </div>

                {/* 2. ROLES */}
                <div className="flex-1 flex flex-col items-center justify-center gap-1.5 min-w-[200px]">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">{t.bestFit}</span>
                    <div className="flex flex-wrap justify-center gap-2">
                        {roles.length > 0 ? roles.map(roleKey => {
                            // @ts-ignore
                            const roleData = t.roles[roleKey] || { label: roleKey, desc: '' };
                            
                            return (
                                <span 
                                    key={roleKey} 
                                    className="px-2 py-1 rounded bg-slate-900/50 border border-slate-800 text-[10px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 shadow-sm hover:border-cyan-500/30 cursor-help transition-colors"
                                    onMouseEnter={(e) => handleMouseEnter(e, roleData.desc)}
                                    onMouseLeave={handleMouseLeave}
                                >
                                    {roleKey.includes('sweeper') || roleKey.includes('attacker') || roleKey.includes('priority') ? <Swords size={10} className="text-red-400"/> : 
                                     roleKey.includes('wall') || roleKey.includes('guard') || roleKey.includes('screener') ? <Shield size={10} className="text-blue-400"/> :
                                     <Zap size={10} className="text-yellow-400"/>}
                                    {roleData.label}
                                </span>
                            );
                        }) : (
                            <span className="text-[10px] text-slate-600 italic">{t.noRoles}</span>
                        )}
                    </div>
                </div>

                {/* 3. SPEED TIER (DINÁMICO CON TOOLTIP) */}
                <div className="flex flex-col items-end gap-0.5">
                    <span 
                        className="text-[9px] font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1.5 cursor-help hover:text-cyan-400 transition-colors"
                        onMouseEnter={(e) => handleMouseEnter(e, tierTooltip)}
                        onMouseLeave={handleMouseLeave}
                    >
                        Speed Tier <Timer size={10} />
                    </span>
                    <div className="flex items-center gap-2">
                        {isTrickRoom && (
                            <span className="text-[8px] font-bold text-slate-500 bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded uppercase tracking-wider">
                                TR
                            </span>
                        )}
                        <span className="text-xl font-black text-cyan-100 font-display">{tierDisplay}</span>
                    </div>
                </div>
            </div>

            {/* FIXED TOOLTIP PORTAL */}
            {tooltipData && (
                <div 
                    className="fixed z-[9999] bg-slate-800 text-slate-200 text-[10px] px-3 py-2 rounded shadow-2xl border border-slate-600 max-w-[220px] text-center pointer-events-none animate-in fade-in zoom-in-95 duration-150"
                    style={{ 
                        top: tooltipData.y, 
                        left: tooltipData.x,
                        transform: 'translateX(-50%)'
                    }}
                >
                    {tooltipData.text}
                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-800 border-t border-l border-slate-600 rotate-45" />
                </div>
            )}
        </>
    );
}