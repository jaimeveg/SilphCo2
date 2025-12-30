'use client';

import { useRef } from 'react';
import HeroHeader from '@/components/ui/HeroHeader';
import NarrativeScene from '@/components/scenes/NarrativeScene';
import ModuleCards from '@/components/navigation/ModuleCards';
import StickySubNav from '@/components/navigation/StickySubNav';
import ReadingProgress from '@/components/ui/ReadingProgress';
import { NarrativeSceneData } from '@/types/silph';
// NUEVO IMPORT: Traemos la factoría aquí
import { getModule1Sections } from '@/data/navigation';

interface Module1ViewProps {
  scenes: NarrativeSceneData[];
  // navigationSections: NavSection[]; <--- ELIMINADO DE PROPS
  dict: any;
}

export default function Module1View({ scenes, dict }: Module1ViewProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  
  // GENERACIÓN DE NAVEGACIÓN EN CLIENTE (Seguro para iconos)
  const navigationSections = getModule1Sections(dict);

  const getSectionId = (index: number) => {
    if (index === 0) return 'types';
    if (index === 2) return 'stats';
    if (index === 8) return 'mechanics';
    if (index === 11) return 'logic';
    return undefined;
  };

  return (
    <div className="flex flex-col relative min-h-screen">
      <HeroHeader />

      <div className="relative z-30">
        <ModuleCards />
      </div>

      <div className="sticky top-0 z-40 shadow-2xl">
        <StickySubNav sections={navigationSections} dict={dict} />
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto">
        <div className="relative" ref={contentRef}>
          <ReadingProgress containerRef={contentRef} />

          <div className="flex flex-col">
            {scenes.map((scene, index) => (
              <div
                key={scene.id}
                id={getSectionId(index)}
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