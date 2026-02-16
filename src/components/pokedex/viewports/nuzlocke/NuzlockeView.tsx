import { useState, useEffect } from 'react';
import { IPokemon } from '@/types/interfaces';
import { Lang } from '@/lib/pokedexDictionary';
import { getNuzlockeDict } from '@/lib/dictionaries/nuzlockeDict';
import { useNuzlockeAnalysis } from '@/hooks/useNuzlockeAnalysis';
import { NuzlockeStats, GameSegment, BossBattle, BossPokemon } from '@/types/nuzlocke';
import { IStat } from '@/types/interfaces';

import staticGamesIndex from '@/data/games_index.json';

import TacticalAssessment from './TacticalAssessment';
import EncounterTable from './EncounterTable';
import BossThreats from './BossThreats';
import PatchDiff from './PatchDiff';

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

interface Props {
  pokemon: IPokemon;
  lang: Lang;
}

export default function NuzlockeView({ pokemon, lang }: Props) {
  const t = getNuzlockeDict(lang);
  
  const [selectedType, setSelectedType] = useState('vanilla');
  const [selectedGamePath, setSelectedGamePath] = useState('');

  useEffect(() => {
    if (staticGamesIndex?.length > 0) {
        const defaults = staticGamesIndex.filter(g => g.type === 'vanilla');
        if (defaults.length > 0) {
            setSelectedGamePath(defaults[0].path);
        } else {
            setSelectedType(staticGamesIndex[0].type);
            setSelectedGamePath(staticGamesIndex[0].path);
        }
    }
  }, []);

  const { manifest, bosses, patch, analysis, loading, error } = useNuzlockeAnalysis(pokemon, selectedGamePath);
  
  const pokemonSlug = pokemon.name.toLowerCase(); 
  const statsObject = getStatsObject(pokemon.stats);
  const filteredGames = staticGamesIndex.filter(g => g.type.toLowerCase() === selectedType.toLowerCase());

  const isCatchable = manifest?.segments.some((seg: GameSegment) => 
      seg.encounters.some((e: any) => e.pokemon_id === pokemonSlug)
  );
  
  const hasBossBattles = bosses?.some((b: BossBattle) => 
      b.team.some((p: BossPokemon) => p.pokemon_id === pokemonSlug)
  );

  useEffect(() => {
    const isValid = filteredGames.find(g => g.path === selectedGamePath);
    if (!isValid && filteredGames.length > 0) {
        setSelectedGamePath(filteredGames[0].path);
    }
  }, [selectedType, filteredGames, selectedGamePath]);

  // Pantalla de error si no disponible
  const showUnavailableScreen = analysis?.isUnavailable;

  return (
    <div className="h-full flex flex-col bg-[#0B1221] font-sans text-slate-300 relative">
        
        {/* HEADER */}
        <div className="flex-none px-4 md:px-6 py-4 border-b border-cyan-900/20 bg-[#0B1221] shadow-xl z-20">
             <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-1 bg-gradient-to-b from-cyan-400 to-blue-600 rounded-full shadow-[0_0_12px_rgba(34,211,238,0.5)]" />
                    <h2 className="text-sm font-bold text-white tracking-[0.2em] uppercase font-mono">
                        Nuzlocke <span className="text-cyan-400">Tactics</span>
                    </h2>
                </div>
                
                <div className="flex gap-2 w-full sm:w-auto">
                    <select 
                        value={selectedType}
                        onChange={(e) => setSelectedType(e.target.value)}
                        className="bg-[#0F1629] text-[10px] font-bold border border-slate-700 rounded px-2 py-1.5 text-cyan-400 uppercase focus:border-cyan-500 outline-none"
                    >
                        <option value="vanilla">VANILLA</option>
                        <option value="romhack">ROMHACK</option>
                    </select>
                    <select 
                        value={selectedGamePath}
                        onChange={(e) => setSelectedGamePath(e.target.value)}
                        className="bg-[#0F1629] text-[10px] font-bold border border-slate-700 rounded px-2 py-1.5 text-slate-200 uppercase flex-1 sm:min-w-[180px] focus:border-cyan-500 outline-none"
                    >
                        {filteredGames.map(g => <option key={g.id} value={g.path}>{g.name.toUpperCase()}</option>)}
                    </select>
                </div>
             </div>
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6 space-y-6">
            
            {loading && (
                <div className="h-full flex items-center justify-center">
                     <div className="w-10 h-10 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"/>
                </div>
            )}

            {!loading && showUnavailableScreen && (
                <div className="h-full flex flex-col items-center justify-center border border-dashed border-slate-800 rounded-lg bg-slate-900/10 p-12 text-center opacity-70">
                    <div className="text-4xl mb-4">🚫</div>
                    <h3 className="text-slate-400 font-bold uppercase tracking-widest text-sm">Not Obtainable</h3>
                    <p className="text-slate-600 text-xs mt-2 max-w-xs leading-relaxed">
                        This Pokémon (or its line) is not available during the main story of this version.
                    </p>
                </div>
            )}
            
            {!loading && manifest && !error && !showUnavailableScreen && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in duration-500">
                    
                    <div className="lg:col-span-2 relative group">
                        {analysis && <TacticalAssessment analysis={analysis} />}
                    </div>

                    <div className={!hasBossBattles ? "lg:col-span-2" : "lg:col-span-1"}>
                        {isCatchable ? (
                            <EncounterTable pokemonSlug={pokemonSlug} segments={manifest.segments} t={t} />
                        ) : (
                            <div className="h-full flex items-center justify-center bg-slate-900/30 border border-slate-800 rounded-lg p-6 text-center">
                                <p className="text-xs text-slate-500 font-mono">ENCOUNTER DATA NOT FOUND</p>
                            </div>
                        )}
                    </div>

                    {hasBossBattles && (
                         <div className="lg:col-span-1">
                            <BossThreats pokemonSlug={pokemonSlug} bosses={bosses} t={t} />
                         </div>
                    )}
                    
                    {patch && analysis?.patchChanges && (
                        <div className="lg:col-span-2">
                             <PatchDiff 
                                originalStats={statsObject} 
                                changes={analysis.patchChanges} 
                                patchName={selectedGamePath.split('/').pop() || ''}
                                title={t.headers.changes} 
                            />
                        </div>
                    )}
                </div>
            )}
        </div>
    </div>
  );
}