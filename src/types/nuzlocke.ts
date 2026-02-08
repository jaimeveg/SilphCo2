export type StatKey = 'hp' | 'atk' | 'def' | 'spa' | 'spd' | 'spe';

export interface NuzlockeStats {
  hp: number;
  atk: number;
  def: number;
  spa: number;
  spd: number;
  spe: number;
}

// ============================================================================
// 1. GAME MANIFEST (Structure & Content)
// Defines WHAT happens in the game (Routes, Encounters)
// NOTE: Bosses are now decoupled (see BossDatabase)
// ============================================================================

export type EncounterMethod = 
  | 'walk' 
  | 'dark-grass'
  | 'surf'
  | 'old-rod' 
  | 'good-rod' 
  | 'super-rod' 
  | 'static'
  | 'fossil' 
  | 'gift' 
  | 'gift-egg'
  | 'npc-trade' 
  | 'grass-spots'
  | 'cave-spots'
  | 'bridge-spots'
  | 'super-rod-spots'
  | 'surf-spots'
  | 'yellow-flowers'
  | 'red-flowers'
  | 'purple-flowers'
  | 'rough-terrain'
  | 'only-one'
  | 'pokeflute'
  | 'headbutt' 
  | 'headbutt-normal' 
  | 'headbutt-low'
  | 'headbutt-high' 
  | 'squirt-bottle'
  | 'wailmer-pail'
  | 'seaweed'
  | 'roaming-grass'
  | 'roaming-water'
  | 'devon-scope'
  | 'feebas-tile-fishing'
  | 'island-scan'
  | 'sos-encounter'
  | 'bubbling-spots'
  | 'berry-piles' 
  | 'sos-from-bubbling-spot'
  | 'overworld'
  | 'overworld-flying'
  | 'overworld-water'
  | 'rock-smash' 
  | 'overworld-special'
  | 'overworld-flying-special'
  | 'overworld-water-special'
  | 'sweet-scent'
  | 'swarm' 
  | 'raid'
  | 'pokeradar'
  | 'grotto'
  | 'radio'
  | 'dexnav'
  | 'event'
  | 'ambush'
  | 'horde'
  | 'null';

export interface Encounter {
  pokemon_id: string; // Slug or ID referencing PokeAPI
  method:{
    encounter_method: EncounterMethod;
    min_level: number;
    max_level: number;
    rate: number;       // Percentage (0-100)
    time: string; // "day", "night", any, others (morning, evening)
    condition: string; // Cualquier condición adicional (weather, etc)
  }[];
  capture_rate: number; // max 255
  // Probabilidad de objetos equipados (útil para Thief/Covet)
  held_items: {
    item_id: string;
    chance: number;   // e.g. 5, 50, 100
  }[];
}

export interface GameSegment {
  id: string;         // Unique ID for the segment - region-gen-game_id-name
  name: string;       // Display name (e.g. "Route 1")
  order: number;      // To sort the timeline
  encounters: Encounter[];
  // Bosses removed -> Moved to BossBattle.segment_id
}

export interface GameManifest {
  game_id: string;    // Unique key (e.g., "fire-red", "radical-red")
  name: string;       // Display name
  region: string;
  base_generation: number;
  segments: GameSegment[];
}

// ============================================================================
// 2. BOSS DATABASE (Relational Structure)
// Bosses are now entities linked to segments via segment_id
// ============================================================================

export type BossCategory = 
  | 'rival' 
  | 'gym_leader' 
  | 'elite_four' 
  | 'champion'
  | 'evil_team_admin' 
  | 'evil_team_boss'
  | 'totem'
  | 'optional'
  | 'null';

export interface BossPokemon {
  pokemon_id: string; // Slug or ID referencing PokeAPI
  level: number;
  item: string;      // Held item slug
  nature: string;
  ability: string;
  moves: string[];    // Array of move slugs
  ivs: Partial<NuzlockeStats>;
  evs: Partial<NuzlockeStats>;
  happiness?: number;
  dynamax_level?: number;
  tera_type?: string;
}

export interface BossBattle {
  id: string;         // Unique ID for the boss battle
  segment_id: string; // FOREIGN KEY: Links to GameSegment.id
  name: string;       // Display name (e.g. "Leader Brock")
  category: BossCategory;
  level_cap: number; // Hard level cap for this boss
  variant?: {
    type: 'starter' | 'game_version' | 'optional';
    slug: string;     // ej. "starter-water", "version-ruby"
    description: string; // ej. "If player chose Squirtle"
  };
  team: BossPokemon[];
  format?: 'single' | 'double' | 'multi';
  weather?: string;
  terrain?: string;
  notes?: string;
}

// Collection type for easy imports
export type BossDatabase = BossBattle[];

// ============================================================================
// 3. BALANCE PATCH (Mechanics Override)
// Defines HOW the game works (Stats, Types, Moves changes for ROM Hacks)
// ============================================================================

export interface PokemonChange {
  id: number | string; // PokeAPI ID or Slug
  types?: [string] | [string, string];
  base_stats?: NuzlockeStats;
  abilities?: {
    0?: string;
    1?: string;
    H?: string;
  };
  // Cambios evolutivos (Crítico para ROM Hacks que eliminan trade evos)
  evolution_changes?: {
    target_id: string;
    old_method?: string; // e.g. "trade"
    new_method: string;  // e.g. "level_up", "item"
    condition: string | number; // e.g. 37, "Link Cable"
  }[];
  learnset?: {
    level: number;
    move_id: string;
  }[];
  capture_rate?: number;
}

export interface MoveChange {
  id: string; // Move slug
  power?: number;
  accuracy?: number;
  type?: string;
  category?: 'physical' | 'special' | 'status';
  pp?: number;
  effect_chance?: number;
  priority?: number;
}

export interface AbilityChange {
  id: string; // Ability slug
  description: string;
}

export interface TypeChartChange {
  attacker: string;
  defender: string;
  multiplier: number; // e.g., 2.0, 0.5, 0
}

export interface BalancePatch {
  patch_id: string;   // Matches GameManifest.game_id ideally
  pokemon?: Record<string, PokemonChange>; // Keyed by pokemon_id/slug for O(1) access
  moves?: Record<string, MoveChange>;
  abilities?: Record<string, AbilityChange>;
  type_chart?: TypeChartChange[];
}