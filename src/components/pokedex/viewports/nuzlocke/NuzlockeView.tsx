import { useState, useEffect, useMemo } from 'react';
import { HelpCircle } from 'lucide-react'; // <--- NUEVO IMPORT
import { IPokemon } from '@/types/interfaces';
import { Lang } from '@/lib/pokedexDictionary';
import { getNuzlockeDict } from '@/lib/dictionaries/nuzlockeDict';
import { useNuzlockeAnalysis } from '@/hooks/useNuzlockeAnalysis';
import { NuzlockeStats, BossBattle } from '@/types/nuzlocke';
import { IStat } from '@/types/interfaces';

import staticGamesIndex from '@/data/games_index.json';

import TacticalAssessment from './TacticalAssessment';
import EncounterTable from './EncounterTable';
import BossThreats from './BossThreats';
import PatchDiff from './PatchDiff';

const getStatsObject = (stats: IStat[]): NuzlockeStats => {
    const find = (labels: string[]) => stats.find(s => labels.includes(s.label.toLowerCase()))?.value || 0;
    return {
        hp: find(['hp']), atk: find(['attack', 'atk']), def: find(['defense', 'def']),
        spa: find(['special-attack', 'sp. atk', 'spa']), spd: find(['special-defense', 'sp. def', 'spd']), spe: find(['speed', 'spe'])
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
  
  // --- NUEVO: Estado de Disponibilidad Global ---
  const [availabilityMap, setAvailabilityMap] = useState<Record<string, string[]> | null>(null);

  useEffect(() => {
      fetch('/data/nuzlocke_availability.json')
          .then(res => res.json())
          .then(data => setAvailabilityMap(data))
          .catch(() => setAvailabilityMap({})); // Fallback silencioso
  }, []);

  // Filtrado reactivo de juegos
  const availablePaths = availabilityMap ? (availabilityMap[pokemon.id.toString()] || []) : [];
  
  const availableVanilla = staticGamesIndex.filter(g => g.type === 'vanilla' && (!availabilityMap || availablePaths.includes(g.path)));
  const availableRomhack = staticGamesIndex.filter(g => g.type === 'romhack' && (!availabilityMap || availablePaths.includes(g.path)));

  // Cambio automático de Tipo (Vanilla/Romhack) si uno está vacío
  useEffect(() => {
      if (availabilityMap) {
          if (selectedType === 'vanilla' && availableVanilla.length === 0 && availableRomhack.length > 0) {
              setSelectedType('romhack');
          } else if (selectedType === 'romhack' && availableRomhack.length === 0 && availableVanilla.length > 0) {
              setSelectedType('vanilla');
          }
      }
  }, [availabilityMap, pokemon.id, selectedType, availableVanilla.length, availableRomhack.length]);

  const filteredGames = selectedType === 'vanilla' ? availableVanilla : availableRomhack;

  // Autoselección de juego válida
  useEffect(() => {
    if (filteredGames.length > 0 && !filteredGames.find(g => g.path === selectedGamePath)) {
        setSelectedGamePath(filteredGames[0].path);
    } else if (filteredGames.length === 0) {
        setSelectedGamePath('');
    }
  }, [filteredGames, selectedGamePath]);

  // Hook principal de análisis
  const { manifest, bosses, patch, analysis, loading, error } = useNuzlockeAnalysis(pokemon, selectedGamePath);
  
  const pokemonSlug = pokemon.name.toLowerCase(); 
  const statsObject = getStatsObject(pokemon.stats);

  const relevantBosses = useMemo(() => {
      if (!bosses) return [];
      return bosses.filter((b: BossBattle) => b.team.some(p => p.pokemon_id === pokemonSlug));
  }, [bosses, pokemonSlug]);

  const hasBossBattles = relevantBosses && relevantBosses.length > 0;
  
  // Si el mapa ya cargó y no hay rutas disponibles, el Pokémon no se puede jugar en NINGÚN juego actual
  const isGloballyUnavailable = availabilityMap !== null && availablePaths.length === 0;
  const showUnavailableScreen = isGloballyUnavailable || !!analysis?.isUnavailable;

 return (
        <div className="h-full flex flex-col bg-[#0B1221] font-sans text-slate-300 relative">
            
            {/* HEADER - FIX 1: Cambiamos z-20 por relative z-[100] para que flote por encima de TODO el viewport */}
            <div className="flex-none px-4 md:px-6 py-4 border-b border-cyan-900/20 bg-[#0B1221] shadow-xl relative z-[100]">
                 <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-1 bg-gradient-to-b from-cyan-400 to-blue-600 rounded-full shadow-[0_0_12px_rgba(34,211,238,0.5)]" />
                        <h2 className="text-sm font-bold text-white tracking-[0.2em] uppercase font-mono">
                            Nuzlocke <span className="text-cyan-400">Tactics</span>
                        </h2>
                    </div>
                    
                    {/* SELECTORES FILTRADOS */}
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        
                        {/* Tooltip Disclaimer */}
                        <div className="group/avail relative flex items-center justify-center mr-2">
                            <HelpCircle size={14} className="text-cyan-500/70 hover:text-cyan-400 cursor-help transition-colors" />
                            
                            {/* FIX 2: Añadimos z-[9999] al tooltip */}
                            <div className="absolute top-full right-0 mt-3 w-56 p-2.5 bg-slate-900 border border-cyan-900/50 rounded-lg shadow-[0_10px_30px_rgba(0,0,0,0.8)] opacity-0 group-hover/avail:opacity-100 transition-opacity pointer-events-none z-[9999] text-[10px] text-slate-300 font-mono text-right leading-relaxed">
                                Showing <span className="text-cyan-400 font-bold">only games</span> where this Pokémon is obtainable during the main playthrough.
                            </div>
                        </div>

                    <select 
                        value={selectedType}
                        onChange={(e) => setSelectedType(e.target.value)}
                        disabled={!availabilityMap || isGloballyUnavailable}
                        className="bg-[#0F1629] text-[10px] font-bold border border-slate-700 rounded px-2 py-1.5 text-cyan-400 uppercase focus:border-cyan-500 outline-none disabled:opacity-50 transition-colors"
                    >
                        {availableVanilla.length > 0 && <option value="vanilla">VANILLA</option>}
                        {availableRomhack.length > 0 && <option value="romhack">ROMHACK</option>}
                        {isGloballyUnavailable && <option value="">N/A</option>}
                    </select>
                    <select 
                        value={selectedGamePath}
                        onChange={(e) => setSelectedGamePath(e.target.value)}
                        disabled={filteredGames.length === 0}
                        className="bg-[#0F1629] text-[10px] font-bold border border-slate-700 rounded px-2 py-1.5 text-slate-200 uppercase flex-1 sm:min-w-[180px] focus:border-cyan-500 outline-none disabled:opacity-50 transition-colors"
                    >
                        {filteredGames.length > 0 
                            ? filteredGames.map(g => <option key={g.id} value={g.path}>{g.name.toUpperCase()}</option>)
                            : <option value="">NO GAMES AVAILABLE</option>
                        }
                    </select>
                </div>
             </div>
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6">
            
            {loading && (
                <div className="h-full flex items-center justify-center">
                     <div className="w-10 h-10 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"/>
                </div>
            )}

            {/* PANTALLA NO DISPONIBLE */}
            {!loading && showUnavailableScreen && (
                <div className="h-full flex flex-col items-center justify-center border border-dashed border-slate-800 rounded-lg bg-slate-900/10 p-12 text-center opacity-70">
                    <div className="text-4xl mb-4">🚫</div>
                    <h3 className="text-slate-400 font-bold uppercase tracking-widest text-sm">Not Obtainable</h3>
                    <p className="text-slate-600 text-xs mt-2 max-w-xs leading-relaxed">
                        This Pokémon (or its line) is not available during the main story of {isGloballyUnavailable ? 'any supported version' : 'this version'}.
                    </p>
                </div>
            )}
            
            {!loading && manifest && !error && !showUnavailableScreen && analysis && (
                <div className="flex flex-col gap-6 animate-in fade-in duration-500 max-w-5xl mx-auto pb-10">
                    
                    <div className="flex flex-col gap-4">
                        <TacticalAssessment analysis={analysis} />
                    </div>

                    {patch && analysis.patchChanges && (
                        <div className="w-full">
                             <PatchDiff 
                                originalStats={statsObject} 
                                changes={analysis.patchChanges} 
                                patchName={selectedGamePath.split('/').pop() || ''}
                                title={t.headers.changes} 
                            />
                        </div>
                    )}

                    <div className="w-full">
                        <EncounterTable 
                            pokemonSlug={pokemonSlug} 
                            pokemonId={pokemon.id}
                            segments={manifest.segments} 
                            t={t} 
                        />
                    </div>

                    {hasBossBattles && (
                         <div className="w-full">
                            <BossThreats pokemonSlug={pokemonSlug} bosses={relevantBosses} t={t} />
                         </div>
                    )}
                    
                </div>
            )}
        </div>
    </div>
  );
}