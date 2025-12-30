import { 
  Hash, Activity, Sword, 
  GraduationCap, Zap, Skull, 
  LucideIcon, Calculator, Timer, 
  Dna, Brain, RefreshCw 
} from 'lucide-react';

// Tipos para TypeScript
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

export interface ModuleDefinition {
  id: string;
  label: string;
  icon?: LucideIcon;
  sections: NavSection[];
  locked: boolean;
}

export interface CoreMenuItem {
  id: string;
  label: string;
  icon: LucideIcon;
  type: 'module_root' | 'link_root';
  children: any[];
}

// --- FACTORY: SECCIONES MÓDULO 1 ---
export const getModule1Sections = (dict: any): NavSection[] => [
  {
    id: 'types',
    label: dict.navigation.sections.types,
    icon: Hash,
    items: [
      { label: 'Tabla de Tipos', id: '1.1_type_matchup' }, // Podríamos traducir esto más a fondo en Fase C
      { label: 'Tipos Duales', id: '1.2_dual_typing' },
    ],
  },
  {
    id: 'stats',
    label: dict.navigation.sections.stats,
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
    label: dict.navigation.sections.mechanics,
    icon: Sword,
    items: [
      { label: 'Funcionamiento', id: '1.9_move_logic' },
      { label: 'STAB', id: '1.10_stab_mechanic' },
      { label: 'Categoría', id: 'section-mechanics-category' },
      { label: 'Estado', id: '1.12_status_moves' },
    ],
  },
];

// --- FACTORY: ACADEMY MODULES ---
export const getAcademyModules = (dict: any): ModuleDefinition[] => [
  {
    id: 'mod_1',
    label: dict.navigation.modules.mod1,
    sections: getModule1Sections(dict),
    locked: false,
  },
  {
    id: 'mod_2',
    label: dict.navigation.modules.mod2,
    icon: Timer,
    sections: [],
    locked: true,
  },
  {
    id: 'mod_3',
    label: dict.navigation.modules.mod3,
    icon: Dna,
    sections: [],
    locked: true,
  },
  {
    id: 'mod_4',
    label: dict.navigation.modules.mod4,
    icon: Brain,
    sections: [],
    locked: true,
  },
  {
    id: 'mod_5',
    label: dict.navigation.modules.mod5,
    icon: RefreshCw,
    sections: [],
    locked: true,
  },
];

// --- FACTORY: MENÚ PRINCIPAL (CORE) ---
export const getCoreMenu = (lang: string, dict: any): CoreMenuItem[] => [
  { 
    id: 'academy', 
    label: dict.navigation.academy, 
    icon: GraduationCap, 
    type: 'module_root',
    children: getAcademyModules(dict) 
  },
  { 
    id: 'tools', 
    label: dict.navigation.tools, 
    icon: Zap, 
    type: 'link_root',
    children: [
      { 
        label: dict.navigation.tools_items.type_calc, 
        href: `/${lang}/tools/type-calculator`, // URL DINÁMICA
        icon: Calculator 
      }
    ] 
  },
  { 
    id: 'nuzlocke', 
    label: dict.navigation.nuzlocke, 
    icon: Skull, 
    type: 'link_root',
    children: [] 
  }
];