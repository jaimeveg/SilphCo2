import { Lang } from "@/lib/pokedexDictionary";

// Aceptamos `t` (diccionario) como prop para no importarlo de nuevo
export default function SurvivalBanner({ analysis, t }: { analysis: any, t: any, lang: Lang }) {
    const tierColors = {
        S: 'bg-purple-600 border-purple-400',
        A: 'bg-emerald-600 border-emerald-400',
        B: 'bg-blue-600 border-blue-400',
        C: 'bg-yellow-600 border-yellow-400',
        D: 'bg-red-600 border-red-400',
    };

    // Función simple para traducir los tags que vienen del hook en inglés
    const translateTag = (tag: string) => {
        if (tag === "Early Carry") return t.tags.earlyCarry;
        if (tag === "Late Scaler") return t.tags.lateScaler;
        if (tag === "Re-Typed") return t.tags.reTyped;
        if (tag === "Buffed Stats") return t.tags.buffedStats;
        return tag;
    };

    return (
        <div className="relative bg-slate-900/50 rounded-lg p-4 border border-slate-700 overflow-hidden">
            <div className="flex items-start gap-4">
                <div className={`
                    w-16 h-16 flex items-center justify-center rounded-lg border-2 text-3xl font-bold shadow-lg
                    ${tierColors[analysis.tier as keyof typeof tierColors] || 'bg-slate-700'}
                `}>
                    {analysis.tier}
                </div>

                <div className="flex-1">
                    <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                        {t.tierTitle}
                        {analysis.tags.map((tag: string) => (
                            <span key={tag} className="text-xs bg-slate-700 px-2 py-0.5 rounded-full text-cyan-300 border border-slate-600">
                                {translateTag(tag)}
                            </span>
                        ))}
                    </h3>
                    <p className="text-sm text-slate-400 mt-1">{t.tierDesc(analysis.tier)}</p>
                    
                    <div className="mt-3 grid grid-cols-3 gap-2">
                        <div className="flex flex-col gap-1">
                            <span className="text-[10px] uppercase text-slate-500 font-bold">{t.phases.early}</span>
                            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full bg-cyan-500" style={{ width: `${analysis.phaseUtility.early}%` }} />
                            </div>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-[10px] uppercase text-slate-500 font-bold">{t.phases.mid}</span>
                            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full bg-cyan-500" style={{ width: `${analysis.phaseUtility.mid}%` }} />
                            </div>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-[10px] uppercase text-slate-500 font-bold">{t.phases.late}</span>
                            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full bg-cyan-500" style={{ width: `${analysis.phaseUtility.late}%` }} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}