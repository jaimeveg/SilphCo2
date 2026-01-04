import PokemonDetailView from '@/components/pokedex/PokemonDetailView';

interface PageProps {
  params: {
    pokemonId: string;
    lang: string;
  };
}

export default function PokemonPage({ params }: PageProps) {
  return (
    <div className="min-h-screen w-full p-6 md:p-12 lg:p-24 bg-slate-950">
      <main className="w-full max-w-7xl mx-auto">
        {/* Breadcrumb o navegación superior podría ir aquí */}
        
        <PokemonDetailView pokemonId={params.pokemonId} />
      </main>
    </div>
  );
}