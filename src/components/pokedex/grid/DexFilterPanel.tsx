'use client';

import { FilterState } from '@/types/pokedex';
import { Search, SlidersHorizontal, ArrowDownUp, ShieldAlert, Zap, BarChart2, FilterX } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  availableGames: { id: string; name: string; type: string }[];
}

const TYPES = ['normal', 'fire', 'water', 'grass', 'electric', 'ice', 'fighting', 'poison', 'ground', 'flying', 'psychic', 'bug', 'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy'];
const TIERS = ['S', 'A', 'B', 'C', 'D', 'F'];
const STATS_MAP = { bst: 'BST', hp: 'HP', atk: 'ATK', def: 'DEF', spa: 'SpA', spd: 'SpD', spe: 'SPE' };

export default function DexFilterPanel({ filters, setFilters, availableGames }: Props) {
  
  const filteredGameList = availableGames.filter(g => g.type === filters.gameType);

  const handleTypeToggle = (type: string) => {
    setFilters(prev => ({
      ...prev,
      types: prev.types.includes(type) 
        ? prev.types.filter(t => t !== type) 
        : [...prev.types, type]
    }));
  };

  const handleClearAll = () => {
    // Reset a Fire Red
    const defaultGameObj = availableGames.find(g => g.id === 'firered' || g.id === 'fire-red') || availableGames[0];
    setFilters({
      search: '',
      gameType: defaultGameObj?.type || 'vanilla',
      game: defaultGameObj?.id || '',
      gen: 'ALL',
      types: [],
      tierPhase: 'early',
      tier: 'ALL',
      fullyEvolvedOnly: false,
      minStatTarget: 'none',
      minStatValue: 0,
      sortBy: 'id',
      sortOrder: 'asc' 
    });
  };

  const handleGameTypeChange = (newType: string) => {
    const firstAvailable = availableGames.find(g => g.type === newType);
    setFilters(prev => ({
      ...prev,
      gameType: newType,
      game: firstAvailable ? firstAvailable.id : '' 
    }));
  };

  return (
    <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 backdrop-blur-md flex flex-col gap-4 shadow-xl relative z-30 mb-6">
      
      {/* Top Row: Layout Elástico (Search toma flex-1, Context/Reset toman shrink-0) */}
      <div className="flex flex-col lg:flex-row gap-3 items-center w-full">
        
        {/* Main Search (Expansivo) */}
        <div className="relative flex-1 w-full group">
           <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
           <input 
             type="text" 
             placeholder="Search Pokémon..." 
             className="w-full bg-slate-950/50 border border-slate-800 text-xs text-slate-200 rounded-lg pl-9 pr-4 py-1.5 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 transition-all placeholder:text-slate-600 font-mono"
             value={filters.search}
             onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
           />
        </div>

        {/* Muted Game Context Block (Estático) */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900/30 border border-slate-800 rounded-lg shrink-0 w-full lg:w-auto justify-between lg:justify-start">
            <div className="relative group/tooltip flex items-center gap-1.5 px-2 py-1 cursor-help">
                <ShieldAlert size={14} className="text-slate-500" />
                <span className="text-[10px] font-mono font-bold text-slate-500 uppercase hidden sm:inline">Context</span>
                <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-56 md:w-64 bg-slate-900/95 backdrop-blur text-slate-300 text-[10px] leading-relaxed font-mono p-3 rounded-lg border border-slate-600 opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none z-[9999] text-center shadow-2xl whitespace-normal break-words">
                    Sets the ruleset to evaluate Tactical Tiers. The grid will always display the full National Pokedex regardless of the context.
                    <div className="absolute left-1/2 -translate-x-1/2 bottom-full border-4 border-transparent border-b-slate-600" />
                </div>
            </div>
            
            <div className="flex items-center gap-1.5">
                <select 
                    value={filters.gameType}
                    onChange={(e) => handleGameTypeChange(e.target.value)}
                    className="w-[90px] shrink-0 appearance-none bg-slate-950/50 border border-slate-800 text-[10px] font-mono tracking-wider font-bold text-slate-400 uppercase rounded px-2 py-1.5 focus:outline-none focus:border-slate-600 transition-colors cursor-pointer [color-scheme:dark]"
                >
                    <option value="vanilla" className="font-mono bg-slate-900 text-slate-300">Vanilla</option>
                    <option value="romhack" className="font-mono bg-slate-900 text-slate-300">Romhack</option>
                </select>

                <select 
                    value={filters.game}
                    onChange={(e) => setFilters(prev => ({ ...prev, game: e.target.value }))}
                    className="w-[140px] md:w-[160px] shrink-0 appearance-none bg-slate-950/50 border border-slate-800 text-[10px] font-mono tracking-wider font-bold text-slate-400 uppercase rounded px-2 py-1.5 focus:outline-none focus:border-slate-600 transition-colors cursor-pointer [color-scheme:dark] truncate"
                >
                    {filteredGameList.map(g => (
                        <option key={g.id} value={g.id} className="font-mono bg-slate-900 text-slate-300">{g.name}</option>
                    ))}
                </select>
            </div>
        </div>

        {/* Clear All Button (Estático y Reducido) */}
        <button 
           onClick={handleClearAll}
           className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider transition-colors shrink-0 w-full lg:w-auto"
        >
           <FilterX size={14} />
           Reset
        </button>
      </div>

      <div className="w-full h-[1px] bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800" />

      {/* Advanced Filters Row */}
      <div className="flex flex-wrap items-center justify-between gap-4">
          
          <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-slate-500 uppercase flex items-center gap-1"><SlidersHorizontal size={12}/> Gen</span>
                  <select 
                      value={filters.gen}
                      onChange={(e) => setFilters(prev => ({ ...prev, gen: e.target.value === 'ALL' ? 'ALL' : Number(e.target.value) }))}
                      className="bg-slate-900 border border-slate-700 text-xs font-mono text-slate-300 rounded px-2 py-1 outline-none [color-scheme:dark]"
                  >
                      <option value="ALL" className="bg-slate-900">All Gens</option>
                      {[1,2,3,4,5,6,7,8,9].map(g => <option key={g} value={g} className="bg-slate-900">Gen {g}</option>)}
                  </select>
              </div>

              <div className="flex items-center bg-slate-900 border border-slate-700 rounded">
                  <span className="text-[10px] font-mono text-slate-500 uppercase flex items-center gap-1 pl-2 pr-1 border-r border-slate-800"><Zap size={12}/> Phase</span>
                  <select 
                      value={filters.tierPhase}
                      onChange={(e) => setFilters(prev => ({ ...prev, tierPhase: e.target.value as any }))}
                      className="bg-transparent text-xs font-mono text-cyan-400 px-2 py-1 outline-none border-r border-slate-800 [color-scheme:dark]"
                  >
                      <option value="early" className="bg-slate-900">Early Game</option>
                      <option value="mid" className="bg-slate-900">Mid Game</option>
                      <option value="late" className="bg-slate-900">Late Game</option>
                  </select>
                  <select 
                      value={filters.tier}
                      onChange={(e) => setFilters(prev => ({ ...prev, tier: e.target.value }))}
                      className="bg-transparent text-xs font-mono text-slate-300 pl-1 pr-2 py-1 outline-none [color-scheme:dark]"
                  >
                      <option value="ALL" className="bg-slate-900">Any Tier</option>
                      {TIERS.map(t => <option key={t} value={t} className="bg-slate-900">&ge; Tier {t}</option>)}
                  </select>
              </div>

              <div className="flex items-center bg-slate-900 border border-slate-700 rounded">
                  <span className="text-[10px] font-mono text-slate-500 uppercase flex items-center gap-1 pl-2 pr-1 border-r border-slate-800"><BarChart2 size={12}/> Min Stat</span>
                  <select 
                      value={filters.minStatTarget}
                      onChange={(e) => setFilters(prev => ({ ...prev, minStatTarget: e.target.value as any }))}
                      className="bg-transparent text-xs font-mono font-bold text-amber-400 px-2 py-1 outline-none border-r border-slate-800 [color-scheme:dark]"
                  >
                      <option value="none" className="bg-slate-900">-- Off --</option>
                      {Object.entries(STATS_MAP).map(([key, label]) => <option key={key} value={key} className="bg-slate-900">{label}</option>)}
                  </select>
                  <input 
                      type="number"
                      min={0}
                      max={800}
                      value={filters.minStatValue}
                      onChange={(e) => setFilters(prev => ({ ...prev, minStatValue: Number(e.target.value) || 0 }))}
                      disabled={filters.minStatTarget === 'none'}
                      className="bg-transparent text-xs font-mono text-slate-300 w-16 px-2 py-1 outline-none disabled:opacity-50"
                  />
              </div>

              <label className="flex items-center gap-2 cursor-pointer group">
                  <input 
                      type="checkbox" 
                      className="sr-only"
                      checked={filters.fullyEvolvedOnly}
                      onChange={(e) => setFilters(prev => ({ ...prev, fullyEvolvedOnly: e.target.checked }))}
                  />
                  <div className={cn("w-4 h-4 rounded border flex items-center justify-center transition-colors", filters.fullyEvolvedOnly ? "bg-cyan-500 border-cyan-400" : "bg-slate-900 border-slate-600")}>
                      {filters.fullyEvolvedOnly && <div className="w-2 h-2 bg-slate-950 rounded-sm" />}
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase group-hover:text-slate-200 transition-colors">Fully Evolved Only</span>
              </label>
          </div>

          <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-lg border border-slate-800 mt-2 xl:mt-0">
              <span className="text-[10px] font-mono text-slate-500 px-2 uppercase"><ArrowDownUp size={12} className="inline mr-1"/> Sort</span>
              <select 
                  value={filters.sortBy}
                  onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value as any }))}
                  className="bg-transparent text-xs font-mono font-bold text-cyan-400 border-l border-slate-700 pl-2 outline-none cursor-pointer [color-scheme:dark]"
              >
                  <option value="id" className="bg-slate-900 text-slate-300">National ID</option>
                  <option value="bst" className="bg-slate-900 text-slate-300">BST</option>
                  <option value="hp" className="bg-slate-900 text-slate-300">HP</option>
                  <option value="atk" className="bg-slate-900 text-slate-300">Attack</option>
                  <option value="def" className="bg-slate-900 text-slate-300">Defense</option>
                  <option value="spa" className="bg-slate-900 text-slate-300">Sp. Atk</option>
                  <option value="spd" className="bg-slate-900 text-slate-300">Sp. Def</option>
                  <option value="spe" className="bg-slate-900 text-slate-300">Speed</option>
              </select>
              <button 
                  onClick={() => setFilters(prev => ({ ...prev, sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc' }))}
                  className="px-2 py-1 bg-slate-800 rounded hover:bg-slate-700 text-[10px] font-mono text-slate-300 transition-colors"
              >
                  {filters.sortOrder.toUpperCase()}
              </button>
          </div>

      </div>

      <div className="flex flex-wrap gap-1 mt-1">
          <span className="text-[10px] font-mono text-slate-500 uppercase mr-2 self-center">Types:</span>
          {TYPES.map(type => {
              const isActive = filters.types.includes(type);
              return (
                  <button 
                      key={type}
                      onClick={() => handleTypeToggle(type)}
                      className={cn(
                          "px-2 py-0.5 text-[9px] font-mono font-bold rounded uppercase border transition-all duration-200",
                          isActive 
                              ? "bg-slate-800 text-white border-cyan-500 shadow-[0_0_8px_rgba(34,211,238,0.2)]" 
                              : "bg-slate-950 text-slate-600 border-slate-800 hover:border-slate-600"
                      )}
                  >
                      {type}
                  </button>
              );
          })}
      </div>

    </div>
  );
}