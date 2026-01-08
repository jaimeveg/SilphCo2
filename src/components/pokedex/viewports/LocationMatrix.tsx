'use client';

import { useState, useMemo, useEffect } from 'react';
import { Map, Waves, Footprints, AlertCircle } from 'lucide-react';
import { ILocationEncounter } from '@/types/interfaces';
import { Lang, POKEDEX_DICTIONARY } from '@/lib/pokedexDictionary';
import { cn } from '@/lib/utils';

interface Props {
  locations?: ILocationEncounter[];
  lang: Lang;
}

// Iconos de Método
const getMethodIcon = (method: string) => {
    if (method.includes('surf') || method.includes('fish')) return <Waves size={12} />;
    if (method.includes('walk')) return <Footprints size={12} />;
    return <AlertCircle size={12} />;
}

export default function LocationMatrix({ locations, lang }: Props) {
  const dict = POKEDEX_DICTIONARY[lang]; 
  const [activeGroup, setActiveGroup] = useState<string | null>(null);

  // Agrupar por Versión/Juego
  const groupedLocations = useMemo(() => {
    if (!locations || locations.length === 0) return null;
    
    const groups: Record<string, ILocationEncounter[]> = {};
    
    locations.forEach(loc => {
      // @ts-ignore
      const regionName = dict.regions[loc.region as keyof typeof dict.regions] || loc.region;
      const versionName = loc.version.charAt(0).toUpperCase() + loc.version.slice(1);
      const groupKey = loc.region !== 'Unknown' ? `${regionName} (${versionName})` : `${versionName} Version`;
      
      if (!groups[groupKey]) groups[groupKey] = [];
      groups[groupKey].push(loc);
    });

    return groups;
  }, [locations, dict]);

  // FIX CRÍTICO: Resetear activeGroup si cambia el Pokémon o las locations
  useEffect(() => {
      if (groupedLocations) {
          const keys = Object.keys(groupedLocations);
          // Si no hay grupo activo, O el grupo activo actual ya no existe en este Pokémon
          if (!activeGroup || !groupedLocations[activeGroup]) {
              setActiveGroup(keys[0] || null);
          }
      } else {
          setActiveGroup(null);
      }
  }, [groupedLocations, activeGroup]);

  if (!groupedLocations || !activeGroup || !groupedLocations[activeGroup]) {
    return (
        <div className="flex flex-col items-center justify-center h-32 border border-dashed border-slate-800 rounded-xl bg-slate-900/20 text-slate-500">
            <Map className="mb-2 opacity-50" size={24} />
            <span className="text-xs font-mono">{dict.labels.unknown_loc}</span>
        </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row gap-4 h-[350px]">
       
       {/* SIDEBAR: Selector de Juego/Región */}
       <div className="w-full md:w-1/3 bg-slate-950/30 rounded-xl border border-slate-800 flex flex-col overflow-hidden">
          <div className="p-3 border-b border-slate-800 bg-slate-900/50">
             <h4 className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">{dict.labels.loc_title}</h4>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
             {Object.keys(groupedLocations).map(key => (
                <button
                  key={key}
                  onClick={() => setActiveGroup(key)}
                  className={cn(
                    "w-full text-left px-3 py-2.5 rounded text-[10px] font-mono font-bold uppercase transition-all border flex justify-between items-center group",
                    activeGroup === key
                      ? "bg-cyan-950/40 border-cyan-500/50 text-cyan-400"
                      : "bg-transparent border-transparent text-slate-500 hover:bg-slate-800 hover:text-slate-300"
                  )}
                >
                   <span className="truncate">{key}</span>
                   {activeGroup === key && <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 shadow-[0_0_6px_cyan]" />}
                </button>
             ))}
          </div>
       </div>

       {/* CONTENT: Lista de Ubicaciones */}
       <div className="w-full md:w-2/3 bg-slate-900/60 border border-slate-800 rounded-xl flex flex-col overflow-hidden relative">
          <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#0891b2_1px,transparent_1px)] [background-size:16px_16px]" />
          
          <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar relative z-10">
             {groupedLocations[activeGroup]?.map((loc, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 rounded bg-slate-950/40 border border-slate-800/50 hover:border-slate-700 transition-colors group">
                   
                   <div className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 group-hover:text-cyan-400 group-hover:border-cyan-500/30 transition-colors">
                      {getMethodIcon(loc.method)}
                   </div>

                   <div className="flex-1 min-w-0">
                      <h5 className="text-xs font-bold text-slate-200 uppercase truncate">{loc.locationName.replace(/-/g, ' ')}</h5>
                      <div className="flex items-center gap-2 mt-1 text-[9px] font-mono text-slate-500">
                         <span className="bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">{loc.method}</span>
                         <span>Lv {loc.minLevel}-{loc.maxLevel}</span>
                      </div>
                   </div>

                   <div className="flex flex-col items-end w-20">
                      <span className="text-[10px] font-mono font-bold text-emerald-400">{loc.chance}%</span>
                      <div className="w-full h-1.5 bg-slate-800 rounded-full mt-1 overflow-hidden">
                         <div className="h-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" style={{ width: `${loc.chance}%` }} />
                      </div>
                   </div>

                </div>
             ))}
          </div>
       </div>

    </div>
  );
}