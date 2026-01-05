'use client';

import { usePokemon } from '@/services/pokeapi';
import PokemonDetailView from '@/components/pokedex/PokemonDetailView';
import { Loader2, AlertTriangle } from 'lucide-react';

interface PageProps {
  params: {
    pokemonId: string;
    lang: string;
  };
}

export default function PokemonPage({ params }: PageProps) {
  // 1. OBTENCIÓN DE DATOS (Elevamos el estado de carga aquí)
  // Al usar React Query, esta petición se comparte o cachea, por lo que 
  // cuando el componente hijo (PokemonDetailView) la pida, será instantáneo.
  const { data: pokemonData, isLoading, isError } = usePokemon(params.pokemonId);

  // 2. ESTADO DE CARGA (Full Screen)
  // Evita renderizar el layout vacío mientras esperamos los datos.
  if (isLoading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-slate-950">
        <Loader2 className="w-10 h-10 text-cyan-500 animate-spin" />
      </div>
    );
  }

  // 3. MANEJO DE ERRORES (Full Screen)
  // Feedback claro si el ID no existe o la API falla.
  if (isError || !pokemonData) {
    return (
      <div className="w-full h-screen flex flex-col items-center justify-center bg-slate-950 text-red-400 gap-4">
        <AlertTriangle className="w-12 h-12" />
        <div className="text-center">
          <h2 className="text-xl font-bold font-display uppercase">Error de Sincronización</h2>
          <p className="font-mono text-sm opacity-70">No se pudo recuperar la data del espécimen #{params.pokemonId}</p>
        </div>
      </div>
    );
  }

  // 4. RENDERIZADO SEGURO
  // Solo llegamos aquí si tenemos datos válidos.
  return (
    <PokemonDetailView pokemonId={params.pokemonId} />
  );
}