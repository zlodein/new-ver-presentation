import dotenv from 'dotenv'
import { fileURLToPath } from 'node:url'
import { basename, dirname, join } from 'node:path'
import { buildApp } from './app.js'

// Загружаем .env из папки server/ (при запуске из server/src или server/dist)
const __dirname = dirname(fileURLToPath(import.meta.url))
const serverDir =
  basename(__dirname) === 'dist' || basename(__dirname) === 'src'
    ? join(__dirname, '..')
    : __dirname
dotenv.config({ path: join(serverDir, '.env') })

const PORT = Number(process.env.PORT) || 3001

async function main() {
  const app = await buildApp()
  try {
    await app.listen({ port: PORT, host: '0.0.0.0' })
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

main().catch((err) => {
  console.error('Server failed to start:', err)
  process.exit(1)
})
