import fs from 'fs';
import path from 'path';

const POKEAPI_GQL = 'https://beta.pokeapi.co/graphql/v1beta';

// Optimizamos query para no traer datos basura
const QUERY = `
  query GetMoveDex {
    pokemon_v2_move {
      name
      power
      accuracy
      pp
      pokemon_v2_type {
        name
      }
      pokemon_v2_movedamageclass {
        name
      }
      pokemon_v2_moveeffect {
        pokemon_v2_moveeffecteffecttexts(where: {language_id: {_eq: 9}}) {
          short_effect
        }
      }
      pokemon_v2_pokemonmoves(distinct_on: pokemon_id) {
        pokemon_id
      }
    }
  }
`;

async function generateMoveDex() {
  console.log('🚀 Generando Move Dex (Heavy)...');
  try {
    const response = await fetch(POKEAPI_GQL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: QUERY })
    });

    const { data } = await response.json();
    const output: Record<string, any> = {};

    data.pokemon_v2_move.forEach((m: any) => {
      // Slugify simple
      const slug = m.name.toLowerCase().replace(/\s+/g, '-');
      
      const learners = m.pokemon_v2_pokemonmoves.map((pm: any) => pm.pokemon_id);
      const effectText = m.pokemon_v2_moveeffect?.pokemon_v2_moveeffecteffecttexts[0]?.short_effect || null;

      output[slug] = {
        name: m.name,
        type: m.pokemon_v2_type?.name || 'normal',
        category: m.pokemon_v2_movedamageclass?.name || 'status',
        power: m.power,
        accuracy: m.accuracy,
        pp: m.pp,
        effect: effectText,
        learners: learners // Array de IDs
      };
    });

    const dir = path.join(process.cwd(), 'public', 'data');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    fs.writeFileSync(path.join(dir, 'move_dex.json'), JSON.stringify(output));
    console.log(`✅ Guardado: move_dex.json (${Object.keys(output).length} movimientos)`);

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

generateMoveDex();