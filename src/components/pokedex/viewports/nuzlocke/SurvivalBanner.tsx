import { Lang } from "@/lib/pokedexDictionary";

export default function SurvivalBanner({ analysis, t }: { analysis: any, t: any, lang: Lang }) {
    const tierConfig = {
        S: { color: 'text-purple-400', border: 'border-purple-500/50', bg: 'bg-purple-500/10' },
        A: { color: 'text-emerald-400', border: 'border-emerald-500/50', bg: 'bg-emerald-500/10' },
        B: { color: 'text-blue-400', border: 'border-blue-500/50', bg: 'bg-blue-500/10' },
        C: { color: 'text-yellow-400', border: 'border-yellow-500/50', bg: 'bg-yellow-500/10' },
        D: { color: 'text-red-400', border: 'border-red-500/50', bg: 'bg-red-500/10' },
    };

    const style = tierConfig[analysis.tier as keyof typeof tierConfig] || tierConfig.C;

    const translateTag = (tag: string) => {
        if (tag === "Early Carry") return t.tags.earlyCarry;
        if (tag === "Late Scaler") return t.tags.lateScaler;
        if (tag === "Re-Typed") return t.tags.reTyped;
        if (tag === "Buffed Stats") return t.tags.buffedStats;
        return tag;
    };

    return (
        <div className="bg-[#0F1629] rounded border border-slate-800 p-5 shadow-lg relative overflow-hidden">
            {/* Background Accent */}
            <div className={`absolute top-0 right-0 w-32 h-32 blur-3xl opacity-10 ${style.bg.replace('/10', '')}`} />

            <div className="flex gap-5 relative z-10">
                {/* Big Tier Badge */}
                <div className={`
                    w-20 h-20 flex flex-col items-center justify-center rounded border-2 backdrop-blur-sm
                    ${style.border} ${style.bg} ${style.color}
                `}>
                    <span className="text-4xl font-black italic leading-none">{analysis.tier}</span>
                    <span className="text-[10px] font-bold uppercase opacity-80 mt-1">TIER</span>
                </div>

                <div className="flex-1 min-w-0">
                    <h3 className="text-slate-100 font-bold uppercase tracking-wider text-sm flex items-center gap-2 mb-2">
                        {t.tierTitle}
                    </h3>
                    
                    <div className="flex flex-wrap gap-2 mb-3">
                        {analysis.tags.map((tag: string) => (
                            <span key={tag} className="text-[10px] font-mono bg-slate-800 text-cyan-300 px-2 py-1 rounded border border-slate-700 uppercase">
                                {translateTag(tag)}
                            </span>
                        ))}
                    </div>

                    {/* Progress Bars */}
                    <div className="space-y-2">
                        {['early', 'mid', 'late'].map((phase) => (
                            <div key={phase} className="flex items-center gap-3">
                                <span className="text-[9px] uppercase text-slate-500 font-bold w-12 text-right">
                                    {t.phases[phase as keyof typeof t.phases]}
                                </span>
                                <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                    <div 
                                        className={`h-full ${style.bg.replace('/10', '')} transition-all duration-500`}
                                        style={{ width: `${analysis.phaseUtility[phase]}%` }} 
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}