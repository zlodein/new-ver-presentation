import dotenv from 'dotenv'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { buildApp } from './app.js'

// Загружаем .env из папки server/, а не из cwd (важно для PM2 и запуска из другой директории)
const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: join(__dirname, '..', '.env') })

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

main()
