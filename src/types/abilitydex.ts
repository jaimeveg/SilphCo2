// src/types/abilitydex.ts

export type AbilityCompetitiveTier = 'S' | 'A' | 'B' | 'C' | 'D' | 'Niche' | null;

export interface IAbilityIndex {
  id: string;          // e.g. "intimidate"
  name: string;
  generation: number;
  short_effect: string;
  // Competitive enrichment (nullable)
  competitive_tier: AbilityCompetitiveTier;
  competitive_usage: number | null;   // Raw weighted usage rate in VGC Gen9
}

export interface IAbilityLearner {
  pokemon_id: string;  // Numeric ID string from alias_map (e.g. "130"), or slug fallback
  pokemon_name: string; // The text slug for display
  is_hidden: boolean;
  slot: number;        // 1 or 2
}

export interface IAbilityCompetitiveDetail {
  tier: AbilityCompetitiveTier;
  usage_rate: number;         // Weighted usage rate across VGC Gen9 format
  normalized_score: number;   // Score normalized 0-1 relative to top ability
  carrier_count: number;      // Number of distinct Pokémon with this ability in VGC data
  format: string;             // e.g. "gen9vgc2026regi"
}

export interface IAbilityDetail extends IAbilityIndex {
  effect_text: string;
  flavor_text: string;
  learners: {
    slot_1: IAbilityLearner[];
    slot_2: IAbilityLearner[];
    hidden: IAbilityLearner[];
  };
  competitive?: IAbilityCompetitiveDetail;
}
