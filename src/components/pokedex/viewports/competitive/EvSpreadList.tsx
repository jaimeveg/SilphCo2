'use client';

import { BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EvSpread {
    nature: string;
    usage: string; 
    evs: Record<string, number>;
}

interface Props {
    spreads: EvSpread[];
}

const STAT_LABELS = { hp: 'HP', atk: 'Atk', def: 'Def', spa: 'SpA', spd: 'SpD', spe: 'Spe' };
const STAT_COLORS = { hp: 'bg-red-500', atk: 'bg-orange-500', def: 'bg-yellow-500', spa: 'bg-blue-500', spd: 'bg-green-500', spe: 'bg-pink-500' };

export default function EvSpreadList({ spreads }: Props) {
    if (!spreads || spreads.length === 0) {
        return <div className="text-[9px] text-slate-600 text-center py-8 italic">No EV spread data available</div>;
    }

    return (
        <div className="h-full flex flex-col">
            <h4 className="text-[9px] font-bold text-slate-500 uppercase flex items-center gap-1.5 border-b border-slate-800 pb-2 mb-3 sticky top-0 bg-slate-950 z-10">
                <BarChart3 size={11} /> Common Spreads
            </h4>
            
            <div className="space-y-2 overflow-y-auto pr-1 custom-scrollbar pb-2">
                {spreads.map((spread, idx) => (
                    <div key={idx} className="group bg-slate-900/30 hover:bg-slate-900/60 border border-slate-800/50 hover:border-slate-700 rounded p-2 transition-all">
                        {/* HEADER */}
                        <div className="flex justify-between items-center mb-1.5">
                            <span className="text-[10px] font-bold text-yellow-500/90 uppercase tracking-wide truncate max-w-[80px]">
                                {spread.nature}
                            </span>
                            <span className="text-[9px] font-mono text-slate-400 bg-slate-950 px-1.5 rounded border border-slate-800">
                                {spread.usage}%
                            </span>
                        </div>

                        {/* EV TEXT LIST */}
                        <div className="flex flex-wrap gap-x-2 gap-y-1 text-[9px] font-mono text-slate-300 mb-1.5">
                            {Object.entries(spread.evs).map(([stat, val]) => {
                                if (val === 0) return null; 
                                return (
                                    <span key={stat} className="flex items-center gap-1">
                                        <span className={cn("w-1 h-1 rounded-full", STAT_COLORS[stat as keyof typeof STAT_COLORS])} />
                                        <span className="opacity-70">{val}</span>
                                        <span className="font-bold opacity-50">{STAT_LABELS[stat as keyof typeof STAT_LABELS]}</span>
                                    </span>
                                );
                            })}
                        </div>

                        {/* VISUAL BAR */}
                        <div className="flex h-1 w-full bg-slate-950 rounded-full overflow-hidden opacity-40 group-hover:opacity-100 transition-opacity">
                            {Object.entries(spread.evs).map(([stat, val]) => (
                                <div 
                                    key={stat} 
                                    className={STAT_COLORS[stat as keyof typeof STAT_COLORS]} 
                                    style={{ width: `${(val / 510) * 100}%` }} 
                                />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}