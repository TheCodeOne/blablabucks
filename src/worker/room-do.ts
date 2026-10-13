import { DurableObject } from 'cloudflare:workers'
import {
  type Buzzword,
  isValidBuzzword,
  sanitizeBuzzwordText,
  shouldIncrementTally,
} from '@/domain/buzzword'
import { DEFAULT_CATEGORIES, type Category, type Headcounts } from '@/domain/categories'
import { IDLE_SESSION, type Session } from '@/domain/session'
import type {
  ClientMessage,
  ClientRole,
  RoomStateSnapshot,
  ServerMessage,
  SocketAttachment,
} from './types'

const ROOM_TTL_MS = 24 * 60 * 60 * 1000

export class RoomDO extends DurableObject {
  private resetAlarm() {
    this.ctx.storage.setAlarm(Date.now() + ROOM_TTL_MS)
  }

  private broadcast(msg: ServerMessage) {
    const payload = JSON.stringify(msg)
    for (const socket of this.ctx.getWebSockets()) {
      try {
        socket.send(payload)
      } catch {
        // socket could be closing
      }
    }
  }

  private broadcastPresence() {
    const participants: string[] = []
    let count = 0
    for (const socket of this.ctx.getWebSockets()) {
      count++
      try {
        const attachment = socket.deserializeAttachment() as SocketAttachment | null
        if (attachment?.userName) {
          participants.push(attachment.userName)
        }
      } catch {
        // ignore
      }
    }
    this.broadcast({
      type: 'presence_updated',
      count,
      participants,
    })
  }

  private async getSnapshot(): Promise<RoomStateSnapshot> {
    const slug = (await this.ctx.storage.get<string>('slug')) || ''
    const session = (await this.ctx.storage.get<Session>('session')) || IDLE_SESSION
    const categories = (await this.ctx.storage.get<Category[]>('categories')) || DEFAULT_CATEGORIES
    const headcounts = (await this.ctx.storage.get<Headcounts>('headcounts')) || {}
    const buzzwords = (await this.ctx.storage.get<Buzzword[]>('buzzwords')) || []
    const buzzwordsEnabled = (await this.ctx.storage.get<boolean>('buzzwordsEnabled')) ?? true

    return {
      slug,
      session,
      categories,
      headcounts,
      buzzwords,
      buzzwordsEnabled,
    }
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url)

    if (request.method === 'POST' && url.pathname === '/init') {
      const data = (await request.json()) as {
        slug: string
        hostToken: string
        session: Session
        categories: Category[]
        headcounts: Headcounts
        buzzwordsEnabled?: boolean
      }

      await this.ctx.storage.put({
        slug: data.slug,
        hostToken: data.hostToken,
        session: data.session,
        categories: data.categories,
        headcounts: data.headcounts,
        buzzwords: [],
        buzzwordsEnabled: data.buzzwordsEnabled ?? true,
        createdAt: Date.now(),
        lastActiveAt: Date.now(),
      })

      this.resetAlarm()
      return Response.json({ ok: true, slug: data.slug })
    }

    if (url.pathname === '/snapshot') {
      const storedSlug = await this.ctx.storage.get<string>('slug')
      if (!storedSlug) return new Response('Room not found', { status: 404 })
      const snapshot = await this.getSnapshot()
      return Response.json(snapshot)
    }

    if (url.pathname === '/websocket') {
      const storedSlug = await this.ctx.storage.get<string>('slug')
      if (!storedSlug) return new Response('Room not found', { status: 404 })

      if (request.headers.get('Upgrade') !== 'websocket') {
        return new Response('Expected WebSocket upgrade', { status: 426 })
      }

      const storedHostToken = await this.ctx.storage.get<string>('hostToken')
      const token = url.searchParams.get('token')
      const role: ClientRole =
        Boolean(storedHostToken) && token === storedHostToken ? 'host' : 'viewer'

      const pair = new WebSocketPair()
      const client = pair[0]
      const server = pair[1]

      const initialUserName = url.searchParams.get('userName') || undefined

      this.ctx.acceptWebSocket(server)
      server.serializeAttachment({ role, userName: initialUserName } satisfies SocketAttachment)

      this.resetAlarm()

      const snapshot = await this.getSnapshot()
      server.send(JSON.stringify({ type: 'init', role, state: snapshot }))

      this.broadcastPresence()

      return new Response(null, { status: 101, webSocket: client })
    }

    return new Response('Not Found', { status: 404 })
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer) {
    if (typeof message !== 'string') return

    try {
      const data = JSON.parse(message) as ClientMessage
      const attachment = ws.deserializeAttachment() as SocketAttachment | null
      const role = attachment?.role ?? 'viewer'

      if (data.type === 'sync_session') {
        if (role !== 'host') {
          ws.send(JSON.stringify({ type: 'error', message: 'Unauthorized: host role required' }))
          return
        }

        await this.ctx.storage.put({
          session: data.session,
          categories: data.categories,
          headcounts: data.headcounts,
          lastActiveAt: Date.now(),
        })

        this.resetAlarm()

        this.broadcast({
          type: 'session_updated',
          session: data.session,
          categories: data.categories,
          headcounts: data.headcounts,
        })
        return
      }

      if (data.type === 'add_buzzword') {
        const text = sanitizeBuzzwordText(data.text)
        const buzzwords = (await this.ctx.storage.get<Buzzword[]>('buzzwords')) || []

        if (!isValidBuzzword(text, buzzwords)) {
          ws.send(JSON.stringify({ type: 'error', message: 'Invalid or duplicate buzzword' }))
          return
        }

        const newWord: Buzzword = {
          id: crypto.randomUUID(),
          text,
          count: 0,
        }

        buzzwords.push(newWord)
        await this.ctx.storage.put('buzzwords', buzzwords)
        this.resetAlarm()

        this.broadcast({
          type: 'buzzwords_updated',
          buzzwords,
        })
        return
      }

      if (data.type === 'delete_buzzword') {
        if (role !== 'host') {
          ws.send(
            JSON.stringify({
              type: 'error',
              message: 'Unauthorized: only host can delete buzzwords',
            }),
          )
          return
        }

        let buzzwords = (await this.ctx.storage.get<Buzzword[]>('buzzwords')) || []
        buzzwords = buzzwords.filter((w) => w.id !== data.id)

        await this.ctx.storage.put('buzzwords', buzzwords)
        this.resetAlarm()

        this.broadcast({
          type: 'buzzwords_updated',
          buzzwords,
        })
        return
      }

      if (data.type === 'tap_buzzword') {
        const buzzwords = (await this.ctx.storage.get<Buzzword[]>('buzzwords')) || []
        const word = buzzwords.find((w) => w.id === data.id)
        if (!word) return

        const now = Date.now()
        const shouldIncrement = shouldIncrementTally(word.lastTalliedAt, now)

        if (shouldIncrement) {
          word.count += 1
          word.lastTalliedAt = now
          await this.ctx.storage.put('buzzwords', buzzwords)
          this.broadcast({
            type: 'buzzwords_updated',
            buzzwords,
          })
        }

        this.resetAlarm()

        this.broadcast({
          type: 'buzzword_reaction',
          id: word.id,
          text: word.text,
          userName: data.userName || 'Anonymous',
        })
        return
      }

      if (data.type === 'toggle_buzzwords') {
        if (role !== 'host') {
          ws.send(
            JSON.stringify({
              type: 'error',
              message: 'Unauthorized: only host can toggle buzzwords',
            }),
          )
          return
        }

        await this.ctx.storage.put('buzzwordsEnabled', data.enabled)
        this.resetAlarm()

        this.broadcast({
          type: 'buzzwords_toggled',
          enabled: data.enabled,
        })
        return
      }

      if (data.type === 'set_presence') {
        const attachment = ws.deserializeAttachment() as SocketAttachment | null
        const updated: SocketAttachment = {
          role: attachment?.role ?? 'viewer',
          userName: data.userName.trim().slice(0, 24),
        }
        ws.serializeAttachment(updated)
        this.broadcastPresence()
        return
      }
    } catch {
      ws.send(JSON.stringify({ type: 'error', message: 'Malformed JSON message' }))
    }
  }

  async webSocketClose(ws: WebSocket) {
    try {
      ws.close()
    } catch {
      // ignore
    }
    this.broadcastPresence()
  }

  async webSocketError(ws: WebSocket) {
    try {
      ws.close()
    } catch {
      // ignore
    }
    this.broadcastPresence()
  }

  async alarm() {
    for (const socket of this.ctx.getWebSockets()) {
      try {
        socket.close(1000, 'Room expired')
      } catch {
        // ignore
      }
    }
    await this.ctx.storage.deleteAll()
  }
}
