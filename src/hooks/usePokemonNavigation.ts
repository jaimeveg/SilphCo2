'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams, useParams } from 'next/navigation'; // Importamos useParams
import { usePokedexEntries } from '@/services/pokeapi';

export type PokedexContext = 'NATIONAL' | 'KANTO' | 'JOHTO' | 'HOENN' | 'SINNOH' | 'UNOVA' | 'KALOS' | 'ALOLA' | 'GALAR' | 'HISUI' | 'PALDEA';

// LÍMITES
const CONTEXT_LIMITS: Record<PokedexContext, { min: number; max: number }> = {
  NATIONAL: { min: 1, max: 1025 },
  KANTO: { min: 1, max: 151 },
  JOHTO: { min: 1, max: 251 },
  HOENN: { min: 1, max: 386 },
  SINNOH: { min: 1, max: 493 },
  UNOVA: { min: 1, max: 649 },
  KALOS: { min: 1, max: 721 },
  ALOLA: { min: 1, max: 809 },
  GALAR: { min: 1, max: 905 },
  HISUI: { min: 1, max: 905 },
  PALDEA: { min: 1, max: 1025 }
};

export function usePokemonNavigation(currentId: number) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams(); // Obtenemos los parámetros de la ruta
  
  // Extraemos el idioma actual (fallback a 'es' por seguridad)
  const lang = params.lang as string || 'es';

  const urlDex = searchParams.get('dex') as PokedexContext | null;
  const [context, setContext] = useState<PokedexContext>(urlDex || 'NATIONAL');
  const { data: regionEntries } = usePokedexEntries(context);

  const getNextId = useCallback((direction: 'next' | 'prev') => {
    // Lógica Regional
    if (context !== 'NATIONAL' && regionEntries && regionEntries.length > 0) {
        const currentIdString = currentId.toString();
        const currentIndex = regionEntries.findIndex((id) => id === currentIdString);
        
        if (currentIndex === -1) return parseInt(regionEntries[0]);

        let nextIndex;
        if (direction === 'next') {
            nextIndex = currentIndex >= regionEntries.length - 1 ? 0 : currentIndex + 1;
        } else {
            nextIndex = currentIndex <= 0 ? regionEntries.length - 1 : currentIndex - 1;
        }
        return parseInt(regionEntries[nextIndex]);
    }

    // Lógica Nacional
    const limits = CONTEXT_LIMITS[context] || CONTEXT_LIMITS.NATIONAL;
    if (direction === 'next') {
      return currentId >= limits.max ? limits.min : currentId + 1;
    } else {
      return currentId <= limits.min ? limits.max : currentId - 1;
    }
  }, [currentId, context, regionEntries]);

  const goToNext = useCallback(() => {
    const next = getNextId('next');
    const query = context !== 'NATIONAL' ? `?dex=${context}` : '';
    // FIX: Usamos la variable 'lang' dinámica en lugar de '/es/'
    router.push(`/${lang}/pokedex/${next}${query}`);
  }, [getNextId, context, router, lang]);

  const goToPrev = useCallback(() => {
    const prev = getNextId('prev');
    const query = context !== 'NATIONAL' ? `?dex=${context}` : '';
    // FIX: Usamos la variable 'lang' dinámica en lugar de '/es/'
    router.push(`/${lang}/pokedex/${prev}${query}`);
  }, [getNextId, context, router, lang]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') goToNext();
      if (e.key === 'ArrowLeft') goToPrev();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToNext, goToPrev]);

  useEffect(() => {
    if (urlDex && urlDex !== context) setContext(urlDex);
  }, [urlDex]);

  return { context, setContext, goToNext, goToPrev };
}