import { GameSegment } from "@/types/nuzlocke";

interface Props {
    pokemonSlug: string;
    segments: GameSegment[];
    t: any; // <--- AÑADIDO: Recibir diccionario
}

export default function EncounterTable({ pokemonSlug, segments, t }: Props) {
    // Filtrar segmentos donde aparece el Pokemon
    const encounters = segments.flatMap(seg => {
        const match = seg.encounters.find(e => e.pokemon_id === pokemonSlug);
        if (!match) return [];

        // Lógica Repel Trick
        const methodGroup = seg.encounters.filter(e => 
            e.pokemon_id !== pokemonSlug
        );
        
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
        <div className="bg-slate-900/30 rounded border border-slate-800">
            <div className="bg-slate-800/80 px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                {t.headers.encounters} {/* <--- USO DE TRADUCCIÓN */}
            </div>
            <div className="divide-y divide-slate-800/50">
                {encounters.map((enc, i) => (
                    <div key={i} className="flex items-center justify-between px-3 py-2 text-sm">
                        <span className="text-slate-300 font-medium">{enc.location}</span>
                        <div className="flex items-center gap-3">
                            {enc.repelTrick && (
                                <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/30">
                                    {t.labels.repelTrick} {/* <--- USO DE TRADUCCIÓN */}
                                </span>
                            )}
                            <span className="text-slate-500 text-xs bg-slate-800 px-2 py-0.5 rounded">
                                {enc.method}
                            </span>
                            <span className="text-cyan-400 w-12 text-right">{enc.rate}</span>
                            <span className="text-slate-400 w-16 text-right">Lv. {enc.levels}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}