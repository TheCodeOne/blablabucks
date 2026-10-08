import { useCallback, useState } from 'react'

/**
 * useState backed by localStorage. `sanitize` repairs/validates whatever was stored
 * (old shapes, hand-edited values) so a bad entry can never crash the app.
 */
export function usePersistentState<T>(
  key: string,
  fallback: T,
  sanitize: (raw: unknown) => T = (raw) => raw as T,
  options?: { override?: T; readOnly?: boolean },
) {
  const [value, setValue] = useState<T>(() => {
    if (options?.override !== undefined) return options.override

    try {
      const raw = localStorage.getItem(key)
      return raw === null ? fallback : sanitize(JSON.parse(raw))
    } catch {
      return fallback
    }
  })

  const set = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const resolved = typeof next === 'function' ? (next as (p: T) => T)(prev) : next
        if (!options?.readOnly) {
          try {
            localStorage.setItem(key, JSON.stringify(resolved))
          } catch {
            // Storage full or disabled: keep working in-memory.
          }
        }
        return resolved
      })
    },
    [key, options?.readOnly],
  )

  return [value, set] as const
}
