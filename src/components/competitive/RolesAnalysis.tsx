'use client';

import { useState } from 'react';
import { IRolesAnalysis } from '@/types/competitive';
import { Shield, Swords, Sparkles, ChevronRight, Zap, Info, X, AlertTriangle } from 'lucide-react';

interface RolesAnalysisProps {
    rolesAnalysis?: IRolesAnalysis;
    source: 'showdown' | 'rk9';
}

const CATEGORY_CONFIG: Record<string, { label: string; color: string; bgColor: string; icon: any }> = {
    OFF: { label: 'OFFENSIVE', color: 'text-red-400', bgColor: 'bg-red-500/20 border-red-500/30', icon: Swords },
    SUP: { label: 'SUPPORT', color: 'text-cyan-400', bgColor: 'bg-cyan-500/20 border-cyan-500/30', icon: Sparkles },
    DEF: { label: 'DEFENSIVE', color: 'text-emerald-400', bgColor: 'bg-emerald-500/20 border-emerald-500/30', icon: Shield },
};

const ROLE_DESCRIPTIONS: Record<string, string> = {
    'Physical Sweeper': 'Attackers dealing primarily physical damage, often with EV/nature investment in Attack and Speed.',
    'Special Sweeper': 'Attackers dealing primarily special damage, often with EV/nature investment in Sp.Atk and Speed.',
    'Trick Room Attacker': 'Slow, powerful attackers designed to sweep under Trick Room (base Speed under 50).',
    'Priority User': 'Pokémon relying on priority moves (Fake Out, Extreme Speed, etc.) to bypass Speed.',
    'Setup Sweeper': 'Attackers using boosting moves (Swords Dance, Nasty Plot, Dragon Dance, etc.) before sweeping.',
    'Wallbreaker': 'Bulky attackers designed to break through defensive cores with raw power.',
    'Mixed Sweeper': 'Offensive Pokémon with balanced ATK and Sp.Atk (both ≥100, within 25pts) running both physical and special attacks.',
    'Redirector': 'Support Pokémon using Follow Me or Rage Powder to redirect attacks from allies.',
    'Speed Control': 'Pokémon providing speed advantage via Tailwind, Icy Wind, or Electroweb.',
    'Trick Room Setter': 'Pokémon dedicated to setting Trick Room for slow team compositions.',
    'Weather Setter': 'Pokémon with weather-inducing abilities (Drought, Drizzle, Sand Stream, Snow Warning).',
    'Terrain Setter': 'Pokémon with terrain-inducing abilities (Electric/Grassy/Misty/Psychic Surge).',
    'Wide Guard': 'Support Pokémon carrying Wide Guard to protect against spread moves.',
    'Cleric / Heal': 'Pokémon providing team healing via Heal Pulse, Life Dew, or status removal.',
    'Disruptor': 'Pokémon disrupting opponents with Fake Out, Thunder Wave, Taunt, Encore, Spore, etc.',
    'Screener': 'Pokémon setting Light Screen, Reflect, or Aurora Veil to reduce team damage.',
    'Physical Wall': 'Defensive Pokémon invested in HP/Defense to absorb physical hits.',
    'Special Wall': 'Defensive Pokémon invested in HP/Sp.Def to absorb special hits.',
    'Staller': 'Pokémon relying on passive damage (Toxic, Leech Seed) and recovery to outlast opponents.',
    'Pivot': 'Pokémon with U-turn, Parting Shot, or Volt Switch + abilities like Intimidate to cycle momentum.',
};

const ROLE_ENTRIES = [
    { cat: 'OFF', label: 'Physical Sweeper' },
    { cat: 'OFF', label: 'Special Sweeper' },
    { cat: 'OFF', label: 'Trick Room Attacker' },
    { cat: 'OFF', label: 'Setup Sweeper' },
    { cat: 'OFF', label: 'Wallbreaker' },
    { cat: 'OFF', label: 'Mixed Sweeper' },
    { cat: 'OFF', label: 'Priority User' },
    { cat: 'SUP', label: 'Redirector' },
    { cat: 'SUP', label: 'Speed Control' },
    { cat: 'SUP', label: 'Trick Room Setter' },
    { cat: 'SUP', label: 'Weather Setter' },
    { cat: 'SUP', label: 'Terrain Setter' },
    { cat: 'SUP', label: 'Wide Guard' },
    { cat: 'SUP', label: 'Disruptor' },
    { cat: 'SUP', label: 'Cleric / Heal' },
    { cat: 'SUP', label: 'Screener' },
    { cat: 'DEF', label: 'Physical Wall' },
    { cat: 'DEF', label: 'Special Wall' },
    { cat: 'DEF', label: 'Staller' },
    { cat: 'DEF', label: 'Pivot' },
];

export default function RolesAnalysis({ rolesAnalysis, source }: RolesAnalysisProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [showInfoModal, setShowInfoModal] = useState(false);

    if (!rolesAnalysis || rolesAnalysis.roles.length === 0) return null;

    const formatValue = (pct: number) => {
        if (source === 'rk9') {
            return `${(pct / 100 * 6).toFixed(1)}/TEAM`;
        }
        return `${pct.toFixed(1)}%`;
    };

    // Group roles by category
    const grouped = { OFF: [] as typeof rolesAnalysis.roles, SUP: [] as typeof rolesAnalysis.roles, DEF: [] as typeof rolesAnalysis.roles };
    rolesAnalysis.roles.forEach(r => {
        if (grouped[r.category]) grouped[r.category].push(r);
    });

    const maxPct = Math.max(...rolesAnalysis.roles.map(r => r.pct));

    return (
        <>
        <div className="flex flex-col gap-2">
            {/* COLLAPSIBLE BANNER */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between bg-slate-900/60 border border-slate-800 rounded-lg px-3 py-2 hover:bg-slate-900 transition-colors group"
            >
                <div className="flex items-center gap-3">
                    <div className="flex -space-x-0.5">
                        <Swords size={11} className="text-red-400/70" />
                        <Shield size={11} className="text-emerald-400/70" />
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Meta Roles Analysis</span>
                </div>
                <ChevronRight size={12} className={`text-slate-600 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
            </button>

            {/* EXPANDED CONTENT */}
            {isExpanded && (
                <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 h-fit flex flex-col gap-4 text-white animate-in fade-in slide-in-from-top-2">
                    
                    {/* Header + Info button */}
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <h3 className="text-[10px] font-mono text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                            <Zap size={10} className="text-cyan-500" /> META ROLES ANALYSIS
                        </h3>
                        <button
                            onClick={(e) => { e.stopPropagation(); setShowInfoModal(true); }}
                            className="p-1 rounded-full hover:bg-slate-800 transition-colors text-slate-600 hover:text-cyan-400"
                            title="Role definitions"
                        >
                            <Info size={12} />
                        </button>
                    </div>

                    {/* Tournament disclaimer */}
                    {source === 'rk9' && (
                        <div className="flex items-start gap-1.5 text-[8px] font-mono text-amber-500/70 bg-amber-500/5 border border-amber-500/10 rounded-md px-2 py-1.5">
                            <AlertTriangle size={9} className="mt-0.5 shrink-0" />
                            <span>EV/Nature data unavailable for tournaments — role accuracy may be reduced vs Showdown analysis.</span>
                        </div>
                    )}

                    {/* PHYSICAL vs MIXED vs SPECIAL SPLIT BAR */}
                    <div className="flex flex-col gap-1.5">
                        <div className="flex justify-between text-[9px] font-mono uppercase tracking-wider">
                            <span className="text-red-400 flex items-center gap-1">
                                <Swords size={9} /> Physical {rolesAnalysis.physical_pct.toFixed(0)}%
                            </span>
                            {(rolesAnalysis.mixed_pct ?? 0) > 0 && (
                                <span className="text-purple-400 text-[8px]">
                                    Mixed {rolesAnalysis.mixed_pct.toFixed(0)}%
                                </span>
                            )}
                            <span className="text-blue-400 flex items-center gap-1">
                                Special {rolesAnalysis.special_pct.toFixed(0)}% <Sparkles size={9} />
                            </span>
                        </div>
                        <div className="h-3 rounded-full overflow-hidden flex bg-slate-950 border border-slate-800">
                            {/* Physical segment */}
                            <div
                                className="bg-gradient-to-r from-red-600/80 to-red-500/60 transition-all duration-500 relative"
                                style={{ width: `${rolesAnalysis.physical_pct}%` }}
                            >
                                <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent" />
                            </div>
                            {/* Mixed segment */}
                            {(rolesAnalysis.mixed_pct ?? 0) > 0 && (
                                <div
                                    className="bg-gradient-to-r from-red-500/50 via-purple-500/60 to-blue-500/50 transition-all duration-500 relative"
                                    style={{ width: `${rolesAnalysis.mixed_pct}%` }}
                                >
                                    <div className="absolute inset-0 bg-gradient-to-b from-white/15 to-transparent" />
                                </div>
                            )}
                            {/* Special segment */}
                            <div
                                className="bg-gradient-to-r from-blue-500/60 to-blue-600/80 transition-all duration-500 relative flex-1"
                            >
                                <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent" />
                            </div>
                        </div>
                    </div>

                    {/* ROLE DISTRIBUTION GRID — grouped by category */}
                    {(['OFF', 'SUP', 'DEF'] as const).map(cat => {
                        const roles = grouped[cat];
                        if (roles.length === 0) return null;
                        const cfg = CATEGORY_CONFIG[cat];
                        const CatIcon = cfg.icon;
                        return (
                            <div key={cat} className="flex flex-col gap-1.5">
                                <div className="flex items-center gap-1.5">
                                    <CatIcon size={9} className={cfg.color} />
                                    <span className={`text-[8px] font-mono uppercase tracking-widest ${cfg.color}`}>
                                        {cfg.label}
                                    </span>
                                </div>
                                {roles.map(r => (
                                    <div key={r.role} className="flex items-center gap-2 group">
                                        <div className="w-24 text-[9px] font-mono text-slate-400 truncate shrink-0 group-hover:text-slate-200 transition-colors">
                                            {r.label}
                                        </div>
                                        <div className="flex-1 h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800/60 relative">
                                            <div
                                                className={`h-full rounded-full transition-all duration-500 ${
                                                    cat === 'OFF' ? 'bg-gradient-to-r from-red-600/70 to-red-400/50' :
                                                    cat === 'SUP' ? 'bg-gradient-to-r from-cyan-600/70 to-cyan-400/50' :
                                                    'bg-gradient-to-r from-emerald-600/70 to-emerald-400/50'
                                                }`}
                                                style={{ width: `${maxPct > 0 ? (r.pct / maxPct) * 100 : 0}%` }}
                                            />
                                        </div>
                                        <div className={`text-[9px] font-mono font-semibold w-14 text-right shrink-0 ${cfg.color}`}>
                                            {formatValue(r.pct)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>

        {/* INFO MODAL */}
        {showInfoModal && (
            <div 
                className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm"
                onClick={() => setShowInfoModal(false)}
                data-lenis-prevent="true"
            >
                <div 
                    className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-lg max-h-[80vh] overflow-y-auto shadow-2xl"
                    onClick={e => e.stopPropagation()}
                    data-lenis-prevent="true"
                    style={{ scrollbarWidth: 'thin', scrollbarColor: '#334155 transparent' }}
                >
                    <div className="flex items-center justify-between p-4 border-b border-slate-800 sticky top-0 bg-slate-900 z-10">
                        <h3 className="text-xs font-mono text-cyan-400 uppercase tracking-widest flex items-center gap-1.5">
                            <Info size={12} /> Role Definitions
                        </h3>
                        <button onClick={() => setShowInfoModal(false)} className="p-1 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white">
                            <X size={14} />
                        </button>
                    </div>
                    <div className="p-4">
                        {/* TABLE FORMAT */}
                        {(['OFF', 'SUP', 'DEF'] as const).map(cat => {
                            const cfg = CATEGORY_CONFIG[cat];
                            const CatIcon = cfg.icon;
                            const catRoles = ROLE_ENTRIES.filter(e => e.cat === cat);
                            return (
                                <div key={cat} className="mb-4">
                                    <div className={`flex items-center gap-1.5 mb-2 ${cfg.color}`}>
                                        <CatIcon size={11} />
                                        <span className="text-[9px] font-mono uppercase tracking-widest font-bold">{cfg.label}</span>
                                    </div>
                                    <table className="w-full text-left">
                                        <tbody>
                                            {catRoles.map(({ label }) => (
                                                <tr key={label} className="border-b border-slate-800/40 last:border-b-0">
                                                    <td className="py-1.5 pr-3 text-[10px] font-mono text-slate-200 font-medium whitespace-nowrap align-top w-28">
                                                        {label}
                                                    </td>
                                                    <td className="py-1.5 text-[9px] text-slate-500 leading-relaxed">
                                                        {ROLE_DESCRIPTIONS[label] || '—'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            );
                        })}
                        {/* Disclaimer */}
                        <div className="text-[9px] font-mono text-slate-400 border-t border-slate-700 pt-3 mt-2 bg-slate-800/30 -mx-4 px-4 -mb-4 pb-4 rounded-b-xl">
                            Roles are computed from moves, abilities, items, and EV spreads using Silph Co.&apos;s competitive analysis engine.
                            Each Pokémon gets up to 3 roles, weighted by format usage rate.
                        </div>
                    </div>
                </div>
            </div>
        )}
        </>
    );
}
