'use client';

import { useState, useRef, useEffect } from 'react';
import { GitBranch, ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { IVariety } from '@/types/interfaces';

interface FormSelectorProps {
  currentId: number;
  varieties: IVariety[];
  onChange: (id: string) => void;
}

export default function FormSelector({ currentId, varieties, onChange }: FormSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Cerrar click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Encontrar nombre actual
  const currentVariety = varieties.find(v => v.pokemonId === currentId.toString()) || varieties[0];
  // Limpiamos nombre visualmente si es muy largo
  const displayName = currentVariety?.name.toUpperCase() || "BASE FORM";

  return (
    <div className="relative z-50" ref={containerRef}>
      
      {/* TRIGGER BUTTON */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
            "flex items-center gap-2 pl-2 pr-2 py-1 rounded border transition-all duration-300 group",
            isOpen 
                ? "bg-amber-950/30 border-amber-500/50 text-amber-400" 
                : "bg-slate-900/30 border-transparent hover:border-amber-500/30 text-slate-500 hover:text-amber-400"
        )}
      >
        <GitBranch size={12} />
        
        <span className="text-[10px] font-mono font-bold uppercase tracking-wider max-w-[120px] truncate">
          {displayName}
        </span>
        
        <ChevronDown 
            size={10} 
            className={cn("transition-transform duration-300", isOpen ? "rotate-180" : "")} 
        />
      </button>

      {/* DROPDOWN MENU */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-1 w-48 bg-[#0f172a] border border-slate-700 rounded-lg shadow-[0_10px_40px_-10px_rgba(0,0,0,0.8)] overflow-hidden animate-in fade-in zoom-in-95 origin-top-left">
          <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-amber-500 to-transparent" />
          
          <div className="max-h-[200px] overflow-y-auto no-scrollbar py-1">
            {varieties.map((v) => {
                const isActive = v.pokemonId === currentId.toString();
                return (
                  <button
                    key={v.pokemonId}
                    onClick={() => {
                        onChange(v.pokemonId);
                        setIsOpen(false);
                    }}
                    className={cn(
                        "w-full flex items-center justify-between px-3 py-2 text-[9px] font-mono font-bold uppercase tracking-wider transition-colors text-left",
                        isActive 
                            ? "bg-amber-950/20 text-amber-500" 
                            : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                    )}
                  >
                    {v.name.toUpperCase()}
                    {isActive && <Check size={10} />}
                  </button>
                );
            })}
          </div>
        </div>
      )}
    </div>
  );
}