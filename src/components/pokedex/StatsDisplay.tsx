import { IStat } from '@/types/pokemon';

interface StatsDisplayProps {
  stats: IStat[];
}

export default function StatsDisplay({ stats }: StatsDisplayProps) {
  return (
    <div className="w-full space-y-3 bg-slate-900/50 p-4 rounded-xl border border-slate-800">
      <h3 className="text-xs font-mono text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-700 pb-2">
        Base Statistics
      </h3>
      <div className="grid gap-2">
        {stats.map((stat) => (
          <div key={stat.label} className="grid grid-cols-[3rem_1fr_2rem] items-center gap-3">
            {/* Label */}
            <span className="text-xs font-bold text-slate-400 font-mono">
              {stat.label}
            </span>
            
            {/* Bar */}
            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-cyan-500 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${(stat.value / stat.max) * 100}%` }}
              />
            </div>

            {/* Value */}
            <span className="text-xs font-mono text-right text-slate-200">
              {stat.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}