// src/types/movedex.ts

export interface IMoveIndexItem {
    id: string; 
    name: string;
    type: string;
    category: string; 
    power: number | null;
    accuracy: number | null;
    pp: number;
    priority: number; 
    flags: {          
        is_priority: boolean; // Solo prioridad > 0
        has_status: boolean;  // Antes ailment
        has_buff: boolean;
        has_debuff: boolean;
    };
    stats_affected: string[]; // Ej: ["attack", "speed"]
}

export interface ILearnerRecord {
    pokemon_id: string;
    method: string; 
    level: number;
}

export interface IMoveTactics {
    ailment: string;
    ailment_chance: number;
    flinch_chance: number;
    stat_chance: number;
    effect_chance: number | null;
    meta_category: string; // Para identificar si afecta al usuario o al rival
    stat_changes: Array<{
        stat: string;
        change: number;
    }>;
}

export interface IMoveDetail extends IMoveIndexItem {
    flavorText: string; 
    effectText: string;
    target: string; // Ej: "user", "selected-pokemon"
    tactics: IMoveTactics; 
    is_sheer_force_boosted: boolean;
    generation_introduced: number;
    learners_by_gen: Record<string, ILearnerRecord[]>; 
}