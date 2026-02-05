import Fastify from 'fastify'
import cors from '@fastify/cors'
import fjwt from '@fastify/jwt'
import { authRoutes } from './routes/auth.js'
import { presentationRoutes } from './routes/presentations.js'
import { editorApiRoutes } from './routes/editor-api.js'

export async function buildApp() {
  const app = Fastify({ logger: true })

  const secret = process.env.JWT_SECRET
  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET must be set and at least 32 characters')
  }

  await app.register(cors, {
    origin: true,
    credentials: true,
  })

  await app.register(fjwt, { secret })

  app.decorate('authenticate', async function (req: { jwtVerify: () => Promise<unknown> }, reply: { status: (code: number) => { send: (payload: unknown) => void } }) {
    try {
      await req.jwtVerify()
    } catch {
      return reply.status(401).send({ error: 'Недействительный или отсутствующий токен' })
    }
  })

  await app.register(authRoutes, { prefix: '/' })
  await app.register(presentationRoutes, { prefix: '/' })
  await app.register(editorApiRoutes, { prefix: '/api' })

  return app
}
