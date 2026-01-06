'use client';

import { Activity, Swords, Trophy, Skull } from 'lucide-react';
import { cn } from '@/lib/utils';

// Definición estricta de las pestañas disponibles
export type TabOption = 'DATA' | 'MOVES' | 'PVP' | 'NUZLOCKE';

interface TabNavigatorProps {
  activeTab: TabOption;
  onTabChange: (tab: TabOption) => void;
}

export default function TabNavigator({ activeTab, onTabChange }: TabNavigatorProps) {
  
  // Configuración de las pestañas (Extensible fácilmente)
  const tabs: { id: TabOption; label: string; icon: React.ElementType }[] = [
    { id: 'DATA', label: 'Bio', icon: Activity },
    { id: 'MOVES', label: 'Moves', icon: Swords },
    { id: 'PVP', label: 'Tactics', icon: Trophy },
    { id: 'NUZLOCKE', label: 'Nuzlocke', icon: Skull },
  ];

  return (
    <nav className="sticky top-0 z-30 w-full bg-slate-950/80 backdrop-blur-md border-b border-slate-800/60 mb-6">
      <div className="flex items-center justify-start md:justify-start overflow-x-auto no-scrollbar">
        
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "relative flex items-center gap-2 px-6 py-4 transition-all duration-300 group min-w-fit",
                // Estado Activo vs Inactivo
                isActive 
                  ? "text-cyan-400 bg-cyan-950/10" 
                  : "text-slate-500 hover:text-slate-300 hover:bg-slate-900/30"
              )}
            >
              {/* Icono con efecto glow si está activo */}
              <Icon 
                size={18} 
                className={cn(
                  "transition-transform duration-300",
                  isActive ? "drop-shadow-[0_0_8px_rgba(34,211,238,0.5)] scale-110" : "group-hover:scale-110"
                )} 
              />
              
              <span className="font-display font-bold text-sm tracking-wider uppercase">
                {tab.label}
              </span>

              {/* Indicador Inferior (Active Bar) */}
              <div 
                className={cn(
                  "absolute bottom-0 left-0 h-[2px] w-full bg-cyan-400 shadow-[0_0_10px_cyan] transition-opacity duration-300",
                  isActive ? "opacity-100" : "opacity-0"
                )} 
              />
            </button>
          );
        })}
      </div>
    </nav>
  );
}