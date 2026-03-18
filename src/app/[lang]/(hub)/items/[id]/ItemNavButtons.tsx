'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, GripHorizontal } from 'lucide-react';

interface Props {
  lang: string;
  backText: string;
}

export default function ItemNavButtons({ lang, backText }: Props) {
  const router = useRouter();

  return (
    <div className="mb-6 flex gap-3 items-center">
      <button 
        onClick={() => router.back()} 
        className="inline-flex items-center gap-2 text-xs font-mono text-slate-400 hover:text-cyan-400 transition-colors uppercase tracking-widest border border-slate-800 hover:border-cyan-500/50 px-3 py-1.5 rounded-md bg-slate-900/60 backdrop-blur-sm shadow-sm"
      >
        <ArrowLeft size={14} /> {backText}
      </button>

      <Link 
        href={`/${lang}/items`} 
        className="inline-flex items-center gap-2 text-xs font-mono text-slate-500 hover:text-purple-400 transition-colors uppercase tracking-widest border border-transparent hover:border-purple-500/30 px-3 py-1.5 rounded-md bg-slate-900/40 backdrop-blur-sm"
      >
        <GripHorizontal size={14} /> View All Items
      </Link>
    </div>
  );
}
