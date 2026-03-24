import { getDictionary } from '@/i18n/get-dictionary';
import fs from 'fs/promises';
import path from 'path';
import CompetitiveClient from './CompetitiveClient';

interface CompetitivePageProps {
  params: { lang: string };
  searchParams: { format?: string; deepdive?: string; source?: string };
}

export default async function CompetitivePage({ params, searchParams }: CompetitivePageProps) {
  const dict = await getDictionary(params.lang as any);
  
  const DATA_DIR = path.join(process.cwd(), 'public', 'data');
  
  // 1. Discover tournament formats
  let tournaments: {id: string; name: string}[] = [];
  try {
    const raw = await fs.readFile(path.join(DATA_DIR, 'tournaments', 'rk9_index.json'), 'utf8');
    tournaments = JSON.parse(raw).map((t: any) => ({
      id: `vgc_${t.id}`,
      name: t.name
    }));
  } catch (e) {
    tournaments = [];
  }

  // 2. Discover Showdown formats
  let showdownFormats: {id: string; name: string}[] = [];
  try {
    const raw = await fs.readFile(path.join(DATA_DIR, 'competitive', 'showdown_index.json'), 'utf8');
    showdownFormats = JSON.parse(raw);
  } catch (e) {
    showdownFormats = [];
  }

  // 3. Determine active format
  const source = searchParams.source || 'showdown';
  let activeFormatId = searchParams.format;
  
  if (!activeFormatId) {
    if (source === 'showdown' && showdownFormats.length > 0) {
      const vgcFormats = showdownFormats.filter(f => f.id.includes('vgc'));
      if (vgcFormats.length > 0) {
        // Sort descending to naturally put gen9 over gen8
        vgcFormats.sort((a, b) => b.id.localeCompare(a.id));
        activeFormatId = vgcFormats[0].id;
      } else {
        activeFormatId = showdownFormats[0].id;
      }
    } else if (source === 'tournament' && tournaments.length > 0) {
      activeFormatId = tournaments[0].id;
    } else {
      activeFormatId = 'none';
    }
  }

  // 4. Fetch Dashboard Data
  let dashboardData = null;
  if (activeFormatId !== 'none') {
    try {
      const dbPath = path.join(DATA_DIR, 'competitive', `meta_${activeFormatId}.json`);
      const dbRaw = await fs.readFile(dbPath, 'utf8');
      dashboardData = JSON.parse(dbRaw);
    } catch (e) {
      console.log(`No payload for ${activeFormatId} yet.`);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <CompetitiveClient 
        lang={params.lang}
        dict={dict}
        showdownFormats={showdownFormats}
        tournamentFormats={tournaments}
        activeFormatId={activeFormatId}
        activeSource={source}
        data={dashboardData}
        deepdiveParam={searchParams.deepdive}
      />
    </div>
  );
}
