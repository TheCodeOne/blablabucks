import { DurableObject } from 'cloudflare:workers'
import {
  type Buzzword,
  isValidBuzzword,
  sanitizeBuzzwordText,
  shouldIncrementTally,
} from '@/domain/buzzword'
import { DEFAULT_CATEGORIES, type Category, type Headcounts } from '@/domain/categories'
import { IDLE_SESSION, type Session } from '@/domain/session'
import { resolveUniqueParticipantName, sanitizeParticipantName } from '@/domain/participant'
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

  private getActiveSockets(excludeSocket?: WebSocket): {
    socket: WebSocket
    clientId: string
    role: ClientRole
    userName?: string
  }[] {
    const active: {
      socket: WebSocket
      clientId: string
      role: ClientRole
      userName?: string
    }[] = []
    const seenClients = new Set<string>()

    const sockets = this.ctx.getWebSockets()
    // Iterate in reverse (newest sockets first)
    for (let i = sockets.length - 1; i >= 0; i--) {
      const socket = sockets[i]
      if (socket === excludeSocket) continue
      // Cloudflare Workers WebSocket readyState: 1 is WebSocket.OPEN
      if (socket.readyState !== 1) continue

      try {
        const attachment = socket.deserializeAttachment() as SocketAttachment | null
        if (!attachment) continue

        const clientId = attachment.clientId || ''
        const clientKey = attachment.role === 'host' ? 'role:host' : `client:${clientId}`

        if (seenClients.has(clientKey)) {
          try {
            socket.close(1000, 'Duplicate client connection')
          } catch {
            // ignore
          }
          continue
        }

        seenClients.add(clientKey)
        active.push({
          socket,
          clientId,
          role: attachment.role,
          userName: attachment.userName,
        })
      } catch {
        // ignore
      }
    }
    return active
  }

  private broadcast(msg: ServerMessage, excludeSocket?: WebSocket) {
    const payload = JSON.stringify(msg)
    for (const socket of this.ctx.getWebSockets()) {
      if (socket === excludeSocket) continue
      if (socket.readyState !== 1) continue
      try {
        socket.send(payload)
      } catch {
        // socket could be closing
      }
    }
  }

  private broadcastPresence(excludeSocket?: WebSocket) {
    const active = this.getActiveSockets(excludeSocket)
    const participants: string[] = []
    const seen = new Set<string>()

    for (const item of active) {
      if (item.userName) {
        const lower = item.userName.toLowerCase()
        if (!seen.has(lower)) {
          seen.add(lower)
          participants.push(item.userName)
        }
      }
    }

    const count = participants.length

    this.broadcast(
      {
        type: 'presence_updated',
        count,
        participants,
      },
      excludeSocket,
    )
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

      const clientId = url.searchParams.get('clientId') || crypto.randomUUID()

      // Close previous socket for same host / client so reconnecting tabs don't inflate presence
      for (const socket of this.ctx.getWebSockets()) {
        try {
          const attachment = socket.deserializeAttachment() as SocketAttachment | null
          if (!attachment) continue
          const isSameClient =
            (role === 'host' && attachment.role === 'host') ||
            (Boolean(clientId) && attachment.clientId === clientId)

          if (isSameClient) {
            try {
              socket.close(1000, 'Replaced by new connection')
            } catch {
              // ignore
            }
          }
        } catch {
          // ignore
        }
      }

      const pair = new WebSocketPair()
      const client = pair[0]
      const server = pair[1]

      const active = this.getActiveSockets()
      const takenNames = active
        .filter((a) => (role === 'host' ? a.role !== 'host' : a.clientId !== clientId))
        .map((a) => a.userName)
        .filter((n): n is string => Boolean(n))

      const requestedName = url.searchParams.get('userName')
      const assignedName = resolveUniqueParticipantName(requestedName, takenNames)

      this.ctx.acceptWebSocket(server)
      server.serializeAttachment({
        role,
        clientId,
        userName: assignedName,
      } satisfies SocketAttachment)

      this.resetAlarm()

      const snapshot = await this.getSnapshot()
      server.send(JSON.stringify({ type: 'init', role, userName: assignedName, state: snapshot }))

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
        const targetName = sanitizeParticipantName(data.userName)
        if (!targetName) {
          ws.send(JSON.stringify({ type: 'error', message: 'Name cannot be empty' }))
          return
        }

        const active = this.getActiveSockets()
        const isTaken = active.some((a) => {
          if (a.socket === ws) return false
          if (role === 'host' && a.role === 'host') return false
          if (attachment?.clientId && a.clientId === attachment.clientId) return false
          return a.userName?.toLowerCase() === targetName.toLowerCase()
        })

        if (isTaken) {
          ws.send(
            JSON.stringify({
              type: 'error',
              message: `The name "${targetName}" is already taken in this room.`,
            }),
          )
          return
        }

        const attachment = ws.deserializeAttachment() as SocketAttachment | null
        const updated: SocketAttachment = {
          role: attachment?.role ?? 'viewer',
          clientId: attachment?.clientId ?? '',
          userName: targetName,
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
    this.broadcastPresence(ws)
  }

  async webSocketError(ws: WebSocket) {
    try {
      ws.close()
    } catch {
      // ignore
    }
    this.broadcastPresence(ws)
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
