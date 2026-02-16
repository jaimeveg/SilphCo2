import { BossDatabase, BossPokemon } from "@/types/nuzlocke";

interface Props {
    pokemonSlug: string;
    bosses: BossDatabase | null;
    t: any;
}

export default function BossThreats({ pokemonSlug, bosses, t }: Props) {
    if (!bosses) return null;

    const threats = bosses.filter(battle => 
        battle.team.some(p => p.pokemon_id === pokemonSlug)
    );

    if (threats.length === 0) return null;

    return (
        <div className="bg-[#0F1629] border border-slate-800 rounded p-5">
            <div className="flex justify-between items-end mb-4 border-b border-slate-800 pb-2">
                <h3 className="text-red-400/80 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                    {/* Icono Espadas Cruzadas Fino */}
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14.5 17.5L3 6V3h3l11.5 11.5" />
                        <path d="M13 19l6-6" />
                        <path d="M16 16l4 4" />
                        <path d="M19 21l2-2" />
                    </svg>
                    {t.headers.threats}
                </h3>
                <span className="text-[9px] text-slate-500 font-mono">
                    {t.labels.appearsIn(threats.length)}
                </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {threats.map((battle) => {
                    const enemyData = battle.team.find(p => p.pokemon_id === pokemonSlug) as BossPokemon;
                    
                    return (
                        <div key={battle.id} className="bg-slate-900/40 border border-slate-800/60 rounded p-3 flex gap-3 transition-colors group hover:border-slate-700">
                            
                            {/* Trainer Info */}
                            <div className="flex flex-col items-center justify-center min-w-[70px] border-r border-slate-800/60 pr-3">
                                <span className="text-[8px] uppercase text-slate-500 font-bold tracking-tight">
                                    {battle.category.replace(/_/g, ' ')}
                                </span>
                                <span className="text-slate-300 font-bold text-xs text-center mt-1 group-hover:text-cyan-400 transition-colors">
                                    {battle.name}
                                </span>
                                <div className="mt-2 text-center">
                                    <span className="text-[8px] text-slate-600 block">LVL</span>
                                    <span className="text-white font-mono font-bold text-sm block">{enemyData.level}</span>
                                </div>
                            </div>

                            {/* Pokemon Build */}
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-[9px] text-slate-500 font-mono uppercase truncate max-w-[100px]">
                                        {battle.segment_id}
                                    </span>
                                    {enemyData.item && (
                                        <span className="text-[9px] text-amber-400/80 font-mono">
                                            [{enemyData.item}]
                                        </span>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-1 mb-2">
                                    {enemyData.moves.map((move, i) => (
                                        <div key={i} className="text-[9px] text-slate-400 truncate font-mono border-l border-slate-800 pl-2">
                                            {move}
                                        </div>
                                    ))}
                                </div>
                                
                                {enemyData.ability && (
                                    <div className="flex justify-end border-t border-slate-800/50 pt-1">
                                        <span className="text-[9px] text-cyan-600/80 uppercase font-bold tracking-wider">
                                            {enemyData.ability}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}