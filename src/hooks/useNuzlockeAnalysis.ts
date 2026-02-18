import { useState, useEffect, useMemo } from 'react';
import { IPokemon } from '@/types/interfaces';
import { analyzeNuzlockeViability, SimulationResult } from '@/lib/utils/nuzlockeEngine';

import staticBaseDex from '@/data/pokedex_base_stats.json';
import staticMoveDex from '@/data/move_dex.json';
import staticMovepoolDex from '@/data/movepool_dex.json';
import staticPokedexIds from '@/data/pokedex_ids.json';

interface NuzlockeState {
  manifest: any | null;
  bosses: any | null;
  patch: any | null;
  loading: boolean;
  error: boolean;
}

type AnalysisResult = SimulationResult & { 
    patchChanges: any | null;
    isUnavailable?: boolean; 
};

export const useNuzlockeAnalysis = (pokemon: IPokemon, gamePath: string | null) => {
  const [data, setData] = useState<NuzlockeState>({
    manifest: null,
    bosses: null,
    patch: null,
    loading: false,
    error: false
  });

  useEffect(() => {
    if (!gamePath) return;
    const loadData = async () => {
      setData(prev => ({ ...prev, loading: true }));
      try {
        const basePath = `/data/games/${gamePath}`;
        const [manifestRes, bossesRes, patchRes] = await Promise.all([
            fetch(`${basePath}/manifest.json`),
            fetch(`${basePath}/bosses.json`),
            fetch(`${basePath}/patch.json`)
        ]);

        const manifest = manifestRes.ok ? await manifestRes.json() : null;
        const bosses = bossesRes.ok ? await bossesRes.json() : null;
        const patch = patchRes.ok ? await patchRes.json() : null;

        setData({ manifest, bosses, patch, loading: false, error: false });
      } catch (e) {
        setData(prev => ({ ...prev, loading: false, error: true }));
      }
    };
    loadData();
  }, [gamePath]);

  const analysis = useMemo((): AnalysisResult | null => {
    if (!data.bosses || !pokemon) return null;

    try {
        const result = analyzeNuzlockeViability(
            pokemon, 
            data.bosses, 
            data.manifest,
            staticBaseDex, 
            staticMoveDex,
            staticMovepoolDex, 
            staticPokedexIds
        );

        const isPostGame = result.meta.availabilityStatus === 'postgame' || result.meta.availabilityStatus === 'unavailable';

        // Lógica de Parches (Debugging Fix)
        let patchChanges = null;
        if (data.patch) {
            // Intentar buscar por ID numérico
            if (data.patch[pokemon.id]) {
                patchChanges = data.patch[pokemon.id];
            } 
            // Intentar buscar por Slug (nombre minúsculas)
            else if (data.patch[pokemon.name.toLowerCase()]) {
                patchChanges = data.patch[pokemon.name.toLowerCase()];
            }
        }

        return {
            ...result,
            patchChanges: patchChanges, // Aseguramos que se pasa al componente
            isUnavailable: isPostGame
        };
    } catch (e) {
        console.error("Analysis Engine Error:", e);
        return null;
    }

  }, [pokemon, data.bosses, data.manifest, data.patch]);

  return { ...data, analysis };
};