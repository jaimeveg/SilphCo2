export type SearchEntityType = 'pokemon' | 'move' | 'item' | 'ability';

export interface ISearchNode {
  id: string;           // Unique slug/id (e.g. "charizard", "earthquake")
  name: string;         // Display name for search (e.g. "Charizard", "Earthquake")
  entity_type: SearchEntityType;
  icon_url: string;     // Path to icon asset
  subtitle: string;     // Disambiguating text (e.g. "Fire / Flying", "Ground — Physical")
}
