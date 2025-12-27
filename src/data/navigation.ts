import {
  BookOpen,
  Database,
  LayoutGrid, // Se mantiene el import por si se usa luego, pero quitamos el ítem
  Zap,
} from 'lucide-react';

export const NAVIGATION_DATA = [
  // ELIMINADO: Dashboard
  {
    id: 'modules',
    label: 'Módulos',
    icon: BookOpen,
    type: 'accordion',
    subItems: [
      {
        label: '01. Fundamentos',
        href: '/',
        sections: [
          { label: 'Tabla de Tipos', href: '/#types' },
          { label: 'Estadísticas Base', href: '/#stats' },
          { label: 'Mecánicas', href: '/#mechanics' },
          { label: 'Lógica', href: '/#logic' },
        ],
      },
      // FIX: Unlock modules y añadidos 5 y 6
      { label: '02. Dinámicas', href: '/m2' },
      { label: '03. Entrenamiento', href: '/m3' },
      { label: '04. Estrategia', href: '/m4' },
      { label: '05. Fenómenos', href: '/m5' },
      { label: '06. Crianza', href: '/m6' },
    ],
  },
  {
    id: 'tools',
    label: 'Herramientas',
    icon: Database,
    type: 'accordion',
    subItems: [
      { label: 'Calculadora Tipos', href: '/tools/type-calculator' },
      { label: 'Team Builder', href: '/tools/builder' },
    ],
  },
];
