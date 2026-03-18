export type ItemCategory = 'competitive' | 'berry' | 'evolution' | 'miscellaneous';

export interface ItemMechanics {
  category: ItemCategory;
  hp?: number; 
  atk?: number; 
  def?: number; 
  spa?: number; 
  spd?: number; 
  spe?: number;
  crit?: number; 
  acc?: number; 
  eva?: number; 
  priority?: number; 
  pp?: number;
  boost?: 'stage' | 'raw';
  affects?: 'self' | 'enemy';
  condition_holder?: string;
  pokemon?: string[];
  evo_pokemon?: string[];
  immunity?: string[];
  type_related?: string[];
  effect_type?: 'boost' | 'reduces';
  move_acc?: number;
  power?: number;
  use?: 'single' | 'permanent';
  status?: string;
  mode?: 'inflicts' | 'cure';
  breeding?: boolean;
  breeding_effect?: string;
}

export interface ItemData {
  id: string; // Basado en el kebab-id
  name: string;
  effect: string;
  sprites: {
    low_res: string; // ej. "/images/items/sprites/leftovers.png"
    high_res: string | null; // ej. "/images/items/high-res/leftovers.png" o null si falla
  };
  categories: ItemCategory[];
  mechanics: ItemMechanics[]; // Array para albergar las diferentes lógicas si hay colisión de ID
  available_in_gens: string[]; // Obtenido de PokeAPI
  fling_power: number | null; // Obtenido de PokeAPI
}
export type ItemDatabase = Record<string, ItemData>; // Indexado por id

export interface IItemUser {
  pokemon_id: string; // ej. "corviknight"
  format: string; // ej. "gen9ou" o "vgc_reg_h"
  usage_rate: number; // Porcentaje de uso del objeto en este Pokémon (ej. 85.5)
  pokemon_usage?: number; // Porcentaje de uso en el formato del Pokémon (ej. 23.4)
}

export interface IItemDetail extends ItemData {
  best_users: IItemUser[];
  global_usage?: number;
}

export interface IItemIndex {
  id: string;
  name: string;
  category: string;
  effect: string;
  local_image_path: string;
  max_usage?: number;
}