'use client';
import { cn } from '@/lib/utils';
import TypeBadge from '@/components/ui/TypeBadge';

interface TypeHeatmapProps {
  data: Record<string, number>; // Ej: { "fire": 120, "water": 40 }
  className?: string;
  totalTeams?: number;
}

const TYPE_ORDER = [
  'normal', 'fire', 'water', 'electric', 'grass', 'ice',
  'fighting', 'poison', 'ground', 'flying', 'psychic', 'bug',
  'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy'
];

export default function TypeHeatmap({ data, className, totalTeams = 1 }: TypeHeatmapProps) {
  // Encontrar el uso máximo para normalizar a una escala visual
  const maxValue = Math.max(...Object.values(data), 1);

  return (
    <div className={cn("grid grid-cols-6 gap-1.5 p-3 bg-slate-900/40 rounded-xl border border-white/5", className)}>
      {TYPE_ORDER.map((typeSlug) => {
        const rawUsage = data[typeSlug] || 0;
        const normalizedScore = rawUsage / maxValue; // 0.0 to 1.0
        
        // Calculate percentages if we have totalTeams
        const percentRaw = ((rawUsage / totalTeams) * 100).toFixed(1);

        // Map normalizedScore to visual weight instead of grayscale
        let heatClass = "opacity-40 scale-90";
        if (normalizedScore > 0.8) heatClass = "opacity-100 scale-105 drop-shadow-[0_0_12px_rgba(255,255,255,0.4)] z-10 font-bold bg-white/5";
        else if (normalizedScore > 0.5) heatClass = "opacity-90 scale-100 bg-white/5";
        else if (normalizedScore > 0.2) heatClass = "opacity-75 scale-95";

        return (
          <div 
            key={typeSlug} 
            className={cn("group flex flex-col items-center justify-between p-2 rounded-lg transition-all duration-300 relative border border-transparent hover:border-slate-700 hover:bg-slate-800", heatClass)}
            title={`${typeSlug.toUpperCase()}: ${percentRaw}% Usage`}
          >
            <div className="mb-1 w-full flex justify-center">
                <TypeBadge type={typeSlug as any} />
            </div>
            <span className={cn(
              "text-[9px] font-mono transition-colors",
              normalizedScore > 0.8 ? "text-white" : "text-slate-500 group-hover:text-slate-300"
            )}>
              {percentRaw}%
            </span>
          </div>
        );
      })}
    </div>
  );
}
