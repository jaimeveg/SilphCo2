'use client';
import { useRef } from 'react';
import HeroHeader from '@/components/ui/HeroHeader';
import NarrativeScene from '@/components/scenes/NarrativeScene';
import content from '@/data/module_1_content_v2.json';

import ModuleCards from '@/components/navigation/ModuleCards';
import StickySubNav from '@/components/navigation/StickySubNav';
import ReadingProgress from '@/components/ui/ReadingProgress';

// 1. IMPORTAR LA INTERFAZ
import { NarrativeSceneData } from '@/types/silph';

export default function Page() {
  // 2. APLICAR CASTING EXPLÍCITO (as unknown as NarrativeSceneData[])
  // Esto fuerza a TS a tratar los strings del JSON como los literales que necesitamos.
  const scenes = content.module_1_narrative.scenes as unknown as NarrativeSceneData[];
  
  const contentRef = useRef<HTMLDivElement>(null);

  const getSectionId = (index: number) => {
    if (index === 0) return 'types';
    if (index === 2) return 'stats';
    if (index === 8) return 'mechanics';
    if (index === 11) return 'logic';
    return undefined;
  };

  return (
    <div className="flex flex-col relative min-h-screen bg-slate-950">
      <HeroHeader />

      <div className="relative z-30">
        <ModuleCards />
      </div>

      <div className="sticky top-0 z-40 shadow-2xl">
        <StickySubNav />
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto">
        <div className="relative" ref={contentRef}>
          <ReadingProgress containerRef={contentRef} />

          <div className="flex flex-col">
            {scenes.map((scene, index) => (
              <div
                key={scene.id}
                id={getSectionId(index)}
                // SCROLL MARGIN SINCRONIZADO CON JS: 140px
                className="relative scroll-mt-[140px]"
              >
                <NarrativeScene data={scene} index={index} />
              </div>
            ))}
          </div>
        </div>

        <section className="h-[30vh] flex items-center justify-center text-slate-600 font-mono text-xs border-t border-slate-800/50 mt-12">
          END OF SEQUENCE // MODULE_01 COMPLETED
        </section>
      </div>

      <div className="fixed inset-0 opacity-[0.03] pointer-events-none z-[5] mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
    </div>
  );
}