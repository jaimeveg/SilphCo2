'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import IntroSimulation from "@/components/hub/IntroSimulation";
import HubNavigation from "@/components/hub/HubNavigation";
import HeroContent from "@/components/hub/HeroContent";

interface HubPageViewProps {
  dict: any;
  lang: string;
}

export default function HubPageView({ dict, lang }: HubPageViewProps) {
  const [showNavigation, setShowNavigation] = useState(false);

  return (
    <div className="w-full min-h-screen flex flex-col p-6 md:p-12 lg:p-24 bg-slate-950 text-slate-200 overflow-hidden">
      
      {/* BACKGROUND NOISE */}
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none z-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
      
      <main className="relative z-10 w-full max-w-7xl mx-auto flex flex-col h-full justify-center min-h-[80vh]">
        
        {/* GRID LAYOUT 
            Mobile: grid-cols-1 (Columna única) -> Orden natural (Texto arriba, Visual abajo)
            Desktop: grid-cols-2 (Dos columnas) -> Izquierda Texto, Derecha Visual
        */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-20 items-center">
          
          {/* 1. CONTENIDO & CONTROLES (TEXTO) 
              Al estar primero en el DOM, en móvil sale arriba.
          */}
          <div className="w-full">
            <HeroContent 
              dict={dict} 
              onExploreClick={() => setShowNavigation(true)}
              onBackClick={() => setShowNavigation(false)}
              showNavigation={showNavigation}
            />
          </div>

          {/* 2. VISUALES DINÁMICOS (SIMULACIÓN / NAV) 
              Al estar segundo en el DOM, en móvil sale debajo.
          */}
          <div className="w-full flex justify-center lg:justify-end relative mt-8 lg:mt-0">
            {/* Contenedor de altura fija para evitar saltos de layout */}
            <div className="w-full h-[350px] md:h-[450px] relative">
                
                <AnimatePresence mode="wait">
                {!showNavigation ? (
                    // VISTA 1: SIMULACIÓN
                    <motion.div
                        key="simulation"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 50 }}
                        transition={{ duration: 0.4, ease: "easeInOut" }}
                        className="absolute inset-0 w-full h-full z-10"
                    >
                        <IntroSimulation />
                    </motion.div>
                ) : (
                    // VISTA 2: NAVEGACIÓN (TARJETAS)
                    <motion.div
                        key="navigation"
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.4, ease: "easeInOut" }}
                        className="absolute inset-0 w-full h-full z-20"
                    >
                        <HubNavigation lang={lang} dict={dict} layout="vertical" />
                    </motion.div>
                )}
                </AnimatePresence>

            </div>
          </div>

        </div>

      </main>
    </div>
  );
}