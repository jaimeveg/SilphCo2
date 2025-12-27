'use client';
import { ArrowDownCircle, LucideIcon } from 'lucide-react';

export interface SubNavSection {
  id: string;
  label: string;
  icon: LucideIcon;
}

interface StickySubNavProps {
  // FIX: Hacemos la prop opcional (?) para evitar errores de TS si falta
  sections?: SubNavSection[];
}

// FIX: Asignamos un array vacío por defecto en la desestructuración
export default function StickySubNav({ sections = [] }: StickySubNavProps) {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      // Offset de 180px para compensar el header sticky completo
      const y = element.getBoundingClientRect().top + window.scrollY - 180;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  // Renderizado defensivo: Si el array está vacío, mostramos estructura básica sin botones
  return (
    <div className="w-full bg-slate-950/90 backdrop-blur-md border-b border-white/5 shadow-2xl transition-all">
      <div className="max-w-7xl mx-auto px-6 h-10 flex items-center justify-between">
        <div className="flex items-center gap-2 opacity-50 shrink-0">
          <ArrowDownCircle size={14} />
          <span className="text-[10px] font-mono uppercase tracking-widest hidden sm:inline">
            Navegación
          </span>
        </div>

        <div className="flex items-center gap-1 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
          {/* Ahora sections siempre será un array, aunque sea vacío */}
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => scrollToSection(section.id)}
              className="flex items-center gap-2 px-3 py-1 rounded-full hover:bg-white/10 text-slate-400 hover:text-brand-cyan transition-colors group whitespace-nowrap"
            >
              {/* Verificación extra por si section.icon no viene */}
              {section.icon && (
                <section.icon
                  size={12}
                  className="group-hover:text-brand-cyan transition-colors"
                />
              )}
              <span className="text-[10px] md:text-xs font-medium group-hover:tracking-wide transition-all">
                {section.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
