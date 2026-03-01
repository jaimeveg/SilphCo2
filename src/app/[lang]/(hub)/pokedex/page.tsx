import { promises as fs } from 'fs';
import path from 'path';
import DexLandingView from '@/components/pokedex/grid/DexLandingView';
import { Lang } from '@/lib/pokedexDictionary';
import { PokemonIndexCard } from '@/types/pokedex';

export const metadata = {
  title: 'National Database | Silph Co. Tactical Hub',
  description: 'Advanced tactical Pokedex grid with O(1) filtering capabilities.',
};

export default async function PokedexLandingPage({ params }: { params: { lang: Lang } }) {
  let initialData: PokemonIndexCard[] = [];
  let availableGames: { id: string; name: string; type: string }[] = [];

  try {
    // 1. Extraemos los juegos reales desde el índice estático (ahora incluyendo el 'type')
    const gamesPath = path.join(process.cwd(), 'public', 'data', 'games_index.json');
    const gamesRaw = await fs.readFile(gamesPath, 'utf8');
    const parsedGames = JSON.parse(gamesRaw);
    availableGames = parsedGames.map((g: any) => ({ id: g.id, name: g.name, type: g.type }));

    // 2. Extraemos el índice precalculado del grid
    const indexPath = path.join(process.cwd(), 'public', 'data', 'pokedex_index.json');
    const fileContents = await fs.readFile(indexPath, 'utf8');
    initialData = JSON.parse(fileContents);

  } catch (error) {
    console.warn('[SilphCo2] Warning: Fallo al leer índices estáticos.', error);
  }

  return (
    <main className="w-full relative min-h-screen bg-slate-950">
      <DexLandingView 
        initialData={initialData} 
        availableGames={availableGames}
        lang={params.lang} 
      />
    </main>
  );
}