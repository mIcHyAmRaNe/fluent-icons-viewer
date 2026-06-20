import { signal, computed } from '@preact/signals'

export interface IconData {
  name: string
  componentName: string
  svgFileName: string
}

export type TabType = 'filled' | 'outlined'

const savedFavs = typeof localStorage !== 'undefined' ? localStorage.getItem('favorites') : null
let initialFavs: IconData[] = []
if (savedFavs) {
  try { initialFavs = JSON.parse(savedFavs) } catch {}
}

const savedTheme = typeof localStorage !== 'undefined' ? localStorage.getItem('theme') : null
const prefersDark = typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
const initialTheme: 'light' | 'dark' = savedTheme === 'dark' || (!savedTheme && prefersDark) ? 'dark' : 'light'

export const currentTab = signal<TabType>('filled')
export const searchQuery = signal('')
export const selectedIcon = signal<IconData | null>(null)
export const favorites = signal<IconData[]>(initialFavs)
export const theme = signal<'light' | 'dark'>(initialTheme)
export const favoriteSidebarOpen = signal(true)
export const elementsToShow = signal(48)

export const favoritesList = computed(() => favorites.value)

export function isAFavorite(componentName: string): boolean {
  return favorites.value.some(ic => ic.componentName === componentName)
}

export function favoriteIcon(payload: IconData) {
  if (!isAFavorite(payload.componentName)) {
    favorites.value = [...favorites.value, payload]
    saveFavorites()
  }
}

export function unFavoriteIcon(payload: IconData) {
  favorites.value = favorites.value.filter(item => item.componentName !== payload.componentName)
  saveFavorites()
}

export function removeFavorites(indices: number[]) {
  const sorted = [...indices].sort((a, b) => b - a)
  const updated = [...favorites.value]
  for (const i of sorted) {
    updated.splice(i, 1)
  }
  favorites.value = updated
  saveFavorites()
}

export function clearFavorites() {
  favorites.value = []
  saveFavorites()
}

export function setTheme(t: 'light' | 'dark') {
  theme.value = t
  localStorage.setItem('theme', t)
  if (t === 'dark') {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
}

export function toggleTheme() {
  setTheme(theme.value === 'light' ? 'dark' : 'light')
}

export function toggleFavoriteSidebar() {
  favoriteSidebarOpen.value = !favoriteSidebarOpen.value
}

export function setTab(tab: TabType) {
  currentTab.value = tab
  elementsToShow.value = 48
  selectedIcon.value = switchVariant(selectedIcon.value, tab)
}

export function setSearchQuery(q: string) {
  searchQuery.value = q
  elementsToShow.value = 48
}

export function setSelectedIcon(icon: IconData | null) {
  selectedIcon.value = icon
}

export function switchVariant(icon: IconData | null, toVariant: TabType): IconData | null {
  if (!icon?.componentName) return icon
  const isFilled = icon.componentName.startsWith('FluentIconFilled')
  if (isFilled && toVariant === 'outlined') {
    return {
      ...icon,
      componentName: icon.componentName.replace('FluentIconFilled', 'FluentIconOutlined'),
      svgFileName: icon.svgFileName.replace('_filled.svg', '_regular.svg'),
    }
  }
  if (!isFilled && toVariant === 'filled') {
    return {
      ...icon,
      componentName: icon.componentName.replace('FluentIconOutlined', 'FluentIconFilled'),
      svgFileName: icon.svgFileName.replace('_regular.svg', '_filled.svg'),
    }
  }
  return icon
}

function saveFavorites() {
  localStorage.setItem('favorites', JSON.stringify(favorites.value))
}

if (typeof document !== 'undefined') {
  if (initialTheme === 'dark') {
    document.documentElement.classList.add('dark')
  }
}
