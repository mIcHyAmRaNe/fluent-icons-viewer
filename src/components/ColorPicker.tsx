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

interface Props {
  color: string
  isDark?: boolean
  onChange: (color: string) => void
}

export default function ColorPicker({ color, isDark, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const [hex, setHex] = useState(color)
  const panelRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setHex(color)
  }, [color])

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

  const handleSwatch = (c: string) => {
    onChange(c)
  }

  const handleHexSubmit = () => {
    const val = hex.startsWith('#') ? hex : '#' + hex
    if (/^#[0-9a-fA-F]{6}$/.test(val)) {
      onChange(val)
    }
  }

  const handleNative = () => {
    inputRef.current?.click()
  }

  const handleNativeChange = (e: Event) => {
    onChange((e.target as HTMLInputElement).value)
  }

  return (
    <div class="relative" ref={panelRef}>
      <button
        onClick={() => setOpen(v => !v)}
        class="w-8 h-8 rounded-full border-2 border-surface1 cursor-pointer hover:scale-110 transition-transform duration-200"
        style={{ backgroundColor: color }}
        aria-label="Pick solid color"
      />
      {open && (
        <div class="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-base border border-surface1 rounded-xl shadow-lg p-3 z-50 min-w-[200px]">
          <div class="grid grid-cols-6 gap-1.5 mb-3">
            {swatches.map(c => (
              <button
                key={c}
                onClick={() => handleSwatch(c)}
                class={`w-7 h-7 rounded-lg cursor-pointer hover:scale-110 transition-transform duration-150 border ${
                  c === color ? 'border-subtext1 ring-2 ring-subtext1/30' : 'border-surface1'
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
          <input ref={inputRef} type="color" value={color} onInput={handleNativeChange} class="sr-only" />
        </div>
      )}
    </div>
  )
}
