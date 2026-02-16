/**
 * Fetches competitive Pokémon sets (setdex) from the smogon/damage-calc
 * repository and writes them as JSON files, one per generation.
 *
 * Usage:  node scripts/generateSetdex.js
 *
 * Output: src/lib/setdex-gen1.json … src/lib/setdex-gen9.json
 */

const GENS = [
  { gen: 1, file: 'gen1.js' },
  { gen: 2, file: 'gen2.js' },
  { gen: 3, file: 'gen3.js' },
  { gen: 4, file: 'gen4.js' },
  { gen: 5, file: 'gen5.js' },
  { gen: 6, file: 'gen6.js' },
  { gen: 7, file: 'gen7.js' },
  { gen: 8, file: 'gen8.js' },
  { gen: 9, file: 'gen9.js' },
]

const BASE_URL =
  'https://raw.githubusercontent.com/smogon/damage-calc/master/src/js/data/sets/'

async function fetchGen(gen, file) {
  const url = BASE_URL + file
  console.log(`  Fetching gen${gen} from ${url} …`)
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${file}: ${res.statusText}`)
  let text = await res.text()

  // The file has a JS declaration like:
  //   var SETDEX_SV = { ... };
  // Extract just the object literal.
  const varMatch = text.match(/var\s+\w+\s*=\s*/)
  if (varMatch) {
    text = text.slice(varMatch.index + varMatch[0].length)
  }

  // Remove trailing semicolons / whitespace
  text = text.replace(/;\s*$/, '').trim()

  // Parse as JS object
  // eslint-disable-next-line no-eval
  return new Function(`return (${text})`)()
}

async function main() {
  const fs = await import('node:fs')
  const path = await import('node:path')

  const outDir = path.resolve(
    import.meta.dirname ?? path.dirname(new URL(import.meta.url).pathname),
    '..',
    'src',
    'lib',
  )

  console.log('Fetching setdex for all generations from smogon/damage-calc …\n')

  let totalPokemon = 0
  let totalSize = 0

  for (const { gen, file } of GENS) {
    const setdex = await fetchGen(gen, file)
    const outPath = path.join(outDir, `setdex-gen${gen}.json`)

    fs.writeFileSync(outPath, JSON.stringify(setdex, null, 0))

    const sizeKB = (fs.statSync(outPath).size / 1024).toFixed(1)
    const pokemonCount = Object.keys(setdex).length
    totalPokemon += pokemonCount
    totalSize += fs.statSync(outPath).size

    console.log(`  ✓ Gen ${gen}: ${pokemonCount} Pokémon (${sizeKB} KB)`)
  }

  console.log(`\n✓ Done! ${totalPokemon} total Pokémon across ${GENS.length} gens (${(totalSize / 1024).toFixed(1)} KB total)`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
