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

// Interfaz adaptada a lo que espera PatchDiff.tsx
interface PatchDataFormatted {
    statDiff: any | null;
    typeChanged: boolean;
}

type AnalysisResult = SimulationResult & { 
    patchChanges: PatchDataFormatted | null;
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
        
        const [manifestRes, bossesRes] = await Promise.all([
            fetch(`${basePath}/manifest.json`),
            fetch(`${basePath}/bosses.json`)
        ]);

        let patchData = null;
        try {
            const patchRes = await fetch(`${basePath}/patch.json`);
            if (patchRes.ok) patchData = await patchRes.json();
        } catch (e) {
            // Patch file is optional
        }

        const manifest = manifestRes.ok ? await manifestRes.json() : null;
        const bosses = bossesRes.ok ? await bossesRes.json() : null;

        setData({ manifest, bosses, patch: patchData, loading: false, error: false });
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

        // --- LÓGICA DE PARCHES (FIXED) ---
        let formattedPatch: PatchDataFormatted | null = null;
        
        if (data.patch) {
            // 1. Acceder al mapa correcto (patch.json suele tener estructura { pokemon: {...} })
            const patchMap = data.patch.pokemon || data.patch;
            
            // 2. Normalizar claves
            const pId = pokemon.id;
            const pName = pokemon.name.toLowerCase();
            const pSlug = pName.replace(/ /g, '-');
            const pSlugClean = pSlug.replace(/[^a-z0-9-]/g, '');

            // 3. Encontrar el nodo "crudo"
            const rawNode = 
                patchMap[pSlug] || 
                patchMap[pName] || 
                patchMap[pSlugClean] ||
                patchMap[pId] || 
                patchMap[String(pId)];

            // 4. TRANSFORMAR al formato que espera PatchDiff ({ statDiff, typeChanged })
            if (rawNode) {
                formattedPatch = {
                    statDiff: rawNode.base_stats || null, // Mapear 'base_stats' del JSON a 'statDiff' del componente
                    typeChanged: !!rawNode.types // Si hay array de tipos, es que cambiaron
                };
            }
        }

        return {
            ...result,
            patchChanges: formattedPatch, // Pasamos el objeto formateado
            isUnavailable: isPostGame
        };
    } catch (e) {
        console.error("Analysis Engine Error:", e);
        return null;
    }

  }, [pokemon, data.bosses, data.manifest, data.patch]);

  return { ...data, analysis };
};