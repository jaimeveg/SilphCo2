import { useState, useEffect } from 'react';
import { Info, MapPin, FlaskConical, Crown, Swords, Shield, Skull, Zap, HelpCircle, Activity, Anchor, Feather, Repeat } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TYPES } from '@/lib/typeLogic';

// Importamos la interfaz completa
import { SimulationResult, PhaseData } from '@/lib/utils/nuzlockeEngine';

interface Props {
    analysis: SimulationResult & { debugLog: string[] } | null;
}

const TIER_COLORS: Record<string, string> = {
    'S': 'text-purple-400 drop-shadow-[0_0_10px_rgba(192,132,252,0.8)]',
    'A': 'text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.6)]',
    'B': 'text-cyan-400',
    'C': 'text-yellow-400',
    'D': 'text-orange-400',
    'F': 'text-red-500',
    'N/A': 'text-slate-600'
};

const PhaseCard = ({ label, data, isActive, onClick }: { label: string, data: PhaseData, isActive: boolean, onClick: () => void }) => {
    const isNA = data.rating === 'unavailable';
    return (
        <div 
            onClick={onClick}
            className={cn(
                "flex flex-col p-3 rounded-lg border h-full transition-all cursor-pointer relative select-none flex-1 min-w-0 group",
                isActive ? "ring-1 ring-cyan-500/50 bg-slate-900" : "bg-slate-950",
                isNA ? "border-slate-800 opacity-50 grayscale" : "border-slate-800 hover:border-slate-600 hover:bg-slate-900/80"
            )}
        >
            <div className="flex justify-between items-center mb-2 border-b border-slate-800/50 pb-2">
                <span className={cn("text-[9px] font-bold uppercase tracking-widest", isActive ? "text-cyan-400" : "text-slate-500 group-hover:text-slate-400")}>{label}</span>
                {!isNA && <span className="text-[9px] font-mono text-slate-500">{data.score}</span>}
            </div>
            
            <div className="flex items-center justify-center flex-1 my-1">
                {isNA ? (
                    <span className="text-2xl font-bold text-slate-700">Ø</span>
                ) : (
                    <span className={cn("text-5xl font-black font-display italic transition-transform", TIER_COLORS[data.tier] || TIER_COLORS['C'], isActive ? "scale-110" : "scale-100 group-hover:scale-105")}>
                        {data.tier}
                    </span>
                )}
            </div>
            
            <p className={cn("text-[9px] text-center font-medium leading-tight mt-auto pt-2 border-t border-slate-800/50 min-h-[2.5em] flex items-center justify-center transition-colors",
                isActive ? "text-slate-300" : "text-slate-500 group-hover:text-slate-400"
            )}>
                {data.reason}
            </p>
        </div>
    );
};

// Componente visual para los separadores de límite de gimnasio
const GymLimitSeparator = ({ label }: { label: string }) => (
    <div className="flex flex-col items-center justify-center w-6 shrink-0 relative z-10 opacity-30 select-none">
        <div className="h-1/4 w-px bg-gradient-to-b from-transparent via-slate-500 to-transparent"></div>
        <span className="text-[9px] font-mono text-slate-400 rotate-90 whitespace-nowrap origin-center my-3 tracking-tighter uppercase font-bold">
            {label}
        </span>
        <div className="h-1/4 w-px bg-gradient-to-t from-transparent via-slate-500 to-transparent"></div>
    </div>
);

export default function TacticalAssessment({ analysis }: Props) {
    const [selectedPhase, setSelectedPhase] = useState<'early' | 'mid' | 'late'>('late');

    useEffect(() => {
        if (!analysis) return;
        if (analysis.phases.late.rating === 'unavailable') {
            if (analysis.phases.mid.rating !== 'unavailable') setSelectedPhase('mid');
            else if (analysis.phases.early.rating !== 'unavailable') setSelectedPhase('early');
        } else {
            setSelectedPhase('late');
        }
    }, [analysis?.meta.origin]);

    if (!analysis) return null;

    const { phases, meta, role, debugLog, phaseLabels } = analysis;
    const activeData = phases[selectedPhase];
    const isTheoretical = meta.availabilityStatus === 'unavailable';

    const downloadLog = () => {
        const blob = new Blob([debugLog.join('\n')], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `nuzlocke_debug.log`;
        a.click();
    };

    const renderStats = () => {
        if (activeData.rating === 'unavailable') {
            return (
                <div className="flex gap-2 items-center text-slate-500 italic text-xs p-2 justify-center h-full">
                    <Info size={14} />
                    <span>Pokémon not available or viable in this phase.</span>
                </div>
            );
        }

        const s = activeData.stats;
        const items = [];

        // LÓGICA DE RENDERIZADO SSOT (Intacta)
        switch (activeData.rating) {
            case 'good':
                if (s.aceKillRate > 85) items.push({ icon: Crown, color: "text-amber-400", text: `Top-tier counter to Gym Leaders Aces with a **${s.aceKillRate}%** kill rate.` });
                if (s.oneToOneRate > 75 && s.riskRate < 20) items.push({ icon: Swords, color: "text-green-400", text: `Exceptional pick with dominant performance in 1v1 battles (**${s.oneToOneRate}%** win rate) and low risk.` });
                if (s.OHKoRate > 45 && s.outspeedRate > 40) items.push({ icon: Zap, color: "text-yellow-400", text: `Powerful offensive threat with strong matchups against bosses (OHKO's in **${s.OHKoRate}%** of battles and outspeeds in **${s.outspeedRate}%** of battles).` });
                if (s.safePivotRate > 50 && s.wallRate > 50) items.push({ icon: Shield, color: "text-blue-400", text: `Reliable defensive pivot and wall, able to safely pivot in over **${s.safePivotRate}%** of battles and act as a wall in over **${s.wallRate}%** of battles.` });
                if (s.safeBuffRate > 40) items.push({ icon: Shield, color: "text-emerald-400", text: `Could safely set up buffs in **${s.safeBuffRate}%** of battles.` });
                if (s.safeHazardsRate > 30) items.push({ icon: Shield, color: "text-cyan-400", text: `Could safely set up hazards in **${s.safeHazardsRate}%** of battles.` });
                if (s.safeStatusRate > 30) items.push({ icon: Shield, color: "text-blue-400", text: `Could safely inflict status in **${s.safeStatusRate}%** of battles.` }); 
                if (s.stallRate > 30) items.push({ icon: Shield, color: "text-slate-400", text: `Can effectively stall in **${s.stallRate}%** of battles.` });
                if (s.coverage/TYPES.length > 0.5){
                    items.push({ icon: Zap, color: "text-yellow-400", text: `Decent type coverage, moveset able to cover **${s.coverage}** different types` });
                } else if (s.weaknessCoverage/s.weaknesses > 0.75) {
                    items.push({ icon: Zap, color: "text-yellow-400", text: `Decent type coverage, covering **${s.coverage}** types out of ${s.weaknesses} weaknesses.` });
                }           
                if (s.speedControlRate == 1) items.push({ icon: Zap, color: "text-yellow-400", text: `Has access to decent speed control and/or priority moves.` });
                break;
            case 'avg':
                if (s.aceKillRate > 65) items.push({ icon: Crown, color: "text-amber-400", text: `Decent counter to Gym Leaders Aces with a **${s.aceKillRate}%** kill rate.` });
                if (s.oneToOneRate > 50 && s.riskRate < 30) items.push({ icon: Swords, color: "text-yellow-400", text: `Solid pick with a positive win rate in 1v1 battles (**${s.oneToOneRate}%**) but some risk involved.` });
                if (s.OHKoRate > 35 && s.outspeedRate > 30) items.push({ icon: Zap, color: "text-yellow-400", text: `Offensive threat with some useful matchups against bosses (OHKO's in **${s.OHKoRate}%** of battles and outspeeds in **${s.outspeedRate}%** of battles).` });
                if (s.safePivotRate > 40 && s.wallRate > 40) items.push({ icon: Shield, color: "text-blue-400", text: `Decent defensive pivot and wall, able to safely pivot in over **${s.safePivotRate}%** of battles and act as a wall in over **${s.wallRate}%** of battles.` });
                if (s.safeBuffRate > 30) items.push({ icon: Shield, color: "text-emerald-400", text: `Could safely set up buffs in **${s.safeBuffRate}%** of battles.` });
                if (s.safeHazardsRate > 20) items.push({ icon: Shield, color: "text-cyan-400", text: `Could safely set up hazards in **${s.safeHazardsRate}%** of battles.` });
                if (s.safeStatusRate > 20) items.push({ icon: Shield, color: "text-blue-400", text: `Could safely inflict status in **${s.safeStatusRate}%** of battles.` }); 
                if (s.stallRate > 20) items.push({ icon: Shield, color: "text-slate-400", text: `Can effectively stall in **${s.stallRate}%** of battles.` });
                if (s.coverage/TYPES.length > 0.3){
                    items.push({ icon: Zap, color: "text-yellow-400", text: `Decent type coverage, moveset able to cover **${s.coverage}** different types` });
                } else if (s.weaknessCoverage/s.weaknesses > 0.5) {
                    items.push({ icon: Zap, color: "text-yellow-400", text: `Decent type coverage, covering **${s.coverage}** types out of ${s.weaknesses} weaknesses.` });
                }
                if (s.speedControlRate > 0) items.push({ icon: Zap, color: "text-yellow-400", text: `Has access to decent speed control and/or priority moves.` });
                break; 
            case 'bad':
                if (s.riskRate > 50) items.push({ icon: Skull, color: "text-red-500", text: `High risk of losing in 1v1 battles with a risk rate of **${s.riskRate}%**.` });
                if (s.riskyPivotRate > 30) items.push({ icon: Skull, color: "text-red-500", text: `Risky pivot with a risk of losing the 1v1 battle by pivoting in over **${s.riskyPivotRate}%** of battles.` });   
                if (s.enemyOHKORate > 30) items.push({ icon: Skull, color: "text-red-500", text: `High risk of being OHKO'd by bosses with a rate of **${s.enemyOHKORate}%**.` });  
                if (s.oneToOneRate < 20 && s.riskRate > 45) items.push({ icon: Swords, color: "text-red-400", text: `Struggles in 1v1 battles with a low win rate (${s.oneToOneRate}%) and higher risk.` });
                if (s.safePivotRate < 20) items.push({ icon: Shield, color: "text-red-400", text: `Weak defensive pivot and wall, able to safely pivot in less than **${s.safePivotRate}%** of battles.` });
                if (s.coverage/s.weaknesses < 0.25) items.push({ icon: Zap, color: "text-red-400", text: `Poor type coverage, covering only **${s.coverage}** types out of **${s.weaknesses}** weaknesses.` });
                if (s.speedControlRate == 0) items.push({ icon: Zap, color: "text-red-400", text: `No access to speed control or priority moves.` });
                break;
        }
        
        if (items.length === 0) items.push({ icon: Info, color: "text-slate-400", text: "Average performance across the board." });

        return items.map((item, i) => (
            <div key={i} className="flex gap-3 items-center group animate-in fade-in slide-in-from-left-1 duration-300" style={{ animationDelay: `${i * 50}ms` }}>
                <item.icon size={13} className={cn(item.color, "mt-0.5 shrink-0 transition-transform group-hover:scale-110")} />
                <p className="text-[11px] text-slate-300 leading-tight font-medium" 
                   dangerouslySetInnerHTML={{ __html: item.text.replace(/\*\*(.*?)\*\*/g, `<span class="${item.color} font-bold">$1</span>`) }} 
                />
            </div>
        ));
    };

    return (
        <div className="relative bg-[#0B101B] border border-slate-800 rounded-xl shadow-2xl flex flex-col h-full">
            
            {/* Header: Z-Index 30 para apilamiento superior */}
            <div className="bg-slate-900/90 border-b border-slate-800 py-3 px-5 flex justify-between items-center backdrop-blur-sm rounded-t-xl relative z-30">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-emerald-400">
                        <Activity size={14} />
                        
                        {/* FIX 1: Named Group 'group/tooltip' para aislar el hover */}
                        {/* FIX 2: Hitbox ajustado con 'inline-flex', 'max-w-max', 'h-fit', 'leading-none' */}
                        <div className="group/tooltip relative inline-flex items-center gap-2 cursor-help max-w-max h-fit leading-none">
                            <span className="text-[11px] font-bold tracking-widest uppercase">TACTICAL VIABILITY ANALYSIS</span>
                            <HelpCircle size={12} className="text-slate-500 group-hover/tooltip:text-emerald-400 transition-colors" />
                            
                            {/* FIX 3: Trigger específico 'group-hover/tooltip' */}
                            {/* FIX 4: Posición Dropdown 'top-full left-0 mt-3' y Z-50 */}
                            <div className="absolute top-full left-0 mt-3 w-64 p-3 bg-slate-950 border border-slate-700/80 rounded-lg shadow-[0_4px_20px_rgba(0,0,0,0.5)] opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none z-50">
                                <p className="text-[9px] text-slate-300 leading-relaxed font-mono text-left">
                                    <span className="text-emerald-400 font-bold block mb-1">SIMULATION DISCLAIMER</span>
                                    Results based on automated engine logic. Actual in-game performance may vary due to AI behavior, specific movesets, abilities, and RNG factors.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="px-2 py-0.5 bg-slate-800 rounded border border-slate-700 flex items-center gap-1.5">
                        <Zap size={10} className="text-yellow-400" />
                        <span className="text-[10px] font-bold text-slate-200 uppercase">{role}</span>
                    </div>
                    <button onClick={downloadLog} className="text-[9px] text-slate-600 hover:text-slate-400 underline decoration-slate-700 transition-colors ml-2">
                        LOGS
                    </button>
                </div>
            </div>

            {/* Content: Z-10 para quedar bajo el header */}
            <div className="p-5 flex flex-col gap-5 flex-1 rounded-b-xl relative z-10">
                {/* 3 Split Phases Grid con Separadores (FLEX) */}
                <div className="flex items-stretch justify-between gap-1 h-32">
                    <PhaseCard 
                        label="EARLY" 
                        data={phases.early} 
                        isActive={selectedPhase === 'early'} 
                        onClick={() => setSelectedPhase('early')} 
                    />
                    
                    <GymLimitSeparator label={phaseLabels?.earlySplit || 'GYM 3'} />

                    <PhaseCard 
                        label="MID" 
                        data={phases.mid} 
                        isActive={selectedPhase === 'mid'} 
                        onClick={() => setSelectedPhase('mid')} 
                    />

                    <GymLimitSeparator label={phaseLabels?.midSplit || 'GYM 6'} />

                    <PhaseCard 
                        label="LATE" 
                        data={phases.late} 
                        isActive={selectedPhase === 'late'} 
                        onClick={() => setSelectedPhase('late')} 
                    />
                </div>

                {/* Dynamic Stats Section */}
                <div className="space-y-3 bg-slate-900/40 p-4 rounded border border-slate-800/50 min-h-[100px] flex flex-col justify-center">
                    {renderStats()}
                </div>
            </div>
        </div>
    );
}