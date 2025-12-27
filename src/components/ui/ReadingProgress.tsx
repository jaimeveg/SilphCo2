'use client';
import { RefObject } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

interface ReadingProgressProps {
  containerRef: RefObject<HTMLElement>;
}

export default function ReadingProgress({
  containerRef,
}: ReadingProgressProps) {
  const { scrollYProgress } = useScroll({
    target: containerRef,
    // "start center": Empieza a llenarse cuando el contenido llega al centro
    // "end end": Termina cuando el final del contenido toca el final de la pantalla
    offset: ['start center', 'end end'],
  });

  const topPosition = useTransform(scrollYProgress, [0, 1], ['0%', '100%']);

  return (
    // FIX: bottom-0 (Antes bottom-24).
    // Al haber sacado el footer del contenedor padre, ahora queremos que la línea
    // llegue hasta el final absoluto de la última escena.
    <div className="absolute left-1/2 -translate-x-1/2 top-24 bottom-0 w-[2px] z-0 hidden lg:block">
      {/* Track Base */}
      <div className="absolute inset-0 bg-slate-800/30 w-px mx-auto rounded-full" />

      {/* Barra de Progreso */}
      <motion.div
        style={{ scaleY: scrollYProgress }}
        className="absolute top-0 left-0 right-0 w-px mx-auto bg-gradient-to-b from-brand-cyan/0 via-brand-cyan to-brand-cyan origin-top shadow-[0_0_15px_#38BDF8]"
      />

      {/* Puntero */}
      <motion.div
        style={{ top: topPosition }}
        className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-slate-950 border border-brand-cyan shadow-[0_0_10px_#38BDF8] z-10"
      />
    </div>
  );
}
