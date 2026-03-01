export interface PokemonBaseStats {
  hp: number;
  atk: number;
  def: number;
  spa: number;
  spd: number;
  spe: number;
  bst: number;
}

export interface PokemonTierData {
  early: string; 
  mid: string;
  late: string;
}

export interface PokemonIndexCard {
  id: string; 
  dex_number: number;
  name: string;
  types: string[];
  base_stats: PokemonBaseStats;
  tiers: Record<string, PokemonTierData>; 
  generation: number;
  is_fully_evolved: boolean;
  varieties?: PokemonIndexCard[]; // NUEVO: Variantes agrupadas bajo el padre
}

export interface FilterState {
  search: string;
  gameType: string; 
  game: string;
  gen: number | 'ALL';
  types: string[];
  tierPhase: 'early' | 'mid' | 'late';
  tier: string | 'ALL';
  fullyEvolvedOnly: boolean;
  minStatTarget: 'none' | 'bst' | 'hp' | 'atk' | 'def' | 'spa' | 'spd' | 'spe';
  minStatValue: number;
  sortBy: 'id' | 'bst' | 'hp' | 'atk' | 'def' | 'spa' | 'spd' | 'spe';
  sortOrder: 'asc' | 'desc';
}