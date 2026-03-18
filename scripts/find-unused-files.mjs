import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const projectRoot = path.resolve(__dirname, '..')
const FRONTEND_ENTRY = path.join(projectRoot, 'src', 'main.ts')
const BACKEND_ENTRY = path.join(projectRoot, 'server', 'src', 'index.ts')
const FRONTEND_HTML_ENTRY = path.join(projectRoot, 'index.html')

const SCAN_ROOTS = [
  path.join(projectRoot, 'src'),
  path.join(projectRoot, 'server', 'src'),
  path.join(projectRoot, 'public'),
]

// Note: We intentionally do NOT treat .d.ts files as movable “unused”.
// They can provide global/module augmentations and may still be required by TS.
const MOVABLE_EXTENSIONS = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.vue',
  '.css',
  '.scss',
  '.json',
  '.svg',
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.webp',
  '.woff',
  '.woff2',
  '.ttf',
  '.eot',
])

const READABLE_TEXT_EXTENSIONS = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.vue',
  '.css',
  '.scss',
  '.html',
  '.json',
  '.md',
])

const RESOLVE_EXTENSIONS = [
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.vue',
  '.json',
  '.css',
  '.scss',
]

const existsFile = (p) => {
  try {
    return fs.existsSync(p) && fs.statSync(p).isFile()
  } catch {
    return false
  }
}

function* walkFiles(rootDir) {
  const stack = [rootDir]
  while (stack.length) {
    const dir = stack.pop()
    let entries
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true })
    } catch {
      continue
    }
    for (const ent of entries) {
      if (ent.name === 'node_modules') continue
      if (ent.name === '.git') continue
      if (ent.name === 'disabledon') continue

      const full = path.join(dir, ent.name)
      if (ent.isDirectory()) {
        stack.push(full)
      } else if (ent.isFile()) {
        yield full
      }
    }
  }
}

function normalizeToProjectRelative(p) {
  const rel = path.relative(projectRoot, p)
  // Make output stable across OS path separators.
  return rel.split(path.sep).join('/')
}

function resolveImport(specifier, importerFilePath) {
  if (!specifier) return []
  const s = specifier.trim()

  // External package import: ignore.
  // Internal alias: "@/..." -> "<root>/src/..."
  if (s.startsWith('@/')) {
    const abs = path.join(projectRoot, 'src', s.slice(2))
    return resolvePathLikeModule(abs)
  }

  if (s.startsWith('~/')) return [] // not handled

  if (s.startsWith('/')) {
    // Vite-served “public/” assets: "/favicon.svg" -> "public/favicon.svg"
    const abs = path.join(projectRoot, 'public', s.slice(1))
    if (existsFile(abs)) return [abs]
    // Also support extensionless file under public
    return resolvePathLikeModule(abs)
  }

  // Relative import
  if (s.startsWith('.')) {
    const baseDir = path.dirname(importerFilePath)
    const absBase = path.resolve(baseDir, s)
    return resolvePathLikeModule(absBase)
  }

  // Non-relative / non-alias: likely a package import.
  return []
}

function resolvePathLikeModule(absBaseOrFile) {
  // If it already looks like a file with known extension.
  if (path.extname(absBaseOrFile)) {
    if (existsFile(absBaseOrFile)) return [absBaseOrFile]

    // Support TS source imports that reference compiled output (common in ESM):
    // e.g. `import('./app.js')` while the source file is `app.ts`.
    const ext = path.extname(absBaseOrFile).toLowerCase()
    const replacements = []
    if (ext === '.js') replacements.push('.ts', '.tsx')
    if (ext === '.jsx') replacements.push('.ts', '.tsx')

    const alt = []
    for (const rExt of replacements) {
      const p = absBaseOrFile.slice(0, -ext.length) + rExt
      if (existsFile(p)) alt.push(p)
    }

    return [...new Set(alt)]
  }

  // Try extensions for extensionless imports.
  const candidates = []
  for (const ext of RESOLVE_EXTENSIONS) {
    const p = absBaseOrFile + ext
    if (existsFile(p)) candidates.push(p)
  }

  // Try index resolution for directory imports.
  for (const ext of RESOLVE_EXTENSIONS) {
    const p = path.join(absBaseOrFile, 'index' + ext)
    if (existsFile(p)) candidates.push(p)
  }

  // Also try extensionless exact file (rare).
  if (existsFile(absBaseOrFile)) candidates.push(absBaseOrFile)

  return [...new Set(candidates)]
}

function extractSpecifiers(text) {
  const specs = []
  // import 'package'
  for (const m of text.matchAll(/import\s+['"]([^'"]+)['"]/g)) specs.push(m[1])
  // import X from 'package'
  for (const m of text.matchAll(/import\s+[^'"]+?\s+from\s+['"]([^'"]+)['"]/g)) specs.push(m[1])
  // require('package')
  for (const m of text.matchAll(/require\s*\(\s*['"]([^'"]+)['"]\s*\)/g)) specs.push(m[1])
  // import('package')
  for (const m of text.matchAll(/import\s*\(\s*['"]([^'"]+)['"]\s*\)/g)) specs.push(m[1])

  // CSS url(...)
  for (const m of text.matchAll(/url\(\s*['"]?([^'")]+)['"]?\s*\)/g)) specs.push(m[1])

  // HTML/Vue attributes src/href="/..."
  for (const m of text.matchAll(/\b(?:src|href)\s*=\s*['"]([^'"]+)['"]/g)) specs.push(m[1])

  return specs
}

function isInScanRoots(absPath) {
  return SCAN_ROOTS.some((r) => {
    const rel = path.relative(r, absPath)
    return rel && !rel.startsWith('..') && !path.isAbsolute(rel)
  })
}

// Build universe of files we consider movable.
const universe = []
for (const root of SCAN_ROOTS) {
  for (const f of walkFiles(root)) {
    const ext = path.extname(f).toLowerCase()
    if (ext === '.d.ts') continue
    if (!MOVABLE_EXTENSIONS.has(ext) && ext !== '') continue
    // Some files (like .env) can have no ext; we skip outside scan roots anyway.
    universe.push(f)
  }
}

const universeSet = new Set(universe)

const queue = []
const processed = new Set()
const reachable = new Set()

function seedForProcessing(filePath) {
  const abs = path.resolve(filePath)
  if (processed.has(abs)) return
  processed.add(abs)
  queue.push(abs)
  // Only mark “reachable” for movable files; non-movable entries like index.html are processed
  // just to extract asset/module references.
  if (universeSet.has(abs)) reachable.add(abs)
}

// Seed BFS.
if (existsFile(FRONTEND_ENTRY)) seedForProcessing(FRONTEND_ENTRY)
if (existsFile(BACKEND_ENTRY)) seedForProcessing(BACKEND_ENTRY)
if (existsFile(FRONTEND_HTML_ENTRY)) seedForProcessing(FRONTEND_HTML_ENTRY)

while (queue.length) {
  const current = queue.shift()
  const ext = path.extname(current).toLowerCase()

  let text = null
  if (READABLE_TEXT_EXTENSIONS.has(ext) || ext === '.d.ts') {
    try {
      text = fs.readFileSync(current, 'utf8')
    } catch {
      text = null
    }
  }
  if (!text) continue

  const specs = extractSpecifiers(text)
  for (const spec of specs) {
    // ignore data: and http(s): assets
    if (spec.startsWith('data:')) continue
    if (spec.startsWith('http://') || spec.startsWith('https://')) continue

    const resolved = resolveImport(spec, current)
    for (const r of resolved) {
      if (!universeSet.has(r)) continue
      if (!reachable.has(r)) reachable.add(r)
      // Traverse further dependencies for any reachable “movable” module.
      seedForProcessing(r)
    }
  }
}

const unused = universe.filter((f) => !reachable.has(f))

// Sort output for determinism.
unused.sort((a, b) => normalizeToProjectRelative(a).localeCompare(normalizeToProjectRelative(b)))
const reachableArr = Array.from(reachable).sort((a, b) =>
  normalizeToProjectRelative(a).localeCompare(normalizeToProjectRelative(b))
)

const report = {
  projectRoot: normalizeToProjectRelative(projectRoot),
  scanRoots: SCAN_ROOTS.map(normalizeToProjectRelative),
  entrypoints: [
    normalizeToProjectRelative(FRONTEND_ENTRY),
    normalizeToProjectRelative(BACKEND_ENTRY),
    existsFile(FRONTEND_HTML_ENTRY) ? normalizeToProjectRelative(FRONTEND_HTML_ENTRY) : null,
  ].filter(Boolean),
  universeCount: universe.length,
  reachableCount: reachableArr.length,
  unusedCount: unused.length,
  // Save full list for the next “move into disabledon” step.
  unusedFiles: unused.map(normalizeToProjectRelative),
}

const reportPath = path.join(projectRoot, 'scripts', 'unused-files-report.json')
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8')

console.log(JSON.stringify({ universeCount: report.universeCount, reachableCount: report.reachableCount, unusedCount: report.unusedCount }, null, 2))
console.log('')
console.log('Sample unused files (first 50):')
for (const f of unused.slice(0, 50)) {
  console.log(' - ' + normalizeToProjectRelative(f))
}
console.log('')
console.log(`Full report: ${normalizeToProjectRelative(reportPath)}`)

