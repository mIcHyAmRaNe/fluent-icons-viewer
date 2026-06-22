import { useEffect, useState } from 'preact/hooks'
import { useSignal, useSignalEffect } from '@preact/signals'
import { currentTab, searchQuery, elementsToShow } from '../lib/store'
import type { IconData } from '../lib/store'
import IconCard from './IconCard'

export default function IconGrid() {
  const [filledIcons, setFilledIcons] = useState<IconData[]>([])
  const [outlinedIcons, setOutlinedIcons] = useState<IconData[]>([])
  const [loading, setLoading] = useState(true)
  const tab = useSignal(currentTab.value)
  const query = useSignal(searchQuery.value)
  const show = useSignal(elementsToShow.value)

  useSignalEffect(() => { tab.value = currentTab.value })
  useSignalEffect(() => { query.value = searchQuery.value })
  useSignalEffect(() => { show.value = elementsToShow.value })

  useEffect(() => {
    Promise.all([
      fetch('/data/filled.json').then(r => r.json()),
      fetch('/data/outlined.json').then(r => r.json()),
    ]).then(([filled, outlined]) => {
      setFilledIcons(filled)
      setOutlinedIcons(outlined)
      setLoading(false)
    }).catch(console.error)
  }, [])

  const currentIcons = tab.value === 'filled' ? filledIcons : outlinedIcons
  const filtered = query.value
    ? currentIcons.filter(ic => ic.name.toLowerCase().includes(query.value.toLowerCase().replace(/\s/g, '')))
    : currentIcons
  const visible = filtered.slice(0, show.value)

  if (loading) {
    return (
      <div class="flex-grow overflow-y-auto">
        <div class="container mx-auto p-8">
          <div class="text-center py-12"><p class="text-overlay1">Loading icons...</p></div>
        </div>
      </div>
    )
  }

  return (
    <div class="flex-grow overflow-y-auto">
      <div class="icon-grid-container container mx-auto p-4 sm:p-6 lg:p-8">
        {visible.length > 0 ? (
          <div class="icon-grid grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 sm:gap-4 lg:gap-6">
            {visible.map(ic => <IconCard key={ic.name} icon={ic} />)}
          </div>
        ) : (
          <div class="text-center py-12">
            <svg class="h-16 w-16 mx-auto text-overlay0 mb-4" viewBox="0 0 24 24" fill="currentColor"><path d="M6 4h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2zm0 2v12h12V6H6zm2 2h8v2H8V8zm0 4h8v2H8v-2zm0 4h5v2H8v-2z"/></svg>
            <p class="text-overlay1 text-lg">No icons found</p>
          </div>
        )}
        {filtered.length > show.value && (
          <div class="my-8 flex justify-center">
            <button
              onClick={() => { elementsToShow.value += 48 }}
              class="show-more-btn"
            >
              Show More Icons ({filtered.length - show.value} remaining)
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
