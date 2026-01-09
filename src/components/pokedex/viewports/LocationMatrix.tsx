'use client';

import { useState, useMemo, useEffect } from 'react';
import { Map, Waves, Footprints, AlertCircle, MapPin, ChevronDown } from 'lucide-react';
import { ILocationEncounter } from '@/types/interfaces';
import { Lang, POKEDEX_DICTIONARY } from '@/lib/pokedexDictionary';
import { cn } from '@/lib/utils';

interface Props {
  locations?: ILocationEncounter[];
  lang: Lang;
}

const getMethodIcon = (method: string) => {
    if (method.includes('surf') || method.includes('fish') || method.includes('sea')) return <Waves size={12} />;
    if (method.includes('walk') || method.includes('grass') || method.includes('ground') || method.includes('cave')) return <Footprints size={12} />;
    return <AlertCircle size={12} />;
}

export default function LocationMatrix({ locations: data, lang }: Props) {
  const dict = POKEDEX_DICTIONARY[lang]; 
  
  const [activeGroupKey, setActiveGroupKey] = useState<string | null>(null);
  const [activeVersion, setActiveVersion] = useState<string | null>(null);

  const groupedData = useMemo(() => {
    if (!data || data.length === 0) return null;

    const groups: Record<string, { label: string, subLabel: string, versions: Set<string>, encounters: ILocationEncounter[] }> = {};
    
    data.forEach(loc => {
        const key = `${loc.generation}-${loc.versionGroup}`; 
        
        if (!groups[key]) {
            groups[key] = {
                label: `${loc.region.toUpperCase()}`,
                subLabel: `${loc.versionGroup} (Gen ${loc.generation})`,
                versions: new Set(),
                encounters: []
            };
        }
        groups[key].versions.add(loc.version);
        groups[key].encounters.push(loc);
    });

    const sortedKeys = Object.keys(groups).sort((a, b) => {
        const genA = parseInt(a.split('-')[0]);
        const genB = parseInt(b.split('-')[0]);
        return genA - genB;
    });

    return { groups, sortedKeys };
  }, [data]);

  useEffect(() => {
      if (groupedData && groupedData.sortedKeys.length > 0) {
          if (!activeGroupKey || !groupedData.groups[activeGroupKey]) {
              const firstKey = groupedData.sortedKeys[0];
              setActiveGroupKey(firstKey);
              const firstVer = Array.from(groupedData.groups[firstKey].versions).sort()[0];
              setActiveVersion(firstVer);
          }
      } else {
          setActiveGroupKey(null);
          setActiveVersion(null);
      }
  }, [groupedData, activeGroupKey]);

  const handleGroupChange = (key: string) => {
      setActiveGroupKey(key);
      if (groupedData?.groups[key]) {
          const firstVer = Array.from(groupedData.groups[key].versions).sort()[0];
          setActiveVersion(firstVer);
      }
  };

  if (!groupedData || !activeGroupKey || !groupedData.groups[activeGroupKey]) {
    return (
        <div className="flex flex-col items-center justify-center h-32 border border-dashed border-slate-800 rounded-xl bg-slate-900/20 text-slate-500">
            <Map className="mb-2 opacity-50" size={24} />
            <span className="text-xs font-mono">{dict.labels.unknown_loc}</span>
        </div>
    );
  }

  const currentGroup = groupedData.groups[activeGroupKey];
  const versionsInGroup = Array.from(currentGroup.versions).sort();
  
  const filteredEncounters = currentGroup.encounters
      .filter(loc => loc.version === activeVersion)
      .sort((a, b) => b.chance - a.chance);

  return (
    <div className="flex flex-col md:flex-row gap-4 h-[350px]">
       <div className="w-full md:w-1/3 bg-slate-950/30 rounded-xl border border-slate-800 flex flex-col overflow-hidden">
          <div className="p-3 border-b border-slate-800 bg-slate-900/50 flex items-center gap-2">
             <MapPin size={12} className="text-cyan-500" />
             <h4 className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">{dict.labels.loc_title}</h4>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
             {groupedData.sortedKeys.map((key) => {
                const group = groupedData.groups[key];
                return (
                    <button
                        key={key}
                        onClick={() => handleGroupChange(key)}
                        className={cn(
                            "w-full text-left px-3 py-2.5 rounded text-[10px] font-mono font-bold uppercase transition-all border flex justify-between items-center group",
                            activeGroupKey === key
                            ? "bg-cyan-950/40 border-cyan-500/50 text-cyan-400"
                            : "bg-transparent border-transparent text-slate-500 hover:bg-slate-800 hover:text-slate-300"
                        )}
                    >
                        <div className="flex flex-col min-w-0">
                            <span className="truncate">{group.label}</span>
                            <span className="text-[8px] opacity-60 font-normal truncate">{group.subLabel}</span>
                        </div>
                        {activeGroupKey === key && <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 shadow-[0_0_6px_cyan] shrink-0 ml-2" />}
                    </button>
                );
             })}
          </div>
       </div>

       <div className="w-full md:w-2/3 bg-slate-900/60 border border-slate-800 rounded-xl flex flex-col overflow-hidden relative">
          <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#0891b2_1px,transparent_1px)] [background-size:16px_16px]" />
          
          <div className="p-2 border-b border-slate-800 bg-slate-950/40 z-20 flex justify-end">
              <div className="relative">
                  <select 
                    value={activeVersion || ''} 
                    onChange={(e) => setActiveVersion(e.target.value)}
                    className="appearance-none bg-slate-900 border border-slate-700 text-slate-200 text-[10px] font-bold uppercase py-1 pl-3 pr-8 rounded focus:border-cyan-500 focus:outline-none cursor-pointer hover:bg-slate-800 transition-colors"
                  >
                      {versionsInGroup.map(v => (
                          <option key={v} value={v}>{v} Version</option>
                      ))}
                  </select>
                  <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar relative z-10">
             {filteredEncounters.length === 0 ? (
                 <div className="flex flex-col items-center justify-center h-full text-slate-600 opacity-50">
                     <AlertCircle size={20} className="mb-1" />
                     <span className="text-[10px] font-mono uppercase">No data found</span>
                 </div>
             ) : (
                 filteredEncounters.map((loc, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 rounded bg-slate-950/40 border border-slate-800/50 hover:border-slate-700 transition-colors group">
                        <div className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 group-hover:text-cyan-400 group-hover:border-cyan-500/30 transition-colors shrink-0">
                            {getMethodIcon(loc.method)}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h5 className="text-xs font-bold text-slate-200 uppercase truncate" title={loc.locationName}>
                                {loc.locationName}
                            </h5>
                            <div className="flex items-center gap-2 mt-1 text-[9px] font-mono text-slate-500">
                                <span className="bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800 truncate max-w-[140px]" title={loc.method}>
                                    {loc.method.replace(/-/g, ' ')}
                                </span>
                                <span className="whitespace-nowrap text-slate-400">
                                    Lv {loc.minLevel === loc.maxLevel ? loc.minLevel : `${loc.minLevel}-${loc.maxLevel}`}
                                </span>
                            </div>
                        </div>
                        <div className="flex flex-col items-end w-16 shrink-0">
                            <span className={cn("text-[10px] font-mono font-bold", loc.chance < 10 ? "text-red-400" : loc.chance > 50 ? "text-emerald-400" : "text-yellow-400")}>
                                {loc.chance}%
                            </span>
                            <div className="w-full h-1.5 bg-slate-800 rounded-full mt-1 overflow-hidden">
                                <div 
                                    className={cn("h-full shadow-[0_0_8px_rgba(0,0,0,0.5)]", loc.chance < 10 ? "bg-red-500" : loc.chance > 50 ? "bg-emerald-500" : "bg-yellow-500")} 
                                    style={{ width: `${loc.chance}%` }} 
                                />
                            </div>
                        </div>
                    </div>
                 ))
             )}
          </div>
       </div>
    </div>
  );
}