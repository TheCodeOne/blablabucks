import dayjs from 'dayjs'
import duration from 'dayjs/plugin/duration'

dayjs.extend(duration)

const eur = new Intl.NumberFormat('de-DE', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const eurWhole = new Intl.NumberFormat('de-DE', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
})

/** Splits a cost into "1.234,56" and the sub-cent digit so the Taxameter can render the tail smaller. */
export function formatTaxameter(cost: number): { main: string; tail: string } {
  const safe = Math.max(0, cost)
  const main = eur.format(Math.floor(safe * 100) / 100)
  const tail = String(Math.floor(safe * 1000) % 10)
  return { main, tail }
}

export function formatRate(perHour: number): string {
  return eurWhole.format(perHour)
}

const eurCents = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' })

export function formatMoney(amount: number): string {
  return eurCents.format(amount)
}

export function formatElapsed(ms: number): string {
  return dayjs.duration(Math.max(0, ms)).format('HH:mm:ss')
}
