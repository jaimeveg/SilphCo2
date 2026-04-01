'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, Activity, Percent, Sword, Shield, Zap, Diamond, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import UsageBar from '@/components/ui/UsageBar';
import TypeBadge from '@/components/ui/TypeBadge';

interface TacticalDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  pokemonId?: string;
  formatId?: string;
  formatName?: string;
  lang: string;
}

const toSlug = (name: string) => name.toLowerCase().replace(/[''\.]/g, '').replace(/[\s:]+/g, '-').replace(/[^a-z0-9-]/g, '');

export default function TacticalDrawer({ isOpen, onClose, pokemonId, formatId, formatName, lang }: TacticalDrawerProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && pokemonId && formatId) {
      setLoading(true);
      fetch(`/data/competitive/${formatId}/${pokemonId}.json`)
        .then(res => res.json())
        .then(json => {
          setData(json);
          setLoading(false);
        })
        .catch(err => {
          console.error('Failed to load deep dive data', err);
          setData(null);
          setLoading(false);
        });
    } else {
      setData(null);
    }
  }, [isOpen, pokemonId, formatId]);

  // Lock html and body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      return () => { 
        document.body.style.overflow = ''; 
        document.documentElement.style.overflow = ''; 
      };
    }
  }, [isOpen]);

  const renderTopList = (record: Record<string, number>, total: number, linkPrefix?: string) => {
    const entries = Object.entries(record || {})
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    if (entries.length === 0) return <p className="text-xs text-slate-600 font-mono">No data</p>;

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {entries.map(([key, count]) => {
          const rawPc = (count / (data.usage_metrics.base_weight || data.usage_metrics.raw)) * 100;
          const slug = toSlug(key);
          const content = (
            <UsageBar
              key={key} 
              label={key.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} 
              value={rawPc} 
              subLabel={`${rawPc.toFixed(1)}%`}
              height="h-3.5"
              color="bg-cyan-500/40" 
            />
          );
          if (linkPrefix) {
            return (
              <Link key={key} href={`/${lang}/${linkPrefix}/${slug}`} className="block hover:brightness-125 transition-all">
                {content}
              </Link>
            );
          }
          return <div key={key}>{content}</div>;
        })}
      </div>
    );
  };

  const pkmName = data?.name || pokemonId || '???';

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40"
            data-lenis-prevent="true"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full sm:w-[480px] md:w-[560px] bg-slate-950/95 backdrop-blur-xl border-l border-slate-800 shadow-2xl shadow-black z-50 flex flex-col"
            data-lenis-prevent="true"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-800/60 bg-slate-900/40">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-xl bg-slate-900/80 border border-slate-700 flex items-center justify-center overflow-hidden shrink-0">
                  <img 
                    src={`/images/pokemon/high-res/${pokemonId}.png`} 
                    alt={pkmName}
                    className="w-12 h-12 object-contain drop-shadow-lg"
                    onError={(e) => { e.currentTarget.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemonId}.png`; }}
                  />
                </div>
                <div>
                   <h2 className="text-lg font-display font-bold text-white uppercase tracking-wider">{pkmName}</h2>
                   <p className="text-[10px] font-mono text-cyan-500 flex items-center gap-1">
                     <Activity size={10}/> Deep Dive Analysis
                   </p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 rounded-full hover:bg-slate-800 transition-colors text-slate-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content Body - custom scrollbar */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6" style={{ scrollbarWidth: 'thin', scrollbarColor: '#334155 transparent' }}>
               {loading ? (
                  <div className="w-full h-full flex items-center justify-center">
                     <p className="text-slate-500 font-mono text-sm animate-pulse">Loading Analysis...</p>
                  </div>
               ) : !data ? (
                  <div className="w-full h-full flex items-center justify-center">
                     <p className="text-red-500/70 font-mono text-sm">Failed to retrieve combat logs.</p>
                  </div>
               ) : (
                  <div className="flex flex-col gap-6">
                     {/* OVERVIEW - Roles left, Usage right */}
                     <div className="flex items-center gap-3 bg-slate-900/60 border border-slate-800 rounded-lg p-3">
                         {/* ROLES (left) */}
                         <div className="flex flex-wrap gap-1.5 flex-1">
                             {data.roles && data.roles.length > 0 ? data.roles.map((r: any) => (
                                 <span 
                                     key={r.role}
                                     className={cn(
                                         "text-[8px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded border",
                                         r.category === 'OFF' && "text-red-400 bg-red-500/10 border-red-500/20",
                                         r.category === 'SUP' && "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
                                         r.category === 'DEF' && "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
                                     )}
                                 >
                                     {r.label}
                                 </span>
                             )) : (
                                 <span className="text-[8px] font-mono text-slate-600 uppercase">No roles detected</span>
                             )}
                         </div>
                         {/* USAGE (right) */}
                         <div className="flex items-center gap-2 ml-auto shrink-0">
                             <div className="flex items-center gap-2">
                                 <Percent size={14} className="text-cyan-500" />
                                 <span className="text-lg font-display font-medium text-slate-200">
                                    {data.usage_metrics?.percent?.toFixed(1) || 0}%
                                 </span>
                             </div>
                             <div className="w-px h-6 bg-slate-800" />
                             <div className="flex flex-col">
                                 <span className="text-[8px] font-mono text-slate-500 uppercase">Raw</span>
                                 <span className="text-sm font-display text-slate-300">
                                    {data.usage_metrics?.raw?.toLocaleString() || 0}
                                 </span>
                             </div>
                         </div>
                     </div>

                     {/* DATA TABLES GRID */}
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {/* Abilities */}
                        <div>
                           <h3 className="text-[10px] font-mono text-slate-400 uppercase tracking-widest border-b border-slate-800 pb-1 mb-2 flex items-center gap-1.5"><Zap size={10}/> Abilities</h3>
                           {renderTopList(data.abilities, data.usage_metrics.base_weight || data.usage_metrics.raw, 'abilities')}
                        </div>
                        {/* Items */}
                        <div>
                           <h3 className="text-[10px] font-mono text-slate-400 uppercase tracking-widest border-b border-slate-800 pb-1 mb-2 flex items-center gap-1.5"><Shield size={10}/> Items</h3>
                           {renderTopList(data.items, data.usage_metrics.base_weight || data.usage_metrics.raw, 'items')}
                        </div>
                     </div>

                     {/* Moves */}
                     <div>
                        <h3 className="text-[10px] font-mono text-slate-400 uppercase tracking-widest border-b border-slate-800 pb-1 mb-2 flex items-center gap-1.5"><Sword size={10}/> Moveset</h3>
                        {renderTopList(data.moves, data.usage_metrics.base_weight || data.usage_metrics.raw, 'moves')}
                     </div>

                     {/* Teras */}
                     {data.teras && Object.keys(data.teras).length > 0 && Object.keys(data.teras).some(k => k.toLowerCase() !== 'unknown' && k.toLowerCase() !== 'none' && k.toLowerCase() !== 'nothing') && (
                        <div>
                            <h3 className="text-[10px] font-mono text-slate-400 uppercase tracking-widest border-b border-slate-800 pb-1 mb-2 flex items-center gap-1.5"><Diamond size={10}/> Tera Types</h3>
                            <div className="flex flex-wrap gap-2 mt-2">
                               {Object.entries(data.teras)
                                 .filter(([k]) => k.toLowerCase() !== 'unknown' && k.toLowerCase() !== 'none' && k.toLowerCase() !== 'nothing')
                                 .sort((a, b: any) => b[1] - (a[1] as number))
                                 .slice(0, 4)
                                 .map(([teraType, count]) => {
                                    const pc = ((count as number) / (data.usage_metrics.base_weight || data.usage_metrics.raw)) * 100;
                                    return (
                                       <div key={teraType} className="flex flex-col items-center gap-1 p-2 rounded bg-slate-900 border border-slate-800 min-w-[60px]">
                                          <div className="scale-75">
                                             {teraType.toLowerCase() === 'stellar' ? (
                                                <div className="flex items-center gap-1 text-cyan-400 font-bold border border-cyan-500/60 bg-cyan-500/20 px-3 py-1.5 rounded-full shadow-[0_0_10px_rgba(34,211,238,0.3)]">
                                                    <Sparkles size={16} /> <span className="text-[12px] uppercase">Stellar</span>
                                                </div>
                                             ) : (
                                                <TypeBadge type={teraType as any} lang={lang as any} />
                                             )}
                                          </div>
                                          <span className="text-[10px] font-mono text-slate-300">{pc.toFixed(1)}%</span>
                                       </div>
                                    );
                                 })
                               }
                            </div>
                        </div>
                     )}

                     {/* EV Spreads */}
                     {data.spreads && data.spreads.length > 0 && (
                        <div>
                            <h3 className="text-[10px] font-mono text-slate-400 uppercase tracking-widest border-b border-slate-800 pb-1 mb-2">EV Spreads</h3>
                            <div className="flex flex-col gap-1.5">
                               {data.spreads.slice(0, 5).map((s: any, i: number) => (
                                  <div key={i} className="flex items-center justify-between bg-slate-900/50 border border-slate-800/50 rounded px-2 py-1.5 text-[9px] font-mono">
                                     <span className="text-slate-400 font-bold">{s.nature}</span>
                                     <span className="text-slate-300">
                                        {s.evs.hp}/{s.evs.atk}/{s.evs.def}/{s.evs.spa}/{s.evs.spd}/{s.evs.spe}
                                     </span>
                                  </div>
                               ))}
                            </div>
                        </div>
                     )}

                     {/* Synergy / Teammates */}
                     <div>
                        <h3 className="text-[10px] font-mono text-slate-400 uppercase tracking-widest border-b border-slate-800 pb-1 mb-2">Strongest Synergies</h3>
                        <div className="flex flex-wrap gap-2">
                             {Object.entries(data.teammates || {})
                                .sort((a, b: any) => b[1] - (a[1] as number))
                                .slice(0, 6)
                                .map(([mateId, count]) => {
                                   const pc = ((count as number) / (data.usage_metrics.base_weight || data.usage_metrics.raw)) * 100;
                                   return (
                                      <div key={mateId} className="flex items-center gap-2 pr-3 py-1 bg-slate-900/50 border border-slate-800 rounded-full" title={`${pc.toFixed(1)}% Co-usage`}>
                                         <div className="w-7 h-7 rounded-full bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center">
                                           <img 
                                             src={`/images/pokemon/high-res/${mateId}.png`} 
                                             alt={mateId}
                                             className="w-6 h-6 object-contain"
                                             onError={(e) => { e.currentTarget.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${mateId}.png`; }}
                                           />
                                         </div>
                                         <span className="font-mono text-[10px] text-slate-300">{pc.toFixed(0)}%</span>
                                      </div>
                                   );
                                })
                             }
                        </div>
                     </div>
                  </div>
               )}
            </div>

            {/* Footer Bridge to Pokedex */}
            <div className="mt-auto p-3 border-t border-slate-800 bg-slate-950">
               <Link
                 href={`/${lang}/pokedex/${pokemonId}?tab=PVP&format=${formatId?.startsWith('showdown_') ? formatId.replace('showdown_', '') + '.json' : (formatName || formatId?.replace('tournament_', '').replace('vgc_', ''))}`}
                 className="flex items-center justify-center gap-2 w-full p-3 rounded bg-cyan-950/30 border border-cyan-500/30 hover:bg-cyan-900/50 hover:border-cyan-400 transition-all font-mono text-xs text-cyan-300 uppercase tracking-[0.2em] group"
               >
                 [ <span className="group-hover:text-white transition-colors">ACCESS FULL TACTICAL FILE</span> ] <ExternalLink size={12} className="group-hover:translate-x-1 transition-transform" />
               </Link>
            </div>

          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
