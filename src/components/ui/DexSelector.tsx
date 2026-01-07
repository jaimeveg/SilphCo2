'use client';
import { useState, useRef, useEffect } from 'react';
import { Layers, ChevronDown, Check } from 'lucide-react';
import { PokedexContext } from '@/hooks/usePokemonNavigation';
import { cn } from '@/lib/utils';

interface DexSelectorProps {
  current: PokedexContext;
  options: PokedexContext[];
  onChange: (value: PokedexContext) => void;
}

export default function DexSelector({ current, options, onChange }: DexSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Cerrar al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative group" ref={containerRef}>
      {/* TRIGGER BUTTON (Estilizado) */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
            "flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-lg transition-all duration-300",
            "bg-slate-900/50 border border-slate-800 hover:border-cyan-500/50",
            isOpen ? "border-cyan-500 shadow-[0_0_10px_rgba(34,211,238,0.2)]" : ""
        )}
      >
        <Layers size={12} className={cn("transition-colors", isOpen ? "text-cyan-400" : "text-slate-500")} />
        
        <span className="text-[10px] font-mono font-bold uppercase text-slate-300 min-w-[80px] text-right">
          {current} DEX
        </span>
        
        <ChevronDown 
            size={12} 
            className={cn("text-slate-500 transition-transform duration-300", isOpen ? "rotate-180 text-cyan-400" : "")} 
        />
      </button>

      {/* DROPDOWN MENU (Custom) */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-48 bg-[#0f172a] border border-slate-700 rounded-lg shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 origin-top-right">
          <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-cyan-500 to-transparent" />
          
          <div className="max-h-[300px] overflow-y-auto no-scrollbar py-1">
            {options.map((opt) => (
              <button
                key={opt}
                onClick={() => {
                    onChange(opt);
                    setIsOpen(false);
                }}
                className={cn(
                    "w-full flex items-center justify-between px-4 py-2 text-[10px] font-mono font-bold uppercase tracking-wider transition-colors",
                    current === opt 
                        ? "bg-cyan-950/30 text-cyan-400" 
                        : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                )}
              >
                {opt} REGION
                {current === opt && <Check size={12} />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}