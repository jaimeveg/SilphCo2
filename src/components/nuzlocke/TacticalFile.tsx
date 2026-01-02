'use client';

import { motion } from 'framer-motion';
import { FileText, Database, ShieldAlert } from 'lucide-react';

interface ArchiveData {
  id: string;
  title: string;
  desc: string;
  format: string; // 'text' | 'database'
}

interface TacticalFileProps {
  archive: ArchiveData;
}

export default function TacticalFile({ archive }: TacticalFileProps) {
  // Selección de icono según formato o ID
  const getIcon = () => {
    if (archive.format === 'database') return Database;
    if (archive.id.includes('hardcore')) return ShieldAlert;
    return FileText;
  };

  const Icon = getIcon();

  return (
    <motion.div
      whileHover={{ y: -4, boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)' }}
      className="group relative bg-slate-800 rounded-t-lg rounded-bl-lg rounded-br-[2rem] p-6 border-t border-l border-r border-slate-700 border-b border-b-slate-900 shadow-xl cursor-pointer overflow-hidden"
    >
      {/* Folder Tab Effect (Visual top tab) */}
      <div className="absolute -top-3 left-0 w-24 h-4 bg-slate-700 rounded-t transform skew-x-12 origin-bottom-left" />

      {/* Decorative 'Confidential' Stamp */}
      <div className="absolute top-2 right-4 opacity-10 group-hover:opacity-20 transition-opacity">
        <span className="text-[10px] font-black tracking-widest text-slate-400 -rotate-12 block border-2 border-slate-400 px-1">
          CONFIDENTIAL
        </span>
      </div>

      {/* Icon */}
      <div className="mb-4 text-slate-400 group-hover:text-amber-400 transition-colors">
        <Icon size={32} strokeWidth={1.5} />
      </div>

      {/* Content */}
      <h3 className="text-lg font-bold text-slate-200 group-hover:text-white mb-2 font-display uppercase tracking-wide">
        {archive.title}
      </h3>
      <p className="text-sm text-slate-400 font-mono leading-relaxed">
        {archive.desc}
      </p>

      {/* Access ID */}
      <div className="mt-4 pt-4 border-t border-slate-700/50 flex justify-between items-center text-[10px] font-mono text-slate-500 uppercase">
        <span>ID: {archive.id}</span>
        <span className="group-hover:text-amber-400 transition-colors">READ_ONLY</span>
      </div>
    </motion.div>
  );
}