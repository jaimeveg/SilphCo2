// src/types/interfaces.ts

// --- 1. BASE BIOLOGY (Importamos o redefinimos para evitar duplicidad) ---
// Opción A: Si borramos pokemon.ts, definimos aquí.
// Opción B (Recomendada ahora): Definimos la estructura V2 completa aquí.

export interface IStat {
    label: string; // HP, ATK, DEF...
    value: number;
    max: number;   // Base 255 visual reference
  }
  
  export interface IPokemon {
    id: number;
    name: string;
    types: string[];
    sprite: string;
    stats: IStat[];
    height: number;
    weight: number;
    // Future-proofing:
    abilities?: { name: string; isHidden: boolean }[]; 
  }
  
  // --- 2. COMPETITIVE INTELLIGENCE (Hybrid Smogon + VGC) ---
  export interface ICompetitiveData {
    // Contexto del análisis
    format: 'Smogon' | 'VGC_Reg_G' | 'VGC_Reg_H'; 
    
    // Smogon Legacy Data
    smogonTier?: 'OU' | 'UU' | 'RU' | 'NU' | 'PU' | 'Uber' | 'AG';
    smogonRole?: string; // "Wallbreaker", "Cleric"
  
    // Modern Meta Analysis (Tu petición)
    customTier: 'S' | 'A' | 'B' | 'C' | 'D' | 'F'; // Basado en Win-rate/Usage actual
    usageRate?: number; // Porcentaje de uso (ej: 45.2)
    
    // Builds Tácticas
    builds: {
      name: string; // Ej: "Assault Vest Tank"
      heldItem: string;
      ability: string;
      nature: string;
      teraType?: string; // Crucial para Gen 9
      evs: {
        hp?: number;
        atk?: number;
        def?: number;
        spa?: number;
        spd?: number;
        spe?: number;
      };
      moves: string[]; // IDs o Nombres
    }[];
  }
  
  // --- 3. NUZLOCKE ANALYTICS (Strategic Value) ---
  export interface INuzlockeData {
    // Evaluación Táctica
    viabilityRanking: 'S' | 'A' | 'B' | 'C' | 'F'; // ¿Vale la pena entrenarlo?
    bestRole: string; // Ej: "Mid-game Sweeper", "E4 Pivot", "HM Slave"
    powerSpike: 'Early' | 'Mid' | 'Late' | 'Consistent'; // ¿Cuándo brilla?
  
    // Datos de Encuentro
    catchData: {
      gameVersion: string; // Ej: "Emerald", "FireRed"
      locations: {
        mapName: string;
        method: 'Grass' | 'Surf' | 'Fishing' | 'Static' | 'Gift';
        encounterRate: number; // % de aparición
        isManipulable: boolean; // ¿Podemos usar Repel Trick / Dupes Clause para forzarlo?
      }[];
    }[];
  
    // Notas Adicionales
    warnings?: string[]; // Ej: "Evoluciona muy tarde", "Aprende movimientos por nivel pobres"
  }
  
  // --- 4. DATA AGGREGATE (El objeto completo que usará la página) ---
  export interface IPokemonFullProfile {
    biology: IPokemon;
    competitive?: ICompetitiveData;
    nuzlocke?: INuzlockeData;
  }