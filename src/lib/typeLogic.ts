// src/lib/typeLogic.ts

export const TYPES = [
  'normal',
  'fire',
  'water',
  'grass',
  'electric',
  'ice',
  'fighting',
  'poison',
  'ground',
  'flying',
  'psychic',
  'bug',
  'rock',
  'ghost',
  'dragon',
  'steel',
  'dark',
  'fairy',
];

/**
 * WEAKNESS_CHART: [Defending Type]: Attacking types that are Super Effective (x2)
 * Source: Definición de Efectividad
 */
const WEAKNESS_CHART: Record<string, string[]> = {
  normal: ['fighting'],
  fire: ['water', 'ground', 'rock'],
  water: ['electric', 'grass'],
  grass: ['fire', 'ice', 'poison', 'flying', 'bug'],
  electric: ['ground'],
  ice: ['fire', 'fighting', 'rock', 'steel'],
  fighting: ['flying', 'psychic', 'fairy'],
  poison: ['ground', 'psychic'],
  ground: ['water', 'grass', 'ice'],
  flying: ['electric', 'ice', 'rock'],
  psychic: ['bug', 'ghost', 'dark'],
  bug: ['fire', 'flying', 'rock'],
  rock: ['water', 'grass', 'fighting', 'ground', 'steel'],
  ghost: ['ghost', 'dark'],
  dragon: ['ice', 'dragon', 'fairy'],
  steel: ['fire', 'fighting', 'ground'],
  dark: ['fighting', 'bug', 'fairy'],
  fairy: ['poison', 'steel'],
};

/**
 * RESISTANCE_CHART: [Defending Type]: Attacking types that are Not Very Effective (x0.5)
 * Source: Definición de Efectividad
 */
const RESISTANCE_CHART: Record<string, string[]> = {
  normal: [],
  fire: ['fire', 'grass', 'ice', 'bug', 'steel', 'fairy'],
  water: ['fire', 'water', 'ice', 'steel'],
  grass: ['water', 'grass', 'electric', 'ground'],
  electric: ['electric', 'flying', 'steel'],
  ice: ['ice'],
  fighting: ['bug', 'rock', 'dark'],
  poison: ['grass', 'fighting', 'poison', 'bug', 'fairy'],
  ground: ['poison', 'rock'],
  flying: ['grass', 'fighting', 'bug'],
  psychic: ['fighting', 'psychic'],
  bug: ['grass', 'fighting', 'ground'],
  rock: ['normal', 'fire', 'poison', 'flying'],
  ghost: ['poison', 'bug'],
  dragon: ['fire', 'water', 'grass', 'electric'],
  steel: [
    'normal',
    'grass',
    'ice',
    'flying',
    'psychic',
    'bug',
    'rock',
    'dragon',
    'steel',
    'fairy',
  ],
  dark: ['ghost', 'dark'],
  fairy: ['fighting', 'bug', 'dark'],
};

/**
 * IMMUNITY_CHART: [Defending Type]: Attacking types that have No Effect (x0)
 * Source: Definición de Efectividad
 */
const IMMUNITY_CHART: Record<string, string[]> = {
  normal: ['ghost'],
  fire: [],
  water: [],
  grass: [],
  electric: [],
  ice: [],
  fighting: [],
  poison: [],
  ground: ['electric'],
  flying: ['ground'],
  psychic: [],
  bug: [],
  rock: [],
  ghost: ['normal', 'fighting'],
  dragon: [],
  steel: ['poison'],
  dark: ['psychic'],
  fairy: ['dragon'],
};

/**
 * Calcula los multiplicadores defensivos combinando uno o dos tipos.
 * Procesa multiplicadores x4 (debilidad doble) y x0.25 (resistencia doble).
 * Source: Tipos Duales y Matemática Extrema
 */
export function calculateDefense(type1: string, type2?: string | null) {
  const multipliers: Record<string, number> = {};

  TYPES.forEach((attacker) => {
    let mult = 1;

    // Proceso del Tipo 1
    if (WEAKNESS_CHART[type1]?.includes(attacker)) mult *= 2;
    if (RESISTANCE_CHART[type1]?.includes(attacker)) mult *= 0.5;
    if (IMMUNITY_CHART[type1]?.includes(attacker)) mult *= 0;

    // Proceso del Tipo 2 (Matemática acumulativa para tipos duales)
    if (type2 && type2 !== type1) {
      if (WEAKNESS_CHART[type2]?.includes(attacker)) mult *= 2;
      if (RESISTANCE_CHART[type2]?.includes(attacker)) mult *= 0.5;
      if (IMMUNITY_CHART[type2]?.includes(attacker)) mult *= 0;
    }

    multipliers[attacker] = mult;
  });

  return multipliers;
}

/**
 * NEW FEATURE: Type Chart Modal Helper
 * Devuelve la eficacia de un ataque simple (Atacante -> Defensor)
 * Retorna: 2 (Super), 0.5 (No muy), 0 (Inmune) o 1 (Neutro)
 */
export function getEffectiveness(attacker: string, defender: string): number {
  if (IMMUNITY_CHART[defender]?.includes(attacker)) return 0;
  if (WEAKNESS_CHART[defender]?.includes(attacker)) return 2;
  if (RESISTANCE_CHART[defender]?.includes(attacker)) return 0.5;
  return 1;
}

/**
 * Helper para generar el resumen de matchups (Debilidades y Resistencias)
 * Utilizado en VisualTypes para mostrar los badges de resumen.
 */
export function calculateTypeMatchups(types: string[]) {
  const [t1, t2] = types;
  const defenseMap = calculateDefense(t1, t2 || null);
  
  const weaknesses: string[] = [];
  const resistances: string[] = [];
  const immunities: string[] = [];

  Object.entries(defenseMap).forEach(([type, multiplier]) => {
    if (multiplier > 1) weaknesses.push(type);
    if (multiplier < 1 && multiplier > 0) resistances.push(type);
    if (multiplier === 0) immunities.push(type);
  });

  return { weaknesses, resistances, immunities };
}