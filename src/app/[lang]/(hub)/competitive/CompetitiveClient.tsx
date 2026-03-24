'use client';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { fetchFormatsIndex, SmogonIndexResponse } from '@/services/smogonService';
import { Target, ChevronDown, ChevronRight, Info, Trophy, BarChart3, Server } from 'lucide-react';
import { IMacroDashboardData } from '@/types/competitive';
import { cn } from '@/lib/utils';
import UsageBar from '@/components/ui/UsageBar';
import TacticalDrawer from "@/components/competitive/TacticalDrawer";
import TeamDetailModal from "@/components/competitive/TeamDetailModal";
import TypeEcosystem from "@/components/competitive/TypeEcosystem";
import BattleGimmickGallery from "@/components/competitive/BattleGimmickGallery";

interface Props {
  lang: string;
  dict: any;
  showdownFormats: {id: string, name: string}[];
  tournamentFormats: {id: string, name: string}[];
  activeFormatId: string;
  activeSource: string;
  data: IMacroDashboardData | null;
  deepdiveParam?: string;
}

export default function CompetitiveClient({ lang, dict, showdownFormats, tournamentFormats, activeFormatId, activeSource, data, deepdiveParam }: Props) {
  const [selectedTeam, setSelectedTeam] = useState<any>(null);
  const [topCutExpanded, setTopCutExpanded] = useState(false);
  const [source, setSource] = useState(activeSource);
  const router = useRouter();

  const handleSourceChange = (newSource: string) => {
    setSource(newSource);
    const formats = newSource === 'showdown' ? showdownFormats : tournamentFormats;
    if (formats.length > 0) {
      let targetFormatId = formats[0].id;
      if (newSource === 'showdown') {
        const vgcFormats = formats.filter(f => f.id.includes('vgc'));
        if (vgcFormats.length > 0) {
          vgcFormats.sort((a, b) => b.id.localeCompare(a.id));
          targetFormatId = vgcFormats[0].id;
        }
      }
      router.push(`/${lang}/competitive?source=${newSource}&format=${targetFormatId}`);
    }
  };

  const handleFormatChange = (formatId: string) => {
    router.push(`/${lang}/competitive?source=${source}&format=${formatId}`);
  };

  const [indexData, setIndexData] = useState<SmogonIndexResponse | null>(null);
  const [gen, setGen] = useState<string>('');
  const [mode, setMode] = useState<string>('');
  const [format, setFormat] = useState<string>('');
  const [reg, setReg] = useState<string>('');
  const [fileId, setFileId] = useState<string>('');

  useEffect(() => {
    fetchFormatsIndex().then(setIndexData).catch(console.error);
  }, []);

  const validGens = useMemo(() => {
    if (!indexData?.structure) return [];
    return Object.keys(indexData.structure).sort((a, b) => parseInt(b.replace('gen', '')) - parseInt(a.replace('gen', '')));
  }, [indexData]);

  useEffect(() => { if (validGens.length > 0 && (!gen || !validGens.includes(gen))) setGen(validGens[0]); }, [validGens, gen]);

  useEffect(() => {
    if (!indexData || !gen) return;
    const modes = indexData.structure[gen];
    if (modes && (!mode || !modes[mode])) {
      const keys = Object.keys(modes);
      setMode(keys.includes('doubles') ? 'doubles' : (keys.includes('singles') ? 'singles' : keys[0] || ''));
    }
  }, [gen, indexData, mode]);

  useEffect(() => {
    if (!indexData || !gen || !mode) return;
    const formats = indexData.structure[gen]?.[mode];
    if (formats) {
      const formatKeys = Object.keys(formats);
      if (!format || !formats[format]) {
        const defaultFmt = formatKeys.find((k: string) => k.includes(mode === 'singles' ? 'OU' : 'VGC')) || formatKeys[0] || '';
        setFormat(defaultFmt);
      }
    }
  }, [mode, gen, indexData, format]);

  useEffect(() => {
    if (!indexData || !gen || !mode || !format) return;
    const regs = indexData.structure[gen]?.[mode]?.[format]?.regs;
    if (regs) {
      const regKeys = Object.keys(regs);
      if (!reg || !regs[reg]) setReg(regKeys.includes('-') ? '-' : regKeys[regKeys.length - 1] || '');
    }
  }, [format, mode, gen, indexData, reg]);

  useEffect(() => {
    if (!indexData || source !== 'showdown' || !activeFormatId) return;
    const target = activeFormatId.replace('showdown_', '') + '.json'; 
    if (fileId === target) return; 

    const gens = Object.keys(indexData.structure);
    for (const g of gens) {
      const modes = Object.keys(indexData.structure[g]);
      for (const m of modes) {
        const formats = indexData.structure[g][m];
        for (const f of Object.keys(formats)) {
          const regs = formats[f].regs;
          if (!regs) continue;
          for (const r of Object.keys(regs)) {
            const eloOptions = regs[r];
            if (eloOptions.some((opt: any) => opt.fileId === target)) {
              setGen(g); setMode(m); setFormat(f); setReg(r); setFileId(target); return;
            }
          }
        }
      }
    }
  }, [indexData, activeFormatId, source, fileId]);

  useEffect(() => {
    if (!indexData || !gen || !mode || !format || !reg || source !== 'showdown') return;
    const eloOptions = indexData.structure[gen]?.[mode]?.[format]?.regs?.[reg];
    if (eloOptions && eloOptions.length > 0) {
      const currentIsValid = eloOptions.some((opt: any) => opt.fileId === fileId);
      if (!currentIsValid || !fileId) {
        const highElo = eloOptions.find((opt: any) => parseInt(opt.elo) >= 1500);
        const fallback = highElo ? highElo.fileId : eloOptions[0].fileId;
        setFileId(fallback);
        
        const newFormatId = `showdown_${fallback.replace('.json', '')}`;
        if (activeFormatId !== newFormatId) {
          router.push(`/${lang}/competitive?source=${source}&format=${newFormatId}`);
        }
      }
    }
  }, [reg, format, mode, gen, indexData, fileId, source, activeFormatId, router, lang]);

  const handleEloSelect = (newFileId: string) => {
    setFileId(newFileId);
    const newFormatId = `showdown_${newFileId.replace('.json', '')}`;
    router.push(`/${lang}/competitive?source=${source}&format=${newFormatId}`);
  };

  const availableModes = indexData?.structure[gen] ? Object.keys(indexData.structure[gen]) : [];
  const availableFormats = indexData?.structure[gen]?.[mode] ? Object.keys(indexData.structure[gen][mode]) : [];
  const availableRegs = indexData?.structure[gen]?.[mode]?.[format]?.regs ? Object.keys(indexData.structure[gen][mode][format].regs) : [];
  const availableElos = indexData?.structure[gen]?.[mode]?.[format]?.regs?.[reg] || [];
  const formatEloLabel = (elo: string) => elo === '0' ? 'All (0+)' : `${elo}+`;

  const handleDeepDive = (pokemonId: string) => {
    router.push(`/${lang}/competitive?source=${source}&format=${activeFormatId}&deepdive=${pokemonId}`);
  };

  const closeDrawer = () => {
    router.push(`/${lang}/competitive?source=${source}&format=${activeFormatId}`);
  };

  const getCentColor = (val: number) => {
    if (val >= 70) return 'text-red-500';
    if (val >= 40) return 'text-amber-500';
    return 'text-emerald-500';
  };

  const currentFormats = source === 'showdown' ? showdownFormats : tournamentFormats;

  if (!data) {
    return (
      <div className="w-full max-w-7xl mx-auto px-6 py-24 flex flex-col items-center justify-center">
        <Target size={48} className="text-slate-700 mb-6" />
        <h2 className="text-xl font-display font-medium text-slate-400">NO TACTICAL DATA FOUND</h2>
        <p className="text-sm font-mono text-slate-500 mt-2">Select a different format or run ETL.</p>
      </div>
    );
  }

  const { total_teams_analyzed, centralization_index, top_pokemon, top_cores, top_cut } = data;
  const isShowdown = source === 'showdown';

  return (
    <>
      <main className="w-full max-w-7xl mx-auto px-6 py-10">
        {/* HEADER */}
        <header className="flex flex-col gap-4 mb-6 border-b border-slate-800/50 pb-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-red-500/10 border border-red-500/20 rounded-md">
                <Target size={16} className="text-red-400" />
              </div>
              <h1 className="text-2xl font-display font-bold text-white tracking-wide uppercase">
                MACRO COMMAND CENTER
              </h1>
            </div>
          </div>

          {/* MODULAR FILTER BAR */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Source Toggle */}
            <div className="flex items-center bg-slate-950 border border-slate-700 rounded overflow-hidden">
              <button onClick={() => handleSourceChange('showdown')} className={cn("px-3 py-1.5 text-[10px] font-bold uppercase flex items-center gap-1.5 transition-colors", source === 'showdown' ? "bg-cyan-500/20 text-cyan-400" : "text-slate-500 hover:text-slate-300")}>
                <Server size={10}/> Showdown
              </button>
              <button onClick={() => handleSourceChange('tournament')} className={cn("px-3 py-1.5 text-[10px] font-bold uppercase flex items-center gap-1.5 border-l border-slate-700 transition-colors", source === 'tournament' ? "bg-amber-500/20 text-amber-400" : "text-slate-500 hover:text-slate-300")}>
                <Trophy size={10}/> Tournaments
              </button>
            </div>

            {/* Format Selector */}
            {source === 'showdown' && (
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                <div className="relative group min-w-[70px]"><select value={gen} onChange={(e) => setGen(e.target.value)} className="w-full appearance-none bg-slate-950 border border-slate-700 text-slate-300 text-[10px] font-bold uppercase py-1.5 pl-2 pr-4 rounded hover:border-cyan-500/50 focus:border-cyan-500 transition-colors">{validGens.map(g => <option key={g} value={g}>{g.toUpperCase()}</option>)}</select><ChevronDown size={10} className="absolute right-1 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" /></div>
                <div className="relative group min-w-[65px]"><select value={mode} onChange={(e) => setMode(e.target.value)} disabled={availableModes.length <= 1} className="w-full appearance-none bg-slate-950 border border-slate-700 text-slate-300 text-[10px] font-bold uppercase py-1.5 pl-2 pr-4 rounded hover:border-cyan-500/50 focus:border-cyan-500 transition-colors disabled:opacity-50">{availableModes.map(m => <option key={m} value={m}>{m === 'doubles' ? 'DOU' : 'SING'}</option>)}</select><ChevronDown size={10} className="absolute right-1 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" /></div>
                <div className="relative group min-w-[100px] flex-1"><select value={format} onChange={(e) => setFormat(e.target.value)} className="w-full appearance-none bg-slate-950 border border-slate-700 text-cyan-100 text-[10px] font-mono font-bold uppercase py-1.5 pl-2 pr-4 rounded hover:border-cyan-500 focus:border-cyan-500 transition-colors text-ellipsis">{availableFormats.map(f => <option key={f} value={f}>{f}</option>)}</select><ChevronDown size={10} className="absolute right-1 top-1/2 -translate-y-1/2 text-cyan-500 pointer-events-none" /></div>
                {reg !== '-' && ( <div className="relative group min-w-[70px]"><select value={reg} onChange={(e) => setReg(e.target.value)} className="w-full appearance-none bg-slate-950/50 border border-slate-700 text-slate-400 text-[10px] font-bold uppercase py-1.5 pl-2 pr-4 rounded hover:border-cyan-500/50 focus:border-cyan-500 transition-colors">{availableRegs.map(r => <option key={r} value={r}>{r}</option>)}</select><ChevronDown size={10} className="absolute right-1 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" /></div> )}
                <div className="relative group min-w-[80px]"><select value={fileId} onChange={(e) => handleEloSelect(e.target.value)} className="w-full appearance-none bg-slate-950/50 border border-slate-700 text-yellow-500/80 text-[10px] font-mono font-bold uppercase py-1.5 pl-2 pr-4 rounded hover:border-yellow-500/50 focus:border-yellow-500 transition-colors">{availableElos.map((opt: any) => <option key={opt.fileId} value={opt.fileId}>{formatEloLabel(opt.elo)}</option>)}</select><ChevronDown size={10} className="absolute right-1 top-1/2 -translate-y-1/2 text-yellow-600 pointer-events-none" /></div>
              </div>
            )}
            
            {source === 'tournament' && (
              <div className="relative min-w-[220px]">
                <select
                  className="w-full appearance-none bg-slate-950 border border-slate-700 text-slate-200 text-[10px] font-mono font-bold uppercase p-2 pr-7 rounded hover:border-cyan-500/50 focus:border-cyan-500 transition-colors"
                  value={activeFormatId}
                  onChange={(e) => handleFormatChange(e.target.value)}
                >
                  {currentFormats.map(f => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
                <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              </div>
            )}
          </div>
        </header>

        {/* INLINE KPIs — Minimal */}
        <div className="flex items-center gap-4 mb-5 text-[10px] font-mono text-slate-500">
          <span>
            {isShowdown ? 'Battles' : 'Teams'}: <span className="text-slate-300 font-bold">{total_teams_analyzed.toLocaleString()}</span>
          </span>
          <span className="text-slate-800">·</span>
          <span className="group relative cursor-help">
            Centralization: <span className={cn("font-bold", getCentColor(centralization_index))}>{centralization_index}%</span>
            <Info size={9} className="inline ml-0.5 text-slate-600" />
            <span className="absolute bottom-full mb-2 left-0 w-48 p-2 bg-slate-950 border border-slate-800 rounded text-[8px] text-slate-400 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20 leading-relaxed shadow-xl">
              Combined usage of top 6 Pokémon. Higher = more centralized meta.
            </span>
          </span>
        </div>

        {/* TOP CUT STANDINGS — Collapsible Banner */}
        {top_cut && top_cut.length > 0 && (
          <div className="mb-6">
            <button 
              onClick={() => setTopCutExpanded(!topCutExpanded)}
              className="w-full flex items-center justify-between bg-slate-900/60 border border-slate-800 rounded-lg px-3 py-2 hover:bg-slate-900 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <Trophy size={12} className="text-yellow-500" />
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Top Cut</span>
                <div className="flex items-center gap-2 ml-1">
                  {top_cut.slice(0, 3).map((tc, idx) => (
                    <div key={idx} className="flex items-center gap-1">
                      <span className={cn("text-[8px] font-bold", idx === 0 ? "text-yellow-500" : idx === 1 ? "text-zinc-400" : "text-slate-600")}>
                        #{tc.placement}
                      </span>
                      <span className="text-[9px] text-slate-400 hidden sm:inline">{tc.player_name.split(' ').slice(0, 2).join(' ')}</span>
                      <div className="flex -space-x-1 ml-0.5">
                        {tc.team.slice(0, 3).map((m, mi) => (
                          <img 
                            key={mi} 
                            src={`/images/pokemon/high-res/${m.pokemon_id}.png`} 
                            alt={m.pokemon_name} 
                            className="w-4 h-4 object-contain rounded-full bg-slate-800 border border-slate-700" 
                          onError={(e) => { 
                            const target = e.currentTarget as HTMLImageElement;
                            if (target.src.includes('PokeAPI')) {
                              target.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiM2NDc0OGIiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSIxMCIvPjxsaW5lIHgxPSJtNCIgeTE9Im00IiB4Mj0ibTIwIiB5Mj0ibTIwIi8+PC9zdmc+'; // lucide circle-off
                            } else {
                              target.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${m.pokemon_id}.png`; 
                            }
                          }}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <ChevronRight size={12} className={cn("text-slate-600 transition-transform", topCutExpanded && "rotate-90")} />
            </button>
            
            {topCutExpanded && (
              <div className="mt-1.5 bg-slate-900/40 border border-slate-800 rounded-lg p-2 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {top_cut.map((tc, idx) => (
                  <button 
                    key={idx} 
                    onClick={() => setSelectedTeam(tc)}
                    className="group flex items-center justify-between px-2.5 py-1.5 rounded bg-slate-950/80 border border-slate-800/60 hover:border-cyan-500/40 hover:bg-cyan-950/10 transition-all text-left"
                  >
                    <div className="flex items-center gap-2">
                      <span className={cn("text-[9px] font-bold w-4 text-center", tc.placement === 1 ? "text-yellow-500" : tc.placement === 2 ? "text-zinc-400" : "text-slate-600")}>
                        #{tc.placement}
                      </span>
                      <span className="text-[10px] font-mono text-slate-300 group-hover:text-cyan-400 transition-colors truncate max-w-[120px]">
                        {tc.player_name.split(' ').slice(0, 2).join(' ')}
                      </span>
                    </div>
                    <div className="flex items-center gap-0.5">
                      {tc.team.map((member, mIdx) => (
                        <img 
                          key={mIdx} 
                          src={`/images/pokemon/high-res/${member.pokemon_id}.png`} 
                          alt={member.pokemon_name} 
                          className="w-6 h-6 object-contain rounded-full bg-slate-900 border border-slate-700/50"
                          onError={(e) => { e.currentTarget.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${member.pokemon_id}.png`; }}
                        />
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TYPE ECOSYSTEM MATRIX */}
        {data.type_ecosystem && (
          <TypeEcosystem ecosystem={data.type_ecosystem} lang={lang} />
        )}

        {/* METAGAME GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-8">
          {/* MAIN: TOP POKEMON GRID */}
          <div className="lg:col-span-8 bg-slate-900/40 border border-slate-800 rounded-xl p-4 flex flex-col">
            <h3 className="text-[10px] font-mono text-slate-500 uppercase tracking-widest border-b border-slate-800 pb-2 mb-3">
              Metagame Centralization Core (Top {top_pokemon.length})
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {top_pokemon.map((p, idx) => (
                <button 
                  key={p.id}
                  onClick={() => handleDeepDive(p.id)}
                  className="group flex items-center gap-2.5 p-2 rounded-lg bg-slate-950/80 border border-slate-800 hover:border-cyan-500/40 hover:bg-cyan-950/15 transition-all text-left"
                  title={p.name}
                >
                  <div className="w-10 h-10 shrink-0 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center overflow-hidden">
                    <img 
                      src={`/images/pokemon/high-res/${p.id}.png`} 
                      alt={p.name} 
                      className="w-8 h-8 object-contain drop-shadow group-hover:scale-110 transition-transform" 
                      onError={(e) => { 
                        const target = e.currentTarget as HTMLImageElement;
                        if (target.src.includes('PokeAPI')) {
                          target.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiM2NDc0OGIiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSIxMCIvPjxsaW5lIHgxPSJtNCIgeTE9Im00IiB4Mj0ibTIwIiB5Mj0ibTIwIi8+PC9zdmc+'; // lucide circle-off
                        } else {
                          target.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.id}.png`; 
                        }
                      }}
                    />
                  </div>
                  <div className="flex flex-col min-w-0 flex-1 justify-center gap-0.5">
                    <span className="text-xs font-display font-bold text-slate-200 truncate">{p.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-cyan-500/70">#{idx+1}</span>
                      <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-cyan-500/40 rounded-full" style={{width: `${Math.min(p.usage_rate * 2, 100)}%`}} />
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">{p.usage_rate.toFixed(1)}%</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* SIDE: SYNERGY CORES */}
          <div className="lg:col-span-4 flex flex-col gap-5">
            <BattleGimmickGallery gimmicks={data.gimmicks} lang={lang} />
            
            <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 flex-1">
              <h3 className="text-[10px] font-mono text-slate-500 uppercase tracking-widest border-b border-slate-800 pb-2 mb-3 flex items-center gap-1.5">
                <BarChart3 size={10} className="text-cyan-500" /> Synergy Cores
              </h3>
              <div className="flex flex-col gap-2">
                {top_cores.map((c, i) => (
                  <div key={i} className="group flex items-center justify-between p-2 rounded-lg bg-slate-950/80 border border-slate-800/60 hover:border-cyan-500/30 transition-all relative overflow-hidden">
                    {/* Neon connection line on hover */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      <div className="absolute top-1/2 left-4 right-16 h-px bg-gradient-to-r from-cyan-500/40 via-cyan-400/20 to-transparent" />
                    </div>
                    <div className="flex items-center gap-0 relative z-10">
                      {c.core.map((pid, idx) => (
                        <div key={pid} className={cn("relative", idx > 0 && "-ml-2.5")} style={{zIndex: 10 - idx}} title={pid}>
                          <div className="w-7 h-7 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center overflow-hidden group-hover:border-cyan-500/50 transition-colors cursor-pointer"
                            onClick={() => handleDeepDive(pid)}
                          >
                            <img 
                              src={`/images/pokemon/high-res/${pid}.png`} 
                              alt={pid} 
                              className="w-8 h-8 object-contain drop-shadow group-hover:scale-110 transition-transform" 
                              onError={(e) => { 
                                const target = e.currentTarget as HTMLImageElement;
                                if (target.src.includes('PokeAPI')) {
                                  target.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiM2NDc0OGIiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSIxMCIvPjxsaW5lIHgxPSJtNCIgeTE9Im00IiB4Mj0ibTIwIiB5Mj0ibTIwIi8+PC9zdmc+'; // lucide circle-off
                                } else {
                                  target.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pid}.png`; 
                                }
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center gap-1.5 ml-2 relative z-10">
                      <div className="w-12 h-1 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-cyan-500/50 rounded-full group-hover:bg-cyan-400/70 transition-colors" style={{width: `${Math.min(c.usage_rate * 10, 100)}%`}} />
                      </div>
                      <span className="text-cyan-400 font-mono text-[9px] font-bold min-w-[32px] text-right group-hover:text-cyan-300 transition-colors">
                        {c.usage_rate.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* DRAWER */}
      <TacticalDrawer 
        isOpen={!!deepdiveParam}
        onClose={closeDrawer}
        pokemonId={deepdiveParam}
        formatId={activeFormatId}
        formatName={currentFormats.find(f => f.id === activeFormatId)?.name}
        lang={lang}
      />
      
      {/* TEAM MODAL */}
      <TeamDetailModal 
        isOpen={!!selectedTeam}
        onClose={() => setSelectedTeam(null)}
        teamData={selectedTeam}
        lang={lang}
      />
    </>
  );
}
