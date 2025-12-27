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
    // ESTRATEGIA DE ASIGNACIÓN ROBUSTA
    // Detectamos si la instancia está anidada (.lenis) o es directa
    // Esto es crítico para que NarrativeScene pueda controlar el scroll
    const lenisInstance = lenisRef.current?.lenis || lenisRef.current;

    if (lenisInstance) {
      (window as any).lenis = lenisInstance;
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