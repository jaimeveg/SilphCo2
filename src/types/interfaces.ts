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

export interface IPokemonAssets {
  main: string;
  shiny: string;
  female?: string;
  femaleShiny?: string;
}

export interface IPokemon {
  id: number;
  speciesId: number;
  name: string;
  speciesName: string;
  types: string[];
  sprite: string;
  assets: IPokemonAssets;
  genderRate: number;
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

// --- ACTUALIZACIÓN ESTRUCTURAL DE LOCALIZACIÓN ---
export interface ILocationEncounter {
  region: string;       
  version: string;      
  versionGroup: string; // <--- NUEVO
  generation: number;   // <--- NUEVO
  gameType: 'Original' | 'Remake' | 'Enhanced' | 'Spin-off'; // <--- NUEVO
  locationName: string;
  method: string;
  chance: number;
  minLevel: number;
  maxLevel: number;
  conditions: string[];
}

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