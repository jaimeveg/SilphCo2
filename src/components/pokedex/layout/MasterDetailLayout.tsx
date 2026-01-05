'use client';

import { ReactNode } from 'react';

interface MasterDetailLayoutProps {
  master: ReactNode;
  detail: ReactNode;
}

export default function MasterDetailLayout({ master, detail }: MasterDetailLayoutProps) {
  return (
    // CONTENEDOR RAIZ: h-[100dvh] ancla al viewport móvil real.
    <div className="flex flex-col lg:flex-row w-full h-[100dvh] overflow-hidden bg-slate-950">
      
      {/* MASTER COLUMN */}
      <aside className="
        w-full lg:w-[420px] xl:w-[480px] shrink-0
        h-[40vh] lg:h-full 
        flex flex-col
        border-b lg:border-b-0 lg:border-r border-slate-800/60
        bg-slate-950/80 backdrop-blur-md
        z-20
      ">
        {/* FIX CRÍTICO: data-lenis-prevent
            Esto le dice al scroll global: "Detente aquí, yo manejo mi propio scroll".
        */}
        <div 
          className="flex-1 overflow-y-auto no-scrollbar overscroll-contain p-6 pb-24 min-h-0"
          data-lenis-prevent="true" 
        >
          {master}
        </div>
      </aside>

      {/* DETAIL DECK */}
      <main className="flex-1 h-full relative flex flex-col bg-slate-950/30 min-w-0">
        {/* FIX CRÍTICO: data-lenis-prevent también aquí */}
        <div 
          className="flex-1 overflow-y-auto no-scrollbar overscroll-contain p-6 lg:p-10 pb-24 min-h-0"
          data-lenis-prevent="true"
        >
          {detail}
        </div>
      </main>

    </div>
  );
}