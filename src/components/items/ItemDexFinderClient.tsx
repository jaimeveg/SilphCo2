'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { IItemIndex } from '@/types/items';
import { Filter, Search, Shield, Zap, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ItemDexFinderProps {
  lang: string;
  t: any;
}

export default function ItemDexFinderClient({ lang, t }: ItemDexFinderProps) {
  const [items, setItems] = useState<IItemIndex[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [loading, setLoading] = useState(true);

  // Load lightweight index
  useEffect(() => {
    async function loadItemDex() {
      try {
        const res = await fetch('/data/itemdex_index.json');
        const data: IItemIndex[] = await res.json();
        setItems(data);
      } catch (error) {
        console.error('Error loading itemdex_index.json', error);
      } finally {
        setLoading(false);
      }
    }
    loadItemDex();
  }, []);

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      // 1. Text Search matching name or effect
      const matchSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.effect.toLowerCase().includes(searchTerm.toLowerCase());
      if (!matchSearch) return false;
      return true;
    });
  }, [items, searchTerm]);

  return (
    <div className="min-h-screen bg-[#0B101B] relative">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1E293B_1px,transparent_1px),linear-gradient(to_bottom,#1E293B_1px,transparent_1px)] opacity-20 bg-[size:40px_40px] pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-900/5 via-slate-900/0 to-purple-900/5 opacity-50 blur-[100px] pointer-events-none" />

      <div className="relative z-10 container mx-auto px-4 pb-8">
        
        {/* Header & Search */}
        <header className="sticky top-0 z-40 bg-[#0B101B]/95 backdrop-blur-3xl px-4 md:px-8 pt-16 pb-4 -mx-4 md:-mx-8 mb-6 flex flex-col items-center justify-between gap-6 md:flex-row border-b border-slate-800/80 shadow-2xl">
          <div className="text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/5 border border-cyan-500/20 mb-3">
              <span className="text-cyan-500 text-[10px] font-mono tracking-widest uppercase">
                {t.hub.title}
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-display font-bold text-white tracking-tight">
              TACTICAL <span className="text-cyan-500">ITEMDEX</span>
            </h1>
            <p className="text-slate-400 text-xs font-mono tracking-wide mt-2">{t.hub.subtitle}</p>
          </div>
          
          <div className="w-full md:w-96 relative group">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-slate-500 group-focus-within:text-cyan-500 transition-colors" />
            </div>
            <input
              type="text"
              placeholder={t.hub.search_placeholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900/80 border border-slate-800 text-xs font-mono text-slate-200 placeholder-slate-500 rounded-lg py-3 pl-10 pr-4 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all shadow-[0_0_15px_rgba(0,0,0,0.5)]"
            />
          </div>
        </header>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center flex-col gap-3 items-center py-20">
            <div className="w-8 h-8 border-2 border-slate-800 border-t-cyan-500 rounded-full animate-spin"></div>
            <span className="text-cyan-500 font-mono text-xs animate-pulse">SYNCING DATABANK...</span>
          </div>
        )}

        {/* Meta Stats */}
        {!loading && (
          <div className="mb-4 flex items-center gap-2 text-[10px] text-slate-500 font-mono uppercase">
            <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-pulse"></span>
            {filteredItems.length} {t.hub.records_found}
          </div>
        )}

        {/* Objects Grid */}
        {!loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {filteredItems.map(item => (
              <Link 
                href={`/${lang}/items/${item.id}`} 
                key={item.id}
                className="group bg-slate-900/60 backdrop-blur-sm border border-slate-800/80 hover:border-cyan-500/50 hover:bg-slate-800/80 rounded-xl p-3 flex items-center gap-3 transition-all duration-300 hover:shadow-[0_0_15px_rgba(6,182,212,0.1)] relative overflow-hidden"
              >
                <div className="w-10 h-10 relative shrink-0">
                  <Image 
                    src={item.local_image_path || '/images/items/sprites/unknown.png'} 
                    alt={item.name} 
                    fill
                    className="object-contain group-hover:drop-shadow-[0_0_8px_rgba(6,182,212,0.8)] filter transition-all pixelated" 
                  />
                </div>
                
                <div className="flex flex-col overflow-hidden w-full">
                  <h3 className="text-[12px] font-bold text-slate-200 mb-0.5 group-hover:text-cyan-400 transition-colors capitalize truncate">
                    {item.name.replace(/-/g, ' ')}
                  </h3>
                  
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-[1px] bg-slate-950 text-slate-500 text-[8px] font-mono rounded border border-slate-800 uppercase tracking-widest truncate max-w-max">
                      {item.category.replace(/-/g, '')}
                    </span>
                    {(item.max_usage || 0) > 0 && (
                      <span className="text-[9px] font-mono text-cyan-500 font-bold">{item.max_usage}% USE</span>
                    )}
                  </div>
                </div>
                
                {/* Indicator Line */}
                <div className="w-[2px] h-0 bg-cyan-500 absolute top-0 left-0 group-hover:h-full transition-all duration-500 ease-out"></div>
              </Link>
            ))}
          </div>
        )}
        
        {/* Empty State */}
        {!loading && filteredItems.length === 0 && (
          <div className="text-center py-20 border border-dashed border-slate-800 rounded-xl bg-slate-900/20">
            <Activity className="w-8 h-8 text-slate-600 mx-auto mb-3 opacity-50" />
            <p className="text-slate-500 font-mono text-xs uppercase tracking-widest">NO_DATA_MATCHING: &quot;{searchTerm}&quot;</p>
          </div>
        )}

      </div>
    </div>
  );
}
