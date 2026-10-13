import type React from 'react'
import { BriefcaseIcon, CodeIcon, GlobeIcon, LaptopIcon, UserIcon, UsersIcon } from 'lucide-react'
import type { CategoryIcon } from '@/domain/categories'

export const CATEGORY_ICONS: Record<CategoryIcon, React.ElementType> = {
  briefcase: BriefcaseIcon,
  code: CodeIcon,
  user: UserIcon,
  users: UsersIcon,
  globe: GlobeIcon,
  laptop: LaptopIcon,
}
