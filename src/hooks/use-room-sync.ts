import { useEffect, useRef, useState, useCallback } from 'react'
import type { Buzzword } from '@/domain/buzzword'
import type { Category, Headcounts } from '@/domain/categories'
import type { Session } from '@/domain/session'
import type { ClientMessage, ClientRole, RoomStateSnapshot, ServerMessage } from '@/worker/types'

type UseRoomSyncOptions = {
  slug?: string | null
  hostToken?: string | null
  userName?: string
  onSessionUpdated?: (update: {
    session: Session
    categories: Category[]
    headcounts: Headcounts
  }) => void
  onReaction?: (reaction: { id: string; text: string; userName: string }) => void
}

export function useRoomSync({
  slug,
  hostToken,
  userName,
  onSessionUpdated,
  onReaction,
}: UseRoomSyncOptions) {
  const [role, setRole] = useState<ClientRole | null>(null)
  const [connected, setConnected] = useState(false)
  const [presenceCount, setPresenceCount] = useState(1)
  const [participants, setParticipants] = useState<string[]>([])
  const [initialState, setInitialState] = useState<RoomStateSnapshot | null>(null)
  const [buzzwords, setBuzzwords] = useState<Buzzword[]>([])
  const [buzzwordsEnabled, setBuzzwordsEnabled] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<number | null>(null)

  const onSessionUpdatedRef = useRef(onSessionUpdated)
  useEffect(() => {
    onSessionUpdatedRef.current = onSessionUpdated
  }, [onSessionUpdated])

  const onReactionRef = useRef(onReaction)
  useEffect(() => {
    onReactionRef.current = onReaction
  }, [onReaction])

  const userNameRef = useRef(userName)
  useEffect(() => {
    userNameRef.current = userName
  }, [userName])

  useEffect(() => {
    if (!slug) return

    let unmounted = false

    const connect = () => {
      if (unmounted || !slug) return

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const tokenQuery = hostToken ? `token=${encodeURIComponent(hostToken)}` : ''
      const nameQuery = userNameRef.current
        ? `userName=${encodeURIComponent(userNameRef.current)}`
        : ''
      const queryString = [tokenQuery, nameQuery].filter(Boolean).join('&')
      const wsUrl = `${protocol}//${window.location.host}/api/room/${slug}/websocket${queryString ? `?${queryString}` : ''}`

      const ws = new WebSocket(wsUrl)
      wsRef.current = ws

      ws.onopen = () => {
        if (unmounted) return
        setConnected(true)
        setError(null)
      }

      ws.onmessage = (event) => {
        if (unmounted) return
        try {
          const msg = JSON.parse(event.data) as ServerMessage
          if (msg.type === 'init') {
            setRole(msg.role)
            setInitialState(msg.state)
            setBuzzwords(msg.state.buzzwords || [])
            setBuzzwordsEnabled(msg.state.buzzwordsEnabled ?? true)
          } else if (msg.type === 'session_updated') {
            onSessionUpdatedRef.current?.({
              session: msg.session,
              categories: msg.categories,
              headcounts: msg.headcounts,
            })
          } else if (msg.type === 'buzzwords_updated') {
            setBuzzwords(msg.buzzwords)
          } else if (msg.type === 'buzzwords_toggled') {
            setBuzzwordsEnabled(msg.enabled)
          } else if (msg.type === 'buzzword_reaction') {
            onReactionRef.current?.(msg)
          } else if (msg.type === 'presence_updated') {
            setPresenceCount(msg.count)
            setParticipants(msg.participants)
          } else if (msg.type === 'error') {
            console.error('Room error:', msg.message)
          }
        } catch (e) {
          console.error('Failed to parse websocket message', e)
        }
      }

      ws.onclose = (event) => {
        if (unmounted) return
        setConnected(false)
        wsRef.current = null

        if (event.code === 4404 || event.reason === 'Room expired') {
          setError('Room expired or not found.')
          return
        }

        reconnectTimeoutRef.current = window.setTimeout(connect, 2000)
      }

      ws.onerror = () => {
        if (unmounted) return
        setConnected(false)
      }
    }

    connect()

    return () => {
      unmounted = true
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }
    }
  }, [slug, hostToken])

  const sendMessage = useCallback((msg: ClientMessage) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg))
    }
  }, [])

  useEffect(() => {
    if (connected && userName) {
      sendMessage({
        type: 'set_presence',
        userName,
      })
    }
  }, [connected, userName, sendMessage])

  const syncSession = useCallback(
    (session: Session, categories: Category[], headcounts: Headcounts) => {
      sendMessage({
        type: 'sync_session',
        session,
        categories,
        headcounts,
      })
    },
    [sendMessage],
  )

  const addBuzzword = useCallback(
    (text: string) => {
      sendMessage({
        type: 'add_buzzword',
        text,
      })
    },
    [sendMessage],
  )

  const deleteBuzzword = useCallback(
    (id: string) => {
      sendMessage({
        type: 'delete_buzzword',
        id,
      })
    },
    [sendMessage],
  )

  const tapBuzzword = useCallback(
    (id: string, name?: string) => {
      sendMessage({
        type: 'tap_buzzword',
        id,
        userName: name || userName,
      })
    },
    [sendMessage, userName],
  )

  const toggleBuzzwords = useCallback(
    (enabled: boolean) => {
      sendMessage({
        type: 'toggle_buzzwords',
        enabled,
      })
    },
    [sendMessage],
  )

  return {
    role,
    connected,
    presenceCount,
    participants,
    initialState,
    buzzwords,
    buzzwordsEnabled,
    error,
    syncSession,
    addBuzzword,
    deleteBuzzword,
    tapBuzzword,
    toggleBuzzwords,
  }
}
