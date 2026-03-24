'use client';

import { useState } from 'react';
import { ITypeEcosystem } from '@/types/competitive';
import TypeBadge from '@/components/ui/TypeBadge';
import { ChevronRight, ShieldAlert, Swords } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface TypeEcosystemProps {
  ecosystem: ITypeEcosystem;
  lang: string;
}

export default function TypeEcosystem({ ecosystem, lang }: TypeEcosystemProps) {
  const [expanded, setExpanded] = useState(false);
  const [activeType, setActiveType] = useState<string | null>(null);

  const typeEntries = Object.entries(ecosystem || {}).sort((a, b) => b[1].usage_rate - a[1].usage_rate);
  const maxUsage = typeEntries.length > 0 ? Math.max(...typeEntries.map(e => e[1].usage_rate)) : 1;

  if (typeEntries.length === 0) return null;

  const handleExpand = () => {
    if (!expanded) {
      setExpanded(true);
      if (!activeType && typeEntries.length > 0) {
        setActiveType(typeEntries[0][0]);
      }
    } else {
      setExpanded(false);
      setActiveType(null);
    }
  };

  const activeData = activeType ? ecosystem[activeType] : null;

  return (
    <div className="mb-6 flex flex-col gap-2">
      {/* HEADER BANNER */}
      <button 
        onClick={handleExpand}
        className="w-full flex items-center justify-between bg-slate-900/60 border border-slate-800 rounded-lg px-3 py-2 hover:bg-slate-900 transition-colors group"
      >
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
             {typeEntries.slice(0, 3).map(([t]) => (
                <div key={t} className="scale-[0.55] -m-2 opacity-80 group-hover:opacity-100 transition-opacity">
                    <TypeBadge type={t as any} lang={lang as any} />
                </div>
             ))}
          </div>
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Elemental Type Ecosystem</span>
        </div>
        <ChevronRight size={12} className={cn("text-slate-600 transition-transform", expanded && "rotate-90")} />
      </button>

      {/* EXPANDED CONTENT: SPLIT VIEW */}
      {expanded && activeData && (
        <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row gap-6 animate-in fade-in slide-in-from-top-2">
          
          {/* LEFT: MACRO INDEX (All Types) */}
          <div className="w-full md:w-5/12 flex flex-col gap-2 pr-2 border-r border-slate-800/50">
            <h3 className="text-[9px] font-mono text-slate-500 uppercase tracking-widest border-b border-slate-800/50 pb-1 mb-1">Global Distribution</h3>
            <div className="grid grid-cols-2 gap-1.5">
            {typeEntries.map(([typeSlug, stats]) => (
              <button 
                key={typeSlug} 
                onClick={() => setActiveType(typeSlug)}
                className={cn(
                  "flex justify-between items-center px-1.5 py-1 rounded transition-all text-left border",
                  activeType === typeSlug 
                    ? "bg-slate-800/80 border-slate-700 shadow-inner" 
                    : "bg-transparent border-transparent hover:bg-slate-800/40 hover:border-slate-800"
                )}
              >
                <div className="scale-75 origin-left -ml-1">
                  <TypeBadge type={typeSlug as any} lang={lang as any} />
                </div>
                <div className="flex flex-col items-end gap-0.5 min-w-[40px]">
                  <span className={cn("text-[9px] font-bold font-mono tracking-tighter", activeType === typeSlug ? "text-cyan-400" : "text-slate-300")}>
                    {(stats.usage_rate / 100).toFixed(2)} / TEAM
                  </span>
                  <div className="w-full h-1 bg-slate-950 rounded-full overflow-hidden">
                    <div className="h-full bg-cyan-500/50 rounded-full" style={{width: `${(stats.usage_rate / maxUsage) * 100}%`}} />
                  </div>
                </div>
              </button>
            ))}
            </div>
          </div>

          {/* RIGHT: ECOSYSTEM DRILL-DOWN */}
          <div className="flex-1 flex flex-col gap-5">
            {/* Header of Drill-down */}
            <div className="flex items-end justify-between border-b border-slate-800 pb-3">
               <div className="flex items-center gap-3">
                 <div className="scale-100 origin-left">
                    <TypeBadge type={activeType as any} lang={lang as any} />
                 </div>
                 <div className="flex flex-col">
                    <span className="text-xl font-display font-black text-white">{(activeData.usage_rate / 100).toFixed(2)}</span>
                    <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wide">Pokémon / Team</span>
                 </div>
               </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* DUAL-TYPE ARCHETYPES */}
              <div className="flex flex-col gap-3">
                 <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                   <Swords size={12} className="text-indigo-400"/> Arquetipos
                 </h4>
                 <div className="flex flex-col gap-1.5">
                   {Object.entries(activeData.combinations)
                     .sort((a, b) => b[1] - a[1])
                     .slice(0, 5)
                     .map(([comboSlug, count]) => {
                        const types = comboSlug.split('-');
                        const comboPerTm = (count * activeData.usage_rate) / (activeData.raw_count * 100);
                        return (
                          <div key={comboSlug} className="bg-slate-950/50 border border-slate-800/80 rounded px-2 py-1 flex items-center justify-between">
                            <div className="flex -space-x-1 scale-75 origin-left -ml-1">
                              {types.map(t => <TypeBadge key={t} type={t as any} lang={lang as any} />)}
                            </div>
                            <span className="text-[10px] font-bold text-indigo-300 font-mono tracking-tighter">{comboPerTm.toFixed(2)} / TEAM</span>
                          </div>
                        );
                   })}
                 </div>
              </div>

              {/* TEAMMATES SYNERGIES */}
              <div className="flex flex-col gap-3">
                 <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                   <ShieldAlert size={12} className="text-emerald-400"/> Sinergias (Equipo)
                 </h4>
                 <div className="flex flex-col gap-1.5">
                   {Object.entries(activeData.teammates || {})
                     .sort((a, b) => b[1] - a[1])
                     .slice(0, 5)
                     .map(([mateSlug, count]) => {
                        const synPerTm = (count * activeData.usage_rate) / (activeData.raw_count * 100);
                        return (
                          <div key={mateSlug} className="bg-slate-950/50 border border-slate-800/80 rounded px-2 py-1 flex items-center justify-between overflow-hidden">
                            <div className="scale-75 origin-left -my-1 -ml-1">
                               <TypeBadge type={mateSlug as any} lang={lang as any} />
                            </div>
                            <div className="text-[10px] font-mono text-emerald-500/80 font-bold tracking-tighter">
                              {synPerTm.toFixed(2)} / TEAM
                            </div>
                          </div>
                        );
                   })}
                 </div>
              </div>

            </div>

            {/* TOP CHAMPIONS */}
            <div className="flex flex-col gap-3 mt-2">
               <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-800/50 pb-1.5">
                 Metagame Champions
               </h4>
               <div className="flex flex-wrap gap-3">
                 {activeData.top_pkm.map((pkm) => (
                   <Link 
                     key={pkm.id}
                     href={`/${lang}/pokedex/${pkm.id}?tab=PVP`}
                     className="group flex flex-col items-center gap-1.5 p-2 rounded-lg bg-slate-950/80 border border-slate-800 hover:border-cyan-500/40 hover:bg-cyan-950/15 transition-all"
                     title={pkm.name}
                   >
                     <img 
                       src={`/images/pokemon/high-res/${pkm.id}.png`} 
                       alt={pkm.name} 
                       className="w-10 h-10 object-contain drop-shadow group-hover:scale-110 transition-transform" 
                       onError={(e) => { e.currentTarget.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pkm.id}.png`; }}
                     />
                     <span className="text-[9px] font-mono text-cyan-500">{pkm.usage_rate.toFixed(1)}%</span>
                   </Link>
                 ))}
               </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
