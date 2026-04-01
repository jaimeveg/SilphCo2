export interface IGimmickStats {
  megas?: {
    total_usage: number; // Raw count sum
    top_pkm: Array<{id: string; name: string; usage_rate: number}>;
  };
  z_moves?: {
    total_usage: number;
    top_crystals: Array<{name: string; count: number}>;
    top_pkm: Array<{id: string; name: string; crystal: string; usage_rate: number}>;
  };
  teras?: {
    total_usage: number;
    top_types: Array<{type: string; count: number}>;
    top_pkm: Array<{id: string; name: string; tera_type: string; usage_rate: number}>;
  };
}

export interface ITeamMember {
  pokemon_id: string; // Used internally for linking, but we might need name for pokepaste
  pokemon_name: string; // Added for pokepaste generation
  item?: string;
  ability?: string;
  moves: string[];
  tera_type?: string;
}

export interface ITopCutTeam {
  player_name: string;
  placement: number; // e.g., 1, 2, 8
  team: ITeamMember[];
  poke_paste: string; // Generated in ETL
}

export interface ITypeEcosystem {
  [typeSlug: string]: {
    usage_rate: number;          
    raw_count: number;           
    combinations: {
      [comboSlug: string]: number; 
    };
    teammates: {
      [typeSlug: string]: number; 
    };
    top_pkm: Array<{
      id: string;
      name: string;
      usage_rate: number;
      raw_count: number;
    }>;
  };
}

export interface IRolesAnalysis {
  physical_pct: number;   // % of attackers that are physical
  mixed_pct: number;      // % of attackers that are mixed
  special_pct: number;    // % of attackers that are special
  roles: Array<{
    role: string;         // role key from ROLE_KEYS
    label: string;        // human-readable label
    category: 'OFF' | 'SUP' | 'DEF';
    count: number;        // weighted count (usage-weighted occurrences)
    pct: number;          // percentage of total weighted roles
  }>;
}

export interface IMacroDashboardData {
  format_id: string; // e.g., "gen9vgc_reg_h"
  total_teams_analyzed: number;
  centralization_index: number; // Range 0-100 (Sum of usage rate of top 6)
  type_ecosystem: ITypeEcosystem; 
  gimmicks?: IGimmickStats;
  roles_analysis?: IRolesAnalysis;
  top_pokemon: Array<{ id: string; name: string; types: string[]; roles: string[]; usage_rate: number; raw_count: number; speed: number }>;
  top_cores: Array<{ core: string[]; usage_rate: number }>; // e.g., ["incineroar", "rillaboom"]
  rogue_picks: Array<{ id: string; player: string; placement: number; usage_rate_global: number }>;
  top_cut: ITopCutTeam[];
}
