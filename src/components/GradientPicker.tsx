import { useState, useRef, useEffect } from 'preact/hooks'

const LATTE = [
  '#d20f39', '#fe640b', '#df8e1d', '#40a02b',
  '#179299', '#04a5e5', '#1e66f5', '#7287fd',
  '#8839ef', '#ea76cb', '#212121', '#ffffff',
]

const MACCHIATO = [
  '#ed8796', '#f5a97f', '#eed49f', '#a6da95',
  '#8bd5ca', '#91d7e3', '#8aadf4', '#b7bdf8',
  '#c6a0f6', '#f5bde6', '#181926', '#ffffff',
]

const PRESETS = [
  { start: '#d20f39', end: '#fe640b', label: 'Sunset' },
  { start: '#1e66f5', end: '#8839ef', label: 'Ocean' },
  { start: '#40a02b', end: '#179299', label: 'Forest' },
  { start: '#ea76cb', end: '#8839ef', label: 'Bloom' },
  { start: '#df8e1d', end: '#d20f39', label: 'Fire' },
  { start: '#04a5e5', end: '#7287fd', label: 'Sky' },
]

interface Props {
  start: string
  end: string
  isDark?: boolean
  onChange: (start: string, end: string) => void
}

export default function GradientPicker({ start, end, isDark, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<'start' | 'end'>('start')
  const [hex, setHex] = useState(start)
  const panelRef = useRef<HTMLDivElement>(null)
  const startRef = useRef<HTMLInputElement>(null)
  const endRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setHex(tab === 'start' ? start : end)
  }, [start, end, tab])

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const swatches = isDark ? MACCHIATO : LATTE
  const currentColor = tab === 'start' ? start : end

  const handleSwatch = (c: string) => {
    if (tab === 'start') onChange(c, end)
    else onChange(start, c)
  }

  const handleHexSubmit = () => {
    const val = hex.startsWith('#') ? hex : '#' + hex
    if (/^#[0-9a-fA-F]{6}$/.test(val)) {
      if (tab === 'start') onChange(val, end)
      else onChange(start, val)
    }
  }

  const handleNative = () => {
    if (tab === 'start') startRef.current?.click()
    else endRef.current?.click()
  }

  const handleNativeChange = (e: Event) => {
    const t = e.target as HTMLInputElement
    const which = t.dataset.tab as 'start' | 'end'
    if (which === 'start') onChange(t.value, end)
    else onChange(start, t.value)
  }

  const handlePreset = (s: string, e: string) => {
    onChange(s, e)
  }

  return (
    <div class="relative" ref={panelRef}>
      <button
        onClick={() => setOpen(v => !v)}
        class="w-8 h-8 rounded-full border-2 border-surface1 cursor-pointer hover:scale-110 transition-transform duration-200"
        style={{ background: `linear-gradient(135deg, ${start}, ${end})` }}
        aria-label="Pick gradient"
      />
      {open && (
        <div class="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-base border border-surface1 rounded-xl shadow-lg p-3 z-50 min-w-[220px]">
          <div class="grid grid-cols-3 gap-1.5 mb-3">
            {PRESETS.map(g => (
              <button
                key={g.label}
                onClick={() => handlePreset(g.start, g.end)}
                class="h-8 rounded-lg cursor-pointer hover:scale-105 transition-transform duration-150 border border-surface1 flex items-center justify-center"
                style={{ background: `linear-gradient(135deg, ${g.start}, ${g.end})` }}
                title={g.label}
              >
                <span class="text-[8px] font-medium text-white drop-shadow-md">{g.label}</span>
              </button>
            ))}
          </div>

          <div class="flex gap-1 mb-2">
            <button
              onClick={() => setTab('start')}
              class={`flex-1 text-xs py-1 rounded-md transition-colors cursor-pointer ${
                tab === 'start' ? 'bg-surface1 text-subtext1 font-medium' : 'text-overlay1 hover:text-subtext1'
              }`}
            >
              Start
            </button>
            <button
              onClick={() => setTab('end')}
              class={`flex-1 text-xs py-1 rounded-md transition-colors cursor-pointer ${
                tab === 'end' ? 'bg-surface1 text-subtext1 font-medium' : 'text-overlay1 hover:text-subtext1'
              }`}
            >
              End
            </button>
          </div>

          <div class="flex items-center gap-2 mb-2">
            <div class="w-6 h-6 rounded-full flex-shrink-0 border border-surface1" style={{ backgroundColor: currentColor }} />
            <span class="text-xs font-mono text-overlay1">{currentColor}</span>
          </div>

          <div class="grid grid-cols-6 gap-1.5 mb-2">
            {swatches.map(c => (
              <button
                key={c}
                onClick={() => handleSwatch(c)}
                class={`w-7 h-7 rounded-lg cursor-pointer hover:scale-110 transition-transform duration-150 border ${
                  c === currentColor ? 'border-subtext1 ring-2 ring-subtext1/30' : 'border-surface1'
                }`}
                style={{ backgroundColor: c }}
                aria-label={c}
              />
            ))}
          </div>

          <div class="flex items-center gap-2 mb-2">
            <input
              type="text"
              value={hex}
              onInput={e => setHex((e.target as HTMLInputElement).value)}
              onKeyDown={e => e.key === 'Enter' && handleHexSubmit()}
              class="flex-1 text-xs font-mono bg-mantle border border-surface1 rounded-lg px-2 py-1.5 outline-none focus:border-subtext1"
              placeholder="#hex"
            />
            <button
              onClick={handleHexSubmit}
              class="text-xs px-2.5 py-1.5 rounded-lg bg-mauve text-white font-medium cursor-pointer hover:bg-mauve/80 transition-colors"
            >
              Set
            </button>
          </div>

          <button
            onClick={handleNative}
            class="w-full text-xs text-center py-1.5 rounded-lg bg-mantle hover:bg-surface0 cursor-pointer transition-colors text-overlay1"
          >
            Pick custom color
          </button>
          <input ref={startRef} type="color" value={start} onInput={handleNativeChange} class="sr-only" data-tab="start" />
          <input ref={endRef} type="color" value={end} onInput={handleNativeChange} class="sr-only" data-tab="end" />
        </div>
      )}
    </div>
  )
}
