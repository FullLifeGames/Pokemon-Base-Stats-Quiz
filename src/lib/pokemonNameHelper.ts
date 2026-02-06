import pokemonNames from './pokemonNames.json';

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
