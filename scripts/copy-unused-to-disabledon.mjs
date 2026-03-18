import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..')

const reportPath = path.join(projectRoot, 'scripts', 'unused-files-report.json')
const disabledRoot = path.join(projectRoot, 'disabledon')

function existsFile(p) {
  try {
    return fs.existsSync(p) && fs.statSync(p).isFile()
  } catch {
    return false
  }
}

const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'))
const unusedFiles = Array.isArray(report.unusedFiles) ? report.unusedFiles : []

let copied = 0
let skipped = 0
let failed = 0

for (const rel of unusedFiles) {
  const src = path.join(projectRoot, ...rel.split('/'))
  if (!existsFile(src)) {
    console.warn(`[skip-missing] ${rel}`)
    skipped++
    continue
  }

  const dest = path.join(disabledRoot, ...rel.split('/'))
  const destDir = path.dirname(dest)
  fs.mkdirSync(destDir, { recursive: true })

  // Copy only if it doesn't exist yet.
  if (existsFile(dest)) {
    skipped++
    continue
  }

  try {
    fs.copyFileSync(src, dest)
    copied++
  } catch (e) {
    failed++
    console.error(`[failed] ${rel}:`, e?.message || e)
  }
}

console.log(JSON.stringify({ unusedCount: unusedFiles.length, copied, skipped, failed, disabledRoot }, null, 2))

