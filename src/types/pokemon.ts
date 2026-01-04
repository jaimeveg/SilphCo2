export interface IStat {
    label: string; // Ej: "HP", "Atk", "Def"
    value: number;
    max: number;   // Para calcular el porcentaje de la barra visual (base 255)
  }
  
  export interface IPokemonBasic {
    id: number;
    name: string;
    types: string[]; // Ej: ['fire', 'flying']
    sprite: string;  // URL optimizada para la UI
    stats: IStat[];
    height: number; // En metros/decímetros según se decida
    weight: number; // En kg/hectogramos
  }