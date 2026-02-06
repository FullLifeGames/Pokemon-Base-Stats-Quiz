# German Pokémon Names Setup

## Overview

This project uses German Pokémon names fetched from the PokéAPI to provide localized names for the Pokémon Quiz application.

## Files

- **`scripts/generatePokemonNames.js`** - Script that fetches German Pokémon names from PokéAPI and generates a mapping file
- **`src/lib/pokemonNames.json`** - Generated mapping file with 1350 Pokémon names (English → German)
- **`src/lib/pokemonNameHelper.ts`** - TypeScript utility functions to get localized Pokémon names

## How It Works

### Generation Script

The `generatePokemonNames.js` script:
1. Fetches all 1350 Pokémon from PokéAPI
2. For each Pokémon, fetches its species data
3. Extracts the German name from the species data
4. Creates a JSON mapping file (`pokemonNames.json`)

### Usage in Vue Components

The `pokemonNameHelper.ts` provides helper functions:

```typescript
import { getLocalizedPokemonName } from '@/lib/pokemonNameHelper';

// Get localized name based on current locale
const localizedName = getLocalizedPokemonName('pikachu', 'de'); // Returns "Pikachu"
const localizedName = getLocalizedPokemonName('pikachu', 'en'); // Returns "pikachu"

// Or use the German-specific function
import { getGermanPokemonName } from '@/lib/pokemonNameHelper';
const germanName = getGermanPokemonName('bulbasaur'); // Returns "Bisasam"
```

In `BaseStatQuiz.vue`, the component uses:
```typescript
label: getLocalizedPokemonName(pokemon.name, locale.value)
```

This automatically displays German names when locale is 'de' and English names when locale is 'en'.

## Regenerating Names

If you need to regenerate the mapping (e.g., to get newly released Pokémon):

```bash
pnpm run generate:names
```

This will:
1. Fetch the latest Pokémon data from PokéAPI
2. Extract German names
3. Update `src/lib/pokemonNames.json`

## Data Source

- **API**: [PokéAPI v2](https://pokeapi.co/)
- **Endpoint**: `https://pokeapi.co/api/v2/pokemon` and species data
- **Coverage**: All 1350 Pokémon including Gen 1-9 and forms
