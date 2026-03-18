/**
 * build-global-search.ts
 * ETL: merges pokedex, movedex, itemdex, abilitydex indexes into
 * a flat global_search_index.json for instant fuzzy search on the client.
 */
import fs from 'fs/promises';
import path from 'path';

const DATA_DIR = path.resolve(__dirname, '../public/data');
const OUTPUT = path.resolve(DATA_DIR, 'global_search_index.json');

interface ISearchNode {
  id: string;
  name: string;
  entity_type: 'pokemon' | 'move' | 'item' | 'ability';
  icon_url: string;
  subtitle: string;
}

function capitalize(s: string): string {
  return s.replace(/(^|[-\s])(\w)/g, (_m, sep, c) => sep + c.toUpperCase()).trim();
}

function formatName(slug: string): string {
  return slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

// ---------- POKEMON ----------
async function buildPokemon(): Promise<ISearchNode[]> {
  const raw = await fs.readFile(path.join(DATA_DIR, 'pokedex_index.json'), 'utf-8');
  const data: any[] = JSON.parse(raw);

  const nodes: ISearchNode[] = [];

  for (const p of data) {
    // Base pokemon
    const types: string[] = p.types ?? [];
    nodes.push({
      id: p.id,
      name: formatName(p.name),
      entity_type: 'pokemon',
      icon_url: `/images/pokemon/icon/${p.dex_number}.png`,
      subtitle: types.map(t => capitalize(t)).join(' / '),
    });

    // Varieties (mega, galar, etc.)
    if (Array.isArray(p.varieties)) {
      for (const v of p.varieties) {
        const vtypes: string[] = v.types ?? types;
        nodes.push({
          id: v.id,
          name: formatName(v.name),
          entity_type: 'pokemon',
          icon_url: `/images/icon/${v.dex_number ?? p.dex_number}.png`,
          subtitle: vtypes.map((t: string) => capitalize(t)).join(' / '),
        });
      }
    }
  }

  return nodes;
}

// ---------- MOVES ----------
async function buildMoves(): Promise<ISearchNode[]> {
  const raw = await fs.readFile(path.join(DATA_DIR, 'movedex_index.json'), 'utf-8');
  const data: any[] = JSON.parse(raw);

  return data.map(m => ({
    id: m.id,
    name: formatName(m.name),
    entity_type: 'move' as const,
    icon_url: `/images/types/${(m.type ?? 'normal').toLowerCase()}.png`,
    subtitle: `${capitalize(m.type ?? 'Normal')} — ${capitalize(m.category ?? 'Status')}`,
  }));
}

// ---------- ITEMS ----------
async function buildItems(): Promise<ISearchNode[]> {
  const raw = await fs.readFile(path.join(DATA_DIR, 'itemdex_index.json'), 'utf-8');
  const data: any[] = JSON.parse(raw);

  return data.map(i => ({
    id: i.id,
    name: i.name ?? formatName(i.id),
    entity_type: 'item' as const,
    icon_url: i.local_image_path ?? `/images/items/high-res/${i.id}.png`,
    subtitle: capitalize(i.category ?? 'Item'),
  }));
}

// ---------- ABILITIES ----------
async function buildAbilities(): Promise<ISearchNode[]> {
  const raw = await fs.readFile(path.join(DATA_DIR, 'abilitydex_index.json'), 'utf-8');
  const data: any[] = JSON.parse(raw);

  return data.map(a => ({
    id: a.id,
    name: formatName(a.name ?? a.id),
    entity_type: 'ability' as const,
    icon_url: '/images/ui/ability-icon.png',
    subtitle: `Ability${a.competitive_tier ? ` · ${a.competitive_tier}-Tier` : ''}`,
  }));
}

// ---------- MAIN ----------
async function main() {
  console.log('[1/5] Building Pokémon nodes...');
  const pokemon = await buildPokemon();
  console.log(`      → ${pokemon.length} pokemon entries`);

  console.log('[2/5] Building Move nodes...');
  const moves = await buildMoves();
  console.log(`      → ${moves.length} move entries`);

  console.log('[3/5] Building Item nodes...');
  const items = await buildItems();
  console.log(`      → ${items.length} item entries`);

  console.log('[4/5] Building Ability nodes...');
  const abilities = await buildAbilities();
  console.log(`      → ${abilities.length} ability entries`);

  const all: ISearchNode[] = [...pokemon, ...moves, ...items, ...abilities];

  console.log(`[5/5] Writing ${all.length} total nodes to global_search_index.json...`);
  await fs.writeFile(OUTPUT, JSON.stringify(all), 'utf-8');
  console.log(`✅  Done! → ${OUTPUT}`);
}

main().catch(e => { console.error(e); process.exit(1); });
