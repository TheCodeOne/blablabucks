export const CATEGORY_IDS = [
  'manager',
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
  { id: 'manager', label: 'Manager', shortLabel: 'Manager', defaultRate: 120 },
  { id: 'internalDev', label: 'Int. Dev', shortLabel: 'Int. Dev', defaultRate: 85 },
  { id: 'externalDev', label: 'Ext. Dev', shortLabel: 'Ext. Dev', defaultRate: 120 },
  { id: 'nearshoringDev', label: 'Nearshore', shortLabel: 'Nearshore', defaultRate: 45 },
  { id: 'internalNonDev', label: 'Int. Non-Dev', shortLabel: 'Int. Non-Dev', defaultRate: 75 },
  { id: 'externalNonDev', label: 'Ext. Non-Dev', shortLabel: 'Ext. Non-Dev', defaultRate: 120 },
]

export type Rates = Record<CategoryId, number>
export type Headcounts = Record<CategoryId, number>

export const DEFAULT_RATES: Rates = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c.defaultRate]),
) as Rates

export const EMPTY_HEADCOUNTS: Headcounts = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, 0]),
) as Headcounts
