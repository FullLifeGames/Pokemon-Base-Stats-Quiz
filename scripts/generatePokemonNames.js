#!/usr/bin/env node

/**
 * Script to fetch German Pokémon names from PokéAPI and generate a mapping file
 * Usage: node scripts/generatePokemonNames.js
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_FILE = path.join(__dirname, '../src/lib/pokemonNames.json');

/**
 * Extract the form suffix from a Pokémon name
 * e.g., "deoxys-attack" => "attack", "charizard-mega-x" => "mega-x"
 */
function extractFormSuffix(pokemonName) {
  const parts = pokemonName.split('-');
  // Get the base name (usually the first part)
  const baseNameLength = pokemonName.includes('nidoran') ? 1 : 
                         pokemonName.includes('mr-mime') ? 2 :
                         pokemonName.includes('mr-rime') ? 2 :
                         pokemonName.includes('type-null') ? 2 :
                         1;
  
  if (parts.length > baseNameLength) {
    return parts.slice(baseNameLength).join('-');
  }
  return null;
}

/**
 * Capitalize form suffix properly
 * e.g., "attack" => "Attack", "mega-x" => "Mega-X"
 */
function capitalizeFormSuffix(suffix) {
  if (!suffix) return '';
  
  return suffix
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('-');
}

async function fetchPokemonNames() {
  const nameMapping = {};
  let successCount = 0;
  let errorCount = 0;
  
  try {
    // Fetch all Pokemon (limit to first 10000 to cover all generations)
    console.log('Fetching Pokémon list from PokéAPI...');
    const response = await fetch('https://pokeapi.co/api/v2/pokemon?limit=10000');
    const data = await response.json();
    
    console.log(`Found ${data.results.length} Pokémon`);
    console.log('Fetching German names...\n');
    
    for (let i = 0; i < data.results.length; i++) {
      const pokemon = data.results[i];
      
      try {
        // Fetch individual Pokemon details to get German name
        const detailResponse = await fetch(pokemon.url);
        const detailData = await detailResponse.json();
        
        // Fetch species data to get German name
        const speciesResponse = await fetch(detailData.species.url);
        const speciesData = await speciesResponse.json();
        
        // Find German name from names array
        const germanName = speciesData.names.find(n => n.language.name === 'de')?.name;
        
        if (germanName) {
          // Check if this is a form by looking at the Pokemon's species vs its name
          // If pokemon.name contains hyphen AND doesn't match species.name exactly, it's a form
          const isForm = pokemon.name !== speciesData.name && pokemon.name.includes('-');
          
          if (isForm) {
            // Extract the form suffix
            const formSuffix = extractFormSuffix(pokemon.name);
            if (formSuffix) {
              // For forms, append the capitalized form suffix
              const capitalizedSuffix = capitalizeFormSuffix(formSuffix);
              nameMapping[pokemon.name] = `${germanName}-${capitalizedSuffix}`;
            } else {
              nameMapping[pokemon.name] = germanName;
            }
            
            // Also create base form entry if it doesn't exist
            if (!nameMapping[speciesData.name]) {
              nameMapping[speciesData.name] = germanName;
            }
          } else {
            // For base forms, always use the German name
            nameMapping[pokemon.name] = germanName;
          }
          
          successCount++;
        } else {
          console.warn(`No German name found for ${pokemon.name}`);
          errorCount++;
        }
        
        // Progress indicator
        if ((i + 1) % 50 === 0) {
          console.log(`Progress: ${i + 1}/${data.results.length}`);
        }
      } catch (error) {
        console.error(`Error fetching ${pokemon.name}:`, error.message);
        errorCount++;
      }
    }
    
    console.log('\n\nWriting mapping to file...');
    
    // Ensure directory exists
    const dir = path.dirname(OUTPUT_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(nameMapping, null, 2));
    console.log(`✓ Successfully generated ${OUTPUT_FILE}`);
    console.log(`✓ Generated mappings for ${successCount} Pokémon`);
    if (errorCount > 0) {
      console.log(`⚠ Failed to fetch ${errorCount} Pokémon`);
    }
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

fetchPokemonNames();
