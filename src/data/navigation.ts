import { 
  Hash, Activity, Sword, 
  GraduationCap, Zap, Skull, 
  LucideIcon, Calculator, Timer, 
  Dna, Brain, RefreshCw, Egg 
} from 'lucide-react';

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
export const getModule1Sections = (dict: any): NavSection[] => {
  const t_items = dict.navigation.sections.items;
  
  return [
    {
      id: 'types',
      label: dict.navigation.sections.types,
      icon: Hash,
      items: [
        { label: t_items.type_chart, id: '1.1_type_matchup' },
        { label: t_items.dual_types, id: '1.2_dual_typing' },
      ],
    },
    {
      id: 'stats',
      label: dict.navigation.sections.stats,
      icon: Activity,
      items: [
        { label: t_items.hp, id: '1.3_stat_hp' },
        { label: t_items.atk_def, id: 'section-physical-stats' }, // Alias para 1.4
        { label: t_items.spa_spd, id: 'section-special-stats' },  // Alias para 1.5
        { label: t_items.speed, id: '1.6_stat_speed' },
        { label: t_items.accuracy, id: '1.8_hidden_accuracy' },
        { label: t_items.bst, id: '1.7_bst_analysis' },
      ],
    },
    {
      id: 'mechanics',
      label: dict.navigation.sections.mechanics,
      icon: Sword,
      items: [
        { label: t_items.logic, id: '1.9_move_logic' },
        { label: t_items.stab, id: '1.10_stab_mechanic' },
        { label: t_items.category, id: 'section-mechanics-category' }, // Alias para 1.11
        { label: t_items.status, id: '1.12_status_moves' },
      ],
    },
  ];
};

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
  {
    id: 'mod_6',
    label: dict.navigation.modules.mod6,
    icon: Egg,
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
        href: `/${lang}/tools/type-calculator`,
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