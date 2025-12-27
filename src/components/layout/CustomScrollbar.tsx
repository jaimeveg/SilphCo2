'use client';
import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';

export default function CustomScrollbar() {
  const [docHeight, setDocHeight] = useState(0);
  const [winHeight, setWinHeight] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const thumbRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  // --- 1. MEDICIÓN DEL ENTORNO ---
  useEffect(() => {
    const resizeObserver = new ResizeObserver(() => {
      setDocHeight(document.documentElement.scrollHeight);
      setWinHeight(window.innerHeight);
    });

    resizeObserver.observe(document.documentElement);

    const handleResize = () => {
      setDocHeight(document.documentElement.scrollHeight);
      setWinHeight(window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // --- 2. SINCRONIZACIÓN SCROLL -> BARRA (RAF LOOP) ---
  useEffect(() => {
    let rafId: number;

    const syncScroll = () => {
      if (!isDragging && thumbRef.current && docHeight > 0) {
        const scrollY = window.scrollY;
        const thumbHeight = Math.max((winHeight / docHeight) * winHeight, 50);
        const availableSpace = winHeight - thumbHeight;
        const scrollRatio = scrollY / (docHeight - winHeight);

        const thumbY = scrollRatio * availableSpace;

        thumbRef.current.style.height = `${thumbHeight}px`;
        thumbRef.current.style.transform = `translate3d(0, ${thumbY}px, 0)`;
      }
      rafId = requestAnimationFrame(syncScroll);
    };

    syncScroll();
    return () => cancelAnimationFrame(rafId);
  }, [docHeight, winHeight, isDragging]);

  // --- 3. LÓGICA DE ARRASTRE (DRAG) ---
  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    setIsDragging(true);

    const track = trackRef.current;
    const thumb = thumbRef.current;
    if (!track || !thumb) return;

    const startY = e.clientY;
    const transform = window.getComputedStyle(thumb).transform;
    const matrix = new DOMMatrix(transform);
    const startTop = matrix.m42;

    const onPointerMove = (moveEvent: PointerEvent) => {
      moveEvent.preventDefault();

      const deltaY = moveEvent.clientY - startY;
      const newTop = startTop + deltaY;

      const thumbHeight = thumb.offsetHeight;
      const availableTrack = winHeight - thumbHeight;
      const boundedTop = Math.max(0, Math.min(newTop, availableTrack));

      const ratio = boundedTop / availableTrack;
      const targetScroll = ratio * (docHeight - winHeight);

      // Actualización Visual
      thumb.style.transform = `translate3d(0, ${boundedTop}px, 0)`;

      // --- CORRECCIÓN AQUÍ: DESEMPAQUETADO ROBUSTO ---
      const globalLenis = (window as any).lenis;
      // Si es el wrapper, accedemos a la instancia interna. Si no, usamos el objeto tal cual.
      const lenisInstance = globalLenis?.lenis || globalLenis;

      // Verificamos que el método exista antes de llamar
      if (lenisInstance && typeof lenisInstance.scrollTo === 'function') {
        lenisInstance.scrollTo(targetScroll, { immediate: true });
      } else {
        // Fallback nativo
        window.scrollTo(0, targetScroll);
      }
    };

    const onPointerUp = () => {
      setIsDragging(false);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  if (docHeight <= winHeight) return null;

  return (
    <div
      className="fixed top-0 right-0 h-full w-3 z-50 hidden lg:block group mix-blend-difference"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div ref={trackRef} className="absolute inset-0 bg-transparent" />

      <motion.div
        ref={thumbRef}
        onPointerDown={handlePointerDown}
        animate={{
          width: isHovered || isDragging ? 6 : 2,
          backgroundColor: isDragging
            ? '#38BDF8'
            : isHovered
            ? '#38BDF8'
            : '#94a3b8',
          opacity: isHovered || isDragging ? 1 : 0.5,
        }}
        transition={{ duration: 0.2 }}
        className="absolute right-0.5 rounded-full cursor-grab active:cursor-grabbing"
        style={{ touchAction: 'none' }}
      />
    </div>
  );
}
