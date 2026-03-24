import { ITeamMember } from '../../src/types/competitive';

/**
 * Normalizes trait names to proper casing for Showdown/Pokepaste format.
 * Examples: "choice-specs" -> "Choice Specs", "flutter-mane" -> "Flutter Mane"
 */
function toTitleCase(slug: string): string {
    if (!slug) return '';
    return slug
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

/**
 * Generates a Pokemon Showdown / PokePaste formatted string for a team.
 */
export function generatePokePaste(team: ITeamMember[]): string {
    let paste = '';

    for (const member of team) {
        // Pokemon Name @ Item
        const pokemonName = toTitleCase(member.pokemon_name);
        if (member.item && member.item !== 'No Item' && member.item !== 'no-item') {
            paste += `${pokemonName} @ ${toTitleCase(member.item)}\n`;
        } else {
            paste += `${pokemonName}\n`;
        }

        // Ability
        if (member.ability && member.ability !== 'Unknown' && member.ability !== 'unknown') {
            paste += `Ability: ${toTitleCase(member.ability)}\n`;
        }

        // Tera Type
        if (member.tera_type && member.tera_type !== 'Unknown' && member.tera_type !== 'unknown') {
            paste += `Tera Type: ${toTitleCase(member.tera_type)}\n`;
        }

        // Moves
        if (member.moves && member.moves.length > 0) {
            for (const move of member.moves) {
                if (move) {
                    paste += `- ${toTitleCase(move)}\n`;
                }
            }
        }

        // Add a blank line between Pokemon
        paste += '\n';
    }

    return paste.trim(); // Remove trailing newline
}
