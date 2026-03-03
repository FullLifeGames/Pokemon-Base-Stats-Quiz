import pokemonNames from './pokemonNames.json';
import pokemonTranslations from './pokemonTranslations.json';

const translations = pokemonTranslations as {
  types: Record<string, string>;
  moves: Record<string, string>;
  abilities: Record<string, string>;
  natures: Record<string, string>;
  items: Record<string, string>;
};

/**
 * Get the German name for a Pokémon given its English name
 * @param englishName - The English name of the Pokémon (e.g., 'bulbasaur')
 * @returns The German name if found, otherwise the English name
 */
export function getGermanPokemonName(englishName: string): string {
  const normalized = englishName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  return (pokemonNames as Record<string, string>)[normalized] || englishName;
}

/**
 * Get the localized name for a Pokémon
 * @param englishName - The English name of the Pokémon
 * @param locale - The locale code ('en' or 'de')
 * @returns The localized name
 */
export function getLocalizedPokemonName(englishName: string, locale: string): string {
  if (locale === 'de') {
    return getGermanPokemonName(englishName);
  }
  return englishName;
}

/** Look up a German translation from a category map, falling back to the English string. */
function germanLookup(map: Record<string, string>, english: string): string {
  return map[english] ?? english;
}

/** Localize a Pokémon type name (e.g. "Fire" → "Feuer"). */
export function getLocalizedTypeName(english: string, locale: string): string {
  return locale === 'de' ? germanLookup(translations.types, english) : english;
}

/** Localize a move name (e.g. "Thunderbolt" → "Donnerblitz"). */
export function getLocalizedMoveName(english: string, locale: string): string {
  return locale === 'de' ? germanLookup(translations.moves, english) : english;
}

/** Localize an ability name (e.g. "Levitate" → "Schwebe"). */
export function getLocalizedAbilityName(english: string, locale: string): string {
  return locale === 'de' ? germanLookup(translations.abilities, english) : english;
}

/** Localize a nature name (e.g. "Adamant" → "Hart"). */
export function getLocalizedNatureName(english: string, locale: string): string {
  return locale === 'de' ? germanLookup(translations.natures, english) : english;
}

/** Localize an item name (e.g. "Leftovers" → "Überreste"). */
export function getLocalizedItemName(english: string, locale: string): string {
  return locale === 'de' ? germanLookup(translations.items, english) : english;
}
