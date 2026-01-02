'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, Database, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import ToolTile from './ToolTile';

interface ToolsDashboardProps {
  data: any; 
  lang: string;
}

export default function ToolsDashboard({ data, lang }: ToolsDashboardProps) {
  const [filter, setFilter] = useState('all');

  // --- BLOQUE DE DEPURACIÓN (Console Logs) ---
  useEffect(() => {
    console.group("🛠️ TOOLS DASHBOARD DEBUG");
    console.log("1. Data recibida:", data);
    
    if (!data) {
      console.error("❌ ERROR CRÍTICO: La prop 'data' es undefined o null.");
    } else if (!data.tools) {
      console.error("❌ ERROR ESTRUCTURA: 'data.tools' no existe.", data);
    } else {
      console.log("2. Total herramientas:", data.tools.length);
      console.log("3. Muestra de herramienta [0]:", data.tools[0]);
      console.log("4. Categoría herramienta [0]:", data.tools[0]?.category);
    }
    console.groupEnd();
  }, [data]);

  // --- RENDERIZADO DE EMERGENCIA (Si no hay datos) ---
  if (!data) {
    return (
      <div className="p-4 border border-red-500 bg-red-950/20 text-red-400 rounded-lg font-mono text-xs">
        <h3 className="font-bold text-lg flex items-center gap-2 mb-2">
          <AlertTriangle /> DEBUG: NO DATA RECEIVED
        </h3>
        <p>El componente ha recibido 'undefined'. Revisa <code>page.tsx</code>.</p>
        <p>Asegúrate de pasar: <code>data={'{dict.tools_dashboard}'}</code></p>
      </div>
    );
  }

  // --- LÓGICA SEGURA ---
  // Default values por si el JSON está incompleto para evitar crash
  const filters = data.filters || {};
  const categories = [
    { id: 'all', label: filters.all || 'ALL' },
    { id: 'analytics', label: filters.analytics || 'ANALYTICS' },
    { id: 'databank', label: filters.databank || 'DATABANK' },
    { id: 'management', label: filters.management || 'MANAGEMENT' },
  ];

  const toolsList = Array.isArray(data.tools) ? data.tools : [];

  // Filtrado con Logs paso a paso
  const filteredTools = toolsList.filter((tool: any) => {
    // Normalización para evitar errores de mayúsculas
    const toolCat = tool.category ? tool.category.toLowerCase() : 'undefined';
    const currentFilter = filter.toLowerCase();
    
    // Loguear solo si estamos filtrando algo específico para no saturar
    if (filter !== 'all') {
      console.log(`🔍 Comparando ID: ${tool.id} | Cat: '${toolCat}' vs Filtro: '${currentFilter}' | Match: ${toolCat === currentFilter}`);
    }

    if (filter === 'all') return true;
    return toolCat === currentFilter;
  });

  return (
    <div className="w-full space-y-8">
      
      {/* BARRA DE FILTROS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-1">
        <div className="flex items-center gap-2 text-slate-400 text-xs font-mono uppercase tracking-widest">
          <Filter size={14} />
          <span>FILTER_PROTOCOL:</span>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                console.log(`Clic en filtro: ${cat.id}`);
                setFilter(cat.id);
              }}
              className={cn(
                "px-4 py-1.5 rounded-full text-xs font-bold font-mono transition-all duration-300 border",
                filter.toLowerCase() === cat.id.toLowerCase()
                  ? "bg-brand-cyan/10 border-brand-cyan text-brand-cyan shadow-[0_0_10px_rgba(34,211,238,0.2)]"
                  : "bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-600 hover:text-slate-300"
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* GRID DE HERRAMIENTAS */}
      <motion.div 
        layout
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        <AnimatePresence mode='popLayout'>
          {filteredTools.map((tool: any) => (
            <ToolTile key={tool.id} tool={tool} lang={lang} />
          ))}
        </AnimatePresence>
      </motion.div>

      {/* DEBUG VISUAL EN PANTALLA: Muestra datos crudos si la lista sale vacía pero el filtro es 'all' */}
      {filteredTools.length === 0 && (
        <div className="w-full py-20 flex flex-col items-center justify-center text-slate-600 space-y-4 border border-dashed border-slate-800 rounded-xl">
          <Database size={48} className="opacity-20" />
          <span className="font-mono text-sm">NO_DATA_FOUND_IN_SECTOR</span>
          
          {/* Debug Data Dump */}
          <div className="mt-4 p-4 bg-black/50 rounded text-[10px] font-mono text-left max-w-md w-full overflow-auto max-h-40">
            <p className="text-brand-cyan mb-1">// DEBUG DATA DUMP:</p>
            <pre>{JSON.stringify({ 
              filterActive: filter, 
              totalToolsRaw: toolsList.length,
              firstToolCategory: toolsList[0]?.category 
            }, null, 2)}</pre>
          </div>
        </div>
      )}

    </div>
  );
}