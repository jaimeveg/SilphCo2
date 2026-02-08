import { useState, useEffect, useMemo } from 'react';
import { IPokemon, IStat } from '@/types/interfaces';
import { 
  GameManifest, 
  BossDatabase, 
  BalancePatch, 
  NuzlockeStats
} from '@/types/nuzlocke'; // Asegúrate de que NuzlockeStats esté exportado en nuzlocke.ts

interface NuzlockeContext {
  manifest: GameManifest | null;
  bosses: BossDatabase | null;
  patch: BalancePatch | null;
  loading: boolean;
}

interface AnalysisResult {
  tier: 'S' | 'A' | 'B' | 'C' | 'D';
  tags: string[];
  description: string;
  phaseUtility: { early: number; mid: number; late: number }; 
  patchChanges: { statDiff: Partial<NuzlockeStats> | null; typeChanged: boolean };
}

// Helper para convertir el array visual de stats a objeto de cálculo
const mapStatsToNuzlocke = (statsArray: IStat[]): NuzlockeStats => {
    const findValue = (labels: string[]) => {
        const stat = statsArray.find(s => labels.includes(s.label.toLowerCase()));
        return stat ? stat.value : 0;
    };

    return {
        hp: findValue(['hp']),
        atk: findValue(['attack', 'atk']),
        def: findValue(['defense', 'def']),
        spa: findValue(['special-attack', 'sp. atk', 'special attack', 'spa']),
        spd: findValue(['special-defense', 'sp. def', 'special defense', 'spd']),
        spe: findValue(['speed', 'spe'])
    };
};

export const useNuzlockeAnalysis = (pokemon: IPokemon, gameId: string | null) => {
  const [data, setData] = useState<NuzlockeContext>({
    manifest: null,
    bosses: null,
    patch: null,
    loading: false
  });

  // Generamos el slug aquí si no existe en la interfaz
  const pokemonSlug = pokemon.name.toLowerCase();

  // 1. Carga dinámica de datos del juego
  useEffect(() => {
    if (!gameId) return;

    const loadGameData = async () => {
      setData(prev => ({ ...prev, loading: true }));
      try {
        const basePath = `/data/games/${gameId}`; 
        
        const [manifestRes, bossesRes] = await Promise.all([
          fetch(`${basePath}/manifest.json`),
          fetch(`${basePath}/bosses.json`)
        ]);

        if (!manifestRes.ok || !bossesRes.ok) throw new Error("Data missing");

        const manifest = await manifestRes.json();
        const bosses = await bossesRes.json();
        
        let patch = null;
        try {
            const patchRes = await fetch(`${basePath}/patch.json`);
            if(patchRes.ok) patch = await patchRes.json();
        } catch (e) { /* No patch exists */ }

        setData({ manifest, bosses, patch, loading: false });
      } catch (e) {
        console.error("Failed to load game data", e);
        setData(prev => ({ ...prev, loading: false }));
      }
    };

    loadGameData();
  }, [gameId]);

  // 2. Algoritmo de Tiering Memoizado
  const analysis = useMemo((): AnalysisResult | null => {
    if (!data.bosses || !pokemon) return null;

    // Convertir stats array a objeto
    const baseStats = mapStatsToNuzlocke(pokemon.stats);

    let totalScore = 0;
    const tags: string[] = [];
    const phases = { early: 0, mid: 0, late: 0 };
    
    // --- LÓGICA DE PARCHE ---
    let activeStats = { ...baseStats };
    let activeTypes = pokemon.types;
    let statDiff: Partial<NuzlockeStats> | null = null;
    let typeChanged = false;

    if (data.patch && data.patch.pokemon && data.patch.pokemon[pokemonSlug]) {
        const changes = data.patch.pokemon[pokemonSlug];
        if (changes.base_stats) {
            statDiff = {};
            (Object.keys(changes.base_stats) as Array<keyof NuzlockeStats>).forEach(k => {
                // TypeScript ahora sabe que k es una key válida de NuzlockeStats
                if (changes.base_stats && changes.base_stats[k] !== undefined) {
                    const newVal = changes.base_stats[k]!;
                    statDiff![k] = newVal;
                    activeStats[k] = newVal;
                }
            });
        }
        if (changes.types) {
            activeTypes = changes.types;
            typeChanged = true;
        }
    }

    const bst = Object.values(activeStats).reduce((a, b) => a + b, 0);

    // --- LÓGICA SIMPLIFICADA DE FASES ---
    data.bosses.forEach((boss, index) => {
        if (activeStats.spe > 80) totalScore += 1; 

        // Asignar puntos a fases
        if (index < 3) phases.early += (bst > 300 ? 20 : 10);
        else if (index < 6) phases.mid += (bst > 450 ? 20 : 10);
        else phases.late += (bst > 520 ? 20 : 10);
    });

    phases.early = Math.min(100, phases.early);
    phases.mid = Math.min(100, phases.mid);
    phases.late = Math.min(100, phases.late);

    if (phases.early > 80) tags.push("Early Carry");
    if (phases.late > 90) tags.push("Late Scaler");
    if (typeChanged) tags.push("Re-Typed");
    if (statDiff) tags.push("Buffed Stats");

    const avgScore = (phases.early + phases.mid + phases.late) / 3;
    let tier: AnalysisResult['tier'] = 'C';
    if (avgScore > 90) tier = 'S';
    else if (avgScore > 75) tier = 'A';
    else if (avgScore > 50) tier = 'B';

    return {
        tier,
        tags,
        description: `Solid ${tier}-Tier pick. ${tags.join(', ')}.`,
        phaseUtility: phases,
        patchChanges: { statDiff, typeChanged }
    };

  }, [pokemon, data.bosses, data.patch, pokemonSlug]);

  return { ...data, analysis };
};