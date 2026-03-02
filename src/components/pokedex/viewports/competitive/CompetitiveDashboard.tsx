'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { fetchSmogonData, fetchFormatsIndex, SmogonIndexResponse } from '@/services/smogonService';
import { useNationalDexLookup } from '@/services/pokeapi';
import { IPokemon } from '@/types/interfaces';
import { Lang } from '@/lib/pokedexDictionary';
import UsageBar from '@/components/ui/UsageBar';
import CompetitiveHeader from './CompetitiveHeader';
import EvSpreadList from './EvSpreadList';
import { Users, Shield, Sword, AlertTriangle, RefreshCw, Zap, Trophy, ChevronDown, Activity, Skull, Diamond, Server } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toSlug } from '@/lib/utils/pokemon-normalizer';
import { useSearchParams } from 'next/navigation'; 

export interface CompetitiveResponse {
  meta: { pokemon: string; format: string; gen: number };
  general: { usage: string; rawCount: number };
  stats: {
    moves: Array<{ name: string; value: number; displayValue?: string; slug?: string }>;
    items: Array<{ name: string; value: number; displayValue?: string; slug?: string }>;
    abilities: Array<{ name: string; value: number; displayValue?: string; slug?: string }>;
    teammates: Array<{ id: number; value: number; displayValue?: string }>; 
    natureSpread: Array<{ nature: string; usage: string; evs: Record<string, number> }>;
    teras?: Array<{ name: string; value: number; displayValue?: string }>; 
  };
  matchups: {
    counters: Array<{ id: number; score: string }>; 
  };
  speed?: {
      tier: string;
      percentile: number;
      baseSpeed: number;
      context: { en: string; es: string };
  };
}

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

interface Props {
    pokemon: IPokemon;
    lang: Lang;
}

export default function CompetitiveDashboard({ pokemon, lang }: Props) {
    const [dataSource, setDataSource] = useState<'showdown' | 'tournament'>('showdown');
    const [tournaments, setTournaments] = useState<{id: string, name: string, date: string}[]>([]);
    const [selectedTournament, setSelectedTournament] = useState<string>('');
    
    // CARGA DE DICCIONARIOS (ROSETTA STONE)
    const [aliasMap, setAliasMap] = useState<Record<string, number> | null>(null);

    useEffect(() => {
        fetch('/data/alias_map.json')
            .then(res => res.json())
            .then(data => setAliasMap(data))
            .catch(() => console.error('No se encontró alias_map.json'));

        fetch('/data/tournaments/rk9_index.json')
            .then(res => res.ok ? res.json() : [])
            .then(data => {
                setTournaments(data);
                if (data.length > 0) setSelectedTournament(data[0].id);
            })
            .catch(() => console.log('Sin torneos locales encontrados.'));
    }, []);

    const { data: indexData, isLoading: isLoadingTree } = useQuery<SmogonIndexResponse | null>({
        queryKey: ['smogonChaosIndex'],
        queryFn: fetchFormatsIndex,
        staleTime: 1000 * 60 * 60 * 12 
    });

    const { data: dexMap } = useNationalDexLookup(); 
    const searchParams = useSearchParams();

    const [gen, setGen] = useState<string>('');
    const [mode, setMode] = useState<string>('');
    const [format, setFormat] = useState<string>('');
    const [reg, setReg] = useState<string>('');
    const [fileId, setFileId] = useState<string>(''); 

    // --- EL CEREBRO DE LA RESOLUCIÓN DE IDs ---
    const activePokemonId = useMemo(() => {
        const variantParam = searchParams.get('variant');
        if (variantParam && !isNaN(Number(variantParam))) return variantParam;
        
        const possibleId = String(pokemon.id);
        if (!isNaN(Number(possibleId))) return possibleId; 
        
        const slug = toSlug(pokemon.name || possibleId);

        if (aliasMap && aliasMap[slug]) return String(aliasMap[slug]);
        if (dexMap && dexMap[slug]) return String(dexMap[slug]);
        
        return possibleId;
    }, [searchParams, pokemon, dexMap, aliasMap]);

    const isNumericId = !isNaN(Number(activePokemonId));

    // --- QUERIES ---

    const smogonQuery = useQuery<CompetitiveResponse | null>({
        queryKey: ['competitiveChaos', activePokemonId, indexData?.date, fileId],
        queryFn: () => fetchSmogonData(activePokemonId, indexData!.date, fileId),
        enabled: !!fileId && !!indexData?.date && dataSource === 'showdown' && isNumericId,
        staleTime: 1000 * 60 * 5,
        retry: false
    });

    const tournamentQuery = useQuery<CompetitiveResponse | null>({
        queryKey: ['tournamentChaos', activePokemonId, selectedTournament],
        queryFn: async () => {
            const res = await fetch(`/data/tournaments/rk9_${selectedTournament}.json`);
            if (!res.ok) throw new Error('Torneo no encontrado');
            
            const rawData = await res.json();
            const pkmData = rawData.pokemon[activePokemonId]; 
            
            if (!pkmData) return null;

            const totalTeams = rawData.battles;
            const pkmUsageRaw = pkmData.usage.raw;
            const usagePercent = ((pkmUsageRaw / totalTeams) * 100).toFixed(2);

            // ========================================================
            // 🚀 MOTOR DE PERCENTILES FRONTAL (ESPECÍFICO PARA TORNEOS)
            // ========================================================
            let speedAnalysis = null;
            try {
                const statsRes = await fetch('/data/pokedex_base_stats.json');
                if (statsRes.ok) {
                    const speedMapCache = await statsRes.json();
                    
                    if (speedMapCache[activePokemonId]) {
                        const targetSpeed = speedMapCache[activePokemonId].stats?.spe || speedMapCache[activePokemonId].base_stats?.spe || 0;
                        
                        const metaSpeeds: number[] = [];
                        let globalMaxSpeed = 0;
                        let globalMinSpeed = 999;

                        // Evaluamos sólo a los Pokémon que participaron en este Torneo
                        Object.keys(rawData.pokemon).forEach(mId => {
                            const monData = rawData.pokemon[mId];
                            const u = (monData.usage.raw / totalTeams) * 100;

                            if (speedMapCache[mId]) {
                                const s = speedMapCache[mId].stats?.spe || speedMapCache[mId].base_stats?.spe || 0;
                                if (s > globalMaxSpeed) globalMaxSpeed = s;
                                if (s < globalMinSpeed) globalMinSpeed = s;

                                // Cortamos ruido: Sólo Pokémon con más de 0.01% de uso en el torneo
                                if (u > 0.01) {
                                    metaSpeeds.push(s);
                                }
                            }
                        });

                        metaSpeeds.sort((a, b) => a - b);

                        if (metaSpeeds.length > 0) {
                            const slowerMons = metaSpeeds.filter(s => s < targetSpeed).length;
                            const percentile = (slowerMons / metaSpeeds.length) * 100;

                            const isFastest = targetSpeed >= globalMaxSpeed;
                            const isSlowest = targetSpeed <= globalMinSpeed;

                            let tier = 'C';
                            if (targetSpeed < 55) {
                                tier = 'F';
                            } else {
                                if (percentile >= 95) tier = 'S+';
                                else if (percentile >= 85) tier = 'S';
                                else if (percentile >= 70) tier = 'A';
                                else if (percentile >= 50) tier = 'B';
                                else tier = 'C';
                            }

                            if (isFastest) tier = 'S+';
                            if (isSlowest) tier = 'F';

                            const rawTopPercent = 100 - percentile;
                            let topPercentStr = rawTopPercent.toFixed(0);
                            if (rawTopPercent < 1) {
                                if (rawTopPercent <= 0.01) topPercentStr = "< 0.01";
                                else topPercentStr = rawTopPercent.toFixed(2);
                            }

                            const slowerPercentStr = percentile.toFixed(0);

                            // TEXTOS ESPECÍFICOS DE TORNEO
                            let contextEn = `Faster than ${slowerPercentStr}% of the tournament`;
                            let contextEs = `Más rápido que el ${slowerPercentStr}% del torneo`;

                            if (isFastest) {
                                contextEn = "The fastest Pokémon in the tournament";
                                contextEs = "El Pokémon más rápido del torneo";
                            } else if (isSlowest) {
                                contextEn = "The slowest Pokémon in the tournament";
                                contextEs = "El Pokémon más lento del torneo";
                            } else if (tier === 'F') { 
                                const fasterThanMeStr = rawTopPercent.toFixed(0);
                                contextEn = `Slower than ${fasterThanMeStr}% (Trick Room viable)`;
                                contextEs = `Más lento que el ${fasterThanMeStr}% (Viable en Espacio Raro)`;
                            } else if (percentile > 90) {
                                contextEn = `Top ${topPercentStr}% fastest in the tournament`;
                                contextEs = `Top ${topPercentStr}% más rápidos del torneo`;
                            }

                            speedAnalysis = {
                                tier,
                                percentile,
                                baseSpeed: targetSpeed,
                                context: { en: contextEn, es: contextEs }
                            };
                        }
                    }
                }
            } catch (e) {
                console.error("Error calculando Speed Tier para el torneo", e);
            }
            // ========================================================

            const mapStats = (record: Record<string, number>) => {
                if (!record) return [];
                return Object.entries(record)
                    .map(([name, count]) => ({
                        name,
                        value: (count / pkmUsageRaw) * 100,
                        displayValue: ((count / pkmUsageRaw) * 100).toFixed(2)
                    }))
                    .sort((a, b) => b.value - a.value);
            };

            const mapTeammates = (record: Record<string, number>) => {
                if (!record) return [];
                return Object.entries(record)
                    .map(([mateIdStr, count]) => ({
                        id: parseInt(mateIdStr, 10),
                        value: (count / pkmUsageRaw) * 100,
                        displayValue: ((count / pkmUsageRaw) * 100).toFixed(2)
                    }))
                    .sort((a, b) => b.value - a.value);
            };

            return {
                meta: { pokemon: activePokemonId, format: rawData.info.tournament_name, gen: 9 },
                general: { usage: usagePercent, rawCount: pkmUsageRaw },
                stats: {
                    moves: mapStats(pkmData.moves).slice(0, 15),
                    items: mapStats(pkmData.items).slice(0, 10),
                    abilities: mapStats(pkmData.abilities).slice(0, 10),
                    teammates: mapTeammates(pkmData.teammates).slice(0, 15),
                    teras: mapStats(pkmData.teras).slice(0, 10),
                    natureSpread: [] 
                },
                matchups: { counters: [] },
                speed: speedAnalysis // ¡Se Inyecta la velocidad aquí!
            } as CompetitiveResponse;
        },
        enabled: dataSource === 'tournament' && !!selectedTournament && isNumericId,
        staleTime: Infinity,
        retry: false
    });

    const isLoading = dataSource === 'showdown' ? smogonQuery.isLoading : tournamentQuery.isLoading;
    const data = dataSource === 'showdown' ? smogonQuery.data : tournamentQuery.data;

    const validGens = useMemo(() => {
        if (!indexData?.structure) return [];
        const pkmGen = normalizeGen(pokemon.generation);
        return Object.keys(indexData.structure)
            .filter(g => parseInt(g.replace('gen', '')) >= pkmGen)
            .sort((a, b) => parseInt(b.replace('gen', '')) - parseInt(a.replace('gen', '')));
    }, [indexData, pokemon.generation]);

    useEffect(() => { if (validGens.length > 0 && (!gen || !validGens.includes(gen))) setGen(validGens[0]); }, [validGens, gen]);
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

    useEffect(() => {
        const target = searchParams.get('format');
        if (!target || !indexData) return;
        if (fileId === target || format === target) return;

        const gens = Object.keys(indexData.structure);
        for (const g of gens) {
            const modes = Object.keys(indexData.structure[g]);
            for (const m of modes) {
                const formats = indexData.structure[g][m];
                if (formats[target]) {
                    setGen(g); setMode(m); setFormat(target); return;
                }
                for (const f of Object.keys(formats)) {
                    const regs = formats[f].regs;
                    if (!regs) continue;
                    for (const r of Object.keys(regs)) {
                        const eloOptions = regs[r];
                        if (eloOptions.some(opt => opt.fileId === target)) {
                            setGen(g); setMode(m); setFormat(f); setReg(r); setFileId(target); return;
                        }
                    }
                }
            }
        }
    }, [indexData, searchParams]);

    const getMateVisuals = (id: number, formatStr: string) => {
        let mateName = `Pokémon #${id}`;
        if (dexMap) {
            const foundSlug = Object.entries(dexMap).find(([slug, dexId]) => dexId === id);
            if (foundSlug) mateName = foundSlug[0].replace(/-/g, ' ').toUpperCase();
        }
        return {
            name: mateName,
            href: `/${lang}/pokedex/${id}?tab=PVP&format=${formatStr}`,
            imgLocal: `/images/pokemon/high-res/${id}.png`,
            imgFallback: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`
        };
    };

    const availableModes = indexData?.structure[gen] ? Object.keys(indexData.structure[gen]) : [];
    const availableFormats = indexData?.structure[gen]?.[mode] ? Object.keys(indexData.structure[gen][mode]) : [];
    const availableRegs = indexData?.structure[gen]?.[mode]?.[format]?.regs ? Object.keys(indexData.structure[gen][mode][format].regs) : [];
    const availableElos = indexData?.structure[gen]?.[mode]?.[format]?.regs?.[reg] || [];
    const formatEloLabel = (elo: string) => elo === '0' ? 'All (0+)' : `${elo}+`;
    const showTeras = (dataSource === 'tournament' || gen.includes('9')) && data?.stats.teras && data.stats.teras.length > 0;

    if (isLoadingTree || !indexData || !dexMap || !aliasMap) return <div className="h-64 flex flex-col items-center justify-center text-slate-500"><Activity className="animate-spin text-cyan-500 mb-2" /><span className="text-xs font-mono">LOADING DATA...</span></div>;

    return (
        <div className="h-full flex flex-col bg-slate-950/30 rounded-xl border border-slate-800 overflow-hidden shadow-2xl">
            {data && (
                <CompetitiveHeader pokemon={pokemon} usageRate={data.general.usage} topMoves={data.stats.moves} topAbilities={data.stats.abilities} topItems={data.stats.items} spreads={data.stats.natureSpread} speedData={data.speed} lang={lang} />
            )}

            <div className="flex flex-col gap-2 p-3 border-b border-slate-800 bg-slate-900/90 z-20">
                <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center gap-3">
                        <h3 className="text-[10px] font-display font-black text-cyan-500 uppercase tracking-widest hidden sm:flex items-center gap-2">
                            <Trophy size={12} className="text-yellow-500" />
                            CHAOS ANALYTICS <span className="text-slate-600 text-[8px] font-mono">v{indexData.date}</span>
                        </h3>
                        
                        <div className="flex items-center bg-slate-950 border border-slate-700 rounded overflow-hidden shadow-inner">
                            <button onClick={() => setDataSource('showdown')} className={cn("px-2.5 py-1 text-[9px] font-bold uppercase transition-colors flex items-center gap-1.5", dataSource === 'showdown' ? "bg-cyan-500/20 text-cyan-400" : "text-slate-500 hover:text-slate-300 hover:bg-slate-900")}><Server size={10}/> Showdown</button>
                            <button onClick={() => setDataSource('tournament')} className={cn("px-2.5 py-1 text-[9px] font-bold uppercase transition-colors flex items-center gap-1.5 border-l border-slate-700", dataSource === 'tournament' ? "bg-amber-500/20 text-amber-400" : "text-slate-500 hover:text-slate-300 hover:bg-slate-900")}><Trophy size={10}/> Torneos VGC</button>
                        </div>
                    </div>
                    {data && (
                        <div className="text-right bg-slate-950/50 px-2 py-0.5 rounded border border-slate-800">
                            <span className="text-[8px] font-mono text-slate-400 mr-2">USAGE</span>
                            <span className="text-xs font-bold text-white">{data.general.usage}%</span>
                        </div>
                    )}
                </div>
                
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                    {dataSource === 'showdown' ? (
                        <>
                            <div className="relative group min-w-[70px]"><select value={gen} onChange={(e) => setGen(e.target.value)} className="w-full appearance-none bg-slate-950 border border-slate-700 text-slate-300 text-[9px] font-bold uppercase py-1.5 pl-2 pr-4 rounded hover:border-cyan-500/50 focus:border-cyan-500 transition-colors">{validGens.map(g => <option key={g} value={g}>{g.toUpperCase()}</option>)}</select><ChevronDown size={10} className="absolute right-1 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" /></div>
                            <div className="relative group min-w-[65px]"><select value={mode} onChange={(e) => setMode(e.target.value)} disabled={availableModes.length <= 1} className="w-full appearance-none bg-slate-950 border border-slate-700 text-slate-300 text-[9px] font-bold uppercase py-1.5 pl-2 pr-4 rounded hover:border-cyan-500/50 focus:border-cyan-500 transition-colors disabled:opacity-50">{availableModes.map(m => <option key={m} value={m}>{m === 'doubles' ? 'DOU' : 'SING'}</option>)}</select><ChevronDown size={10} className="absolute right-1 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" /></div>
                            <div className="relative group min-w-[100px] flex-1"><select value={format} onChange={(e) => setFormat(e.target.value)} className="w-full appearance-none bg-slate-950 border border-slate-700 text-cyan-100 text-[9px] font-mono font-bold uppercase py-1.5 pl-2 pr-4 rounded hover:border-cyan-500 focus:border-cyan-500 transition-colors text-ellipsis">{availableFormats.map(f => <option key={f} value={f}>{f}</option>)}</select><ChevronDown size={10} className="absolute right-1 top-1/2 -translate-y-1/2 text-cyan-500 pointer-events-none" /></div>
                            {reg !== '-' && ( <div className="relative group min-w-[70px]"><select value={reg} onChange={(e) => setReg(e.target.value)} className="w-full appearance-none bg-slate-950/50 border border-slate-700 text-slate-400 text-[9px] font-bold uppercase py-1.5 pl-2 pr-4 rounded hover:border-cyan-500/50 focus:border-cyan-500 transition-colors">{availableRegs.map(r => <option key={r} value={r}>{r}</option>)}</select><ChevronDown size={10} className="absolute right-1 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" /></div> )}
                            <div className="relative group min-w-[80px]"><select value={fileId} onChange={(e) => setFileId(e.target.value)} className="w-full appearance-none bg-slate-950/50 border border-slate-700 text-yellow-500/80 text-[9px] font-mono font-bold uppercase py-1.5 pl-2 pr-4 rounded hover:border-yellow-500/50 focus:border-yellow-500 transition-colors">{availableElos.map(opt => <option key={opt.fileId} value={opt.fileId}>{formatEloLabel(opt.elo)}</option>)}</select><ChevronDown size={10} className="absolute right-1 top-1/2 -translate-y-1/2 text-yellow-600 pointer-events-none" /></div>
                        </>
                    ) : (
                        <div className="relative group min-w-[200px] flex-1 sm:flex-none">
                            <select value={selectedTournament} onChange={(e) => setSelectedTournament(e.target.value)} disabled={tournaments.length === 0} className="w-full appearance-none bg-slate-950 border border-slate-700 text-amber-400 text-[9px] font-mono font-bold uppercase py-1.5 pl-2 pr-6 rounded hover:border-amber-500 focus:border-amber-500 transition-colors text-ellipsis disabled:opacity-50">
                                {tournaments.length === 0 ? <option value="">Ningún torneo local descargado...</option> : tournaments.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                            <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 text-amber-600 pointer-events-none" />
                        </div>
                    )}
                </div>
            </div>

            <div className="flex-1 overflow-hidden relative flex flex-col bg-slate-950/50">
                {isLoading && <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/60 z-30 backdrop-blur-[1px]"><RefreshCw className="animate-spin text-cyan-500 mb-2" size={20} /><span className="text-[9px] font-mono text-cyan-400">PROCESSING...</span></div>}

                {!isLoading && !data ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-600 gap-3 p-8 text-center">
                        <AlertTriangle size={24} className="opacity-50 text-yellow-500" />
                        <div>
                            <h3 className="text-xs font-bold text-slate-300 uppercase mb-1">No Usage Data</h3>
                            <p className="text-[9px] font-mono text-slate-500 max-w-[240px] mx-auto">
                                ID #{activePokemonId} hasn't been used in <span className={dataSource === 'showdown' ? "text-cyan-500" : "text-amber-500"}>{dataSource === 'showdown' ? format : 'this tournament'}</span> enough to appear in statistics.
                            </p>
                        </div>
                    </div>
                ) : data ? (
                    <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                        
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">
                            
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="space-y-1.5">
                                    <h4 className="text-[9px] font-bold text-slate-500 uppercase flex items-center gap-1.5 border-b border-slate-800/50 pb-1"><Sword size={11} /> Key Moves</h4>
                                    <div className="pt-1">{data.stats.moves.slice(0, 8).map((m) => (
                                        <UsageBar key={m.name} label={m.name} value={m.value} subLabel={`${fmtPct(m.displayValue || m.value)}%`} color="bg-cyan-600" />
                                    ))}</div>
                                </div>
                                <div className="space-y-6">
                                    <div className="space-y-1.5">
                                        <h4 className="text-[9px] font-bold text-slate-500 uppercase flex items-center gap-1.5 border-b border-slate-800/50 pb-1"><Shield size={11} /> Key Items</h4>
                                        <div className="pt-1">{data.stats.items.slice(0, 5).map((i) => (
                                            <UsageBar key={i.name} label={i.name} value={i.value} subLabel={`${fmtPct(i.displayValue || i.value)}%`} color="bg-indigo-500" />
                                        ))}</div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <h4 className="text-[9px] font-bold text-slate-500 uppercase flex items-center gap-1.5 border-b border-slate-800/50 pb-1"><Zap size={11} /> Abilities</h4>
                                        <div className="pt-1">{data.stats.abilities.slice(0, 2).map((a) => (
                                            <UsageBar key={a.name} label={a.name} value={a.value} subLabel={`${fmtPct(a.displayValue || a.value)}%`} color="bg-emerald-600" />
                                        ))}</div>
                                    </div>
                                </div>
                            </div>

                            {showTeras && (
                                <div className="space-y-1.5">
                                    <h4 className="text-[9px] font-bold text-slate-500 uppercase flex items-center gap-1.5 border-b border-slate-800/50 pb-1"><Diamond size={11} /> Tera Types</h4>
                                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 pt-1">
                                        {data.stats.teras?.slice(0, 6).map((t) => (
                                            <UsageBar key={t.name} label={t.name} value={t.value} subLabel={`${fmtPct(t.displayValue || t.value)}%`} color="bg-pink-600" />
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2">
                                <h4 className="text-[9px] font-bold text-slate-500 uppercase flex items-center gap-1.5 border-b border-slate-800/50 pb-1"><Users size={11} /> Teammates</h4>
                                <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2 pt-1">
                                    {data.stats.teammates.slice(0, 12).map((mate) => {
                                        const visuals = getMateVisuals(mate.id, data.meta.format);
                                        return (
                                            <Link key={mate.id} href={visuals.href} className="block relative group" title={`${visuals.name} (${fmtPct(mate.displayValue || mate.value)}%)`}>
                                                <div className="relative aspect-square bg-slate-900 border border-slate-800 rounded hover:border-cyan-500/50 transition-all overflow-hidden cursor-pointer">
                                                    <img 
                                                        src={visuals.imgLocal} 
                                                        alt={visuals.name} 
                                                        className="w-full h-full object-contain p-1 opacity-70 group-hover:opacity-100 transition-opacity drop-shadow-md" 
                                                        loading="lazy" 
                                                        onError={(e) => { 
                                                            const target = e.target as HTMLImageElement; 
                                                            if (target.src !== visuals.imgFallback) { target.src = visuals.imgFallback; } else { target.style.display = 'none'; } 
                                                        }} 
                                                    />
                                                    <div className="absolute bottom-0 right-0 bg-slate-950/90 text-[8px] px-1.5 py-0.5 text-cyan-400 font-mono border-tl rounded-tl font-bold">{fmtPct(mate.displayValue || mate.value)}%</div>
                                                </div>
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>

                            {data.matchups?.counters && data.matchups.counters.length > 0 && (
                                <div className="space-y-2">
                                    <h4 className="text-[9px] font-bold text-slate-500 uppercase flex items-center gap-1.5 border-b border-slate-800/50 pb-1"><Skull size={11} /> Checks & Counters</h4>
                                    <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2 pt-1">
                                        {data.matchups.counters.slice(0, 8).map((counter) => {
                                            const visuals = getMateVisuals(counter.id, data.meta.format);
                                            return (
                                                <Link key={counter.id} href={visuals.href} className="block relative group" title={`${visuals.name} (Score: ${counter.score}%)`}>
                                                    <div className="relative aspect-square bg-slate-900 border border-slate-800 rounded hover:border-red-500/50 transition-all overflow-hidden cursor-pointer">
                                                        <img 
                                                            src={visuals.imgLocal} 
                                                            alt={visuals.name} 
                                                            className="w-full h-full object-contain p-1 opacity-70 group-hover:opacity-100 transition-opacity drop-shadow-md" 
                                                            loading="lazy" 
                                                            onError={(e) => { 
                                                                const target = e.target as HTMLImageElement; 
                                                                if (target.src !== visuals.imgFallback) { target.src = visuals.imgFallback; } else { target.style.display = 'none'; } 
                                                            }} 
                                                        />
                                                        <div className="absolute bottom-0 right-0 bg-slate-950/90 text-[8px] px-1.5 py-0.5 text-red-400 font-mono border-tl rounded-tl font-bold">{counter.score}%</div>
                                                    </div>
                                                </Link>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="w-full md:w-[220px] bg-slate-950 border-l border-slate-800 p-3 overflow-y-auto custom-scrollbar">
                            <EvSpreadList spreads={data.stats.natureSpread} />
                        </div>
                    </div>
                ) : null}
            </div>
        </div>
    );
}