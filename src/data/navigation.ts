import { 
  Hash, Activity, Sword, 
  GraduationCap, Zap, Skull, 
  LucideIcon, Calculator, Lock, 
  Dna, Brain, Timer, RefreshCw 
} from 'lucide-react';

// --- TIPOS DE DATOS ---
export interface NavItem {
  label: string;
  id: string;
}

export interface NavSection {
  id: string;
  label: string;
  icon: LucideIcon;
  items: NavItem[];
}

// --- MÓDULO 1 (SECCIONES) ---
export const MODULE_1_NAVIGATION: NavSection[] = [
  {
    id: 'types',
    label: 'TIPOS',
    icon: Hash,
    items: [
      { label: 'Tabla de Tipos', id: '1.1_type_matchup' },
      { label: 'Tipos Duales', id: '1.2_dual_typing' },
    ],
  },
  {
    id: 'stats',
    label: 'STATS',
    icon: Activity,
    items: [
      { label: 'HP (Vida)', id: '1.3_stat_hp' },
      { label: 'ATK & DEF', id: 'section-physical-stats' },
      { label: 'SPA & SPD', id: 'section-special-stats' },
      { label: 'Velocidad', id: '1.6_stat_speed' },
      { label: 'Precisión/Eva', id: '1.8_hidden_accuracy' },
      { label: 'BST Total', id: '1.7_bst_analysis' },
    ],
  },
  {
    id: 'mechanics',
    label: 'COMBATE',
    icon: Sword,
    items: [
      { label: 'Funcionamiento', id: '1.9_move_logic' },
      { label: 'STAB', id: '1.10_stab_mechanic' },
      { label: 'Categoría', id: 'section-mechanics-category' },
      { label: 'Estado', id: '1.12_status_moves' },
    ],
  },
];

// --- ESTRUCTURA ACADEMY ---
export const ACADEMY_MODULES = [
  {
    id: 'mod_1',
    label: 'Módulo 01: Fundamentos',
    sections: MODULE_1_NAVIGATION,
    locked: false,
  },
  {
    id: 'mod_2',
    label: 'Módulo 02: Dinámicas de Turno',
    icon: Timer,
    sections: [],
    locked: true,
  },
  {
    id: 'mod_3',
    label: 'Módulo 03: Genética y Crianza',
    icon: Dna,
    sections: [],
    locked: true,
  },
  {
    id: 'mod_4',
    label: 'Módulo 04: Estrategia Pro',
    icon: Brain,
    sections: [],
    locked: true,
  },
  {
    id: 'mod_5',
    label: 'Módulo 05: Mecánicas Gen.',
    icon: RefreshCw,
    sections: [],
    locked: true,
  },
];

// --- MENÚ PRINCIPAL (CORE) ---
export interface CoreMenuItem {
  id: string;
  label: string;
  icon: LucideIcon;
  type: 'module_root' | 'link_root';
  children: any[];
}

export const CORE_MENU: CoreMenuItem[] = [
  { 
    id: 'academy', 
    label: 'ACADEMY', 
    icon: GraduationCap, 
    type: 'module_root',
    children: ACADEMY_MODULES 
  },
  { 
    id: 'tools', 
    label: 'HERRAMIENTAS', 
    icon: Zap, 
    type: 'link_root',
    children: [
      { 
        label: 'Calculadora de Tipos', 
        href: '/tools/type-calculator', 
        icon: Calculator 
      }
    ] 
  },
  { 
    id: 'nuzlocke', 
    label: 'NUZLOCKE', 
    icon: Skull, 
    type: 'link_root',
    children: [] // WIP
  }
];