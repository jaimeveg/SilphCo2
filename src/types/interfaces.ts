// src/types/interfaces.ts

export interface IStat {
  label: string;
  value: number;
  max: number;
}

export interface IAbility {
  name: string;
  isHidden: boolean;
  description: string;
}

export interface IVariety {
  isDefault: boolean;
  name: string;
  pokemonId: string;
}

// --- NUEVA ESTRUCTURA DE ASSETS ---
export interface IPokemonAssets {
  main: string;          // Official Artwork Normal (2D High-Res)
  shiny: string;         // Official Artwork Shiny (2D High-Res)
  female?: string;       // Official Artwork Hembra (Solo si existe en 2D)
  femaleShiny?: string;  // Official Artwork Hembra Shiny (Solo si existe en 2D)
}

export interface IPokemon {
  id: number;
  speciesId: number;
  name: string;
  speciesName: string;
  types: string[];
  sprite: string; // Legacy support
  assets: IPokemonAssets; // <--- NUEVO
  genderRate: number;     // <--- NUEVO: -1 (Genderless), 0 (Male only), 8 (Female only), 1-7 (Mixed)
  stats: IStat[];
  height: number;
  weight: number;
  abilities: IAbility[];
  generation: string;
  varieties: IVariety[];
  dexIds: Record<string, number>;
  evolutionChain?: IEvolutionNode;
  locations?: ILocationEncounter[];
}

export interface IEvolutionDetail {
  trigger: string;
  minLevel?: number;
  item?: string;
  heldItem?: string;
  minHappiness?: number;
  minAffection?: number;
  minBeauty?: number;
  timeOfDay?: string;
  knownMove?: string;
  knownMoveType?: string;
  location?: string;
  condition?: string;
  gender?: number;
  relativePhysicalStats?: number;
  needsOverworldRain?: boolean;
  turnUpsideDown?: boolean;
  partySpecies?: string;
  partyType?: string;
  tradeSpecies?: string;
  customReq?: string;
}

export interface IEvolutionNode {
  speciesId: number;
  speciesName: string;
  sprite: string;
  icon?: string;
  types: string[];
  details: IEvolutionDetail[];
  evolvesTo: IEvolutionNode[];
  url?: string;
  variantId?: number;
}

export interface ILocationEncounter {
  region: string;
  version: string;
  locationName: string;
  method: string;
  chance: number;
  minLevel: number;
  maxLevel: number;
  conditions: string[];
}

// --- INTELLIGENCE INTERFACES ---
export interface ICompetitiveData {
  format: 'Smogon' | 'VGC_Reg_G' | 'VGC_Reg_H';
  smogonTier?: 'OU' | 'UU' | 'RU' | 'NU' | 'PU' | 'Uber' | 'AG';
  smogonRole?: string;
  customTier: 'S' | 'A' | 'B' | 'C' | 'D' | 'F';
  usageRate?: number;
  builds: {
      name: string;
      heldItem: string;
      ability: string;
      nature: string;
      teraType?: string;
      evs: {
          hp?: number;
          atk?: number;
          def?: number;
          spa?: number;
          spd?: number;
          spe?: number;
      };
      moves: string[];
  }[];
}

export interface INuzlockeData {
  viabilityRanking: 'S' | 'A' | 'B' | 'C' | 'F';
  bestRole: string;
  powerSpike: 'Early' | 'Mid' | 'Late' | 'Consistent';
  catchData: {
      gameVersion: string;
      locations: {
          mapName: string;
          method: 'Grass' | 'Surf' | 'Fishing' | 'Static' | 'Gift';
          encounterRate: number;
          isManipulable: boolean;
      }[];
  }[];
  warnings?: string[];
}

export interface IPokemonFullProfile {
  biology: IPokemon;
  competitive?: ICompetitiveData;
  nuzlocke?: INuzlockeData;
}