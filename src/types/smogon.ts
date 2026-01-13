// src/types/smogon.ts

// --- RAW DATA FROM GITHUB (Server Side Only) ---
export interface IRawStatData {
    battles: number;
    pokemon: Record<string, {
        usage: { raw: number; real: number; weighted: number };
        moves: Record<string, number>;
        abilities: Record<string, number>;
        items: Record<string, number>;
        teammates: Record<string, number>;
        spreads: Record<string, number>;
        viability?: number;
    }>;
}

// --- CLIENT SIDE DATA (Normalized) ---
export interface IUsageItem {
    name: string;
    usage: number; // Porcentaje 0-100
}

export interface ISpreadItem {
    nature: string;
    evs: { hp: number; atk: number; def: number; spa: number; spd: number; spe: number };
    usage: number;
}

export interface ICompetitiveData {
    format: string;
    timestamp: string;
    usageRate: number; // 0-1
    rank: number | null; // Posición en el ranking
    moves: IUsageItem[];
    abilities: IUsageItem[];
    items: IUsageItem[];
    teammates: IUsageItem[];
    spreads: ISpreadItem[];
    // Datos de análisis táctico (opcional si existe)
    analysis?: {
        overview: string;
        sets: any[]; // Estructura simplificada de sets
    };
}