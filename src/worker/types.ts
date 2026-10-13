import type { Category, Headcounts } from '@/domain/categories'
import type { Session } from '@/domain/session'
import type { Buzzword } from '@/domain/buzzword'

export type ClientRole = 'host' | 'viewer'

export type RoomStateSnapshot = {
  slug: string
  session: Session
  categories: Category[]
  headcounts: Headcounts
  buzzwords: Buzzword[]
  buzzwordsEnabled: boolean
}

export type ClientMessage =
  | {
      type: 'sync_session'
      session: Session
      categories: Category[]
      headcounts: Headcounts
    }
  | {
      type: 'add_buzzword'
      text: string
    }
  | {
      type: 'delete_buzzword'
      id: string
    }
  | {
      type: 'tap_buzzword'
      id: string
      userName?: string
    }
  | {
      type: 'toggle_buzzwords'
      enabled: boolean
    }
  | {
      type: 'set_presence'
      userName: string
    }

export type ServerMessage =
  | {
      type: 'init'
      role: ClientRole
      state: RoomStateSnapshot
    }
  | {
      type: 'session_updated'
      session: Session
      categories: Category[]
      headcounts: Headcounts
    }
  | {
      type: 'buzzwords_updated'
      buzzwords: Buzzword[]
    }
  | {
      type: 'buzzwords_toggled'
      enabled: boolean
    }
  | {
      type: 'buzzword_reaction'
      id: string
      text: string
      userName: string
    }
  | {
      type: 'presence_updated'
      count: number
      participants: string[]
    }
  | {
      type: 'error'
      message: string
    }

export type SocketAttachment = {
  role: ClientRole
  userName?: string
}
