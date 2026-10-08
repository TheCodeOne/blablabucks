export const CATEGORY_IDS = [
  'internalDev',
  'externalDev',
  'nearshoringDev',
  'internalNonDev',
  'externalNonDev',
] as const

export type CategoryId = (typeof CATEGORY_IDS)[number]

export type Category = {
  id: CategoryId
  label: string
  shortLabel: string
  defaultRate: number
}

/** Rates are hourly costs in EUR. Defaults are rough DACH market guesses; users override them in the Settings Modal. */
export const CATEGORIES: readonly Category[] = [
  { id: 'internalDev', label: 'Internal Dev', shortLabel: 'Int. Dev', defaultRate: 75 },
  { id: 'externalDev', label: 'External Dev', shortLabel: 'Ext. Dev', defaultRate: 110 },
  { id: 'nearshoringDev', label: 'NearShoring Dev', shortLabel: 'Nearshore', defaultRate: 50 },
  { id: 'internalNonDev', label: 'Internal Non-Dev', shortLabel: 'Int. Non-Dev', defaultRate: 65 },
  { id: 'externalNonDev', label: 'External Non-Dev', shortLabel: 'Ext. Non-Dev', defaultRate: 120 },
]

export type Rates = Record<CategoryId, number>
export type Headcounts = Record<CategoryId, number>

export const DEFAULT_RATES: Rates = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c.defaultRate]),
) as Rates

export const EMPTY_HEADCOUNTS: Headcounts = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, 0]),
) as Headcounts
