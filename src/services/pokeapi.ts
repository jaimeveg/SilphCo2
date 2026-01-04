import { useQuery } from '@tanstack/react-query';
import { IPokemonBasic, IStat } from '@/types/pokemon';

const POKEAPI_BASE = 'https://pokeapi.co/api/v2';

// Mapeo de nombres de stats de API a etiquetas UI cortas
const STAT_LABELS: Record<string, string> = {
  'hp': 'HP',
  'attack': 'ATK',
  'defense': 'DEF',
  'special-attack': 'SPA',
  'special-defense': 'SPD',
  'speed': 'SPE',
};

// Función de normalización pura
const normalizePokemon = (data: any): IPokemonBasic => {
    const stats: IStat[] = data.stats.map((s: any) => ({
      label: STAT_LABELS[s.stat.name] || s.stat.name,
      value: s.base_stat,
      max: 255, 
    }));
  
    // CAMBIO CRÍTICO: Prioridad de Sprites
    // 1. Official Artwork: Alta resolución, estático, limpio.
    // 2. Home: Modelos 3D alta resolución (opcional, pero official-artwork es más icónico).
    // 3. Showdown: Animado pero baja resolución (pixel art).
    const sprite = 
      data.sprites.other?.['official-artwork']?.front_default ||
      data.sprites.other?.home?.front_default ||
      data.sprites.other?.showdown?.front_default ||
      data.sprites.front_default;
  
    return {
      id: data.id,
      name: data.name,
      types: data.types.map((t: any) => t.type.name),
      sprite,
      stats,
      height: data.height,
      weight: data.weight,
    };
  };

// Fetcher
const fetchPokemon = async (id: string | number): Promise<IPokemonBasic> => {
  const response = await fetch(`${POKEAPI_BASE}/pokemon/${id}`);
  if (!response.ok) {
    throw new Error(`Error fetching Pokemon ${id}`);
  }
  const data = await response.json();
  return normalizePokemon(data);
};

// Hook React Query
export const usePokemon = (id: string | number) => {
  return useQuery({
    queryKey: ['pokemon', id],
    queryFn: () => fetchPokemon(id),
    enabled: !!id, // Solo ejecuta si hay ID
  });
};