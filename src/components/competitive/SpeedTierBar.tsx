import React, { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { Wind, ChevronRight, ArrowBigLeftDash, ArrowBigRightDash } from 'lucide-react';

interface SpeedTierBarProps {
  top_pokemon: Array<{ id: string; name: string; speed?: number }>;
}

export function SpeedTierBar({ top_pokemon }: SpeedTierBarProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const sorted = useMemo(() => {
    const withSpeed = top_pokemon.filter(p => typeof p.speed === 'number' && p.speed > 0);
    const sortedDesc = [...withSpeed].sort((a, b) => b.speed! - a.speed!);
    const sortedAsc = [...withSpeed].sort((a, b) => a.speed! - b.speed!);

    // Función para obtener solo IDs únicos
    const dedupe = (arr: typeof withSpeed) => {
      const seen = new Set();
      return arr.filter(item => {
        if (seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
      });
    };

    const uniqueFastest = dedupe(sortedDesc);
    const uniqueSlowest = dedupe(sortedAsc);

    return {
      fastest: uniqueFastest.slice(0, 7),
      slowest: uniqueSlowest.slice(0, 7)
    };
  }, [top_pokemon]);

  if (sorted.fastest.length === 0) return null;

  const getResponsiveClass = (index: number) => {
    if (index < 2) return "flex";
    if (index === 2) return "hidden min-[480px]:flex";
    if (index === 3) return "hidden sm:flex";
    if (index === 4) return "hidden md:flex";
    if (index === 5) return "hidden lg:flex";
    return "hidden xl:flex";
  };

  return (
    <div className="flex flex-col gap-2 mb-6">
      {/* COLLAPSIBLE BANNER */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between bg-slate-900/60 border border-slate-800 rounded-lg px-3 py-2 hover:bg-slate-900 transition-colors group"
      >
        <div className="flex items-center gap-3">
          <Wind size={11} className="text-cyan-500/70" />
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider group-hover:text-cyan-400 transition-colors">
            Speed Tier Ecosystem
          </span>
        </div>
        <ChevronRight size={12} className={cn("text-slate-600 transition-transform", isExpanded && "rotate-90")} />
      </button>

      {/* EXPANDED CONTENT */}
      {isExpanded && (
        <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 h-fit flex flex-col gap-4 text-white animate-in fade-in slide-in-from-top-2">

          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 className="text-[10px] font-mono text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
              <Wind size={10} className="text-cyan-500" /> SPEED TIER ECOSYSTEM
            </h3>
          </div>

          <div className="relative flex items-center justify-between w-full h-20 bg-slate-950/50 rounded-lg border border-slate-800 px-2 sm:px-4 mt-1">
            {/* Línea conectora base */}
            <div className="absolute left-[5%] right-[5%] top-1/2 -translate-y-1/2 h-[2px] bg-gradient-to-r from-red-500/20 via-slate-700 to-cyan-500/20 pointer-events-none" />

            {/* Label central flotante */}
            <div className="absolute left-1/2 top-1/2 -translate-y-1/2 -translate-x-1/2 bg-slate-950 px-3 py-1 border border-slate-800 rounded-full flex items-center gap-1 text-slate-400 z-10 shadow-lg">
              <ArrowBigLeftDash size={12} className={cn("text-slate-600 transition-transform")} /><span className="text-[10px] font-mono font-bold tracking-widest">SLOWEST - FASTEST</span><ArrowBigRightDash size={12} className={cn("text-slate-600 transition-transform")} />
            </div>

            {/* Bando Izquierdo: Más Lentos */}
            <div className="flex items-center gap-1 md:gap-2 relative z-10">
              {sorted.slowest.map((p, idx) => (
                <div key={`slow-${p.id}`} className={cn("flex-col items-center gap-1 bg-slate-950 rounded-lg border border-slate-800/80 p-1 md:p-1.5", getResponsiveClass(idx))}>
                  <div className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center">
                    <img
                      src={`/images/pokemon/high-res/${p.id}.png`}
                      alt={p.name}
                      className="w-full h-full object-contain drop-shadow"
                      onError={(e) => {
                        const target = e.currentTarget as HTMLImageElement;
                        if (!target.src.includes('PokeAPI')) {
                          target.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.id}.png`;
                        }
                      }}
                    />
                  </div>
                  <div className="w-full text-center border-t border-slate-800 pt-0.5 mt-0.5">
                    <span className="text-[10px] font-mono font-bold text-red-400">{p.speed}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Bando Derecho: Más Rápidos */}
            <div className="flex items-center gap-1 md:gap-2 relative z-10 flex-row-reverse">
              {sorted.fastest.map((p, idx) => (
                <div key={`fast-${p.id}`} className={cn("flex-col items-center gap-1 bg-slate-950 rounded-lg border border-slate-800/80 p-1 md:p-1.5", getResponsiveClass(idx))}>
                  <div className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center">
                    <img
                      src={`/images/pokemon/high-res/${p.id}.png`}
                      alt={p.name}
                      className="w-full h-full object-contain drop-shadow"
                      onError={(e) => {
                        const target = e.currentTarget as HTMLImageElement;
                        if (!target.src.includes('PokeAPI')) {
                          target.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.id}.png`;
                        }
                      }}
                    />
                  </div>
                  <div className="w-full text-center border-t border-slate-800 pt-0.5 mt-0.5">
                    <span className="text-[10px] font-mono font-bold text-cyan-400">{p.speed}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
