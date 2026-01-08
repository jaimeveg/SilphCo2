'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { BarChart3, RefreshCw, ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { IPokemon } from '@/types/interfaces';
import { POKEDEX_DICTIONARY, Lang } from '@/lib/pokedexDictionary';

interface Props {
  stats: IPokemon['stats'];
  lang: Lang;
}

const NATURE_TABLE: Record<string, { up?: string; down?: string }> = {
  hardy: {}, lonely: { up: 'atk', down: 'def' }, brave: { up: 'atk', down: 'spe' }, adamant: { up: 'atk', down: 'spa' }, naughty: { up: 'atk', down: 'spd' },
  bold: { up: 'def', down: 'atk' }, docile: {}, relaxed: { up: 'def', down: 'spe' }, impish: { up: 'def', down: 'spa' }, lax: { up: 'def', down: 'spd' },
  timid: { up: 'spe', down: 'atk' }, hasty: { up: 'spe', down: 'def' }, serious: {}, jolly: { up: 'spe', down: 'spa' }, naive: { up: 'spe', down: 'spd' },
  modest: { up: 'spa', down: 'atk' }, mild: { up: 'spa', down: 'def' }, quiet: { up: 'spa', down: 'spe' }, bashful: {}, rash: { up: 'spa', down: 'spd' },
  calm: { up: 'spd', down: 'atk' }, gentle: { up: 'spd', down: 'def' }, sassy: { up: 'spd', down: 'spe' }, careful: { up: 'spd', down: 'spa' }, quirky: {}
};

const STAT_KEYS = ['hp', 'atk', 'def', 'spa', 'spd', 'spe'];

const calculateStat = (base: number, key: string, level: number, iv: number, ev: number, natureKey: string) => {
  if (key === 'hp') {
    if (base === 1) return 1; 
    return Math.floor(((2 * base + iv + Math.floor(ev / 4)) * level) / 100) + level + 10;
  }
  let val = Math.floor(((2 * base + iv + Math.floor(ev / 4)) * level) / 100) + 5;
  const nature = NATURE_TABLE[natureKey];
  if (nature?.up === key) val = Math.floor(val * 1.1);
  if (nature?.down === key) val = Math.floor(val * 0.9);
  return val;
};

const calculateMaxPotential = (base: number, key: string, level: number) => {
    if (key === 'hp') {
        if (base === 1) return 1;
        return Math.floor(((2 * base + 31 + 63) * level) / 100) + level + 10;
    }
    const raw = Math.floor(((2 * base + 31 + 63) * level) / 100) + 5;
    return Math.floor(raw * 1.1);
};

const getNatureModString = (natureKey: string) => {
    const n = NATURE_TABLE[natureKey];
    if (!n?.up) return "";
    return `(+${n.up.toUpperCase().slice(0,3)} / -${n.down!.toUpperCase().slice(0,3)})`;
};

const NatureSelector = ({ value, onChange, options, dict }: any) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) setIsOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // @ts-ignore
    const label = dict.natures?.[value] || value;
    const modString = getNatureModString(value);

    return (
        <div className="relative w-full" ref={containerRef}>
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="w-full bg-slate-950 border border-slate-800 hover:border-cyan-500/50 text-cyan-500 text-[10px] font-bold rounded px-2 py-1 flex justify-between items-center transition-colors h-6"
            >
                <div className="flex items-center gap-1 truncate">
                    <span className="capitalize">{label}</span>
                    {modString && <span className="text-[8px] text-slate-500 font-mono">{modString}</span>}
                </div>
                <ChevronDown size={10} className={cn("transition-transform ml-1", isOpen && "rotate-180")} />
            </button>
            {isOpen && (
                <div className="absolute top-full left-0 w-full mt-1 max-h-[160px] overflow-y-auto bg-slate-900 border border-slate-700 rounded shadow-xl z-50 custom-scrollbar">
                    {options.map((opt: string) => {
                        const optMod = getNatureModString(opt);
                        return (
                            <button
                                key={opt}
                                onClick={() => { onChange(opt); setIsOpen(false); }}
                                className={cn(
                                    "w-full text-left px-2 py-1 text-[9px] uppercase font-mono hover:bg-slate-800 transition-colors flex justify-between items-center",
                                    opt === value ? "text-cyan-400 bg-slate-950/50" : "text-slate-400"
                                )}
                            >
                                <div className="flex gap-1">
                                    {/* @ts-ignore */}
                                    <span>{dict.natures?.[opt] || opt}</span>
                                    <span className="opacity-50">{optMod}</span>
                                </div>
                                {opt === value && <Check size={10} />}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default function VisualStats({ stats, lang }: Props) {
  const dict = POKEDEX_DICTIONARY[lang];
  
  const [level, setLevel] = useState<number | ''>(50);
  const [nature, setNature] = useState<string>('serious');
  const [ivs, setIvs] = useState<Record<string, number>>({ hp:31, atk:31, def:31, spa:31, spd:31, spe:31 });
  const [evs, setEvs] = useState<Record<string, number>>({ hp:0, atk:0, def:0, spa:0, spd:0, spe:0 });

  const resetStats = () => {
    setIvs({ hp:31, atk:31, def:31, spa:31, spd:31, spe:31 });
    setEvs({ hp:0, atk:0, def:0, spa:0, spd:0, spe:0 });
    setNature('serious');
    setLevel(50);
  };

  const handleLevelChange = (rawVal: string) => {
    if (rawVal === '') { setLevel(''); return; }
    const val = Number(rawVal);
    if (val > 100) return; 
    setLevel(Math.max(0, val));
  };

  const effectiveLevel = level === '' ? 0 : level;

  const handleIvChange = (key: string, val: number) => setIvs(prev => ({ ...prev, [key]: isNaN(val) ? 0 : Math.max(0, Math.min(31, val)) }));
  const handleEvChange = (key: string, val: number) => setEvs(prev => ({ ...prev, [key]: isNaN(val) ? 0 : Math.max(0, Math.min(252, val)) }));

  const orderedStats = useMemo(() => {
    return STAT_KEYS.map(key => {
      const found = stats.find(s => {
        if (key === 'hp' && s.label.toLowerCase() === 'hp') return true;
        if (key === 'atk' && (s.label.toLowerCase() === 'attack' || s.label === 'ATK')) return true;
        if (key === 'def' && (s.label.toLowerCase() === 'defense' || s.label === 'DEF')) return true;
        if (key === 'spa' && (s.label.includes('special-attack') || s.label === 'SPA')) return true;
        if (key === 'spd' && (s.label.includes('special-defense') || s.label === 'SPD')) return true;
        if (key === 'spe' && (s.label.toLowerCase() === 'speed' || s.label === 'SPE')) return true;
        return false;
      });
      return { key, label: found?.label || key.toUpperCase(), base: found?.value || 0 };
    });
  }, [stats]);

  return (
    <div className="w-full bg-slate-900/40 border border-slate-800 rounded-xl p-3 backdrop-blur-md flex flex-col gap-3">
      
      {/* HEADER COMPACTO */}
      <div className="flex flex-wrap justify-between items-end gap-2 pb-2 border-b border-slate-800/50">
        <div className="flex items-center gap-2">
            <div className="p-1.5 bg-slate-950 rounded border border-slate-800">
                <BarChart3 className="text-cyan-500" size={14} />
            </div>
            <div>
                <h3 className="text-[10px] font-display font-bold text-white uppercase tracking-widest leading-none">{dict.labels.stats_title}</h3>
                <p className="text-[8px] text-slate-500 font-mono leading-none mt-0.5">COMPETITIVE ENGINE</p>
            </div>
        </div>

        <div className="flex items-center gap-2 flex-1 justify-end">
             {/* INPUT NIVEL */}
             <div className="flex items-center gap-1 bg-slate-950 rounded border border-slate-800 px-1 py-0.5">
                <label className="text-[8px] font-mono text-slate-500 uppercase">{dict.labels.level}</label>
                <input 
                    type="number" min="0" max="100" 
                    value={level} 
                    onChange={(e) => handleLevelChange(e.target.value)}
                    placeholder="0"
                    className="bg-transparent text-cyan-400 text-[10px] font-bold outline-none w-8 text-center no-spinners placeholder-slate-700"
                />
            </div>
            <div className="w-32 md:w-40">
                <NatureSelector value={nature} onChange={setNature} options={Object.keys(NATURE_TABLE)} dict={dict} />
            </div>
            <button onClick={resetStats} className="p-1 text-slate-500 hover:text-cyan-400 transition-colors" title="Reset">
                <RefreshCw size={12} />
            </button>
        </div>
      </div>

      {/* STATS GRID */}
      <div className="flex flex-col gap-1.5">
        <div className="grid grid-cols-[30px_35px_1fr_30px_35px_35px] gap-2 px-1 opacity-60">
            <span className="text-[8px] font-mono uppercase text-center">Stat</span>
            <span className="text-[8px] font-mono uppercase text-center">Base</span>
            <span className="text-[8px] font-mono uppercase text-center">Analysis</span>
            <span className="text-[8px] font-mono uppercase text-center font-bold text-cyan-500">Real</span>
            <span className="text-[8px] font-mono uppercase text-center font-bold text-slate-400">IV</span>
            <span className="text-[8px] font-mono uppercase text-center font-bold text-emerald-400">EV</span>
        </div>

        {orderedStats.map(({ key, label, base }) => {
            const realVal = calculateStat(base, key, effectiveLevel, ivs[key], evs[key], nature);
            
            const baseWidth = Math.min((base / 255) * 100, 100);
            
            const maxPotential = calculateMaxPotential(base, key, effectiveLevel);
            const dynamicScale = Math.max(255, maxPotential > 0 ? maxPotential : 255); 
            const realWidth = Math.min((realVal / dynamicScale) * 100, 100);

            let tierColor = "bg-red-500";
            if (base >= 60) tierColor = "bg-amber-400";
            if (base >= 90) tierColor = "bg-emerald-400";
            if (base >= 120) tierColor = "bg-purple-500"; 

            const nat = NATURE_TABLE[nature];
            const isBoosted = nat?.up === key;
            const isHindered = nat?.down === key;
            const labelColor = isBoosted ? "text-red-400" : (isHindered ? "text-blue-400" : "text-slate-400");
            const labelSymbol = isBoosted ? "+" : (isHindered ? "-" : "");

            return (
                <div key={key} className="grid grid-cols-[30px_35px_1fr_30px_35px_35px] gap-2 items-center group hover:bg-slate-950/30 rounded py-0.5 transition-colors">
                    
                    {/* LABEL */}
                    <span className={cn("text-[9px] font-bold font-mono uppercase text-center", labelColor)}>
                        {key.toUpperCase()}{labelSymbol}
                    </span>

                    {/* VALOR BASE EN CAJA (Soft White) */}
                    <div className="flex items-center justify-center bg-slate-950/80 border border-slate-800 rounded px-1.5 py-0.5 min-w-[24px]">
                        <span className="text-[9px] font-mono text-slate-300 font-bold">{base}</span>
                    </div>

                    {/* DUAL BAR SYSTEM */}
                    <div className="relative h-5 w-full flex flex-col justify-center gap-[1px]">
                        {/* Upper Bar: BASE (Tier Color) */}
                        <div className="relative h-1 w-full bg-slate-800/50 rounded-r-full overflow-hidden">
                             <div className={cn("absolute top-0 left-0 h-full opacity-90", tierColor)} style={{ width: `${baseWidth}%` }} />
                        </div>
                        {/* Lower Bar: REAL (Cyan Suavizado) */}
                        <div className="relative h-1 w-full bg-slate-800/50 rounded-r-full overflow-hidden">
                             <div className="absolute top-0 left-0 h-full bg-cyan-500 shadow-[0_0_6px_rgba(6,182,212,0.5)]" style={{ width: `${realWidth}%` }} />
                        </div>
                    </div>

                    <span className={cn("text-[9px] font-mono font-bold text-center", isBoosted ? "text-red-300" : isHindered ? "text-blue-300" : "text-white")}>
                        {realVal}
                    </span>

                    <input 
                        type="number" min="0" max="31" 
                        value={ivs[key]} 
                        onChange={(e) => handleIvChange(key, Number(e.target.value))}
                        className="bg-slate-900 border border-slate-800 focus:border-cyan-500 text-slate-300 text-[9px] rounded text-center h-5 outline-none no-spinners"
                    />
                    <input 
                        type="number" min="0" max="252" step="4"
                        value={evs[key]} 
                        onChange={(e) => handleEvChange(key, Number(e.target.value))}
                        className="bg-slate-900 border border-slate-800 focus:border-emerald-500 text-emerald-300 text-[9px] rounded text-center h-5 outline-none no-spinners"
                    />
                </div>
            );
        })}
      </div>
    </div>
  );
}