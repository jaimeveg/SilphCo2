'use client';
import { useState, useRef } from 'react';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createPortal } from 'react-dom';

interface Props {
  name: string;
  isHidden: boolean;
  description: string;
}

export default function AbilityChip({ name, isHidden, description }: Props) {
  const [isHovered, setIsHovered] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const chipRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = () => {
    if (chipRef.current) {
      const rect = chipRef.current.getBoundingClientRect();
      // Posicionamos el tooltip encima del chip, centrado
      setCoords({
        top: rect.top - 10, // 10px arriba
        left: rect.left + rect.width / 2
      });
    }
    setIsHovered(true);
  };

  return (
    <>
      <div 
        ref={chipRef}
        className="relative group/ability"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className={cn(
          "cursor-help flex items-center gap-2 px-4 py-2 rounded border transition-all duration-300",
          isHidden 
            ? "border-purple-500/40 bg-purple-500/10 text-purple-200 hover:bg-purple-500/20" 
            : "border-slate-700 bg-slate-800/60 text-slate-200 hover:border-cyan-500/50 hover:bg-slate-800"
        )}>
          {isHidden && <Sparkles size={10} className="text-purple-400" />}
          <span className="text-xs font-mono font-bold uppercase tracking-wide">
            {name}
          </span>
        </div>
      </div>

      {/* PORTAL TOOLTIP: Renderizado fuera del flujo normal para evitar overflow */}
      {isHovered && typeof document !== 'undefined' && createPortal(
        <div 
            className="fixed z-[9999] pointer-events-none w-64 transition-all duration-200 animate-in fade-in zoom-in-95"
            style={{ 
                top: coords.top, 
                left: coords.left, 
                transform: 'translate(-50%, -100%)' // Centrado horizontal, encima vertical
            }}
        >
          <div className="bg-[#0f172a] border border-slate-600 shadow-[0_0_30px_rgba(0,0,0,0.8)] rounded-lg p-4 text-left mb-2">
              <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-cyan-500 to-transparent" />
              
              <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-800">
                  <span className="text-[9px] font-mono text-cyan-500 uppercase tracking-widest">ABILITY_DATA</span>
                  {isHidden && <span className="text-[9px] font-mono text-purple-400 uppercase">HIDDEN_GENE</span>}
              </div>
              
              <p className="text-xs text-slate-300 leading-relaxed font-sans opacity-90">
                  {description}
              </p>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}