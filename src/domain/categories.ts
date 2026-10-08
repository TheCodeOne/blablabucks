export type CategoryId = string

export type CategoryIcon = 'briefcase' | 'code' | 'user' | 'users' | 'globe' | 'laptop'

export type Category = {
  id: CategoryId
  label: string
  icon: CategoryIcon
  rate: number
}

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'manager', label: 'Manager', icon: 'briefcase', rate: 120 },
  { id: 'dev', label: 'Dev', icon: 'code', rate: 85 },
  { id: 'po', label: 'PO', icon: 'user', rate: 95 },
  { id: 'scrummaster', label: 'Scrum Master', icon: 'users', rate: 90 },
]

export type Headcounts = Record<CategoryId, number>
