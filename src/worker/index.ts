import { generateRoomSlug } from './slug'
import { RoomDO } from './room-do'

export { RoomDO }

export interface Env {
  ROOM_DO: DurableObjectNamespace<RoomDO>
  ASSETS?: Fetcher
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)

    // POST /api/room -> Create room
    if (request.method === 'POST' && url.pathname === '/api/room') {
      try {
        const body = (await request.json()) as Record<string, unknown>
        const slug = generateRoomSlug()
        const hostToken = crypto.randomUUID()

        const id = env.ROOM_DO.idFromName(slug)
        const stub = env.ROOM_DO.get(id)

        const initRes = await stub.fetch('http://do/init', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            slug,
            hostToken,
            ...body,
          }),
        })

        if (!initRes.ok) {
          return new Response('Failed to initialize room', { status: 500 })
        }

        return Response.json({ slug, hostToken })
      } catch {
        return new Response('Invalid request body', { status: 400 })
      }
    }

    // GET /api/room/:slug/websocket -> Connect to DO websocket
    const wsMatch = url.pathname.match(/^\/api\/room\/([^/]+)\/websocket$/)
    if (wsMatch) {
      const slug = wsMatch[1]
      const id = env.ROOM_DO.idFromName(slug)
      const stub = env.ROOM_DO.get(id)
      return stub.fetch(new Request(`http://do/websocket${url.search}`, request))
    }

    // GET /api/room/:slug -> Get room snapshot
    const snapshotMatch = url.pathname.match(/^\/api\/room\/([^/]+)$/)
    if (snapshotMatch && request.method === 'GET') {
      const slug = snapshotMatch[1]
      const id = env.ROOM_DO.idFromName(slug)
      const stub = env.ROOM_DO.get(id)
      return stub.fetch('http://do/snapshot')
    }

    // Serve static assets if in production/preview worker environment
    if (env.ASSETS) {
      return env.ASSETS.fetch(request)
    }

    return new Response('Not Found', { status: 404 })
  },
}
