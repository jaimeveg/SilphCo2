'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Image from 'next/image';
import { IItemDetail } from '@/types/items';
import { POKEDEX_DICTIONARY, Lang } from '@/lib/pokedexDictionary';
import { Search, Calculator, Check, Power, ChevronDown, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  item: IItemDetail;
  lang: Lang;
  t: any; // dictionary for calculator
}

const STAT_KEYS = ['atk', 'def', 'spa', 'spd', 'spe'];
const NATURE_TABLE: Record<string, { up?: string; down?: string }> = {
  hardy: {}, lonely: { up: 'atk', down: 'def' }, brave: { up: 'atk', down: 'spe' }, adamant: { up: 'atk', down: 'spa' }, naughty: { up: 'atk', down: 'spd' },
  bold: { up: 'def', down: 'atk' }, docile: {}, relaxed: { up: 'def', down: 'spe' }, impish: { up: 'def', down: 'spa' }, lax: { up: 'def', down: 'spd' },
  timid: { up: 'spe', down: 'atk' }, hasty: { up: 'spe', down: 'def' }, serious: {}, jolly: { up: 'spe', down: 'spa' }, naive: { up: 'spe', down: 'spd' },
  modest: { up: 'spa', down: 'atk' }, mild: { up: 'spa', down: 'def' }, quiet: { up: 'spa', down: 'spe' }, bashful: {}, rash: { up: 'spa', down: 'spd' },
  calm: { up: 'spd', down: 'atk' }, gentle: { up: 'spd', down: 'def' }, sassy: { up: 'spd', down: 'spe' }, careful: { up: 'spd', down: 'spa' }, quirky: {}
};

// Math Logic
const calculateStat = (base: number, key: string, level: number, iv: number, ev: number, natureKey: string, itemMult: number, isHpPercentageActive: boolean, hpFlatBonus: number) => {
  if (key === 'hp') {
    if (base === 1) return 1; 
    let val = Math.floor(((2 * base + iv + Math.floor(ev / 4)) * level) / 100) + level + 10;
    val += hpFlatBonus;
    return val;
  }
  let val = Math.floor(((2 * base + iv + Math.floor(ev / 4)) * level) / 100) + 5;
  const nature = NATURE_TABLE[natureKey];
  if (nature?.up === key) val = Math.floor(val * 1.1);
  if (nature?.down === key) val = Math.floor(val * 0.9);
  
  if (itemMult !== 1) {
    val = Math.floor(val * itemMult);
  }
  return val;
};

export default function ItemStatCalculator({ item, lang, t }: Props) {
  const dict = POKEDEX_DICTIONARY[lang];
  const [pokedex, setPokedex] = useState<any>(null);
  
  // Custom states
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedPoke, setSelectedPoke] = useState<any>(null);
  const [baseStats, setBaseStats] = useState<Record<string, number>>({ hp:160, atk:110, def:65, spa:65, spd:110, spe:30 });
  
  const [level, setLevel] = useState<number>(50);
  const [nature, setNature] = useState<string>('serious');
  const [ivs, setIvs] = useState<Record<string, number>>({ hp:31, atk:31, def:31, spa:31, spd:31, spe:31 });
  const [evs, setEvs] = useState<Record<string, number>>({ hp:0, atk:0, def:0, spa:0, spd:0, spe:0 });
  const [itemActive, setItemActive] = useState(true);

  // Load Pokedex
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/data/pokedex_base_stats.json');
        const data = await res.json();
        setPokedex(data);
        
        // Preload Snorlax
        const snorlax = Object.values(data).find((p: any) => p.name === 'snorlax');
        if (snorlax) {
          setSelectedPoke(snorlax);
          setBaseStats((snorlax as any).stats);
        }
      } catch (e) {
        console.error(e);
      }
    }
    load();
  }, []);

  const pokeList = useMemo(() => {
    if (!pokedex) return [];
    return Object.values(pokedex).filter((p: any) => p.name.includes(searchTerm.toLowerCase())).slice(0, 50);
  }, [pokedex, searchTerm]);

  const selectPokemon = (p: any) => {
    setSelectedPoke(p);
    setBaseStats(p.stats);
    setSearchTerm('');
    setIsSearchOpen(false);
  };

  const handleIvChange = (key: string, val: number) => setIvs(prev => ({ ...prev, [key]: isNaN(val) ? 0 : Math.max(0, Math.min(31, val)) }));
  const handleEvChange = (targetKey: string, val: number) => {
    let numVal = isNaN(val) ? 0 : val;
    numVal = Math.max(0, Math.min(252, numVal));
    setEvs(prev => {
        const currentTotal = Object.entries(prev).reduce((acc, [key, value]) => key === targetKey ? acc : acc + value, 0);
        const remaining = 510 - currentTotal;
        return { ...prev, [targetKey]: Math.min(numVal, remaining) };
    });
  };

  const mechanics = item.mechanics?.[0] || {};
  const isStageMode = mechanics.boost === 'stage';

  return (
    <div className="w-full bg-slate-900/60 border border-slate-800 rounded-xl p-4 backdrop-blur-md flex flex-col gap-4">
      
      {/* HEADER */}
      <div className="flex flex-wrap justify-between items-center gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
            <div className="p-1.5 bg-cyan-500/10 rounded border border-cyan-500/30">
                <Calculator className="text-cyan-500" size={16} />
            </div>
            <div>
                <h3 className="text-sm font-display font-bold text-white uppercase tracking-widest leading-none">{t.title}</h3>
                <p className="text-[9px] text-slate-500 font-mono mt-1 uppercase">{t.subtitle || "Real-time stat mutations"}</p>
            </div>
        </div>

        <button 
          onClick={() => setItemActive(!itemActive)}
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded border text-[10px] font-mono font-bold uppercase transition-all shadow-sm",
            itemActive ? "bg-cyan-500/20 text-cyan-400 border-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.2)]" : "bg-slate-950 text-slate-500 border-slate-800"
          )}
        >
          <Power size={12} />
          {t.item_active}
        </button>
      </div>

      <div className="flex flex-col gap-4">
        {/* POKEMON SELECTOR */}
        <div className="w-full flex flex-col gap-3">
          <div className="relative">
            <label className="text-[10px] font-mono text-cyan-500 font-bold uppercase tracking-widest mb-2 flex items-center gap-1 border-b border-cyan-500/20 pb-1">
              <Activity size={12} /> {t.select_pokemon}
            </label>
            
            {selectedPoke && !isSearchOpen ? (
              <div 
                className="w-full bg-slate-950 border border-slate-800 hover:border-cyan-500/50 rounded-lg p-2 flex items-center justify-between cursor-pointer group transition-colors"
                onClick={() => setIsSearchOpen(true)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 relative bg-slate-900 rounded-full border border-slate-800 p-0.5 overflow-hidden">
                    <Image 
                      src={`/images/pokemon/high-res/${selectedPoke.id}.png`} 
                      alt={selectedPoke.name} fill className="object-contain" unoptimized 
                      onError={(e) => {
                        e.currentTarget.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${selectedPoke.id}.png`;
                      }}
                    />
                  </div>
                  <div>
                    <div className="text-xs text-slate-200 font-bold capitalize group-hover:text-cyan-400 transition-colors">{selectedPoke.name.replace('-', ' ')}</div>
                    <div className="flex gap-1 mt-0.5">
                      {selectedPoke.types.map((type: string) => (
                        <span key={type} className="text-[8px] font-mono uppercase bg-slate-800 text-slate-400 px-1 rounded">{type}</span>
                      ))}
                    </div>
                  </div>
                </div>
                <Search size={14} className="text-slate-500 group-hover:text-cyan-500" />
              </div>
            ) : (
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input 
                  autoFocus={isSearchOpen}
                  type="text" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={t.select_pokemon}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 text-sm text-slate-200 rounded-lg py-2 pl-9 pr-3 outline-none"
                />
                {(isSearchOpen || searchTerm) && (
                   <div className="absolute top-full left-0 w-full mt-2 bg-slate-900 border border-slate-700 rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto custom-scrollbar p-1">
                     {pokeList.map((p: any) => (
                       <div 
                         key={p.id} 
                         onClick={() => selectPokemon(p)}
                         className="flex items-center gap-3 p-2 hover:bg-slate-800 rounded cursor-pointer transition-colors"
                       >
                         <div className="w-6 h-6 relative shrink-0">
                           <Image 
                             src={`/images/pokemon/high-res/${p.id}.png`} 
                             alt={p.name} fill className="object-contain" unoptimized 
                             onError={(e) => {
                               e.currentTarget.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${p.id}.png`;
                             }}
                           />
                         </div>
                         <span className="text-xs text-slate-300 capitalize">{p.name.replace('-', ' ')}</span>
                       </div>
                     ))}
                     {pokeList.length === 0 && <div className="p-3 text-center text-xs text-slate-500">No results</div>}
                   </div>
                )}
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-[9px] font-mono text-slate-500 uppercase mb-1 block">{t.level}</label>
              <input 
                  type="number" min="1" max="100" 
                  value={level} onChange={(e) => setLevel(Number(e.target.value) || 1)}
                  className="w-full bg-slate-950 border border-slate-800 text-cyan-400 text-xs font-bold rounded p-2 outline-none text-center"
              />
            </div>
            <div className="flex-[2]">
              <label className="text-[9px] font-mono text-slate-500 uppercase mb-1 block">{t.nature}</label>
              <select 
                value={nature} onChange={(e) => setNature(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded p-2 outline-none uppercase font-mono"
              >
                {Object.keys(NATURE_TABLE).map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* STAT GRID COMPACT MODE */}
        <div className="flex-1 flex flex-col gap-1.5">
          <div className="grid grid-cols-[30px_35px_45px_35px_35px] gap-2 px-1 border-b border-slate-800 pb-1 mb-1">
              <span className="text-[8px] font-mono uppercase text-slate-500 text-center">Stat</span>
              <span className="text-[8px] font-mono uppercase text-slate-500 text-center">Base</span>
              <span className="text-[8px] font-mono uppercase text-center font-bold text-cyan-500">Eff</span>
              <span className="text-[8px] font-mono uppercase text-center font-bold text-slate-400">IV</span>
              <span className="text-[8px] font-mono uppercase text-center font-bold text-emerald-400">EV</span>
          </div>

          {STAT_KEYS.map((key) => {
              const base = baseStats[key] || 10;
              
              let itemMult = 1;
              let hpFlatBonus = 0;
              let isBoostedByItem = false;

              if (itemActive && !isStageMode && mechanics) {
                const rawBonus = (mechanics as any)[key];
                if (rawBonus) {
                  const isReduction = rawBonus < 0 || mechanics.effect_type === 'reduces';
                  const absBonus = Math.abs(rawBonus);
                  itemMult = isReduction ? Math.max(0, 1 - (absBonus / 100)) : 1 + (absBonus / 100); 
                  isBoostedByItem = true;
                }
              }

              const realVal = calculateStat(base, key, level, ivs[key], evs[key], nature, itemMult, false, hpFlatBonus);
              const isNatureBoost = NATURE_TABLE[nature]?.up === key;
              const isNatureHind = NATURE_TABLE[nature]?.down === key;
              
              const labelColor = isNatureBoost ? "text-red-400" : (isNatureHind ? "text-blue-400" : "text-slate-400");
              const labelSymbol = isNatureBoost ? "+" : (isNatureHind ? "-" : "");

              return (
                  <div key={key} className={cn("grid grid-cols-[30px_35px_45px_35px_35px] gap-2 items-center group rounded p-1 transition-colors", isBoostedByItem && itemActive ? "bg-cyan-500/5 border border-cyan-500/20" : "")}>
                      <span className={cn("text-[9px] font-bold font-mono uppercase text-center", labelColor)}>
                          {key}{labelSymbol}
                      </span>

                      <div className="flex items-center justify-center bg-slate-950/80 border border-slate-800 rounded px-1.5 py-0.5">
                          <span className="text-[9px] font-mono text-slate-400">{base}</span>
                      </div>

                      <div className="flex justify-center flex-col items-center">
                        <span className={cn("text-[11px] font-mono font-bold leading-none", isBoostedByItem && itemActive ? "text-cyan-400 drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]" : "text-white")}>
                            {realVal}
                        </span>
                      </div>

                      <input type="number" min="0" max="31" value={ivs[key]} onChange={(e) => handleIvChange(key, Number(e.target.value))} className="bg-slate-950 border border-slate-800 focus:border-cyan-500 text-slate-300 text-[10px] font-mono rounded text-center h-6 outline-none no-spinners" />
                      <input type="number" min="0" max="252" step="4" value={evs[key]} onChange={(e) => handleEvChange(key, Number(e.target.value))} className="bg-slate-950 border border-slate-800 focus:border-emerald-500 text-emerald-300 text-[10px] font-mono rounded text-center h-6 outline-none no-spinners" />
                  </div>
              );
          })}
          
        </div>
      </div>
    </div>
  );
}
