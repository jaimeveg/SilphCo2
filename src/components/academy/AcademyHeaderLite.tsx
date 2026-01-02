'use client';

import { Terminal, Database } from 'lucide-react';

interface AcademyHeaderLiteProps {
  dict: any;
}

export default function AcademyHeaderLite({ dict }: AcademyHeaderLiteProps) {
  const t = dict.academy_hub;

  // Separamos las partes del texto de marca
  // Asumimos que el formato en JSON sigue siendo "PARTE 1 // PARTE 2"
  const brandParts = t.brand.split('//').map((s: string) => s.trim());
  const companyName = brandParts[0];
  const appName = brandParts[1];

  return (
    <div className="w-full h-full flex flex-col justify-start p-8 md:p-12 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
      
      <div className="relative z-10 space-y-6">
        {/* Brand Label */}
        <div className="flex items-center gap-2 text-brand-cyan/70 font-mono text-[10px] tracking-[0.2em] uppercase">
          <Database size={12} />
          <span>DATABANK_V2.0</span>
        </div>

        {/* Main Title Refactored */}
        <h1 className="flex flex-col font-display font-bold tracking-tighter leading-none">
          {/* SILPH CO. / S.A. - Más grande y blanco */}
          <span className="text-5xl md:text-6xl text-white">
            {companyName}
          </span>
          {/* POKEACADEMY - Más pequeño y neón */}
          <span className="text-3xl md:text-4xl text-brand-cyan mt-2 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]">
            {appName}
          </span>
        </h1>

        {/* Subtitle */}
        <div className="flex items-start gap-3 p-4 bg-slate-900/50 border-l-2 border-brand-cyan/50 backdrop-blur-sm rounded-r-lg max-w-sm mt-8">
          <Terminal size={18} className="text-slate-500 mt-0.5 shrink-0" />
          <p className="text-sm text-slate-400 font-mono leading-relaxed">
            {t.subtitle}
          </p>
        </div>
      </div>

      {/* Footer Decor */}
      <div className="mt-auto pt-12 hidden md:block">
        <div className="flex gap-2">
            {[...Array(3)].map((_, i) => (
                <div key={i} className="w-1 h-1 bg-slate-800 rounded-full" />
            ))}
        </div>
      </div>
    </div>
  );
}