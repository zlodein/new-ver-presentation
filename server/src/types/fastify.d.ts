/* eslint-disable @typescript-eslint/no-unused-vars -- FastifyRequest используется в типе authenticate */
import type { FastifyRequest } from 'fastify'

declare module 'fastify' {
  interface FastifyInstance {
    jwt: { sign: (payload: object, options?: { expiresIn?: string }) => string }
    authenticate: (req: FastifyRequest, reply: import('fastify').FastifyReply) => Promise<void>
  }
  interface FastifyRequest {
    user?: { sub: string; email?: string }
  }
}
