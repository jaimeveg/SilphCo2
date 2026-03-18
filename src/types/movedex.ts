// src/types/movedex.ts

export interface IMoveIndexItem {
    id: string;
    name: string;
    type: string;
    category: string;
    power: number | null;
    accuracy: number | null;
    pp: number;
    max_pp: number; // <-- NUEVO: PP Máximos calculados (8/5)
    priority: number;
    flags: {
        is_priority: boolean;
        has_status: boolean;
        has_buff: boolean;
        has_debuff: boolean;
    };
    stats_affected: string[];
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
    meta_category: string;
    stat_changes: Array<{
        stat: string;
        change: number;
    }>;
}

export interface IMoveDetail extends IMoveIndexItem {
    flavorText: string;
    effectText: string;
    target: string;
    tactics: IMoveTactics;
    is_sheer_force_boosted: boolean;
    generation_introduced: number;
    learners_by_gen: Record<string, ILearnerRecord[]>;
}