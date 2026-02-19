import { useState, useMemo, useEffect } from 'react';
import { MapPin, Search, ChevronRight, ChevronDown, ChevronUp, Package } from 'lucide-react';
import { GameSegment } from '@/types/nuzlocke';
import { cn } from '@/lib/utils';
import staticBaseDex from '@/data/pokedex_base_stats.json';

interface Props {
    pokemonSlug: string;
    pokemonId: number;
    segments: GameSegment[];
    t: any;
}

// Interfaces auxiliares
interface HeldItem {
    item: { name: string; url?: string };
    version_details: { rarity: number; version: { name: string } }[];
}

interface BaseDexEntry {
    id: number;
    name: string;
    evolution?: any;
    held_items?: HeldItem[];
}

const getEvolutionLineage = (currentId: number, baseDex: any): { id: number, name: string }[] => {
    const lineage = [];
    let current = baseDex[currentId];
    if (current) lineage.push({ id: current.id, name: current.name.toLowerCase() });

    let tempId = currentId;
    let depth = 0;
    while(depth < 5) {
        const entry = baseDex[tempId];
        if (entry?.evolution?.from?.pokemonId) {
            const parentId = entry.evolution.from.pokemonId;
            const parentEntry = baseDex[parentId];
            if (parentEntry) {
                lineage.unshift({ id: parentEntry.id, name: parentEntry.name.toLowerCase() });
                tempId = parentId;
            } else {
                break;
            }
        } else {
            break;
        }
        depth++;
    }
    return lineage;
};

// Helper actualizado para la estructura del JSON proporcionado
const getEncounterMeta = (enc: any) => {
    let min = 100;
    let max = 0;
    let totalRate = 0;
    let hasData = false;

    // 1. Procesar métodos para niveles y rate
    if (enc.method && Array.isArray(enc.method)) {
        enc.method.forEach((m: any) => {
            // Niveles
            if (m.min_level) min = Math.min(min, m.min_level);
            if (m.max_level) max = Math.max(max, m.max_level);
            
            // Rate (puede ser 'rate', 'chance' o 'rarity')
            const rate = m.rate || m.chance || m.rarity || 0;
            totalRate += rate;
            hasData = true;
        });
    } else {
        // Fallback a propiedades top-level si existen (algunos JSONs antiguos)
        if (enc.min_level) { min = enc.min_level; hasData = true; }
        if (enc.max_level) { max = enc.max_level; hasData = true; }
        if (enc.rate || enc.chance) { totalRate = enc.rate || enc.chance; hasData = true; }
    }

    if (!hasData) return { min: null, max: null, rate: null };

    return { 
        min: min === 100 ? null : min, 
        max: max === 0 ? null : max, 
        rate: totalRate 
    };
};

export default function EncounterTable({ pokemonSlug, pokemonId, segments, t }: Props) {
    const [selectedId, setSelectedId] = useState<number>(pokemonId);
    const [isExpanded, setIsExpanded] = useState(false);

    const { lineage, encountersByMon } = useMemo(() => {
        // @ts-ignore
        const safeBaseDex: Record<string, BaseDexEntry> = staticBaseDex || {};
        
        let lin = getEvolutionLineage(pokemonId, safeBaseDex);
        if (lin.length === 0) lin = [{ id: pokemonId, name: pokemonSlug }];

        const map = new Map<string, any[]>();
        lin.forEach(l => map.set(l.name, []));

        segments.forEach(segment => {
            if (!segment.encounters) return;
            segment.encounters.forEach((enc: any) => {
                if (map.has(enc.pokemon_id)) {
                    map.get(enc.pokemon_id)!.push({
                        location: segment.name,
                        ...enc
                    });
                }
            });
        });

        return { lineage: lin, encountersByMon: map, safeBaseDex };
    }, [pokemonId, segments, pokemonSlug]);

    useEffect(() => { setIsExpanded(false); }, [selectedId]);

    // Auto-selección inteligente
    useEffect(() => {
        // @ts-ignore
        const currentName = staticBaseDex[pokemonId]?.name.toLowerCase() || pokemonSlug;
        const currentHasData = (encountersByMon.get(currentName)?.length || 0) > 0;
        
        if (!currentHasData) {
            const firstWithData = lineage.find(l => (encountersByMon.get(l.name)?.length || 0) > 0);
            if (firstWithData) setSelectedId(firstWithData.id);
        }
    }, [lineage, encountersByMon, pokemonId, pokemonSlug]);

    // @ts-ignore
    const currentMonName = staticBaseDex[selectedId]?.name.toLowerCase() || pokemonSlug;
    const activeEncounters = encountersByMon.get(currentMonName) || [];
    const totalEncounters = Array.from(encountersByMon.values()).flat().length;

    // @ts-ignore
    const baseDexEntry: BaseDexEntry = staticBaseDex[selectedId];

    const LIMIT = 5;
    const visibleEncounters = isExpanded ? activeEncounters : activeEncounters.slice(0, LIMIT);
    const hiddenCount = activeEncounters.length - LIMIT;

    if (totalEncounters === 0) {
        return (
            <div className="bg-[#0B101B] border border-slate-800 rounded-xl p-8 flex flex-col items-center justify-center text-slate-500 w-full min-h-[200px]">
                <Search size={24} className="mb-3 opacity-30" />
                <span className="text-xs font-mono uppercase tracking-widest text-center opacity-60">
                    No wild encounters found <br/> for this evolutionary line
                </span>
            </div>
        );
    }

    return (
        <div className="bg-[#0B101B] border border-slate-800 rounded-xl overflow-hidden shadow-lg w-full">
            <div className="bg-slate-900/90 border-b border-slate-800 py-3 px-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <MapPin size={14} className="text-emerald-400" />
                    <h3 className="text-[11px] font-bold text-slate-200 tracking-widest uppercase">
                        Encounter Intelligence
                    </h3>
                </div>
            </div>

            {/* TAB SELECTOR */}
            <div className="flex items-center gap-2 p-3 border-b border-slate-800/50 bg-slate-950/30 overflow-x-auto custom-scrollbar">
                {lineage.map((member, idx) => {
                    const count = encountersByMon.get(member.name)?.length || 0;
                    const isActive = selectedId === member.id;
                    const isDisabled = count === 0;
                    const isLast = idx === lineage.length - 1;
                    
                    return (
                        <div key={member.id} className="flex items-center">
                            <button
                                onClick={() => !isDisabled && setSelectedId(member.id)}
                                disabled={isDisabled}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2 rounded-lg border transition-all min-w-[140px] relative group overflow-hidden",
                                    isActive 
                                        ? "bg-slate-800 border-emerald-500/50 ring-1 ring-emerald-500/20 shadow-md" 
                                        : isDisabled 
                                            ? "bg-slate-900/20 border-slate-800/50 opacity-40 cursor-not-allowed grayscale"
                                            : "bg-slate-900 border-slate-800 hover:border-slate-700 hover:bg-slate-800/80"
                                )}
                            >
                                <img 
                                    src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${member.id}.png`} 
                                    alt={member.name}
                                    className="w-8 h-8 object-contain pixelated drop-shadow-md"
                                />
                                <div className="flex flex-col items-start min-w-0">
                                    <span className={cn("text-[10px] font-bold uppercase truncate w-full", isActive ? "text-slate-200" : "text-slate-500")}>
                                        {member.name}
                                    </span>
                                    <span className={cn("text-[9px] font-mono", isActive ? "text-emerald-400" : "text-slate-600")}>
                                        {count} Locations
                                    </span>
                                </div>
                                {isActive && <div className="absolute bottom-0 left-0 h-[2px] w-full bg-emerald-500/50"></div>}
                            </button>
                            {!isLast && <ChevronRight size={12} className="mx-2 text-slate-700/50" />}
                        </div>
                    );
                })}
            </div>
            
            {/* TABLE */}
            <div className="relative min-h-[150px]">
                {activeEncounters.length > 0 ? (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-950/50 text-[9px] text-slate-500 uppercase tracking-wider font-mono">
                                        <th className="p-3 font-medium border-b border-slate-800 w-[30%] pl-5">Location</th>
                                        <th className="p-3 font-medium border-b border-slate-800 text-center">Method</th>
                                        <th className="p-3 font-medium border-b border-slate-800 text-center">Levels</th>
                                        <th className="p-3 font-medium border-b border-slate-800 text-center">Held Item</th>
                                        <th className="p-3 font-medium border-b border-slate-800 text-right pr-5">Rate</th>
                                    </tr>
                                </thead>
                                <tbody className="text-[10px] text-slate-300">
                                    {visibleEncounters.map((enc, idx) => {
                                        const meta = getEncounterMeta(enc);
                                        
                                        // LOGICA HELD ITEMS
                                        let itemsDisplay = null;
                                        
                                        // 1. Prioridad: Item específico en el encuentro (del JSON manifest)
                                        if (enc.held_items && enc.held_items.length > 0) {
                                            itemsDisplay = (
                                                <div className="flex flex-col items-center gap-1">
                                                    {enc.held_items.map((hi: any, hIdx: number) => (
                                                        <div key={hIdx} className="flex items-center gap-1.5">
                                                            <Package size={10} className="text-amber-400" />
                                                            <span className="capitalize text-amber-200">
                                                                {hi.item_id ? hi.item_id.replace(/-/g, ' ') : 'Item'}
                                                            </span>
                                                            <span className="text-[8px] text-slate-500 font-mono">
                                                                {hi.chance}%
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            );
                                        } 
                                        // 2. Fallback: Datos globales de la especie (Base Dex)
                                        else if (baseDexEntry?.held_items && baseDexEntry.held_items.length > 0) {
                                            const commonItem = baseDexEntry.held_items.reduce((prev, curr) => 
                                                (curr.version_details[0].rarity > prev.version_details[0].rarity) ? curr : prev
                                            );
                                            
                                            itemsDisplay = (
                                                <div className="flex flex-col items-center opacity-60 hover:opacity-100 transition-opacity" title="Species generic data">
                                                    <span className="capitalize text-slate-400">{commonItem.item.name.replace(/-/g, ' ')}</span>
                                                    <span className="text-[8px] text-slate-600">{commonItem.version_details[0].rarity}% (Generic)</span>
                                                </div>
                                            );
                                        } else {
                                            itemsDisplay = <span className="text-slate-700">-</span>;
                                        }

                                        return (
                                            <tr key={idx} className="border-b border-slate-800/50 hover:bg-slate-900/40 transition-colors group">
                                                <td className="p-3 pl-5 font-medium text-emerald-400 group-hover:text-emerald-300 transition-colors">
                                                    {enc.location}
                                                </td>
                                                <td className="p-3 text-center capitalize text-slate-400">
                                                    {enc.method?.map((m:any) => (m.encounter_method || m.type).replace(/-/g, ' ')).join(', ') || 'Standard'}
                                                </td>
                                                <td className="p-3 text-center font-mono text-slate-400">
                                                    {(meta.min && meta.max) 
                                                        ? (meta.min === meta.max ? `Lvl ${meta.min}` : `${meta.min}-${meta.max}`)
                                                        : <span className="text-slate-700">?</span>
                                                    }
                                                </td>
                                                <td className="p-3 text-center">
                                                    {itemsDisplay}
                                                </td>
                                                <td className="p-3 pr-5 text-right font-mono text-cyan-400 font-bold">
                                                    {meta.rate ? `${meta.rate}%` : <span className="text-slate-700">-</span>}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {activeEncounters.length > LIMIT && (
                            <button 
                                onClick={() => setIsExpanded(!isExpanded)}
                                className="w-full py-2 bg-slate-900/30 hover:bg-slate-900/60 border-t border-slate-800 flex items-center justify-center gap-2 text-[10px] font-mono text-slate-500 hover:text-emerald-400 transition-colors uppercase tracking-wider"
                            >
                                {isExpanded ? (
                                    <>
                                        Show Less <ChevronUp size={12} />
                                    </>
                                ) : (
                                    <>
                                        Show {hiddenCount} More Locations <ChevronDown size={12} />
                                    </>
                                )}
                            </button>
                        )}
                    </>
                ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-600 gap-2">
                        <Search size={20} className="opacity-20" />
                        <p className="text-[10px] font-mono opacity-60">Select a stage above to view locations</p>
                    </div>
                )}
            </div>
        </div>
    );
}