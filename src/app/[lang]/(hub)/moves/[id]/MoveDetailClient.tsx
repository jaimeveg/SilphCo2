'use client';

import { useState, useEffect } from 'react';
import { IMoveDetail, ILearnerRecord } from '@/types/movedex';
import TypeBadge from '@/components/ui/TypeBadge';
import { Swords, Sparkles, Shield, Flame, Activity, Target, Zap, AlertTriangle, ArrowLeft, TrendingUp, TrendingDown, User, Crosshair } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useNationalDexLookup } from '@/services/pokeapi';
import { useRouter } from 'next/navigation';
import { Lang } from '@/lib/pokedexDictionary';

interface Props {
    move: IMoveDetail;
    lang: Lang;
}

export default function MoveDetailClient({ move, lang }: Props) {
    const router = useRouter();
    const { data: dexMap } = useNationalDexLookup();
    const [aliasMap, setAliasMap] = useState<Record<string, number> | null>(null);
    
    const availableGens = Object.keys(move?.learners_by_gen || {}).sort((a, b) => parseInt(b) - parseInt(a));
    const [activeGen, setActiveGen] = useState<string>(availableGens[0] || "9");

    useEffect(() => {
        fetch('/data/alias_map.json').then(res => res.json()).then(data => setAliasMap(data)).catch(() => {});
    }, []);

    if (!move) return null;

    const learners = move.learners_by_gen?.[activeGen] || [];
    const learnersByMethod = learners.reduce((acc, curr) => {
        if (!acc[curr.method]) acc[curr.method] = [];
        acc[curr.method].push(curr);
        return acc;
    }, {} as Record<string, ILearnerRecord[]>);

    const formatName = (slug: string) => slug.split('-').join(' ').toUpperCase();
    const hasMechanics = move.tactics.flinch_chance > 0 || move.tactics.stat_chance > 0 || move.tactics.ailment_chance > 0 || move.tactics.stat_changes.length > 0;

    // SEPARAR BUFFS Y DROPS
    const statBuffs = move.tactics.stat_changes.filter(sc => sc.change > 0);
    const statDrops = move.tactics.stat_changes.filter(sc => sc.change < 0);

    // FUNCIÓN HEURÍSTICA PARA IDENTIFICAR AL OBJETIVO DEL DROP/BUFF
    const getStatTarget = (change: number, power: number | null, targetName: string, statChance: number) => {
        // Por norma general, los Buffs (+) siempre afectan al usuario (Danza Espada, Ancient Power)
        if (change > 0) return { id: 'USER', label: lang === 'es' ? 'Usuario' : 'User', icon: <User size={10} className="text-emerald-400" /> };
        
        // Si es un Drop (-) y el ataque hace daño (poder > 0) pero el stat_chance es 0 (efecto garantizado)
        // Suele ser un ataque de retroceso o desgaste del usuario (Ej: A Bocajarro, Sofoco, Lluevehojas)
        if (change < 0 && power && power > 0 && statChance === 0) {
            return { id: 'USER', label: lang === 'es' ? 'Usuario' : 'User', icon: <User size={10} className="text-red-400" /> };
        }
        
        // Si el objetivo original del movimiento es explícitamente el usuario (Ej: Maldición)
        if (targetName === 'user') return { id: 'USER', label: lang === 'es' ? 'Usuario' : 'User', icon: <User size={10} className="text-red-400" /> };

        // Por defecto, cualquier otro drop (-) se aplica al rival (Ej: Bola Sombra, Chirrido, Viento Hielo)
        return { id: 'TARGET', label: lang === 'es' ? 'Objetivo' : 'Target', icon: <Crosshair size={10} className="text-red-400" /> };
    };

    const getPokemonName = (id: string | number) => {
        const numId = Number(id);
        if (dexMap) {
            const found = Object.entries(dexMap).find(([_, dexId]) => dexId === numId);
            if (found) return found[0].replace(/-/g, ' ').toUpperCase();
        }
        if (aliasMap) {
            const found = Object.entries(aliasMap).find(([_, aliasId]) => aliasId === numId);
            if (found) return found[0].replace(/-/g, ' ').toUpperCase();
        }
        return `ID #${id}`;
    };

    const getCategoryText = (cat: string) => {
        if (cat === 'physical') return lang === 'es' ? 'FÍSICO' : 'PHYSICAL';
        if (cat === 'special') return lang === 'es' ? 'ESPECIAL' : 'SPECIAL';
        return lang === 'es' ? 'ESTADO' : 'STATUS';
    };

    return (
        <div className="max-w-6xl mx-auto p-3 md:p-6 space-y-4 animate-in fade-in zoom-in-95 duration-300">
            
            <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-400 hover:text-cyan-400 text-xs font-mono uppercase tracking-widest transition-colors w-fit group mb-2">
                <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                {lang === 'es' ? 'VOLVER' : 'BACK'}
            </button>

            <div className="bg-slate-900/80 backdrop-blur-md border border-slate-700/50 rounded-2xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.5)] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-[100px] pointer-events-none -translate-y-1/2 translate-x-1/4" />
                
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10 border-b border-slate-800 pb-4 mb-4">
                    <div className="flex flex-col gap-1.5">
                        <h1 className="text-3xl md:text-5xl font-black font-display text-white tracking-tighter uppercase">
                            {formatName(move.name)}
                        </h1>
                        <div className="flex flex-wrap items-center gap-2">
                            <TypeBadge type={move.type} lang={lang} />
                            
                            <span className="bg-slate-950 border border-slate-700 text-slate-300 px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase flex items-center gap-1.5">
                                {move.category === 'physical' ? <Swords size={10} className="text-orange-400"/> : 
                                 move.category === 'special' ? <Sparkles size={10} className="text-cyan-400"/> : 
                                 <Shield size={10} className="text-slate-400"/>}
                                {getCategoryText(move.category)}
                            </span>
                            
                            <span className="text-slate-500 text-[10px] font-mono font-bold tracking-widest bg-slate-950 border border-slate-800 px-2 py-0.5 rounded">
                                GEN {move.generation_introduced}
                            </span>
                            
                            {move.is_sheer_force_boosted && (
                                <span className="bg-slate-950 border border-slate-800 text-slate-400 px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-widest flex items-center gap-1.5">
                                    <Flame size={10} className="text-red-500/70" /> SHEER FORCE
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="flex bg-slate-950 border border-slate-700 rounded-xl overflow-hidden shadow-inner w-full md:w-auto mt-2 md:mt-0">
                        <div className="flex flex-col items-center px-4 py-2 hover:bg-slate-900 transition-colors">
                            <span className="text-[9px] text-cyan-500 font-mono font-bold tracking-widest mb-0.5">PRI</span>
                            <span className={cn("text-xl font-black font-display leading-none", move.priority > 0 ? "text-emerald-400" : move.priority < 0 ? "text-red-400" : "text-white")}>
                                {move.priority > 0 ? `+${move.priority}` : move.priority}
                            </span>
                        </div>
                        <div className="w-px bg-slate-800" />
                        <div className="flex flex-col items-center px-4 py-2 hover:bg-slate-900 transition-colors">
                            <span className="text-[9px] text-cyan-500 font-mono font-bold tracking-widest mb-0.5">PWR</span>
                            <span className="text-xl font-black text-white font-display leading-none">{move.power || '-'}</span>
                        </div>
                        <div className="w-px bg-slate-800" />
                        <div className="flex flex-col items-center px-4 py-2 hover:bg-slate-900 transition-colors">
                            <span className="text-[9px] text-cyan-500 font-mono font-bold tracking-widest mb-0.5">ACC</span>
                            <span className="text-xl font-black text-white font-display leading-none">{move.accuracy ? `${move.accuracy}%` : '-'}</span>
                        </div>
                        <div className="w-px bg-slate-800" />
                        <div className="flex flex-col items-center px-4 py-2 hover:bg-slate-900 transition-colors">
                            <span className="text-[9px] text-cyan-500 font-mono font-bold tracking-widest mb-0.5">PP</span>
                            <span className="text-xl font-black text-white font-display leading-none">{move.pp}</span>
                        </div>
                    </div>
                </div>

                <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="lg:col-span-2 space-y-3">
                        {move.flavorText && (
                            <div className="border-l-2 border-cyan-500 pl-3">
                                <p className="text-slate-400 font-mono text-[11px] leading-relaxed uppercase tracking-wide">"{move.flavorText}"</p>
                            </div>
                        )}
                        <p className="text-slate-200 text-sm leading-relaxed bg-slate-950/50 p-3 rounded-lg border border-slate-800/50">
                            {move.effectText}
                        </p>
                    </div>

                    {hasMechanics && (
                        <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-3 space-y-2">
                            <h3 className="text-[9px] font-black text-cyan-500 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-800 pb-1">
                                <Target size={10} /> TACTICAL PROBABILITIES
                            </h3>
                            <div className="space-y-1.5">
                                {move.tactics.flinch_chance > 0 && (
                                    <div className="flex justify-between items-center text-xs font-mono bg-slate-900 px-2 py-1.5 rounded">
                                        <span className="text-slate-400 flex items-center gap-1.5"><Zap size={10} className="text-yellow-500"/> Flinch</span>
                                        <span className="text-white font-bold">{move.tactics.flinch_chance}%</span>
                                    </div>
                                )}
                                {move.tactics.ailment_chance > 0 && move.tactics.ailment !== 'none' && (
                                    <div className="flex justify-between items-center text-xs font-mono bg-slate-900 px-2 py-1.5 rounded">
                                        <span className="text-slate-400 flex items-center gap-1.5"><AlertTriangle size={10} className="text-purple-500"/> {formatName(move.tactics.ailment)}</span>
                                        <span className="text-white font-bold">{move.tactics.ailment_chance}%</span>
                                    </div>
                                )}
                                
                                {/* BUFFS DETALLADOS CON TARGET */}
                                {statBuffs.length > 0 && (() => {
                                    const targetInfo = getStatTarget(statBuffs[0].change, move.power, move.target, move.tactics.stat_chance);
                                    return (
                                        <div className="flex justify-between items-center text-xs font-mono bg-slate-900 px-2 py-2 rounded">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-slate-400 flex items-center gap-1.5">
                                                    <TrendingUp size={10} className="text-emerald-500"/> Stat Buff 
                                                    <span className="bg-slate-950 border border-emerald-900/50 px-1 py-0.5 rounded text-[8px] flex items-center gap-1">
                                                        {targetInfo.icon} {targetInfo.label}
                                                    </span>
                                                </span>
                                                <span className="text-[9px] text-emerald-400/80">
                                                    {statBuffs.length >= 5 ? `ALL STATS +${statBuffs[0].change}` : statBuffs.map(sc => `+${sc.change} ${formatName(sc.stat)}`).join(', ')}
                                                </span>
                                            </div>
                                            <span className="text-white font-bold">{move.tactics.stat_chance > 0 ? `${move.tactics.stat_chance}%` : '100%'}</span>
                                        </div>
                                    );
                                })()}

                                {/* DROPS DETALLADOS CON TARGET */}
                                {statDrops.length > 0 && (() => {
                                    const targetInfo = getStatTarget(statDrops[0].change, move.power, move.target, move.tactics.stat_chance);
                                    return (
                                        <div className="flex justify-between items-center text-xs font-mono bg-slate-900 px-2 py-2 rounded">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-slate-400 flex items-center gap-1.5">
                                                    <TrendingDown size={10} className="text-red-500"/> Stat Drop
                                                    <span className="bg-slate-950 border border-red-900/50 px-1 py-0.5 rounded text-[8px] flex items-center gap-1">
                                                        {targetInfo.icon} {targetInfo.label}
                                                    </span>
                                                </span>
                                                <span className="text-[9px] text-red-400/80">
                                                    {statDrops.length >= 5 ? `ALL STATS ${statDrops[0].change}` : statDrops.map(sc => `${sc.change} ${formatName(sc.stat)}`).join(', ')}
                                                </span>
                                            </div>
                                            <span className="text-white font-bold">{move.tactics.stat_chance > 0 ? `${move.tactics.stat_chance}%` : '100%'}</span>
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* LEARNER MATRIX */}
            <div className="bg-slate-900/60 backdrop-blur-sm border border-slate-800 rounded-2xl p-5 shadow-xl">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5 border-b border-slate-800/50 pb-4">
                    <h2 className="text-lg font-display font-black text-white flex items-center gap-2 uppercase tracking-wide">
                        <Activity className="text-cyan-500" size={18} /> LEARNER MATRIX
                    </h2>
                    <div className="flex bg-slate-950 border border-slate-700 rounded overflow-hidden shadow-inner">
                        {availableGens.map(gen => (
                            <button 
                                key={gen}
                                onClick={() => setActiveGen(gen)}
                                className={cn(
                                    "px-3 py-1 text-[10px] font-bold font-mono transition-colors",
                                    activeGen === gen ? "bg-cyan-500/20 text-cyan-400" : "text-slate-500 hover:text-slate-300 hover:bg-slate-900"
                                )}
                            >
                                G{gen}
                            </button>
                        ))}
                    </div>
                </div>

                {availableGens.length === 0 ? (
                    <div className="text-center text-slate-600 py-10 font-mono text-xs uppercase tracking-widest">NO LEARNER DATA INDEXED.</div>
                ) : (
                    <div className="space-y-6">
                        {['level-up', 'machine', 'tutor', 'egg'].map(method => {
                            const methodLearners = learnersByMethod[method];
                            if (!methodLearners || methodLearners.length === 0) return null;

                            return (
                                <div key={method} className="space-y-2">
                                    <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                        {lang === 'es' ? 'APRENDIZAJE VÍA ' : 'VIA '}{method.replace('-', ' ')}
                                    </h3>
                                    <div className="flex flex-wrap gap-1.5">
                                        {methodLearners.map((lrn, idx) => {
                                            const realName = getPokemonName(lrn.pokemon_id);
                                            return (
                                                <Link 
                                                    key={`${lrn.pokemon_id}-${idx}`} 
                                                    href={`/${lang}/pokedex/${lrn.pokemon_id}`}
                                                    className="group relative w-12 h-12 bg-slate-950 border border-slate-800 rounded hover:border-cyan-500 transition-colors flex items-center justify-center overflow-hidden cursor-crosshair"
                                                    title={`${realName} ${lrn.level ? `(Lv. ${lrn.level})` : ''}`}
                                                >
                                                    <img 
                                                        src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${lrn.pokemon_id}.png`}
                                                        alt={realName}
                                                        className="w-14 h-14 object-contain opacity-70 group-hover:opacity-100 group-hover:scale-110 transition-all drop-shadow-md pixelated"
                                                        loading="lazy"
                                                    />
                                                    {lrn.level > 0 && (
                                                        <span className="absolute bottom-0 right-0 bg-slate-900 text-[8px] font-mono font-bold text-cyan-400 px-1 border-t border-l border-slate-700 rounded-tl">
                                                            L{lrn.level}
                                                        </span>
                                                    )}
                                                </Link>
                                            )
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}