import fs from 'fs';
import path from 'path';

const POKEAPI_GQL = 'https://beta.pokeapi.co/graphql/v1beta';

const QUERY = `
  query GetBaseStats {
    pokemon_v2_pokemon {
      id
      name
      pokemon_v2_pokemonstats {
        base_stat
        pokemon_v2_stat {
          name
        }
      }
      pokemon_v2_pokemontypes {
        pokemon_v2_type {
          name
        }
      }
    }
  }
`;

async function generateBaseDex() {
  console.log('🚀 Generando Base Stats Dex...');
  try {
    const response = await fetch(POKEAPI_GQL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: QUERY })
    });

    const { data } = await response.json();
    const output: Record<number, any> = {};

    data.pokemon_v2_pokemon.forEach((p: any) => {
      const stats: any = {};
      let bst = 0;

      p.pokemon_v2_pokemonstats.forEach((s: any) => {
        const statName = s.pokemon_v2_stat.name;
        // Mapear nombres de API a nuestro NuzlockeStats interface
        const key = statName === 'hp' ? 'hp' :
                    statName === 'attack' ? 'atk' :
                    statName === 'defense' ? 'def' :
                    statName === 'special-attack' ? 'spa' :
                    statName === 'special-defense' ? 'spd' :
                    statName === 'speed' ? 'spe' : null;
        
        if (key) {
          stats[key] = s.base_stat;
          bst += s.base_stat;
        }
      });

      const types = p.pokemon_v2_pokemontypes.map((t: any) => t.pokemon_v2_type.name);

      output[p.id] = { stats, types, bst };
    });

    const dir = path.join(process.cwd(), 'public', 'data');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    
    fs.writeFileSync(path.join(dir, 'pokedex_base_stats.json'), JSON.stringify(output));
    console.log(`✅ Guardado: pokedex_base_stats.json (${Object.keys(output).length} entradas)`);

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

generateBaseDex();