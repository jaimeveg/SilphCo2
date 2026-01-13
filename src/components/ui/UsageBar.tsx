import { cn } from '@/lib/utils';

interface Props {
    label: string;
    value: number; // 0-100
    color?: string;
    height?: string;
    showValue?: boolean;
}

export default function UsageBar({ label, value, color = "bg-cyan-500", height = "h-5", showValue = true }: Props) {
    return (
        <div className="relative w-full group select-none mb-1">
            <div className={cn("w-full bg-slate-900/50 rounded-sm overflow-hidden border border-slate-800/50 relative", height)}>
                <div 
                    className={cn("h-full transition-all duration-700 ease-out opacity-60 group-hover:opacity-90", color)} 
                    style={{ width: `${value}%` }} 
                />
                <div className="absolute inset-0 flex justify-between items-center px-2 text-[9px] font-mono font-bold z-10 text-slate-200 drop-shadow-md">
                    <span className="truncate max-w-[85%]">{label}</span>
                    {showValue && <span className="text-cyan-100">{value}%</span>}
                </div>
            </div>
        </div>
    );
}