import { useState } from 'react';
import { IPokemon } from '@/types/interfaces';
import { Lang } from '@/lib/pokedexDictionary';
import { getNuzlockeDict } from '@/lib/nuzlockeDict';
import { useNuzlockeAnalysis } from '@/hooks/useNuzlockeAnalysis';
import { NuzlockeStats } from '@/types/nuzlocke';
import { IStat} from '@/types/interfaces';

import SurvivalBanner from './SurvivalBanner';
import EncounterTable from './EncounterTable';
import PatchDiff from './PatchDiff';
import BossThreats from './BossThreats';

// Helper stats
const getStatsObject = (stats: IStat[]): NuzlockeStats => {
    const find = (labels: string[]) => stats.find(s => labels.includes(s.label.toLowerCase()))?.value || 0;
    return {
        hp: find(['hp']),
        atk: find(['attack', 'atk']),
        def: find(['defense', 'def']),
        spa: find(['special-attack', 'sp. atk', 'spa']),
        spd: find(['special-defense', 'sp. def', 'spd']),
        spe: find(['speed', 'spe'])
    };
};

const AVAILABLE_GAMES = [
    { id: 'vanilla/emerald', name: 'Emerald (Vanilla)', type: 'vanilla' },
    { id: 'romhack/radical-red', name: 'Radical Red', type: 'romhack' },
];

interface Props {
  pokemon: IPokemon;
  lang: Lang;
}

export default function NuzlockeView({ pokemon, lang }: Props) {
  const t = getNuzlockeDict(lang);
  const [selectedGame, setSelectedGame] = useState<string>(AVAILABLE_GAMES[0].id);
  const { manifest, bosses, patch, analysis, loading } = useNuzlockeAnalysis(pokemon, selectedGame);
  
  const pokemonSlug = pokemon.name.toLowerCase(); 
  const statsObject = getStatsObject(pokemon.stats);

  return (
    <div className="p-4 space-y-6 text-slate-200 h-full overflow-y-auto custom-scrollbar">
        {/* Game Selector */}
        <div className="flex justify-end items-center gap-2">
            <label className="text-xs text-slate-400 uppercase font-bold">{t.gameRegion}</label>
            <select 
                value={selectedGame} 
                onChange={(e) => setSelectedGame(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded px-3 py-1 text-sm text-cyan-400 focus:outline-none focus:border-cyan-500"
            >
                {AVAILABLE_GAMES.map(g => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                ))}
            </select>
        </div>

        {loading ? (
            <div className="flex flex-col items-center justify-center py-20 opacity-70">
                <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <span className="text-cyan-400 font-mono text-sm animate-pulse">{t.loading}</span>
            </div>
        ) : !manifest ? (
            <div className="text-center py-20 border border-dashed border-slate-700 rounded-lg bg-slate-900/30">
                <p className="text-slate-500 mb-2">{t.noData}</p>
                <p className="text-xs text-slate-600">{t.selectGame}</p>
            </div>
        ) : (
            <>
                {/* 1. Survival Banner */}
                {analysis && <SurvivalBanner analysis={analysis} lang={lang} t={t} />}

                {/* 2. Patch Diff */}
                {patch && analysis?.patchChanges && (
                    <PatchDiff 
                        originalStats={statsObject} 
                        changes={analysis.patchChanges} 
                        // --- FIX AQUÍ: Añadido fallback || selectedGame ---
                        patchName={selectedGame.split('/').pop() || selectedGame}
                        title={t.headers.changes} 
                    />
                )}

                {/* 3. Encounters */}
                <EncounterTable 
                    pokemonSlug={pokemonSlug} 
                    segments={manifest.segments}
                    t={t}
                />

                {/* 4. Boss Threats */}
                <BossThreats 
                    pokemonSlug={pokemonSlug} 
                    bosses={bosses}
                    t={t}
                />
            </>
        )}
    </div>
  );
}