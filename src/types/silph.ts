// src/types/silph.ts

export type VisualSignature =
  // LEGACY (Módulo 1 - No tocar nombres existentes)
  | 'Elemental_Type_Chart_Active'
  | 'Dual_Type_Overlap'
  | 'Stat_HP_Pulse'
  | 'Physical_Combat_Axis'
  | 'Special_Energy_Axis'
  | 'Speed_Tier_Sequencing'
  | 'BST_Totalizer_UI'
  | 'RNG_Hit_Probability'
  | 'Move_Data_Overlay'
  | 'STAB_Aura_Effect'
  | 'Category_Identifier_Cards'
  | 'Status_Utility_Grid'
  // NEXT-GEN (Módulos 2-6)
  | 'weather_particle_sys' // Módulo 2.4
  | 'synergy_network_graph' // Módulo 4.1
  | 'dna_helix_view' // Módulo 3.2
  | 'stat_stage_slider'; // Módulo 2.2

// --- INTERFACES BASE ---
export interface TechnicalNote {
  label: string;
  tooltip: string;
}

export interface SceneContent {
  headline: string;
  kpi: string;
  body: string;
  technical_notes?: TechnicalNote[];
}

interface BaseScene {
  id: string;
  // visual_signature actúa como discriminante
  visual_signature: string;
  content: SceneContent;
}

// --- ESCENAS LEGACY (MÓDULO 1) ---
// Estas escenas dependen de SCENE_CONFIG en NarrativeScene.tsx
// No tienen estructura de 'data' estricta en el JSON actual, usan IDs para configurarse.
export interface LegacyScene extends BaseScene {
  visual_signature:
    | 'Elemental_Type_Chart_Active'
    | 'Dual_Type_Overlap'
    | 'Stat_HP_Pulse'
    | 'Physical_Combat_Axis'
    | 'Special_Energy_Axis'
    | 'Speed_Tier_Sequencing'
    | 'BST_Totalizer_UI'
    | 'RNG_Hit_Probability'
    | 'Move_Data_Overlay'
    | 'STAB_Aura_Effect'
    | 'Category_Identifier_Cards'
    | 'Status_Utility_Grid';
  // El Módulo 1 no usa un objeto 'data' tipado en el JSON, se infiere por ID
  data?: never;
}

// --- ESCENAS NEXT-GEN (MÓDULOS 2-6) ---

// M2.4: Simulador de Clima
export interface SimulationScene extends BaseScene {
  visual_signature: 'weather_particle_sys';
  data: {
    weatherType: 'sun' | 'rain' | 'sand' | 'snow';
    intensity: number; // 0-100
    particles: boolean;
  };
}

// M4.1: Grafo de Sinergias
export interface NetworkScene extends BaseScene {
  visual_signature: 'synergy_network_graph';
  data: {
    nodes: {
      id: string;
      label: string;
      role: 'sweeper' | 'wall' | 'support';
    }[];
    edges: { source: string; target: string; strength: number }[];
  };
}

// M3.2: Genética
export interface GeneticsScene extends BaseScene {
  visual_signature: 'dna_helix_view';
  data: {
    pokemonId: number;
    ivSpread: number[]; // [HP, Atk, Def, SpA, SpD, Spe]
    shinyProbability: number;
  };
}

// UNIÓN MAESTRA
export type NarrativeSceneData =
  | LegacyScene
  | SimulationScene
  | NetworkScene
  | GeneticsScene;
