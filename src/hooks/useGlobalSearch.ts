'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import type { ISearchNode } from '@/types/search';

// Lazily import Fuse only on client
let FuseClass: any = null;

export function useGlobalSearch() {
  const [isLoaded, setIsLoaded] = useState(false);
  const fuseRef = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      // Load Fuse
      if (!FuseClass) {
        const mod = await import('fuse.js');
        FuseClass = mod.default;
      }

      // Load index
      const res = await fetch('/data/global_search_index.json');
      if (!res.ok) throw new Error('Failed to load global_search_index.json');
      const data: ISearchNode[] = await res.json();

      if (cancelled) return;

      fuseRef.current = new FuseClass(data, {
        keys: ['name'],
        threshold: 0.3,
        minMatchCharLength: 2,
        includeScore: true,
      });

      setIsLoaded(true);
    }

    load().catch(console.error);

    return () => { cancelled = true; };
  }, []);

  const search = useCallback((query: string): ISearchNode[] => {
    if (!fuseRef.current || query.trim().length < 2) return [];
    const results = fuseRef.current.search(query, { limit: 10 });
    return results.map((r: any) => r.item as ISearchNode);
  }, []);

  return { search, isLoaded };
}
