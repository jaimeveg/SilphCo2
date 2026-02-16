import { useState, useEffect } from 'react';
import { Info, MapPin, FlaskConical, Crown, Swords, Shield, Skull, Zap } from 'lucide-react';
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
                "flex flex-col p-3 rounded-lg border h-full transition-all cursor-pointer relative select-none",
                isActive ? "ring-1 ring-cyan-500/50 bg-slate-900" : "bg-slate-950",
                isNA ? "border-slate-800 opacity-50 grayscale" : "border-slate-800 hover:border-slate-600 hover:bg-slate-900/80"
            )}
        >
            <div className="flex justify-between items-center mb-2 border-b border-slate-800/50 pb-2">
                <span className={cn("text-[9px] font-bold uppercase tracking-widest", isActive ? "text-cyan-400" : "text-slate-500")}>{label}</span>
                {!isNA && <span className="text-[9px] font-mono text-slate-500">{data.score}</span>}
            </div>
            
            <div className="flex items-center justify-center flex-1 my-1">
                {isNA ? (
                    <span className="text-2xl font-bold text-slate-700">Ø</span>
                ) : (
                    <span className={cn("text-5xl font-black font-display italic", TIER_COLORS[data.tier] || TIER_COLORS['C'])}>
                        {data.tier}
                    </span>
                )}
            </div>
            
            <p className="text-[9px] text-center text-slate-400 font-medium leading-tight mt-auto pt-2 border-t border-slate-800/50 min-h-[2.5em] flex items-center justify-center">
                {data.reason}
            </p>
        </div>
    );
};

export default function TacticalAssessment({ analysis }: Props) {
    const [selectedPhase, setSelectedPhase] = useState<'early' | 'mid' | 'late'>('late');

    // Auto-select first available phase
    useEffect(() => {
        if (!analysis) return;
        // Prioridad: Early -> Mid -> Late si están disponibles
        if (analysis.phases.early.rating !== 'unavailable') setSelectedPhase('early');
        else if (analysis.phases.mid.rating !== 'unavailable') setSelectedPhase('mid');
        else setSelectedPhase('late');
    }, [analysis?.meta.origin]); // Reset when pokemon changes

    if (!analysis) return null;

    const { phases, meta, role, debugLog } = analysis;
    const activeData = phases[selectedPhase];
    const isTheoretical = meta.availabilityStatus === 'unavailable';

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

        //aceKillRate: Ratio de Aces derrotados
        //oneToOneRate: Ratio de barridos 1v1
        //speedControlRate: Tiene Speed Control (Tailwind, Trick Room, etc)
        //OHKoRate: Ratio de OHKO a bosses
        //outspeedRate: Ratio de outspeeds a bosses
        //safePivotRate: ratio de pivotes seguros (>25% HP después de recibir max damage)
        //safeBuffRate: ratio de buff seguros (>30% HP después de recibir max damage)
        //afeHazardsRate: ratio de colocación segura de hazards (>30% HP después de recibir max damage)
        //safeStatusRate: ratio de colocación segura de status (>30% HP después de recibir max damage)
        //stallRate: ratio de poder hacer estrategia de stall (toxic, leech seed, etc) de forma segura
        //wallRate: ratio de ser un muro efectivo (>30% HP después de recibir max damage)
        //riskRate: ratio de perder el 1 vs 1
        //riskyPivotRate: ratio de perder el 1 vs 1 por pivotar
        //enemyOHKORate: ratio de ser OHKO por bosses (métrica de fragilidad)
        //coverage: numero de tipos a los que cubre de los que es débil
        //weaknesses: numero de debilidades del poke
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
            <div key={i} className="flex gap-3 items-center group">
                <item.icon size={12} className={item.color} />
                <p className="text-xs text-slate-300 font-medium" 
                   dangerouslySetInnerHTML={{ __html: item.text.replace(/\*\*(.*?)\*\*/g, `<span class="${item.color}">$1</span>`) }} 
                />
            </div>
        ));
    };

    return (
        <div className="relative bg-[#0B101B] border border-slate-800 rounded-xl overflow-hidden shadow-2xl flex flex-col h-full">
            
            {/* Header */}
            <div className="bg-slate-900/90 border-b border-slate-800 py-3 px-5 flex justify-between items-center backdrop-blur-sm">
                <div className="flex items-center gap-3">
                    {isTheoretical ? (
                        <div className="flex items-center gap-2 text-blue-400">
                            <FlaskConical size={14} />
                            <span className="text-[11px] font-bold tracking-widest">THEORETICAL</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 text-emerald-400">
                            <MapPin size={14} />
                            <span className="text-[11px] font-bold tracking-widest uppercase">
                                {meta.origin ? `FOUND: ${meta.origin}` : 'AVAILABLE'}
                            </span>
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-3">
                    <div className="px-2 py-0.5 bg-slate-800 rounded border border-slate-700 flex items-center gap-1.5">
                        <Zap size={10} className="text-yellow-400" />
                        <span className="text-[10px] font-bold text-slate-200 uppercase">{role}</span>
                    </div>
                </div>
            </div>

            <div className="p-5 flex flex-col gap-5">
                <div className="grid grid-cols-3 gap-3">
                    <PhaseCard label="EARLY" data={phases.early} isActive={selectedPhase === 'early'} onClick={() => setSelectedPhase('early')} />
                    <PhaseCard label="MID" data={phases.mid} isActive={selectedPhase === 'mid'} onClick={() => setSelectedPhase('mid')} />
                    <PhaseCard label="LATE" data={phases.late} isActive={selectedPhase === 'late'} onClick={() => setSelectedPhase('late')} />
                </div>

                <div className="space-y-3 bg-slate-900/40 p-4 rounded border border-slate-800/50 min-h-[80px] flex flex-col justify-center">
                    {renderStats()}
                </div>
            </div>
        </div>
    );
}