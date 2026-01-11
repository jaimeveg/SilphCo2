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

// --- NUEVAS INTERFACES PARA MOVE REGISTRY (VIEWPORT C) ---
export interface IMoveLearnMethod {
  name: string;
  url: string;
}

export interface IMoveVersionGroupDetail {
  level_learned_at: number;
  move_learn_method: IMoveLearnMethod;
  version_group: {
      name: string;
      url: string;
  };
}

export interface IPokemonMove {
  move: {
      name: string;
      url: string;
  };
  version_group_details: IMoveVersionGroupDetail[];
}

export interface IMachineDetail {
  id: number;
  item: {
      name: string;
      url: string;
  };
  version_group: {
      name: string;
  };
}

export interface IMoveDetail {
  id: number;
  name: string; // Internal name (kebab-case)
  names: {      // <--- NUEVO: Nombres localizados
      name: string;
      language: { name: string };
  }[];
  accuracy: number | null;
  power: number | null;
  pp: number;
  priority: number;
  type: string;
  damage_class: string;
  flavor_text_entries: { 
      flavor_text: string; 
      language: { name: string }; 
      version_group: { name: string };
  }[];
  target: string;
  machines?: {
      machine: { url: string };
      version_group: { name: string };
  }[];
}

// --- INTERFACES PARA LOCALIZACIÓN (VIEWPORT B) ---
export interface ILocationEncounter {
  region: string;       
  version: string;      
  versionGroup: string;
  generation: number;
  gameType: 'Original' | 'Remake' | 'Enhanced' | 'Spin-off';
  locationName: string;
  method: string;
  chance: number;
  minLevel: number;
  maxLevel: number;
  conditions: string[];
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
  moves: IPokemonMove[]; // Array crudo de movimientos
}

// Interfaces adicionales (Competitivo/Nuzlocke) se mantienen igual
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