'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldAlert, Copy, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { ITopCutTeam } from '@/types/competitive';
import TypeBadge from '@/components/ui/TypeBadge';
import { cn } from '@/lib/utils';

interface TeamDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamData: ITopCutTeam | null;
  lang: string;
}

const toSlug = (name: string) => name.toLowerCase().replace(/[''\.]/g, '').replace(/[\s:]+/g, '-').replace(/[^a-z0-9-]/g, '');

export default function TeamDetailModal({ isOpen, onClose, teamData, lang }: TeamDetailModalProps) {
  // Lock body scroll
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

  if (!teamData) return null;

  const handleCopyPaste = (paste: string) => {
    navigator.clipboard.writeText(paste);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6" data-lenis-prevent="true">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-4xl bg-slate-950 border border-slate-700 shadow-2xl rounded-xl overflow-hidden flex flex-col max-h-[85vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/50">
              <div className="flex items-center gap-3">
                <div className={cn("w-8 h-8 rounded-full flex items-center justify-center font-display font-bold text-sm", 
                   teamData.placement === 1 ? "bg-yellow-500 text-black" : 
                   teamData.placement === 2 ? "bg-zinc-400 text-black" : "bg-slate-800 text-slate-300"
                )}>
                   #{teamData.placement}
                </div>
                <div>
                  <h2 className="text-base font-display font-bold text-white uppercase tracking-wider">{teamData.player_name}</h2>
                  <p className="text-[9px] font-mono text-cyan-500">Top Cut Roster</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                 <button 
                  onClick={() => handleCopyPaste(teamData.poke_paste)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-white transition-colors text-[10px] font-mono group border border-slate-600"
                 >
                    <Copy size={12} className="group-hover:text-emerald-400 transition-colors" /> PokePaste
                 </button>
                 <button 
                   onClick={onClose}
                   className="p-1.5 rounded-full hover:bg-slate-800 transition-colors text-slate-400 hover:text-white"
                 >
                   <X size={18} />
                 </button>
              </div>
            </div>

            {/* Poke Grid - Custom scrollbar */}
            <div 
              className="flex-1 overflow-y-auto p-4 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900/20 via-slate-950 to-slate-950"
              style={{ scrollbarWidth: 'thin', scrollbarColor: '#334155 transparent' }}
            >
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                 {teamData.team.map((member, i) => {
                    const itemSlug = toSlug(member.item || 'no-item');
                    const abilitySlug = toSlug(member.ability || 'unknown');
                    const isTeraValid = member.tera_type && member.tera_type !== 'Unknown' && member.tera_type.toLowerCase() !== 'none' && member.tera_type.toLowerCase() !== 'nothing';
                    const pkmSlug = toSlug(member.pokemon_name || '');

                    return (
                       <div key={i} className="flex flex-col bg-slate-900/60 border border-slate-800 rounded-lg overflow-hidden hover:border-slate-600 transition-colors">
                          <header className="relative flex items-center gap-2 p-2.5 bg-slate-900 border-b border-slate-800">
                              <div className="z-10 absolute -top-3 -right-3 opacity-10 pointer-events-none">
                                <img 
                                  src={`/images/pokemon/high-res/${member.pokemon_id}.png`} 
                                  alt={member.pokemon_name} 
                                  className="w-24 h-24 object-contain" 
                                  onError={(e) => { 
                                    const target = e.currentTarget as HTMLImageElement;
                                    if (target.src.includes('PokeAPI')) {
                                      target.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiM2NDc0OGIiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSIxMCIvPjxsaW5lIHgxPSJtNCIgeTE9Im00IiB4Mj0ibTIwIiB5Mj0ibTIwIi8+PC9zdmc+';
                                    } else {
                                      target.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${member.pokemon_id}.png`; 
                                    }
                                  }}
                                />
                              </div>
                              <div className="flex items-center gap-2 z-10 w-full">
                                <img 
                                  src={`/images/pokemon/high-res/${member.pokemon_id}.png`} 
                                  alt={member.pokemon_name} 
                                  className="w-10 h-10 object-contain drop-shadow" 
                                  onError={(e) => { 
                                    const target = e.currentTarget as HTMLImageElement;
                                    if (target.src.includes('PokeAPI')) {
                                      target.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiM2NDc0OGIiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSIxMCIvPjxsaW5lIHgxPSJtNCIgeTE9Im00IiB4Mj0ibTIwIiB5Mj0ibTIwIi8+PC9zdmc+';
                                    } else {
                                      target.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${member.pokemon_id}.png`; 
                                    }
                                  }}
                                />
                                <Link href={`/${lang}/pokedex/${member.pokemon_id}`} className="text-xs font-display font-medium text-white truncate hover:text-cyan-400 transition-colors">
                                  {member.pokemon_name}
                                </Link>
                              </div>
                          </header>

                          <div className="p-2.5 flex flex-col gap-2.5 text-[10px] font-mono">
                             {/* Ability & Item */}
                             <div className="flex flex-col gap-1.5 border-b border-slate-800/60 pb-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-[8px] text-slate-500 uppercase">Ability</span>
                                  <Link href={`/${lang}/abilities/${abilitySlug}`} className="text-cyan-400 hover:text-cyan-300 truncate text-right max-w-[70%]">
                                     {member.ability}
                                  </Link>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-[8px] text-slate-500 uppercase">Item</span>
                                  <Link href={`/${lang}/items/${itemSlug}`} className="text-yellow-400 hover:text-yellow-300 truncate flex items-center gap-1 justify-end text-right max-w-[70%]">
                                     <img src={`/images/items/high-res/${itemSlug}.png`} alt={member.item} className="w-3 h-3 object-contain inline" onError={(e) => e.currentTarget.style.display = 'none'} />
                                     {member.item}
                                  </Link>
                                </div>
                             </div>

                             {/* Moves */}
                             <div className="flex flex-col gap-1">
                                {member.moves.map((move, mIdx) => (
                                  <Link key={mIdx} href={`/${lang}/moves/${toSlug(move)}`} className="text-slate-300 bg-slate-950 border border-slate-800 px-1.5 py-1 rounded truncate hover:bg-slate-800 hover:text-white transition-colors text-[9px]">
                                     {move}
                                  </Link>
                                ))}
                             </div>

                             {/* Tera — Compact */}
                             {isTeraValid && (
                               <div className="flex items-center justify-between bg-slate-950 px-1.5 py-1 rounded border border-slate-800">
                                  <span className="text-[8px] text-slate-500 uppercase flex items-center gap-1"><ShieldAlert size={8}/> Tera</span>
                                  <div className="scale-[0.6] origin-right">
                                     {member.tera_type?.toLowerCase() === 'stellar' ? (
                                        <div className="flex items-center gap-1 text-cyan-400 font-bold border border-cyan-500 bg-cyan-500/20 px-3 py-1.5 rounded-full shadow-[0_0_10px_rgba(34,211,238,0.4)]">
                                            <Sparkles size={16} /> <span className="text-[12px] uppercase">Stellar</span>
                                        </div>
                                     ) : (
                                        <TypeBadge type={member.tera_type?.toLowerCase() as any} lang={lang as any} />
                                     )}
                                  </div>
                               </div>
                             )}
                          </div>
                       </div>
                    );
                 })}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
