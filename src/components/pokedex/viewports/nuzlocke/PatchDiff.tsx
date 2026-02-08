import { NuzlockeStats } from "@/types/nuzlocke";

interface Props {
    originalStats: NuzlockeStats;
    changes: { statDiff: Partial<NuzlockeStats> | null; typeChanged: boolean };
    patchName: string;
    title: string; // <--- AÑADIDO: Recibir título traducido
}

export default function PatchDiff({ originalStats, changes, patchName, title }: Props) {
    if (!changes.statDiff && !changes.typeChanged) return null;

    return (
        <div className="bg-indigo-900/20 border border-indigo-500/30 rounded-lg p-3">
            <h4 className="text-indigo-300 text-xs font-bold uppercase mb-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"/>
                {title} ({patchName}) {/* <--- USO DE TRADUCCIÓN */}
            </h4>
            
            {changes.statDiff && (
                <div className="grid grid-cols-6 gap-2 text-center mb-2">
                    {Object.entries(changes.statDiff).map(([stat, val]: [string, any]) => {
                        const key = stat as keyof NuzlockeStats;
                        const mapKey = key === 'spa' ? 'spa' : key === 'spd' ? 'spd' : key === 'atk' ? 'atk' : key === 'def' ? 'def' : key === 'spe' ? 'spe' : 'hp';
                        
                        // Corrección de acceso a propiedades (asegurar compatibilidad con NuzlockeStats)
                        const oldVal = originalStats[mapKey];
                        const diff = val - oldVal;
                        
                        return (
                            <div key={stat} className="bg-indigo-950/50 rounded p-1">
                                <div className="text-[10px] text-slate-500 uppercase">{stat}</div>
                                <div className="text-sm font-mono font-bold text-white">
                                    {val}
                                    <span className={`text-[10px] ml-1 ${diff > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                        {diff > 0 ? '+' : ''}{diff}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
            
            {changes.typeChanged && (
                <div className="text-xs text-indigo-200">
                    ⚠️ Type combination has been altered in this patch.
                </div>
            )}
        </div>
    );
}