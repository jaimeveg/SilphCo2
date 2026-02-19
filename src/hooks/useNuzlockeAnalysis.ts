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
        } catch (e) {}

        const manifest = manifestRes.ok ? await manifestRes.json() : null;
        
        // NUEVO: Flaggar si es Vanilla para controlar cruces generacionales
        if (manifest) {
            manifest.isVanilla = gamePath.includes('vanilla');
        }

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
        let formattedPatch: PatchDataFormatted | null = null;
        let patchedBaseDex = staticBaseDex;
        let patchedMoveDex = staticMoveDex;

        if (data.patch) {
            const patchMap = data.patch.pokemon || data.patch;
            const patchMoves = data.patch.moves || {};
            
            const pId = pokemon.id;
            const pName = pokemon.name.toLowerCase();
            const pSlug = pName.replace(/ /g, '-');
            const pSlugClean = pSlug.replace(/[^a-z0-9-]/g, ''); 

            const rawNode = 
                patchMap[pSlug] || patchMap[pName] || patchMap[pSlugClean] || patchMap[pId] || patchMap[String(pId)];

            if (rawNode) {
                formattedPatch = {
                    statDiff: rawNode.base_stats || null, 
                    typeChanged: !!rawNode.types 
                };
            }

            patchedBaseDex = JSON.parse(JSON.stringify(staticBaseDex));
            patchedMoveDex = JSON.parse(JSON.stringify(staticMoveDex));

            for (const [key, changes] of Object.entries<any>(patchMap)) {
                let id: any = key;
                if (isNaN(Number(key))) {
                    // @ts-ignore
                    id = staticPokedexIds[key] || staticPokedexIds[key.replace(/[^a-z0-9-]/g, '')];
                }
                
                if (id && patchedBaseDex[id as keyof typeof patchedBaseDex]) {
                    const dexEntry = patchedBaseDex[id as keyof typeof patchedBaseDex] as any;
                    if (changes.base_stats) dexEntry.stats = { ...dexEntry.stats, ...changes.base_stats };
                    if (changes.types) dexEntry.types = changes.types;
                    if (changes.abilities) dexEntry.abilities = changes.abilities;
                }
            }

            for (const [mKey, mChanges] of Object.entries<any>(patchMoves)) {
                const moveEntry = patchedMoveDex[mKey as keyof typeof patchedMoveDex] as any;
                if (moveEntry) {
                    patchedMoveDex[mKey as keyof typeof patchedMoveDex] = { ...moveEntry, ...mChanges };
                } else {
                    // @ts-ignore
                    patchedMoveDex[mKey] = {
                        name: mKey, type: mChanges.type || 'normal', category: mChanges.category || 'physical',
                        power: mChanges.power || 0, accuracy: mChanges.accuracy || 100, pp: mChanges.pp || 10,
                        tactics: mChanges.tactics || {}, ...mChanges
                    };
                }
            }
        }

        const result = analyzeNuzlockeViability(
            pokemon, data.bosses, data.manifest,
            patchedBaseDex, patchedMoveDex, staticMovepoolDex, staticPokedexIds
        );

        const isPostGame = result.meta.availabilityStatus === 'postgame' || result.meta.availabilityStatus === 'unavailable';

        return {
            ...result,
            patchChanges: formattedPatch,
            isUnavailable: isPostGame
        };
    } catch (e) {
        console.error("Analysis Engine Error:", e);
        return null;
    }

  }, [pokemon, data.bosses, data.manifest, data.patch]);

  return { ...data, analysis };
};