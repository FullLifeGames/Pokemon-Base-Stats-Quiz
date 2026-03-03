#!/usr/bin/env node

/**
 * Script to fetch German Pokémon type, move, and ability names from PokéAPI
 * and generate a mapping file.
 *
 * Usage: node scripts/generatePokemonTranslations.js
 *
 * Output: src/lib/pokemonTranslations.json
 *   {
 *     "types":     { "Fire": "Feuer", … },
 *     "moves":     { "Thunderbolt": "Donnerblitz", … },
 *     "abilities": { "Levitate": "Schwebe", … },
 *     "natures":   { "Adamant": "Hart", … },
 *     "items":     { "Leftovers": "Überreste", … }
 *   }
 */

import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUTPUT_FILE = path.join(__dirname, '../src/lib/pokemonTranslations.json')

/** Small delay to avoid hammering the API. */
const delay = (ms) => new Promise((r) => setTimeout(r, ms))

/**
 * Fetch a paginated list of resources from PokéAPI.
 * Returns array of { name, url } objects.
 */
async function fetchList(endpoint) {
  const all = []
  let url = `https://pokeapi.co/api/v2/${endpoint}?limit=100`
  while (url) {
    const res = await fetch(url)
    const data = await res.json()
    all.push(...data.results)
    url = data.next
  }
  return all
}

/**
 * Fetch a single resource and extract the German name from its `names` array.
 * Falls back to the English name from the same array (or the identifier).
 */
async function fetchGermanName(url, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      const german = data.names?.find((n) => n.language.name === 'de')
      const english = data.names?.find((n) => n.language.name === 'en')
      // Return both so the caller can build key→value
      return {
        english: english?.name ?? data.name,
        german: german?.name ?? null,
      }
    } catch (err) {
      if (attempt === retries) throw err
      await delay(1000 * attempt) // exponential-ish back-off
    }
  }
}

/**
 * Process a whole category (type / move / ability / nature / item).
 * Returns { [englishName]: germanName } for every entry that has a German name.
 */
async function processCategory(label, endpoint) {
  console.log(`\n── ${label} ──────────────────────────────`)
  const list = await fetchList(endpoint)
  console.log(`  Found ${list.length} entries. Fetching German names …`)

  const mapping = {}
  let ok = 0
  let skip = 0

  // Process in small batches to be kind to the API
  const BATCH = 20
  for (let i = 0; i < list.length; i += BATCH) {
    const batch = list.slice(i, i + BATCH)
    const results = await Promise.all(
      batch.map((entry) => fetchGermanName(entry.url).catch(() => null)),
    )

    for (const result of results) {
      if (result?.german) {
        mapping[result.english] = result.german
        ok++
      } else {
        skip++
      }
    }

    const done = Math.min(i + BATCH, list.length)
    if (done % 100 === 0 || done === list.length) {
      console.log(`  Progress: ${done}/${list.length}`)
    }

    // Small delay between batches
    if (i + BATCH < list.length) await delay(200)
  }

  console.log(`  ✓ ${ok} translated, ${skip} skipped`)
  return mapping
}

async function main() {
  console.log('Generating Pokémon translations …\n')

  const types = await processCategory('Types', 'type')
  const moves = await processCategory('Moves', 'move')
  const abilities = await processCategory('Abilities', 'ability')
  const natures = await processCategory('Natures', 'nature')
  const items = await processCategory('Items', 'item')

  const output = { types, moves, abilities, natures, items }
  const dir = path.dirname(OUTPUT_FILE)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2))
  console.log(`\n✓ Written to ${OUTPUT_FILE}`)
  console.log(
    `  types=${Object.keys(types).length}  moves=${Object.keys(moves).length}  ` +
    `abilities=${Object.keys(abilities).length}  natures=${Object.keys(natures).length}  ` +
    `items=${Object.keys(items).length}`,
  )
}

main().catch((err) => {
  console.error('Fatal:', err)
  process.exit(1)
})
