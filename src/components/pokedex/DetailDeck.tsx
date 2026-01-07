'use client';

import { useState } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import TabNavigator, { TabOption } from './navigation/TabNavigator';
import { ViewportData, ViewportMoves, ViewportPVP, ViewportNuzlocke } from './viewports/Placeholders';
import { IPokemon } from '@/types/interfaces';
import { GitBranch } from 'lucide-react';

interface Props {
  pokemon: IPokemon;
}

export default function DetailDeck({ pokemon }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabOption>('DATA');

  // CHANGE FORM HANDLER (QUERY PARAM MODE)
  const handleVarietyChange = (newVariantId: string) => {
    // 1. Clonamos params actuales para no perder el contexto 'dex'
    const params = new URLSearchParams(searchParams.toString());
    
    // 2. Si la nueva variante es la base (speciesId), quitamos el param 'variant'
    //    Si es una forma alternativa, seteamos 'variant'.
    if (newVariantId === pokemon.speciesId.toString()) {
      params.delete('variant');
    } else {
      params.set('variant', newVariantId);
    }

    // 3. Reemplazamos URL manteniendo ruta base (/pokedex/3)
    router.push(`${pathname}?${params.toString()}`);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'DATA': return <ViewportData />;
      case 'MOVES': return <ViewportMoves />;
      case 'PVP': return <ViewportPVP />;
      case 'NUZLOCKE': return <ViewportNuzlocke />;
      default: return <ViewportData />;
    }
  };

  const hasVarieties = pokemon.varieties && pokemon.varieties.length > 1;

  return (
    <div className="w-full h-full flex flex-col min-h-[500px]">
      
      {/* HEADER BAR CON SELECTOR DE FORMAS */}
      <div className="flex justify-between items-center pr-4">
        <TabNavigator activeTab={activeTab} onTabChange={setActiveTab} />
        
        {hasVarieties && (
            <div className="flex items-center gap-2 mb-6">
                <GitBranch size={14} className="text-slate-500" />
                <select 
                    className="bg-slate-900 border border-slate-700 text-xs text-slate-300 rounded px-2 py-1 outline-none focus:border-cyan-500 uppercase font-mono max-w-[150px]"
                    value={pokemon.id} // El ID actual (sea variante o base)
                    onChange={(e) => handleVarietyChange(e.target.value)}
                >
                    {pokemon.varieties.map((v) => (
                        <option key={v.pokemonId} value={v.pokemonId}>
                            {v.name}
                        </option>
                    ))}
                </select>
            </div>
        )}
      </div>

      <div className="flex-1 animate-in fade-in slide-in-from-bottom-2 duration-300">
        {renderContent()}
      </div>

    </div>
  );
}