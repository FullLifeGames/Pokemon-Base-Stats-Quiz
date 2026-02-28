const fs = require('fs')
const path = require('path')

const ROOT = process.cwd()
const SRC_DIR = path.join(ROOT, 'src')
const TEST_GLOB_SEGMENTS = ['__tests__', '.test.', '.spec.']
const FILE_EXTENSIONS = new Set(['.ts', '.tsx', '.vue'])

function listFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === 'coverage' || entry.name === '.git') continue
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...listFiles(fullPath))
      continue
    }
    const ext = path.extname(entry.name)
    if (FILE_EXTENSIONS.has(ext) && !entry.name.endsWith('.d.ts')) {
      files.push(fullPath)
    }
  }
  return files
}

function toRel(filePath) {
  return path.relative(ROOT, filePath).split(path.sep).join('/')
}

function lineFromIndex(source, index) {
  return source.slice(0, index).split('\n').length
}

function collectDeclarations(filePath, source) {
  const decls = []
  const patterns = [
    /\bfunction\s+([A-Za-z_]\w*)\s*\(/g,
    /\bconst\s+([A-Za-z_]\w*)\s*=\s*(?:async\s*)?\([^\)]*\)\s*=>/g,
    /\bconst\s+([A-Za-z_]\w*)\s*=\s*(?:async\s*)?[A-Za-z_]\w*\s*=>/g,
  ]

  for (const regex of patterns) {
    let match
    while ((match = regex.exec(source)) !== null) {
      const name = match[1]
      if (!name) continue
      decls.push({
        name,
        file: toRel(filePath),
        line: lineFromIndex(source, match.index),
      })
    }
  }

  return decls
}

function isTestFile(relPath) {
  return TEST_GLOB_SEGMENTS.some(segment => relPath.includes(segment))
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function collectUsages(name, filesWithSource) {
  const usageFiles = []
  const regex = new RegExp(`\\b${escapeRegex(name)}\\b`, 'g')

  for (const [filePath, source] of filesWithSource) {
    const rel = toRel(filePath)
    let match
    let hit = false
    while ((match = regex.exec(source)) !== null) {
      hit = true
    }
    if (hit) usageFiles.push(rel)
  }

  return Array.from(new Set(usageFiles)).sort()
}

const files = listFiles(SRC_DIR)
const filesWithSource = files.map(file => [file, fs.readFileSync(file, 'utf8')])

const declarations = []
for (const [filePath, source] of filesWithSource) {
  if (isTestFile(toRel(filePath))) continue
  declarations.push(...collectDeclarations(filePath, source))
}

const byName = new Map()
for (const decl of declarations) {
  if (!byName.has(decl.name)) byName.set(decl.name, [])
  byName.get(decl.name).push(decl)
}

const rows = []
for (const [name, decls] of [...byName.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
  const usageFiles = collectUsages(name, filesWithSource)
  const duplicate = decls.length > 1
  const tested = usageFiles.some(isTestFile)
  const testFiles = usageFiles.filter(isTestFile)

  rows.push({
    name,
    declarations: decls,
    duplicate,
    usageFiles,
    tested,
    testFiles,
  })
}

const lines = []
lines.push('# Method Duplication Audit')
lines.push('')
lines.push(`Generated: ${new Date().toISOString()}`)
lines.push('')
lines.push(`Total methods found: ${rows.length}`)
lines.push(`Duplicate declarations: ${rows.filter(r => r.duplicate).length}`)
lines.push('')
lines.push('| Method | Declared In | Duplicate | Used In | Testing Applied | Test Files |')
lines.push('|---|---|---|---|---|---|')
for (const row of rows) {
  const declaredIn = row.declarations.map(d => `${d.file}:L${d.line}`).join('<br/>')
  const usedIn = row.usageFiles.slice(0, 8).join('<br/>') + (row.usageFiles.length > 8 ? '<br/>…' : '')
  const testFiles = row.testFiles.slice(0, 5).join('<br/>') + (row.testFiles.length > 5 ? '<br/>…' : '')
  lines.push(`| ${row.name} | ${declaredIn || '-'} | ${row.duplicate ? 'Yes' : 'No'} | ${usedIn || '-'} | ${row.tested ? 'Yes' : 'No'} | ${testFiles || '-'} |`)
}

const outPath = path.join(ROOT, 'METHOD_DUPLICATION_AUDIT.md')
fs.writeFileSync(outPath, lines.join('\n'), 'utf8')
console.log(`Wrote ${outPath}`)
