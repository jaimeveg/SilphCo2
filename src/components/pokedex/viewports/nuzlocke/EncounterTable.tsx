import { GameSegment } from "@/types/nuzlocke";

interface Props {
    pokemonSlug: string;
    segments: GameSegment[];
    t: any;
}

export default function EncounterTable({ pokemonSlug, segments, t }: Props) {
    const encounters = segments.flatMap(seg => {
        const match = seg.encounters.find(e => e.pokemon_id === pokemonSlug);
        if (!match) return [];

        const methodGroup = seg.encounters.filter(e => e.pokemon_id !== pokemonSlug);
        let maxOtherLevel = 0;
        methodGroup.forEach(other => {
            other.method.forEach(m => {
                if(m.max_level > maxOtherLevel) maxOtherLevel = m.max_level;
            });
        });

        const myMinLevel = Math.min(...match.method.map(m => m.min_level));
        const repelTrick = myMinLevel > maxOtherLevel;

        return match.method.map(m => ({
            location: seg.name,
            method: m.encounter_method,
            levels: `${m.min_level}-${m.max_level}`,
            rate: `${m.rate}%`,
            repelTrick
        }));
    });

    if (encounters.length === 0) return null;

    return (
        <div className="bg-[#0F1629] rounded border border-slate-800 overflow-hidden">
            <div className="bg-slate-900/30 px-4 py-3 border-b border-slate-800 flex justify-between items-center">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    {/* Icono Mapa Fino */}
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon>
                        <line x1="8" y1="2" x2="8" y2="18"></line>
                        <line x1="16" y1="6" x2="16" y2="22"></line>
                    </svg>
                    {t.headers.encounters}
                </h4>
            </div>
            
            <div className="divide-y divide-slate-800/50">
                {encounters.map((enc, i) => (
                    <div key={i} className="flex items-center justify-between px-4 py-2.5 text-sm hover:bg-slate-900/50 transition-colors group">
                        <span className="text-slate-300 font-medium text-xs group-hover:text-cyan-400 transition-colors">
                            {enc.location}
                        </span>
                        
                        <div className="flex items-center gap-4">
                            {enc.repelTrick && (
                                <span className="flex items-center gap-1 text-[9px] text-yellow-500 font-bold uppercase tracking-wider">
                                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                                    </svg>
                                    Repel
                                </span>
                            )}
                            
                            <span className="text-slate-500 text-[10px] uppercase font-mono">
                                {enc.method}
                            </span>
                            
                            <div className="flex flex-col items-end w-12">
                                <span className="text-white font-mono font-bold text-xs">{enc.rate}</span>
                                <span className="text-slate-600 text-[9px]">Lv.{enc.levels}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}