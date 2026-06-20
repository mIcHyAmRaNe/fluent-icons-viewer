import type { IconData } from '../lib/store'
import { selectedIcon, isAFavorite, favoriteIcon, unFavoriteIcon, setSelectedIcon } from '../lib/store'
import { useSignal, useSignalEffect } from '@preact/signals'
import SvgIcon from './SvgIcon'

interface Props {
  icon: IconData
}

export default function IconCard({ icon }: Props) {
  const fav = isAFavorite(icon.componentName)
  const selected = useSignal(selectedIcon.value?.name === icon.name)

  useSignalEffect(() => { selected.value = selectedIcon.value?.name === icon.name })

  const handleSelect = () => setSelectedIcon(icon)
  const handleFav = (e: Event) => {
    e.stopPropagation()
    if (isAFavorite(icon.componentName)) {
      unFavoriteIcon(icon)
    } else {
      favoriteIcon(icon)
    }
  }

  const formattedName = icon.name.replace(/([A-Z])/g, ' $1')

  let cls = 'pb-[100%] relative rounded-lg overflow-hidden group border'
  if (selected.value) cls += ' card-selected'
  else if (fav) cls += ' card-favorited'
  else cls += ' border-surface0'

  return (
    <article class={cls}>
      <div class="absolute inset-0">
        <button
          onClick={handleSelect}
          class="block w-full h-full focus:outline-none group relative hover:bg-mantle focus:bg-mantle cursor-pointer transition-colors duration-200"
          aria-label={formattedName}
        >
          <div class="absolute inset-0 flex items-center justify-center">
            <SvgIcon path={`fluent/${icon.svgFileName}`} size={40} class="text-subtext0" />
          </div>
          <div class="p-4 absolute inset-x-0 bottom-0">
            <div class="-mx-2 -my-1 flex flex-row justify-center">
              <p class="subpixel-antialiased px-2 py-1 tracking-wide leading-tight text-overlay2 cursor-text select-text text-xs truncate">
                {formattedName}
              </p>
            </div>
          </div>
        </button>
      </div>
      <div class="absolute top-2 right-2 z-10">
        <button
          onClick={handleFav}
          class={`fav-btn w-7 h-7 rounded-full flex items-center justify-center cursor-pointer transition-all duration-200 ${fav ? 'fav-active' : ''}`}
          aria-label={fav ? 'Remove from favorites' : 'Add to favorites'}
        >
          <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill={fav ? 'currentColor' : 'none'} stroke="currentColor" stroke-width={fav ? '0' : '2'}>
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
        </button>
      </div>
    </article>
  )
}
