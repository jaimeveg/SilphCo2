'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { IMoveIndexItem } from '@/types/movedex';
import TypeBadge from '@/components/ui/TypeBadge'; 
import { Lang } from '@/lib/pokedexDictionary';
import { Search, Swords, Sparkles, Shield, Filter, Zap, ChevronDown, Activity, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

const TYPE_LOCALE: Record<string, { en: string, es: string }> = {
    normal: { en: 'Normal', es: 'Normal' }, fire: { en: 'Fire', es: 'Fuego' }, water: { en: 'Water', es: 'Agua' },
    grass: { en: 'Grass', es: 'Planta' }, electric: { en: 'Electric', es: 'Eléctrico' }, ice: { en: 'Ice', es: 'Hielo' },
    fighting: { en: 'Fighting', es: 'Lucha' }, poison: { en: 'Poison', es: 'Veneno' }, ground: { en: 'Ground', es: 'Tierra' },
    flying: { en: 'Flying', es: 'Volador' }, psychic: { en: 'Psychic', es: 'Psíquico' }, bug: { en: 'Bug', es: 'Bicho' },
    rock: { en: 'Rock', es: 'Roca' }, ghost: { en: 'Ghost', es: 'Fantasma' }, dragon: { en: 'Dragon', es: 'Dragón' },
    dark: { en: 'Dark', es: 'Siniestro' }, steel: { en: 'Steel', es: 'Acero' }, fairy: { en: 'Fairy', es: 'Hada' }
};

export default function MoveDexIndex({ params }: { params: { lang: string } }) {
    const lang = params.lang || 'en';
    const [moves, setMoves] = useState<IMoveIndexItem[]>([]);
    
    // ESTADOS DE FILTRO
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [catFilter, setCatFilter] = useState('');
    const [effectFilter, setEffectFilter] = useState('');
    const [statFilter, setStatFilter] = useState(''); // NUEVO: Filtro de Estadísticas

    useEffect(() => {
        fetch('/data/movedex_index.json')
            .then(res => res.json())
            .then(data => setMoves(data))
            .catch(e => console.error("Error loading MoveDex Index", e));
    }, []);

    const clearFilters = () => {
        setSearch(''); setTypeFilter(''); setCatFilter(''); setEffectFilter(''); setStatFilter('');
    };

    const isFiltered = search || typeFilter || catFilter || effectFilter || statFilter;

    const filteredMoves = useMemo(() => {
        return moves.filter(m => {
            const matchSearch = m.name.toLowerCase().includes(search.toLowerCase()) || m.id.includes(search.toLowerCase());
            const matchType = typeFilter ? m.type === typeFilter : true;
            const matchCat = catFilter ? m.category === catFilter : true;
            
            const matchEffect = effectFilter ? (
                (effectFilter === 'priority' && m.flags?.is_priority) ||
                (effectFilter === 'status' && m.flags?.has_status) ||
                (effectFilter === 'buff' && m.flags?.has_buff) ||
                (effectFilter === 'debuff' && m.flags?.has_debuff)
            ) : true;

            const matchStat = statFilter ? m.stats_affected?.includes(statFilter) : true;

            return matchSearch && matchType && matchCat && matchEffect && matchStat;
        });
    }, [moves, search, typeFilter, catFilter, effectFilter, statFilter]);

    const getCategoryIcon = (cat: string) => {
        switch(cat.toLowerCase()) {
            case 'physical': return <Swords size={10} className="text-orange-400" />;
            case 'special': return <Sparkles size={10} className="text-cyan-400" />;
            default: return <Shield size={10} className="text-slate-400" />;
        }
    };

    const formatName = (slug: string) => slug.split('-').join(' ').toUpperCase();
    const allTypes = useMemo(() => Array.from(new Set(moves.map(m => m.type))).sort(), [moves]);

    return (
        <div className="max-w-[1400px] mx-auto p-4 md:p-6 space-y-6 animate-in fade-in zoom-in-95 duration-500">
            
            <div className="bg-slate-900/80 backdrop-blur-md border border-slate-700/50 rounded-2xl p-4 shadow-2xl flex flex-col xl:flex-row justify-between gap-4 items-center relative overflow-hidden">
                <div className="absolute top-0 right-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
                
                <div className="flex items-center gap-4 z-10 w-full xl:w-auto">
                    <div className="w-12 h-12 bg-slate-950 border border-slate-700 flex items-center justify-center rounded-xl shadow-inner shrink-0">
                        <Zap size={24} className="text-cyan-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-display font-black text-white tracking-tighter uppercase">TACTICAL <span className="text-cyan-500">MOVEDEX</span></h1>
                        <p className="text-slate-400 text-[10px] uppercase font-mono tracking-widest">{moves.length} Records Indexed</p>
                    </div>
                </div>
                
                {/* SELECTORES ULTRADENSOS */}
                <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto z-10 flex-wrap xl:flex-nowrap items-center">
                    
                    {/* Botón Clear Filters */}
                    {isFiltered && (
                        <button onClick={clearFilters} className="text-xs font-mono font-bold text-slate-400 hover:text-red-400 flex items-center gap-1.5 transition-colors uppercase w-full sm:w-auto justify-center">
                            <RefreshCw size={12} /> {lang === 'es' ? 'LIMPIAR' : 'CLEAR'}
                        </button>
                    )}

                    <div className="relative group flex-1 w-full sm:min-w-[160px]">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-500/50 group-focus-within:text-cyan-400 transition-colors" />
                        <input 
                            type="text" 
                            placeholder={lang === 'es' ? "BUSCAR..." : "SEARCH..."} 
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-slate-900/80 border border-cyan-900/50 text-cyan-50 pl-9 pr-4 py-2.5 rounded-xl text-xs font-mono font-bold uppercase focus:border-cyan-400 outline-none transition-all placeholder:text-cyan-800 shadow-[inset_0_0_15px_rgba(6,182,212,0.05)]"
                        />
                    </div>
                    
                    <div className="flex gap-2 flex-1 w-full sm:w-auto flex-wrap sm:flex-nowrap">
                        <div className="relative flex-1 group min-w-[110px]">
                            <select 
                                value={typeFilter} 
                                onChange={(e) => setTypeFilter(e.target.value)}
                                className="w-full appearance-none bg-slate-900/80 border border-cyan-900/50 text-cyan-100 pl-3 pr-8 py-2.5 rounded-xl text-xs font-mono font-bold uppercase focus:border-cyan-400 outline-none transition-all cursor-pointer"
                            >
                                <option value="">{lang === 'es' ? 'TIPOS' : 'TYPES'}</option>
                                {allTypes.map(t => ( <option key={t} value={t}>{TYPE_LOCALE[t] ? TYPE_LOCALE[t][lang as 'en'|'es'] : t.toUpperCase()}</option> ))}
                            </select>
                            <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-cyan-600 pointer-events-none" />
                        </div>
                        
                        <div className="relative flex-1 group min-w-[120px]">
                            <select 
                                value={catFilter} 
                                onChange={(e) => setCatFilter(e.target.value)}
                                className="w-full appearance-none bg-slate-900/80 border border-cyan-900/50 text-cyan-100 pl-3 pr-8 py-2.5 rounded-xl text-xs font-mono font-bold uppercase focus:border-cyan-400 outline-none transition-all cursor-pointer"
                            >
                                <option value="">{lang === 'es' ? 'CATEGORÍA' : 'CATEGORY'}</option>
                                <option value="physical">{lang === 'es' ? 'FÍSICO' : 'PHYSICAL'}</option>
                                <option value="special">{lang === 'es' ? 'ESPECIAL' : 'SPECIAL'}</option>
                                <option value="status">{lang === 'es' ? 'ESTADO' : 'STATUS'}</option>
                            </select>
                            <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-cyan-600 pointer-events-none" />
                        </div>

                        <div className="relative flex-1 group min-w-[130px]">
                            <select 
                                value={effectFilter} 
                                onChange={(e) => setEffectFilter(e.target.value)}
                                className="w-full appearance-none bg-slate-900/80 border border-cyan-900/50 text-cyan-100 pl-3 pr-8 py-2.5 rounded-xl text-xs font-mono font-bold uppercase focus:border-cyan-400 outline-none transition-all cursor-pointer"
                            >
                                <option value="">{lang === 'es' ? 'EFECTOS' : 'EFFECTS'}</option>
                                <option value="priority">{lang === 'es' ? 'PRIORIDAD (+)' : 'PRIORITY (+)'}</option>
                                <option value="status">{lang === 'es' ? 'COND. ESTADO' : 'STATUS COND.'}</option>
                                <option value="buff">{lang === 'es' ? 'BOOST (BUFF)' : 'STAT BUFF'}</option>
                                <option value="debuff">{lang === 'es' ? 'DROP (DEBUFF)' : 'STAT DROP'}</option>
                            </select>
                            <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-cyan-600 pointer-events-none" />
                        </div>

                        {/* NUEVO: SELECTOR DE STAT ESPECÍFICA */}
                        {(effectFilter === 'buff' || effectFilter === 'debuff' || !effectFilter) && (
                            <div className="relative flex-1 group min-w-[120px] animate-in fade-in slide-in-from-right-4">
                                <select 
                                    value={statFilter} 
                                    onChange={(e) => setStatFilter(e.target.value)}
                                    className="w-full appearance-none bg-slate-900/80 border border-emerald-900/50 text-emerald-100 pl-3 pr-8 py-2.5 rounded-xl text-xs font-mono font-bold uppercase focus:border-emerald-400 outline-none transition-all cursor-pointer"
                                >
                                    <option value="">{lang === 'es' ? 'CUALQ. STAT' : 'ANY STAT'}</option>
                                    <option value="attack">Attack</option>
                                    <option value="defense">Defense</option>
                                    <option value="special-attack">Sp. Atk</option>
                                    <option value="special-defense">Sp. Def</option>
                                    <option value="speed">Speed</option>
                                    <option value="accuracy">Accuracy</option>
                                    <option value="evasion">Evasion</option>
                                </select>
                                <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-600 pointer-events-none" />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
                {filteredMoves.map(move => (
                    <Link 
                        key={move.id} 
                        href={`/${lang}/moves/${move.id}`} 
                        className="group bg-slate-900/40 backdrop-blur-sm border border-slate-800/80 rounded-lg p-2.5 flex flex-col gap-2 hover:bg-slate-800 hover:border-cyan-500/50 hover:shadow-[0_0_15px_rgba(6,182,212,0.15)] transition-all cursor-pointer relative overflow-hidden"
                    >
                        <div className="flex items-center justify-between z-10 gap-2">
                            <span className="font-display font-bold text-xs text-slate-200 tracking-wide truncate group-hover:text-cyan-400 transition-colors">
                                {formatName(move.name)}
                            </span>
                            <div className="flex items-center justify-center w-5 h-5 bg-slate-950 border border-slate-700 rounded shrink-0" title={move.category}>
                                {getCategoryIcon(move.category)}
                            </div>
                        </div>

                        <div className="flex items-center justify-between z-10">
                            <div className="flex items-center gap-1">
                                <div className="scale-[0.80] origin-left shrink-0">
                                    <TypeBadge type={move.type} lang={lang as Lang} />
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-1.5 bg-slate-950/80 border border-slate-800 px-1.5 py-0.5 rounded text-[10px] font-mono shrink-0">
                                <div className="flex items-baseline gap-1">
                                    <span className="text-[8px] text-slate-500">P</span>
                                    <span className="font-bold text-white">{move.power || '-'}</span>
                                </div>
                                <div className="w-px h-2.5 bg-slate-700" />
                                <div className="flex items-baseline gap-1">
                                    <span className="text-[8px] text-slate-500">A</span>
                                    <span className="font-bold text-slate-300">{move.accuracy || '-'}</span>
                                </div>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
            
            {filteredMoves.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                    <Search size={48} className="opacity-20 mb-4" />
                    <span className="font-mono text-xs uppercase tracking-widest">No moves match your criteria.</span>
                    <button onClick={clearFilters} className="mt-4 text-xs font-bold text-cyan-500 hover:text-cyan-400 underline uppercase tracking-widest">
                        {lang === 'es' ? 'Limpiar Filtros' : 'Clear Filters'}
                    </button>
                </div>
            )}
        </div>
    );
}