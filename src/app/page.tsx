'use client';
import { useRef } from 'react';
import { Hash, Activity, Sword, Brain } from 'lucide-react';
import HeroHeader from '@/components/ui/HeroHeader';
import NarrativeScene from '@/components/scenes/NarrativeScene';
import content from '@/data/module_1_content_v2.json';

import ModuleCards from '@/components/navigation/ModuleCards';
import StickySubNav from '@/components/navigation/StickySubNav';
import ReadingProgress from '@/components/ui/ReadingProgress';

const MODULE_1_SECTIONS = [
  { id: 'types', label: 'Tipos', icon: Hash },
  { id: 'stats', label: 'Stats', icon: Activity },
  { id: 'mechanics', label: 'Combate', icon: Sword },
  { id: 'logic', label: 'Lógica', icon: Brain },
];

export default function Page() {
  const { scenes } = content.module_1_narrative;
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

      <div className="sticky top-0 z-40 shadow-2xl">
        <ModuleCards />
        <StickySubNav sections={MODULE_1_SECTIONS} />
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto">
        {/* --- ZONA DE RASTREO (Solo contenido) --- */}
        {/* El ref está aquí, por lo que el progreso acaba cuando acaba este div */}
        <div className="relative" ref={contentRef}>
          <ReadingProgress containerRef={contentRef} />

          <div className="flex flex-col">
            {scenes.map((scene, index) => (
              <div
                key={scene.id}
                id={getSectionId(index)}
                className="relative scroll-mt-[200px]"
              >
                <NarrativeScene data={scene} index={index} />
              </div>
            ))}
          </div>
        </div>
        {/* ---------------------------------------- */}

        {/* FOOTER (Fuera del rastreo) */}
        <section className="h-[30vh] flex items-center justify-center text-slate-600 font-mono text-xs border-t border-slate-800/50 mt-12">
          END OF SEQUENCE // MODULE_01 COMPLETED
        </section>
      </div>

      <div className="fixed inset-0 opacity-[0.03] pointer-events-none z-[5] mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
    </div>
  );
}
