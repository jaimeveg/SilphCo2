'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom'; // CLAVE: Importamos Portal
import { EyeOff, Info } from 'lucide-react';
import { IAbility } from '@/types/interfaces';
import { cn } from '@/lib/utils';

interface Props {
  ability: IAbility;
}

export default function AbilityChip({ ability }: Props) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const [mounted, setMounted] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);

  // Necesario para evitar errores de hidratación con Portals en Next.js
  useEffect(() => {
    setMounted(true);
  }, []);

  const updateCoords = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setCoords({ 
        top: rect.top, // Borde superior exacto del chip
        left: rect.left + (rect.width / 2) // Centro horizontal exacto
      });
    }
  };

  const handleMouseEnter = () => {
    updateCoords();
    setShowTooltip(true);
  };

  // Recalcular al hacer scroll para que no se "despegue" visualmente
  useEffect(() => {
    if (showTooltip) {
        window.addEventListener('scroll', updateCoords, true);
        window.addEventListener('resize', updateCoords);
    }
    return () => {
        window.removeEventListener('scroll', updateCoords, true);
        window.removeEventListener('resize', updateCoords);
    };
  }, [showTooltip]);

  // Contenido del Tooltip (Renderizado vía Portal)
  const tooltipContent = coords ? (
    <div 
      className="fixed z-[9999] pointer-events-none top-0 left-0 w-full h-0" // Contenedor fantasma global
    >
        <div 
            className="absolute flex flex-col items-center"
            style={{ 
                // Usamos las coordenadas globales directas
                top: coords.top - 8, 
                left: coords.left,
                transform: 'translate(-50%, -100%)' // Centrado horizontal + mover hacia arriba
            }}
        >
            <div className={cn(
                "p-2 rounded shadow-[0_10px_40px_rgba(0,0,0,0.9)] text-[10px] leading-relaxed relative backdrop-blur-md border w-max max-w-[240px]",
                ability.isHidden 
                    ? "bg-purple-950/95 border-purple-500/50 text-purple-100" 
                    : "bg-slate-900/95 border-slate-700 text-slate-300"
            )}>
                {ability.description}
                
                {/* Flecha decorativa */}
                <div className={cn(
                    "absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent",
                    ability.isHidden ? "border-t-purple-500/50" : "border-t-slate-700"
                )} />
            </div>
        </div>
    </div>
  ) : null;

  return (
    <>
      <div 
        ref={triggerRef}
        className={cn(
          "flex items-center justify-between p-2 rounded border transition-all duration-300 cursor-help select-none min-w-[120px]",
          ability.isHidden 
            ? "bg-purple-950/20 border-purple-500/30 hover:border-purple-500/60 hover:bg-purple-900/30" 
            : "bg-slate-900/40 border-slate-700 hover:border-cyan-500/50 hover:bg-slate-800/60"
        )}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setShowTooltip(false)}
        onClick={() => { updateCoords(); setShowTooltip(!showTooltip); }}
      >
        <div className="flex items-center gap-2">
          {ability.isHidden && (
            <div className="bg-purple-500/20 p-0.5 rounded text-purple-400" title="Habilidad Oculta">
                <EyeOff size={12} />
            </div>
          )}
          
          <span className={cn(
            "text-xs font-bold uppercase tracking-wide whitespace-nowrap",
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

      {/* Renderizado en el BODY para escapar de cualquier contexto de apilamiento o transformación padre */}
      {mounted && showTooltip && createPortal(tooltipContent, document.body)}
    </>
  );
}