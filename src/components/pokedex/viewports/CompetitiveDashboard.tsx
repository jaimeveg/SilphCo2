'use client';

import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchSmogonData, fetchFormatsIndex, SmogonIndexResponse, EloOption } from '@/services/smogonService';
import { IPokemon } from '@/types/interfaces';
import { Lang } from '@/lib/pokedexDictionary';
import UsageBar from '@/components/ui/UsageBar';
import { BarChart3, Users, Shield, Sword, AlertTriangle, RefreshCw, Zap, Trophy, ChevronDown, Activity, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';

// --- INTERFACES & UTILS ---
export interface CompetitiveResponse {
  meta: { pokemon: string; format: string; gen: number };
  general: { usage: string; rawCount: number };
  stats: {
    moves: Array<{ name: string; value: number; slug: string }>;
    items: Array<{ name: string; value: number; slug: string }>;
    abilities: Array<{ name: string; value: number; slug: string }>;
    teammates: Array<{ name: string; value: number; slug: string }>;
    natureSpread: Array<{ nature: string; usage: number; evs: Record<string, number> }>;
    teras?: Array<{ name: string; value: number }>;
  };
  matchups: {
    counters: Array<{ name: string; score: number; slug: string }>;
  };
}

const getSpriteUrl = (name: string) => {
    const clean = name.toLowerCase()
        .replace(/['’\.]/g, '')
        .replace(/[:]/g, '')
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');
    return `https://img.pokemondb.net/sprites/home/normal/${clean}.png`;
};

const StatBlock = ({ label, value, max = 252, color }: { label: string, value: number, max?: number, color: string }) => (
    <div className="flex-1 flex flex-col gap-0.5 items-center group">
        <div className={`h-10 w-2.5 rounded-[1px] bg-slate-900/80 relative overflow-hidden flex flex-col justify-end border border-slate-800`}>
            <div 
                className={cn("w-full transition-all opacity-80 group-hover:opacity-100", color)} 
                style={{ height: `${Math.min((value / max) * 100, 100)}%` }} 
            />
        </div>
        <span className="text-[6px] text-slate-500 font-mono uppercase">{label}</span>
    </div>
);

// HELPER LOCAL: Parseo robusto de Generación (Con corrección manual del usuario)
const normalizeGen = (gen: string | number | undefined): number => {
    if (!gen) return 1; 
    if (typeof gen === 'number') return gen;
    
    // Mapeo inverso de Romanos (Output de pokeapi.ts) a Enteros
    const roman = String(gen).toUpperCase(); // Aseguramos string
    const romans: Record<string, number> = { 
        'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5, 
        'VI': 6, 'VII': 7, 'VIII': 8, 'IX': 9, 'X': 10,
        'XI':11, 'XII':12, 'XIII':13, 'XIV':14,
        'XV':15, 'XVI':16, 'XVII':17, 'XVIII':18, 'XIX':19, 'XX':20,
        'XXI':21, 'XXII':22, 'XXIII':23, 'XXIV':24, 'XXV':25 
   };
    return romans[roman] || 9; 
};

interface Props {
    pokemon: IPokemon;
    lang: Lang;
}

export default function CompetitiveDashboard({ pokemon, lang }: Props) {
    // 1. CARGA DEL ÁRBOL DE FORMATOS (CHAOS INDEX)
    const { data: indexData, isLoading: isLoadingTree } = useQuery<SmogonIndexResponse | null>({
        queryKey: ['smogonChaosIndex'],
        queryFn: fetchFormatsIndex,
        staleTime: 1000 * 60 * 60 * 12 // 12h
    });

    // 2. ESTADOS DE SELECCIÓN (5 NIVELES)
    const [gen, setGen] = useState<string>('');
    const [mode, setMode] = useState<string>('');
    const [format, setFormat] = useState<string>('');
    const [reg, setReg] = useState<string>('');
    const [fileId, setFileId] = useState<string>(''); // Este es el ELO seleccionado (el value final)

    // --- LÓGICA DE DERIVACIÓN Y CASCADA ---

    // A. Filtrado de Generaciones Válidas
    const validGens = useMemo(() => {
        if (!indexData?.structure) return [];
        const pkmGen = normalizeGen(pokemon.generation);
        
        // Obtenemos gens disponibles y filtramos por fecha de nacimiento del Pokémon
        // Orden inverso (9, 8, 7...)
        return Object.keys(indexData.structure)
            .filter(g => {
                const gNum = parseInt(g.replace('gen', ''));
                return gNum >= pkmGen;
            })
            .sort((a, b) => parseInt(b.replace('gen', '')) - parseInt(a.replace('gen', '')));
    }, [indexData, pokemon.generation]);

    // B. Cascada Nivel 1: Init / Gen Change
    useEffect(() => {
        if (validGens.length > 0) {
            // Si no hay gen seleccionada o la actual es inválida para este pokemon
            if (!gen || !validGens.includes(gen)) {
                setGen(validGens[0]); // Default: Gen más reciente
            }
        }
    }, [validGens, gen]);

    // C. Cascada Nivel 2: Mode (Singles/Doubles)
    useEffect(() => {
        if (!indexData || !gen) return;
        const modes = indexData.structure[gen];
        if (modes) {
            // Preferencia por Singles si existe, sino el primero que haya
            if (!mode || !modes[mode]) {
                const availableModes = Object.keys(modes);
                setMode(availableModes.includes('singles') ? 'singles' : availableModes[0]);
            }
        }
    }, [gen, indexData, mode]);

    // D. Cascada Nivel 3: Format (OU, VGC...)
    useEffect(() => {
        if (!indexData || !gen || !mode) return;
        const formats = indexData.structure[gen]?.[mode];
        if (formats) {
            const formatKeys = Object.keys(formats);
            if (!format || !formats[format]) {
                // Default inteligente: OU para singles, VGC para doubles (buscando string parcial)
                const defaultFmt = formatKeys.find(k => k.includes(mode === 'singles' ? 'OU' : 'VGC')) || formatKeys[0];
                setFormat(defaultFmt);
            }
        }
    }, [mode, gen, indexData, format]);

    // E. Cascada Nivel 4: Regulation
    useEffect(() => {
        if (!indexData || !gen || !mode || !format) return;
        const regs = indexData.structure[gen]?.[mode]?.[format]?.regs;
        if (regs) {
            const regKeys = Object.keys(regs);
            if (!reg || !regs[reg]) {
                // Normalmente queremos la última regulación (si están ordenadas alfabeticamente Reg G > Reg F)
                // O el estándar "-"
                setReg(regKeys.includes('-') ? '-' : regKeys[regKeys.length - 1]);
            }
        }
    }, [format, mode, gen, indexData, reg]);

    // F. Cascada Nivel 5: ELO / FileId
    useEffect(() => {
        if (!indexData || !gen || !mode || !format || !reg) return;
        const eloOptions = indexData.structure[gen]?.[mode]?.[format]?.regs?.[reg];
        
        if (eloOptions && eloOptions.length > 0) {
            // Verificamos si el fileId actual sigue siendo válido en la nueva lista
            const currentIsValid = eloOptions.some(opt => opt.fileId === fileId);
            
            if (!currentIsValid || !fileId) {
                // Default: "0" (All) o "1500" (Standard High Ladder)
                // Intentamos buscar el baseline 1500/1695/1760 si existe, sino el primero (0)
                const highElo = eloOptions.find(opt => parseInt(opt.elo) >= 1500);
                setFileId(highElo ? highElo.fileId : eloOptions[0].fileId);
            }
        }
    }, [reg, format, mode, gen, indexData, fileId]);


    // 3. CARGA DE DATOS COMPETITIVOS (USANDO EL FILE ID SELECCIONADO)
    const { data, isLoading } = useQuery<CompetitiveResponse | null>({
        queryKey: ['competitiveChaos', pokemon.name, indexData?.date, fileId],
        queryFn: () => fetchSmogonData(pokemon.name, indexData!.date, fileId),
        enabled: !!fileId && !!indexData?.date,
        staleTime: 1000 * 60 * 5,
        retry: false
    });


    // --- HELPERS VISUALES ---
    // Recuperar opciones actuales para renderizar selects
    const availableModes = indexData?.structure[gen] ? Object.keys(indexData.structure[gen]) : [];
    const availableFormats = indexData?.structure[gen]?.[mode] ? Object.keys(indexData.structure[gen][mode]) : [];
    const availableRegs = indexData?.structure[gen]?.[mode]?.[format]?.regs ? Object.keys(indexData.structure[gen][mode][format].regs) : [];
    const availableElos = indexData?.structure[gen]?.[mode]?.[format]?.regs?.[reg] || [];

    // Helper para formatear ELO en el select
    const formatEloLabel = (elo: string) => elo === '0' ? 'All (0+)' : `High (${elo}+)`;


    // --- RENDER ---
    if (isLoadingTree || !indexData) {
        return (
            <div className="h-64 flex flex-col items-center justify-center bg-slate-950/50 rounded-xl border border-slate-800">
                <Activity className="animate-spin text-cyan-500 mb-2" />
                <span className="text-xs text-slate-500 font-mono">CONNECTING TO SMOGON CHAOS SERVER...</span>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-slate-950/50 rounded-xl border border-slate-800 overflow-hidden">
            
            {/* HEADER CONTROL - AHORA CON 5 NIVELES */}
            <div className="flex flex-col gap-3 p-3 border-b border-slate-800 bg-slate-900/90 z-10 shadow-md">
                
                {/* FILA 1: Título y Rate */}
                <div className="flex justify-between items-center">
                    <h3 className="text-[10px] font-display font-black text-cyan-500 uppercase tracking-widest flex items-center gap-2">
                        <Trophy size={12} className="text-yellow-500" />
                        CHAOS ANALYTICS <span className="text-slate-600 text-[8px]">v{indexData.date}</span>
                    </h3>
                    {data && (
                        <div className="text-right bg-slate-950/50 px-2 py-0.5 rounded border border-slate-800">
                            <span className="text-[8px] font-mono text-slate-400 mr-2">USAGE RATE</span>
                            <span className="text-xs font-bold text-white">{data.general.usage}%</span>
                        </div>
                    )}
                </div>

                {/* FILA 2: Selectores */}
                <div className="flex flex-wrap gap-2 items-center">
                    
                    {/* 1. GEN */}
                    <div className="relative group w-[80px]">
                        <select 
                            value={gen}
                            onChange={(e) => setGen(e.target.value)}
                            className="w-full appearance-none bg-slate-950 border border-slate-700 text-slate-300 text-[9px] font-bold uppercase py-1.5 pl-2 pr-4 rounded hover:border-cyan-500/50 focus:border-cyan-500 transition-colors"
                        >
                            {validGens.map(g => <option key={g} value={g}>{g.toUpperCase()}</option>)}
                        </select>
                        <ChevronDown size={10} className="absolute right-1 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                    </div>

                    {/* 2. MODE */}
                    <div className="relative group w-[80px]">
                         <select 
                            value={mode}
                            onChange={(e) => setMode(e.target.value)}
                            disabled={availableModes.length <= 1}
                            className="w-full appearance-none bg-slate-950 border border-slate-700 text-slate-300 text-[9px] font-bold uppercase py-1.5 pl-2 pr-4 rounded hover:border-cyan-500/50 focus:border-cyan-500 transition-colors disabled:opacity-50"
                        >
                            {availableModes.map(m => <option key={m} value={m}>{m === 'doubles' ? 'DOU' : 'SING'}</option>)}
                        </select>
                        <ChevronDown size={10} className="absolute right-1 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                    </div>

                    {/* 3. FORMAT */}
                    <div className="relative group min-w-[100px] flex-1">
                        <select 
                            value={format}
                            onChange={(e) => setFormat(e.target.value)}
                            className="w-full appearance-none bg-slate-950 border border-slate-700 text-cyan-100 text-[9px] font-mono font-bold uppercase py-1.5 pl-2 pr-4 rounded hover:border-cyan-500 focus:border-cyan-500 transition-colors"
                        >
                            {availableFormats.map(f => <option key={f} value={f}>{f}</option>)}
                        </select>
                        <ChevronDown size={10} className="absolute right-1 top-1/2 -translate-y-1/2 text-cyan-500 pointer-events-none" />
                    </div>
                </div>

                {/* FILA 3: Filtros Finos (Regulacion y ELO) */}
                <div className="flex gap-2 items-center border-t border-slate-800/50 pt-2">
                    <Filter size={10} className="text-slate-600" />
                    
                    {/* 4. REGULATION (Si aplica) */}
                    <div className="relative group w-[100px]">
                        <select 
                            value={reg}
                            onChange={(e) => setReg(e.target.value)}
                            disabled={availableRegs.length <= 1 && reg === '-'}
                            className="w-full appearance-none bg-slate-950/50 border border-slate-700 text-slate-400 text-[9px] font-bold uppercase py-1 pl-2 pr-4 rounded hover:border-cyan-500/50 focus:border-cyan-500 transition-colors"
                        >
                            {availableRegs.map(r => <option key={r} value={r}>{r === '-' ? 'Standard' : r}</option>)}
                        </select>
                        <ChevronDown size={10} className="absolute right-1 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                    </div>

                    {/* 5. ELO SELECTOR */}
                    <div className="relative group w-[110px]">
                        <select 
                            value={fileId}
                            onChange={(e) => setFileId(e.target.value)}
                            className="w-full appearance-none bg-slate-950/50 border border-slate-700 text-yellow-500/80 text-[9px] font-mono font-bold uppercase py-1 pl-2 pr-4 rounded hover:border-yellow-500/50 focus:border-yellow-500 transition-colors"
                        >
                            {availableElos.map(opt => (
                                <option key={opt.fileId} value={opt.fileId}>{formatEloLabel(opt.elo)}</option>
                            ))}
                        </select>
                        <ChevronDown size={10} className="absolute right-1 top-1/2 -translate-y-1/2 text-yellow-600 pointer-events-none" />
                    </div>
                </div>
            </div>

            {/* CONTENT AREA (IGUAL QUE ANTES) */}
            <div className="flex-1 overflow-hidden relative">
                
                {isLoading && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/60 z-20 backdrop-blur-[1px]">
                        <RefreshCw className="animate-spin text-cyan-500 mb-2" size={20} />
                        <span className="text-[9px] font-mono text-cyan-400">DECRYPTING BATTLE DATA...</span>
                    </div>
                )}

                {!isLoading && !data ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-600 gap-3 p-8 text-center bg-[radial-gradient(circle_at_center,rgba(30,41,59,0.5)_0,transparent_100%)]">
                        <div className="p-3 bg-slate-900/50 rounded-full border border-slate-800">
                            <AlertTriangle size={24} className="opacity-50 text-yellow-500" />
                        </div>
                        <div>
                            <h3 className="text-xs font-bold text-slate-300 uppercase mb-1">No Data Found</h3>
                            <p className="text-[9px] font-mono text-slate-500 max-w-[240px] mx-auto leading-relaxed">
                                {pokemon.name} has no recorded usage in <span className="text-cyan-500">{format} ({reg})</span> above {availableElos.find(e => e.fileId === fileId)?.elo} ELO.
                            </p>
                        </div>
                    </div>
                ) : data ? (
                    <div className="h-full flex flex-col md:flex-row overflow-hidden">
                        
                        {/* LEFT: METRICS */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-5">
                            
                            {/* MOVES & ITEMS */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <h4 className="text-[8px] font-bold text-slate-500 uppercase flex items-center gap-1.5 border-b border-slate-800/50 pb-1">
                                        <Sword size={10} /> Key Moves
                                    </h4>
                                    <div>
                                        {data.stats.moves.slice(0, 8).map((m) => (
                                            <UsageBar key={m.name} label={m.name} value={m.value} color="bg-cyan-600" />
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="space-y-1.5">
                                        <h4 className="text-[8px] font-bold text-slate-500 uppercase flex items-center gap-1.5 border-b border-slate-800/50 pb-1">
                                            <Shield size={10} /> Key Items
                                        </h4>
                                        <div>
                                            {data.stats.items.slice(0, 5).map((i) => (
                                                <UsageBar key={i.name} label={i.name} value={i.value} color="bg-indigo-500" />
                                            ))}
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <h4 className="text-[8px] font-bold text-slate-500 uppercase flex items-center gap-1.5 border-b border-slate-800/50 pb-1">
                                            <Zap size={10} /> Abilities
                                        </h4>
                                        <div>
                                            {data.stats.abilities.slice(0, 2).map((a) => (
                                                <UsageBar key={a.name} label={a.name} value={a.value} color="bg-emerald-600" />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* TEAMMATES */}
                            <div className="space-y-2">
                                <h4 className="text-[8px] font-bold text-slate-500 uppercase flex items-center gap-1.5 border-b border-slate-800/50 pb-1">
                                    <Users size={10} /> Teammates
                                </h4>
                                <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2">
                                    {data.stats.teammates.slice(0, 12).map((mate) => (
                                        <div 
                                            key={mate.name} 
                                            title={`${mate.name} (${mate.value}%)`} 
                                            className="relative aspect-square bg-slate-900 border border-slate-800 rounded hover:border-cyan-500/50 transition-all group overflow-hidden cursor-help"
                                        >
                                            <img 
                                                src={getSpriteUrl(mate.name)} 
                                                alt={mate.name} 
                                                className="w-full h-full object-contain p-1 opacity-70 group-hover:opacity-100 transition-opacity drop-shadow-md" 
                                                loading="lazy"
                                                onError={(e) => (e.target as HTMLImageElement).style.display = 'none'} 
                                            />
                                            <span className="absolute inset-0 flex items-center justify-center text-[6px] text-center p-1 opacity-0 group-hover:opacity-0 bg-slate-950/80 pointer-events-none">
                                                {mate.name}
                                            </span>
                                            <div className="absolute bottom-0 right-0 bg-slate-950/90 text-[6px] px-1 text-cyan-400 font-mono border-tl rounded-tl">
                                                {mate.value}%
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* RIGHT: SPREADS */}
                        <div className="w-full md:w-[200px] bg-slate-950 border-l border-slate-800 p-3 overflow-y-auto custom-scrollbar">
                            <h4 className="text-[8px] font-bold text-slate-500 uppercase flex items-center gap-1.5 border-b border-slate-800 pb-2 mb-3">
                                <BarChart3 size={10} /> Spreads
                            </h4>
                            <div className="space-y-2">
                                {data.stats.natureSpread && data.stats.natureSpread.length > 0 ? data.stats.natureSpread.map((spread, idx) => (
                                    <div key={idx} className="bg-slate-900/40 p-2 rounded border border-slate-800/60">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-[9px] font-bold text-yellow-500 truncate max-w-[80px]">{spread.nature}</span>
                                            <span className="text-[8px] font-mono text-slate-400">{spread.usage}%</span>
                                        </div>
                                        <div className="flex justify-between items-end h-10 gap-0.5">
                                            <StatBlock label="H" value={spread.evs?.hp || 0} color="bg-red-500" />
                                            <StatBlock label="A" value={spread.evs?.atk || 0} color="bg-orange-500" />
                                            <StatBlock label="B" value={spread.evs?.def || 0} color="bg-yellow-500" />
                                            <StatBlock label="C" value={spread.evs?.spa || 0} color="bg-blue-500" />
                                            <StatBlock label="D" value={spread.evs?.spd || 0} color="bg-green-500" />
                                            <StatBlock label="S" value={spread.evs?.spe || 0} color="bg-pink-500" />
                                        </div>
                                    </div>
                                )) : (
                                    <div className="text-[8px] text-slate-600 text-center py-4 italic">No specific EV spreads recorded</div>
                                )}
                            </div>
                        </div>

                    </div>
                ) : null}
            </div>
        </div>
    );
}