'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { fetchSmogonData, fetchFormatsIndex, SmogonIndexResponse } from '@/services/smogonService';
import { useNationalDexLookup } from '@/services/pokeapi';
import { resolvePokemonId } from '@/lib/utils/competitive-mapping';
import { IPokemon } from '@/types/interfaces';
import { Lang } from '@/lib/pokedexDictionary';
import UsageBar from '@/components/ui/UsageBar';
import { BarChart3, Users, Shield, Sword, AlertTriangle, RefreshCw, Zap, Trophy, ChevronDown, Activity, Skull, Diamond } from 'lucide-react';
import { cn } from '@/lib/utils';

// --- INTERFACES ---
export interface CompetitiveResponse {
  meta: { pokemon: string; format: string; gen: number };
  general: { usage: string; rawCount: number };
  stats: {
    moves: Array<{ name: string; value: number; displayValue?: string; slug: string }>;
    items: Array<{ name: string; value: number; displayValue?: string; slug: string }>;
    abilities: Array<{ name: string; value: number; displayValue?: string; slug: string }>;
    teammates: Array<{ name: string; value: number; displayValue?: string; slug: string }>;
    natureSpread: Array<{ nature: string; usage: number | string; evs: Record<string, number> }>;
    teras?: Array<{ name: string; value: number; displayValue?: string }>; 
  };
  matchups: {
    counters: Array<{ name: string; score: string; slug: string }>;
  };
}

// --- HELPERS VISUALES Y NORMALIZADORES ---
const StatBlock = ({ label, value, max = 252, color }: { label: string, value: number, max?: number, color: string }) => (
    <div className="flex-1 flex flex-col gap-0.5 items-center group">
        <div className={`h-10 w-2.5 rounded-[1px] bg-slate-900/80 relative overflow-hidden flex flex-col justify-end border border-slate-800`}>
            <div className={cn("w-full transition-all opacity-80 group-hover:opacity-100", color)} style={{ height: `${Math.min((value / max) * 100, 100)}%` }} />
        </div>
        <span className="text-[6px] text-slate-500 font-mono uppercase">{label}</span>
    </div>
);

const normalizeGen = (gen: string | number | undefined): number => {
    if (!gen) return 1; 
    if (typeof gen === 'number') return gen;
    const roman = String(gen).toUpperCase(); 
    const romans: Record<string, number> = { 'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5, 'VI': 6, 'VII': 7, 'VIII': 8, 'IX': 9, 'X': 10, 'XI': 11, 'XII': 12, 'XIII': 13, 'XIV': 14, 'XV': 15 };
    return romans[roman] || 9; 
};

const fmtPct = (val: number | string | undefined): string => {
    if (val === undefined) return "0.00";
    if (typeof val === 'string') return val.includes('.') ? val : `${val}.00`;
    return typeof val === 'number' ? val.toFixed(2) : val;
};

// --- COMPONENTE PRINCIPAL ---
interface Props {
    pokemon: IPokemon;
    lang: Lang;
}

export default function CompetitiveDashboard({ pokemon, lang }: Props) {
    const { data: indexData, isLoading: isLoadingTree } = useQuery<SmogonIndexResponse | null>({
        queryKey: ['smogonChaosIndex'],
        queryFn: fetchFormatsIndex,
        staleTime: 1000 * 60 * 60 * 12 
    });

    const { data: dexMap } = useNationalDexLookup(); 

    const [gen, setGen] = useState<string>('');
    const [mode, setMode] = useState<string>('');
    const [format, setFormat] = useState<string>('');
    const [reg, setReg] = useState<string>('');
    const [fileId, setFileId] = useState<string>(''); 

    // --- CASCADAS ---
    const validGens = useMemo(() => {
        if (!indexData?.structure) return [];
        const pkmGen = normalizeGen(pokemon.generation);
        return Object.keys(indexData.structure)
            .filter(g => parseInt(g.replace('gen', '')) >= pkmGen)
            .sort((a, b) => parseInt(b.replace('gen', '')) - parseInt(a.replace('gen', '')));
    }, [indexData, pokemon.generation]);

    useEffect(() => {
        if (validGens.length > 0 && (!gen || !validGens.includes(gen))) setGen(validGens[0]);
    }, [validGens, gen]);

    useEffect(() => {
        if (!indexData || !gen) return;
        const modes = indexData.structure[gen];
        if (modes && (!mode || !modes[mode])) {
            const keys = Object.keys(modes);
            setMode(keys.includes('doubles') ? 'doubles' : (keys.includes('singles') ? 'singles' : keys[0]));
        }
    }, [gen, indexData, mode]);

    useEffect(() => {
        if (!indexData || !gen || !mode) return;
        const formats = indexData.structure[gen]?.[mode];
        if (formats) {
            const formatKeys = Object.keys(formats);
            if (!format || !formats[format]) {
                const defaultFmt = formatKeys.find(k => k.includes(mode === 'singles' ? 'OU' : 'VGC')) || formatKeys[0];
                setFormat(defaultFmt);
            }
        }
    }, [mode, gen, indexData, format]);

    useEffect(() => {
        if (!indexData || !gen || !mode || !format) return;
        const regs = indexData.structure[gen]?.[mode]?.[format]?.regs;
        if (regs) {
            const regKeys = Object.keys(regs);
            if (!reg || !regs[reg]) setReg(regKeys.includes('-') ? '-' : regKeys[regKeys.length - 1]);
        }
    }, [format, mode, gen, indexData, reg]);

    useEffect(() => {
        if (!indexData || !gen || !mode || !format || !reg) return;
        const eloOptions = indexData.structure[gen]?.[mode]?.[format]?.regs?.[reg];
        if (eloOptions && eloOptions.length > 0) {
            const currentIsValid = eloOptions.some(opt => opt.fileId === fileId);
            if (!currentIsValid || !fileId) {
                // @ts-ignore
                const highElo = eloOptions.find(opt => parseInt(opt.elo) >= 1500);
                setFileId(highElo ? highElo.fileId : eloOptions[0].fileId);
            }
        }
    }, [reg, format, mode, gen, indexData, fileId]);

    const { data, isLoading } = useQuery<CompetitiveResponse | null>({
        queryKey: ['competitiveChaos', pokemon.name, indexData?.date, fileId],
        queryFn: () => fetchSmogonData(pokemon.name, indexData!.date, fileId),
        enabled: !!fileId && !!indexData?.date,
        staleTime: 1000 * 60 * 5,
        retry: false
    });

    // --- HELPER RESOLVER (Teammates & Counters) ---
    const resolveMate = (slug: string) => {
        let cleanSlug = slug.toLowerCase().replace(/['’\.]/g, '').replace(/[:]/g, '').replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        if (cleanSlug.includes('♂')) cleanSlug = cleanSlug.replace('♂', '-m');
        if (cleanSlug.includes('♀')) cleanSlug = cleanSlug.replace('♀', '-f');

        let id: number | null = null;
        if (dexMap) id = resolvePokemonId(cleanSlug, dexMap);

        if (id) {
            return {
                id,
                href: `/${lang}/pokedex/${id}`,
                img: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/${id}.png`
            };
        } else {
            return {
                id: null,
                href: `/${lang}/pokedex/${cleanSlug}`,
                img: `https://img.pokemondb.net/sprites/home/normal/${cleanSlug}.png`
            };
        }
    };

    const availableModes = indexData?.structure[gen] ? Object.keys(indexData.structure[gen]) : [];
    const availableFormats = indexData?.structure[gen]?.[mode] ? Object.keys(indexData.structure[gen][mode]) : [];
    const availableRegs = indexData?.structure[gen]?.[mode]?.[format]?.regs ? Object.keys(indexData.structure[gen][mode][format].regs) : [];
    const availableElos = indexData?.structure[gen]?.[mode]?.[format]?.regs?.[reg] || [];
    const formatEloLabel = (elo: string) => elo === '0' ? 'All (0+)' : `${elo}+`;

    // CONDICIÓN TERA: Solo si es Gen 9 Y hay datos
    const showTeras = gen.includes('9') && data?.stats.teras && data.stats.teras.length > 0;

    if (isLoadingTree || !indexData) return <div className="h-64 flex flex-col items-center justify-center text-slate-500"><Activity className="animate-spin text-cyan-500 mb-2" /><span className="text-xs font-mono">LOADING DATA...</span></div>;

    return (
        <div className="h-full flex flex-col bg-slate-950/50 rounded-xl border border-slate-800 overflow-hidden">
            
            {/* HEADER (Selectores igual que antes) */}
            <div className="flex flex-col gap-2 p-3 border-b border-slate-800 bg-slate-900/90 z-10 shadow-md">
                <div className="flex justify-between items-center mb-1">
                    <h3 className="text-[10px] font-display font-black text-cyan-500 uppercase tracking-widest flex items-center gap-2">
                        <Trophy size={12} className="text-yellow-500" />
                        CHAOS ANALYTICS <span className="text-slate-600 text-[8px]">v{indexData.date}</span>
                    </h3>
                    {data && (
                        <div className="text-right bg-slate-950/50 px-2 py-0.5 rounded border border-slate-800">
                            <span className="text-[8px] font-mono text-slate-400 mr-2">USAGE</span>
                            <span className="text-xs font-bold text-white">{data.general.usage}%</span>
                        </div>
                    )}
                </div>
                {/* ... (Bloque de Selectores Mantener Igual) ... */}
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                    <div className="relative group min-w-[70px]">
                        <select value={gen} onChange={(e) => setGen(e.target.value)} className="w-full appearance-none bg-slate-950 border border-slate-700 text-slate-300 text-[9px] font-bold uppercase py-1.5 pl-2 pr-4 rounded hover:border-cyan-500/50 focus:border-cyan-500 transition-colors">
                            {validGens.map(g => <option key={g} value={g}>{g.toUpperCase()}</option>)}
                        </select>
                        <ChevronDown size={10} className="absolute right-1 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                    </div>
                    <div className="relative group min-w-[65px]">
                         <select value={mode} onChange={(e) => setMode(e.target.value)} disabled={availableModes.length <= 1} className="w-full appearance-none bg-slate-950 border border-slate-700 text-slate-300 text-[9px] font-bold uppercase py-1.5 pl-2 pr-4 rounded hover:border-cyan-500/50 focus:border-cyan-500 transition-colors disabled:opacity-50">
                            {availableModes.map(m => <option key={m} value={m}>{m === 'doubles' ? 'DOU' : 'SING'}</option>)}
                        </select>
                        <ChevronDown size={10} className="absolute right-1 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                    </div>
                    <div className="relative group min-w-[100px] flex-1">
                        <select value={format} onChange={(e) => setFormat(e.target.value)} className="w-full appearance-none bg-slate-950 border border-slate-700 text-cyan-100 text-[9px] font-mono font-bold uppercase py-1.5 pl-2 pr-4 rounded hover:border-cyan-500 focus:border-cyan-500 transition-colors text-ellipsis">
                            {availableFormats.map(f => <option key={f} value={f}>{f}</option>)}
                        </select>
                        <ChevronDown size={10} className="absolute right-1 top-1/2 -translate-y-1/2 text-cyan-500 pointer-events-none" />
                    </div>
                    {reg !== '-' && (
                        <div className="relative group min-w-[70px]">
                            <select value={reg} onChange={(e) => setReg(e.target.value)} className="w-full appearance-none bg-slate-950/50 border border-slate-700 text-slate-400 text-[9px] font-bold uppercase py-1.5 pl-2 pr-4 rounded hover:border-cyan-500/50 focus:border-cyan-500 transition-colors">
                                {availableRegs.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                            <ChevronDown size={10} className="absolute right-1 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                        </div>
                    )}
                    <div className="relative group min-w-[80px]">
                        <select value={fileId} onChange={(e) => setFileId(e.target.value)} className="w-full appearance-none bg-slate-950/50 border border-slate-700 text-yellow-500/80 text-[9px] font-mono font-bold uppercase py-1.5 pl-2 pr-4 rounded hover:border-yellow-500/50 focus:border-yellow-500 transition-colors">
                            {availableElos.map(opt => <option key={opt.fileId} value={opt.fileId}>{formatEloLabel(opt.elo)}</option>)}
                        </select>
                        <ChevronDown size={10} className="absolute right-1 top-1/2 -translate-y-1/2 text-yellow-600 pointer-events-none" />
                    </div>
                </div>
            </div>

            {/* CONTENT */}
            <div className="flex-1 overflow-hidden relative">
                {isLoading && <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/60 z-20 backdrop-blur-[1px]"><RefreshCw className="animate-spin text-cyan-500 mb-2" size={20} /><span className="text-[9px] font-mono text-cyan-400">PROCESSING...</span></div>}

                {!isLoading && !data ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-600 gap-3 p-8 text-center">
                        <AlertTriangle size={24} className="opacity-50 text-yellow-500" />
                        <div>
                            <h3 className="text-xs font-bold text-slate-300 uppercase mb-1">No Usage Data</h3>
                            <p className="text-[9px] font-mono text-slate-500 max-w-[240px] mx-auto">
                                {pokemon.name} hasn't been used in <span className="text-cyan-500">{format}</span> enough to appear in statistics.
                            </p>
                        </div>
                    </div>
                ) : data ? (
                    <div className="h-full flex flex-col md:flex-row overflow-hidden">
                        
                        {/* LEFT: METRICS */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-6">
                            
                            {/* BLOCK 1: Moves & Items */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <h4 className="text-[8px] font-bold text-slate-500 uppercase flex items-center gap-1.5 border-b border-slate-800/50 pb-1"><Sword size={10} /> Key Moves</h4>
                                    <div>{data.stats.moves.slice(0, 8).map((m) => (
                                        <UsageBar key={m.name} label={m.name} value={m.value} subLabel={`${fmtPct(m.displayValue || m.value)}%`} color="bg-cyan-600" />
                                    ))}</div>
                                </div>
                                <div className="space-y-4">
                                    <div className="space-y-1.5">
                                        <h4 className="text-[8px] font-bold text-slate-500 uppercase flex items-center gap-1.5 border-b border-slate-800/50 pb-1"><Shield size={10} /> Key Items</h4>
                                        <div>{data.stats.items.slice(0, 5).map((i) => (
                                            <UsageBar key={i.name} label={i.name} value={i.value} subLabel={`${fmtPct(i.displayValue || i.value)}%`} color="bg-indigo-500" />
                                        ))}</div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <h4 className="text-[8px] font-bold text-slate-500 uppercase flex items-center gap-1.5 border-b border-slate-800/50 pb-1"><Zap size={10} /> Abilities</h4>
                                        <div>{data.stats.abilities.slice(0, 2).map((a) => (
                                            <UsageBar key={a.name} label={a.name} value={a.value} subLabel={`${fmtPct(a.displayValue || a.value)}%`} color="bg-emerald-600" />
                                        ))}</div>
                                    </div>
                                </div>
                            </div>

                            {/* BLOCK 2: TERAS (Solo Gen 9) */}
                            {showTeras && (
                                <div className="space-y-1.5">
                                    <h4 className="text-[8px] font-bold text-slate-500 uppercase flex items-center gap-1.5 border-b border-slate-800/50 pb-1">
                                        <Diamond size={10} /> Tera Types
                                    </h4>
                                    <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                                        {/* @ts-ignore - Validado arriba */}
                                        {data.stats.teras.slice(0, 6).map((t) => (
                                            <UsageBar 
                                                key={t.name} 
                                                label={t.name} 
                                                value={t.value} 
                                                subLabel={`${fmtPct(t.displayValue || t.value)}%`} 
                                                color="bg-pink-600" 
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* BLOCK 3: TEAMMATES */}
                            <div className="space-y-2">
                                <h4 className="text-[8px] font-bold text-slate-500 uppercase flex items-center gap-1.5 border-b border-slate-800/50 pb-1"><Users size={10} /> Teammates</h4>
                                <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2">
                                    {data.stats.teammates.slice(0, 12).map((mate) => {
                                        const resolved = resolveMate(mate.slug);
                                        return (
                                            <Link key={mate.name} href={resolved.href} className="block relative group" title={`${mate.name} (${fmtPct(mate.value)}%)`}>
                                                <div className="relative aspect-square bg-slate-900 border border-slate-800 rounded hover:border-cyan-500/50 transition-all overflow-hidden cursor-pointer">
                                                    <img src={resolved.img} alt={mate.name} className="w-full h-full object-contain p-1 opacity-70 group-hover:opacity-100 transition-opacity drop-shadow-md" loading="lazy" onError={(e) => { const target = e.target as HTMLImageElement; if (target.src.includes('raw.githubusercontent')) { target.src = `https://img.pokemondb.net/sprites/home/normal/${mate.slug}.png`; } else { target.style.display = 'none'; } }} />
                                                    <div className="absolute bottom-0 right-0 bg-slate-950/90 text-[8px] px-1.5 py-0.5 text-cyan-400 font-mono border-tl rounded-tl font-bold">{fmtPct(mate.displayValue || mate.value)}%</div>
                                                </div>
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* BLOCK 4: COUNTERS (CON PORCENTAJE) */}
                            {data.matchups?.counters && data.matchups.counters.length > 0 && (
                                <div className="space-y-2">
                                    <h4 className="text-[8px] font-bold text-slate-500 uppercase flex items-center gap-1.5 border-b border-slate-800/50 pb-1">
                                        <Skull size={10} /> Checks & Counters
                                    </h4>
                                    <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2">
                                        {data.matchups.counters.slice(0, 8).map((counter) => {
                                            const resolved = resolveMate(counter.slug);
                                            return (
                                                <Link key={counter.name} href={resolved.href} className="block relative group" title={`${counter.name} (Win Rate: ${counter.score}%)`}>
                                                    <div className="relative aspect-square bg-slate-900 border border-slate-800 rounded hover:border-red-500/50 transition-all overflow-hidden cursor-pointer">
                                                        <img src={resolved.img} alt={counter.name} className="w-full h-full object-contain p-1 opacity-70 group-hover:opacity-100 transition-opacity drop-shadow-md" loading="lazy" onError={(e) => { const target = e.target as HTMLImageElement; if (target.src.includes('raw.githubusercontent')) { target.src = `https://img.pokemondb.net/sprites/home/normal/${counter.slug}.png`; } else { target.style.display = 'none'; } }} />
                                                        <div className="absolute bottom-0 right-0 bg-slate-950/90 text-[8px] px-1.5 py-0.5 text-red-400 font-mono border-tl rounded-tl font-bold">
                                                            {counter.score}%
                                                        </div>
                                                    </div>
                                                </Link>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* RIGHT: SPREADS */}
                        <div className="w-full md:w-[200px] bg-slate-950 border-l border-slate-800 p-3 overflow-y-auto custom-scrollbar">
                            <h4 className="text-[8px] font-bold text-slate-500 uppercase flex items-center gap-1.5 border-b border-slate-800 pb-2 mb-3"><BarChart3 size={10} /> Spreads</h4>
                            <div className="space-y-2">
                                {data.stats.natureSpread && data.stats.natureSpread.length > 0 ? data.stats.natureSpread.map((spread, idx) => (
                                    <div key={idx} className="bg-slate-900/40 p-2 rounded border border-slate-800/60">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-[9px] font-bold text-yellow-500 truncate max-w-[80px]">{spread.nature}</span>
                                            <span className="text-[8px] font-mono text-slate-400">{fmtPct(spread.usage)}%</span>
                                        </div>
                                        <div className="flex justify-between items-end h-10 gap-0.5">
                                            {Object.entries(spread.evs).map(([stat, val]) => (
                                                <StatBlock key={stat} label={stat.substring(0,1).toUpperCase()} value={val} color={stat === 'spe' ? 'bg-pink-500' : 'bg-slate-600'} />
                                            ))}
                                        </div>
                                    </div>
                                )) : <div className="text-[8px] text-slate-600 text-center py-4 italic">No spreads recorded</div>}
                            </div>
                        </div>
                    </div>
                ) : null}
            </div>
        </div>
    );
}