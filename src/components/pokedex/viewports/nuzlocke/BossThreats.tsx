import { BossDatabase, BossPokemon } from "@/types/nuzlocke";

interface Props {
    pokemonSlug: string;
    bosses: BossDatabase | null;
    t: any; // <--- AÑADIDO
}

export default function BossThreats({ pokemonSlug, bosses, t }: Props) {
    if (!bosses) return null;

    const threats = bosses.filter(battle => 
        battle.team.some(p => p.pokemon_id === pokemonSlug)
    );

    if (threats.length === 0) return null;

    return (
        <div className="bg-red-900/10 border border-red-500/30 rounded-lg p-4">
            <h3 className="text-red-400 text-sm font-bold uppercase mb-4 flex items-center gap-2">
                <span className="text-xl">⚠️</span> {t.headers.threats} {/* <--- TRADUCCIÓN */}
                <span className="text-xs bg-red-950 text-red-300 px-2 py-0.5 rounded-full border border-red-800">
                    {t.labels.appearsIn(threats.length)} {/* <--- TRADUCCIÓN CON FUNCIÓN */}
                </span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {threats.map((battle) => {
                    const enemyData = battle.team.find(p => p.pokemon_id === pokemonSlug) as BossPokemon;
                    
                    return (
                        <div key={battle.id} className="bg-slate-900/80 border border-slate-700 rounded p-3 flex gap-3 relative overflow-hidden group hover:border-red-500/50 transition-colors">
                            <div className="absolute top-0 right-0 p-2 opacity-10 font-black text-6xl text-red-500 pointer-events-none">
                                VS
                            </div>

                            <div className="flex flex-col items-center justify-center min-w-[80px] border-r border-slate-700 pr-3">
                                <div className="text-[10px] uppercase text-slate-500 font-bold text-center mb-1">
                                    {battle.category.replace(/_/g, ' ')}
                                </div>
                                <div className="text-red-300 font-bold text-sm text-center leading-tight">
                                    {battle.name}
                                </div>
                                <div className="mt-2 text-[10px] text-slate-400 text-center">
                                    Lv. <span className="text-white font-mono text-lg">{enemyData.level}</span>
                                </div>
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-xs text-slate-400 font-mono truncate">
                                        {battle.segment_id}
                                    </span>
                                    {enemyData.item && (
                                        <span className="text-[10px] flex items-center gap-1 bg-slate-800 px-1.5 py-0.5 rounded text-amber-200 border border-amber-900/30">
                                            🎁 {enemyData.item}
                                        </span>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-1">
                                    {enemyData.moves.map((move, i) => (
                                        <div key={i} className="bg-slate-800/50 px-2 py-1 rounded text-xs text-slate-300 truncate font-medium">
                                            {move}
                                        </div>
                                    ))}
                                    {[...Array(Math.max(0, 4 - enemyData.moves.length))].map((_, i) => (
                                        <div key={`empty-${i}`} className="bg-slate-800/20 px-2 py-1 rounded text-xs text-slate-600 border border-slate-800 border-dashed">
                                            --
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-2 flex gap-2 text-[10px]">
                                    {enemyData.ability && (
                                        <div className="bg-cyan-900/30 text-cyan-300 px-1.5 py-0.5 rounded border border-cyan-800/30">
                                            Abil: <span className="font-bold">{enemyData.ability}</span>
                                        </div>
                                    )}
                                    {enemyData.nature && (
                                        <div className="bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700">
                                            {enemyData.nature}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}