'use client';

import { useState } from 'react';
import { EyeOff, Info } from 'lucide-react';
import { IAbility } from '@/types/interfaces';
import { cn } from '@/lib/utils';

interface Props {
  ability: IAbility;
}

export default function AbilityChip({ ability }: Props) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div 
      // FIX CRÍTICO: 'hover:z-[100]' eleva este chip por encima de todo el layout
      // cuando se interactúa con él, evitando que el tooltip quede tapado por paneles vecinos.
      className="relative group hover:z-[100]"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onClick={() => setShowTooltip(!showTooltip)}
    >
      <div className={cn(
        "flex items-center justify-between p-2 rounded border transition-all duration-300 cursor-help select-none",
        ability.isHidden 
          ? "bg-purple-950/20 border-purple-500/30 hover:border-purple-500/60 hover:bg-purple-900/30" 
          : "bg-slate-900/40 border-slate-700 hover:border-cyan-500/50 hover:bg-slate-800/60"
      )}>
        <div className="flex items-center gap-2">
          {ability.isHidden && (
            <div className="bg-purple-500/20 p-0.5 rounded text-purple-400" title="Habilidad Oculta">
                <EyeOff size={12} />
            </div>
          )}
          
          <span className={cn(
            "text-xs font-bold uppercase tracking-wide whitespace-nowrap", // Evitar saltos de línea raros
            ability.isHidden ? "text-purple-300" : "text-slate-200"
          )}>
            {ability.name}
          </span>
        </div>
        
        <Info size={12} className={cn(
            "transition-colors ml-2",
            ability.isHidden ? "text-purple-500 group-hover:text-purple-300" : "text-slate-600 group-hover:text-cyan-400"
        )} />
      </div>

      {/* Tooltip con Descripción */}
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[240px] z-[200] px-1">
          <div className={cn(
              "p-2 rounded shadow-[0_10px_40px_rgba(0,0,0,0.8)] text-[10px] leading-relaxed relative backdrop-blur-md border",
              ability.isHidden 
                ? "bg-purple-950/95 border-purple-500/50 text-purple-100" 
                : "bg-slate-900/95 border-slate-700 text-slate-300"
          )}>
            {ability.description}
            
            {/* Flecha del tooltip */}
            <div className={cn(
                "absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent",
                ability.isHidden ? "border-t-purple-500/50" : "border-t-slate-700"
            )} />
          </div>
        </div>
      )}
    </div>
  );
}