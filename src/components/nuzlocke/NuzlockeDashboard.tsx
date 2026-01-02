'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import FieldTool from './FieldTool';
import TacticalFile from './TacticalFile';
import { Siren, FolderOpen } from 'lucide-react';

interface NuzlockeDashboardProps {
  data: any; 
}

type TabType = 'operations' | 'archives';

export default function NuzlockeDashboard({ data }: NuzlockeDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabType>('operations');

  return (
    <div className="w-full max-w-5xl mx-auto">
      
      {/* TABS NAVIGATION - ROJOS OSCUROS */}
      <div className="flex border-b border-red-950/30 mb-8">
        <button
          onClick={() => setActiveTab('operations')}
          className={cn(
            "flex-1 md:flex-none md:w-64 py-4 text-center font-display font-bold tracking-wider text-sm transition-all relative",
            activeTab === 'operations' 
              ? "text-red-700" // Rojo oscuro
              : "text-slate-600 hover:text-slate-400 hover:bg-red-950/10"
          )}
        >
          <div className="flex items-center justify-center gap-2">
            <Siren size={16} className={activeTab === 'operations' ? "animate-pulse text-red-800" : ""} />
            {data.tabs.operations}
          </div>
          {activeTab === 'operations' && (
            <motion.div 
              layoutId="tab-indicator"
              // Indicador y sombra profundos
              className="absolute bottom-0 left-0 w-full h-0.5 bg-red-800 shadow-[0_0_15px_rgba(127,29,29,0.6)]" 
            />
          )}
        </button>

        <button
          onClick={() => setActiveTab('archives')}
          className={cn(
            "flex-1 md:flex-none md:w-64 py-4 text-center font-display font-bold tracking-wider text-sm transition-all relative",
            activeTab === 'archives' 
              ? "text-amber-600" 
              : "text-slate-600 hover:text-slate-400 hover:bg-amber-950/10"
          )}
        >
          <div className="flex items-center justify-center gap-2">
            <FolderOpen size={16} />
            {data.tabs.archives}
          </div>
          {activeTab === 'archives' && (
            <motion.div 
              layoutId="tab-indicator"
              className="absolute bottom-0 left-0 w-full h-0.5 bg-amber-600 shadow-[0_0_15px_rgba(217,119,6,0.4)]" 
            />
          )}
        </button>
      </div>

      {/* CONTENT AREA */}
      <div className="min-h-[400px]">
        <AnimatePresence mode="wait">
          {activeTab === 'operations' && (
            <motion.div
              key="operations"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              {data.tools.map((tool: any) => (
                <FieldTool key={tool.id} tool={tool} />
              ))}
            </motion.div>
          )}

          {activeTab === 'archives' && (
            <motion.div
              key="archives"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {data.archives.map((archive: any) => (
                <TacticalFile key={archive.id} archive={archive} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}