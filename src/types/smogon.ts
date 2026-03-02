// Archivo: src/types/smogon.ts

// Tipo semántico para clarificar que las llaves ahora son IDs oficiales
export type DexId = string; 

export interface IUsageItem {
  name: string;
  value: number;
  displayValue?: string;
  slug?: string;
}

// NUEVO: Item específico basado en ID para compañeros
export interface ITeammateItem {
  id: number;
  value: number;
  displayValue?: string;
}

// NUEVO: Item específico basado en ID para counters
export interface ICounterItem {
  id: number;
  score: string;
}

export interface IRawPokemonData {
  "Raw count": number;
  usage?: number;
  Moves: Record<string, number>;
  Items: Record<string, number>;
  Abilities: Record<string, number>;
  Teammates: Record<DexId, number>; // Las llaves son IDs numéricos en formato string
  Spreads: Record<string, number>;
  Counters?: Record<DexId, [number, number, number]>; // Las llaves son IDs
}

export interface IRawStatData {
  info: {
    metagame: string;
    cutoff: number;
    "cutoff deviation": 0;
    "team type": 1;
    "number of battles": number;
  };
  data: Record<DexId, IRawPokemonData>; // Diccionario principal basado en IDs
}

export interface CompetitiveResponse {
  meta: { pokemon: DexId; format: string; gen: number };
  general: { usage: string; rawCount: number };
  stats: {
    moves: IUsageItem[];
    items: IUsageItem[];
    abilities: IUsageItem[];
    teammates: ITeammateItem[]; // Actualizado a ITeammateItem
    natureSpread: Array<{ nature: string; usage: string; evs: Record<string, number> }>;
    teras?: IUsageItem[];
  };
  matchups: {
    counters: ICounterItem[]; // Actualizado a ICounterItem
  };
  speed?: {
    tier: string;
    percentile: number;
    baseSpeed: number;
    context: { en: string; es: string };
  };
}