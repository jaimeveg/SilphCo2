'use client';
import { ReactLenis } from '@studio-freight/react-lenis';
import { useRef, useEffect } from 'react';

export default function ScrollProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const lenisRef = useRef<any>(null);

  useEffect(() => {
    // DIAGNÓSTICO: Ver qué estructura tiene el ref realmente
    console.log('[ScrollProvider] Ref content:', lenisRef.current);

    // ESTRATEGIA DE ASIGNACIÓN ROBUSTA
    // Intento 1: Propiedad .lenis (versiones antiguas/wrappers)
    // Intento 2: Instancia directa (versiones nuevas)
    const lenisInstance = lenisRef.current?.lenis || lenisRef.current;

    if (lenisInstance) {
      console.log(
        '[ScrollProvider] ✅ Lenis Instance Found & Exposed globally'
      );
      (window as any).lenis = lenisInstance;
    } else {
      console.error('[ScrollProvider] ❌ Failed to find Lenis instance in ref');
    }

    // Limpieza al desmontar
    return () => {
      (window as any).lenis = null;
    };
  }, []);

  return (
    <ReactLenis
      ref={lenisRef}
      root
      options={{
        lerp: 0.07,
        duration: 1.8,
        smoothWheel: true,
        wheelMultiplier: 0.8,
        touchMultiplier: 1.5,
        orientation: 'vertical',
        gestureOrientation: 'vertical',
        infinite: false,
      }}
    >
      {children}
    </ReactLenis>
  );
}
