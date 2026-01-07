'use client';

import { Suspense } from 'react'; // Importar Suspense
import { usePokemon } from '@/services/pokeapi';
import PokemonDetailView from '@/components/pokedex/PokemonDetailView';
import { Loader2, AlertTriangle } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

interface PageProps {
  params: {
    pokemonId: string;
    lang: string;
  };
}

// Componente interno que usa searchParams
function PokemonContent({ pokemonId }: { pokemonId: string }) {
  const searchParams = useSearchParams();
  const variantId = searchParams.get('variant');
  const fetchId = variantId || pokemonId;

  // React Query se encarga de la caché
  const { data: pokemonData, isLoading, isError } = usePokemon(fetchId);

  if (isLoading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-slate-950">
        <Loader2 className="w-10 h-10 text-cyan-500 animate-spin" />
      </div>
    );
  }

  if (isError || !pokemonData) {
    return (
      <div className="w-full h-screen flex flex-col items-center justify-center bg-slate-950 text-red-400 gap-4">
        <AlertTriangle className="w-12 h-12" />
        <div className="text-center">
          <h2 className="text-xl font-bold font-display uppercase">Error de Sincronización</h2>
          <p className="font-mono text-sm opacity-70">No se pudo recuperar la data del espécimen #{fetchId}</p>
        </div>
      </div>
    );
  }

  return <PokemonDetailView pokemonId={fetchId} />;
}

// Componente principal exportado
export default function PokemonPage({ params }: PageProps) {
  return (
    // Suspense evita errores de hidratación con useSearchParams
    <Suspense fallback={<div className="w-full h-screen bg-slate-950" />}>
      <PokemonContent pokemonId={params.pokemonId} />
    </Suspense>
  );
}