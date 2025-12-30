'use client';

import { useRef } from 'react';
import HeroHeader from '@/components/ui/HeroHeader';
import NarrativeScene from '@/components/scenes/NarrativeScene';
import content from '@/data/module_1_content_v2.json';
import ModuleCards from '@/components/navigation/ModuleCards';
import StickySubNav from '@/components/navigation/StickySubNav';
import ReadingProgress from '@/components/ui/ReadingProgress';
import { NarrativeSceneData } from '@/types/silph';

// Definimos props para recibir el idioma (aunque no se use en el render visual, es buena práctica mantenerlo)
interface ModulePageProps {
  params: {
    lang: string;
  };
}

export default function Module1Page({ params }: ModulePageProps) {
  // 1. RECUPERACIÓN DE DATOS (Lógica original restaurada)
  const scenes = (content as any).module_1_narrative.scenes as NarrativeSceneData[];
  
  const contentRef = useRef<HTMLDivElement>(null);

  const getSectionId = (index: number) => {
    if (index === 0) return 'types';
    if (index === 2) return 'stats';
    if (index === 8) return 'mechanics';
    if (index === 11) return 'logic';
    return undefined;
  };

  return (
    // Eliminamos bg-slate-950 porque ya está en el layout global, pero mantenemos flex-col y min-h
    <div className="flex flex-col relative min-h-screen">
      
      <HeroHeader />

      <div className="relative z-30">
        <ModuleCards />
      </div>

      <div className="sticky top-0 z-40 shadow-2xl">
        <StickySubNav />
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto">
        <div className="relative" ref={contentRef}>
          {/* Barra de progreso de lectura */}
          <ReadingProgress containerRef={contentRef} />

          <div className="flex flex-col">
            {/* 2. BUCLE DE ESCENAS (Esto es lo que faltaba y arregla el error del index) */}
            {scenes.map((scene, index) => (
              <div
                key={scene.id}
                id={getSectionId(index)}
                className="relative scroll-mt-[140px]"
              >
                {/* Pasamos 'index' correctamente como requiere el componente */}
                <NarrativeScene data={scene} index={index} />
              </div>
            ))}
          </div>
        </div>

        <section className="h-[30vh] flex items-center justify-center text-slate-600 font-mono text-xs border-t border-slate-800/50 mt-12">
          END OF SEQUENCE // MODULE_01 COMPLETED
        </section>
      </div>

      {/* Ruido de fondo (Opcional, si ya está en layout se puede quitar, pero mal no hace) */}
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none z-[5] mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
    </div>
  );
}