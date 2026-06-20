import { useState } from 'preact/hooks'
import { useSignal, useSignalEffect } from '@preact/signals'
import { favorites, favoriteSidebarOpen, toggleFavoriteSidebar, removeFavorites, unFavoriteIcon } from '../lib/store'
import type { IconData } from '../lib/store'
import { getSvg, downloadAsZip } from '../lib/iconManager'
import SvgIcon from './SvgIcon'

export default function FavoritesSidebar() {
  const favs = useSignal<IconData[]>([])
  const open = useSignal(favoriteSidebarOpen.value)
  const [selected, setSelected] = useState<number[]>([])

  useSignalEffect(() => { favs.value = favorites.value })
  useSignalEffect(() => { open.value = favoriteSidebarOpen.value })

  const toggleSelect = (i: number) => {
    setSelected(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i])
  }

  const selectAll = () => {
    setSelected(prev => prev.length === favs.value.length ? [] : favs.value.map((_, i) => i))
  }

  const removeSelected = () => {
    removeFavorites(selected)
    setSelected([])
  }

  const downloadAll = async () => {
    if (!favs.value.length) return
    const results = await Promise.allSettled(
      favs.value.map(async (item) => {
        const content = await getSvg('fluent/' + item.svgFileName)
        const suffix = item.componentName.includes('Filled') ? '_filled' : '_outlined'
        return { name: `${item.name}${suffix}.svg`, content }
      })
    )
    const valid = results.filter(r => r.status === 'fulfilled').map(r => (r as PromiseFulfilledResult<{ name: string; content: string }>).value).filter(f => f.content)
    if (valid.length) downloadAsZip(valid)
  }

  const allSelected = favs.value.length > 0 && selected.length === favs.value.length

  return (
    <>
    {!open.value && (
      <button
        onClick={toggleFavoriteSidebar}
        class="fixed left-0 top-1/2 -translate-y-1/2 z-50 w-7 h-12 bg-base border border-surface1 rounded-r-lg shadow-lg flex items-center justify-center cursor-pointer hover:bg-mantle transition-all duration-200"
        aria-label="Open favorites sidebar"
      >
        <svg class="h-4 w-4 text-overlay1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
      </button>
    )}
    <aside class={`favorites-sidebar relative ${open.value ? 'open' : 'closed'}`}>
      <div class="flex items-center justify-between px-4 h-[75px] border-b border-surface1">
        <h3 class="text-sm font-medium">Favorites ({favs.value.length})</h3>
        <button onClick={toggleFavoriteSidebar} class="p-1.5 rounded-lg hover:bg-mantle cursor-pointer transition-colors duration-200" aria-label="Toggle favorites sidebar">
          <svg class="h-4 w-4 text-overlay1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
      </div>
      <div class="overflow-y-auto" style={{ height: 'calc(100vh - 150px)' }}>
        {favs.value.length === 0 ? (
          <div class="p-4 text-center text-overlay0 text-sm">
            <svg class="h-8 w-8 mx-auto mb-2 text-overlay0" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
            <p>No favorites yet</p>
            <p class="text-xs mt-1">Click the heart icon on any icon to add it here</p>
          </div>
        ) : (
          <div class="py-2">
            <div class="px-4 flex gap-2 mb-2">
              <button onClick={selectAll} class="text-xs px-3 py-1 rounded-full border border-surface1 hover:bg-mantle cursor-pointer transition-colors duration-200">
                {allSelected ? 'Deselect All' : 'Select All'}
              </button>
              {selected.length > 0 && (
                <button onClick={removeSelected} class="text-xs px-3 py-1 rounded-full bg-red/10 text-red border border-red/30 hover:bg-red/20 cursor-pointer transition-colors duration-200">
                  Remove ({selected.length})
                </button>
              )}
            </div>
            <div>
              {favs.value.map((fav, i) => (
                <div key={fav.componentName} class="flex items-center gap-2 px-4 py-2 text-sm hover:bg-mantle transition-colors duration-200 cursor-pointer" onClick={() => toggleSelect(i)}>
                  <div class={`w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors duration-200 ${selected.includes(i) ? 'bg-blue border-blue' : 'border-surface1'}`}>
                    {selected.includes(i) && <svg class="h-3 w-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M5 13l4 4L19 7"/></svg>}
                  </div>
                  <SvgIcon path={`fluent/${fav.svgFileName}`} size={20} class="text-overlay2 flex-shrink-0" />
                  <span class="truncate text-xs flex-1">{fav.name.replace(/([A-Z])/g, ' $1')}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); unFavoriteIcon(fav) }}
                    class="p-1 rounded hover:bg-surface0 cursor-pointer flex-shrink-0 transition-colors duration-200"
                    aria-label="Remove from favorites"
                  >
                    <svg class="h-3 w-3 text-overlay0 hover:text-red" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 18L18 6M6 6l12 12"/></svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      {favs.value.length > 0 && (
        <div class="absolute bottom-0 left-0 right-0 p-3 border-t border-surface1 bg-inherit">
          <button onClick={downloadAll} class="w-full py-2 px-4 rounded-lg bg-mauve hover:bg-mauve/80 text-white text-sm font-medium cursor-pointer transition-colors duration-200 flex items-center justify-center gap-2">
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
            Download All Favorites
          </button>
        </div>
      )}
    </aside>
    </>
  )
}
