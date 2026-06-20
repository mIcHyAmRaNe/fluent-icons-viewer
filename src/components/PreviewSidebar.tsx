import { useEffect, useState, useRef } from 'preact/hooks'
import { useSignal, useSignalEffect } from '@preact/signals'
import { selectedIcon, theme, isAFavorite, favoriteIcon, unFavoriteIcon } from '../lib/store'
import type { IconData } from '../lib/store'
import { getSvg, getSvgWithGradient, svgToComponent, svgToImage, downloadUrl } from '../lib/iconManager'
import SvgIcon from './SvgIcon'
import ColorPicker from './ColorPicker'
import GradientPicker from './GradientPicker'
import Prism from 'prismjs'
import 'prismjs/components/prism-markup'
import 'prismjs/components/prism-jsx'

const copyFormats = ['svg', 'vue', 'react'] as const
const exportOptions = [
  { name: 'SVG', value: 'svg' },
  { name: 'PNG', value: 'png' },
  { name: 'Vue', value: 'vue' },
  { name: 'React', value: 'react' },
] as const

export default function PreviewSidebar() {
  const icon = useSignal<IconData | null>(selectedIcon.value)
  const isDark = useSignal(theme.value === 'dark')
  const [color, setColor] = useState('#212121')
  const [colorChanged, setColorChanged] = useState(false)
  const [fillMode, setFillMode] = useState<'solid' | 'gradient'>('solid')
  const [gradientStart, setGradientStart] = useState('#d20f39')
  const [gradientEnd, setGradientEnd] = useState('#1e66f5')
  const [copyType, setCopyType] = useState<'svg' | 'vue' | 'react'>('svg')
  const [exportType, setExportType] = useState<'svg' | 'png' | 'vue' | 'react'>('svg')
  const [showDownloadMenu, setShowDownloadMenu] = useState(false)
  const [snippet, setSnippet] = useState('')
  const codeRef = useRef<HTMLElement>(null)

  useSignalEffect(() => { icon.value = selectedIcon.value })
  useSignalEffect(() => { isDark.value = theme.value === 'dark' })

  useEffect(() => {
    if (!colorChanged) {
      setColor(isDark.value ? '#ffffff' : '#212121')
    }
  }, [isDark.value])

  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setColor('#ffffff')
    }
  }, [])

  useEffect(() => {
    if (!icon.value) { setSnippet(''); return }
    let cancelled = false
    const load = async () => {
      const svgPath = 'fluent/' + icon.value!.svgFileName
      const svg = fillMode === 'gradient'
        ? await getSvgWithGradient(svgPath, gradientStart, gradientEnd)
        : await getSvg(svgPath, colorChanged ? color : undefined)
      if (cancelled) return
      if (copyType === 'svg') {
        setSnippet(svg)
      } else {
        setSnippet(svgToComponent(svg, copyType, icon.value!.name))
      }
    }
    load()
    return () => { cancelled = true }
  }, [icon.value?.name, copyType, colorChanged, color, fillMode, gradientStart, gradientEnd])

  useEffect(() => {
    setShowDownloadMenu(false)
  }, [icon.value?.name])

  useEffect(() => {
    if (codeRef.current && snippet) {
      codeRef.current.textContent = snippet
      Prism.highlightElement(codeRef.current)
    }
  }, [snippet, copyType])

  const handleFavorite = () => {
    if (!icon.value) return
    if (isAFavorite(icon.value.componentName)) {
      unFavoriteIcon(icon.value)
    } else {
      favoriteIcon(icon.value)
    }
  }

  const handleCopy = async () => {
    if (!snippet) return
    try {
      await navigator.clipboard.writeText(snippet)
    } catch (err) { console.error(err) }
  }

  const handleDownload = async (type?: string) => {
    if (!icon.value) return
    const fmt = type || exportType
    const name = icon.value.name
    const suffix = icon.value.componentName.includes('Filled') ? 'filled' : 'outlined'
    const typeSuffix = icon.value.componentName.includes('Filled') ? '_filled' : '_outlined'
    const svgPath = 'fluent/' + icon.value.svgFileName

    try {
      switch (fmt) {
        case 'svg':
          downloadUrl(`/icons/${svgPath}`, `${name}_${suffix}.svg`)
          break
        case 'png': {
          const svg = fillMode === 'gradient' ? await getSvgWithGradient(svgPath, gradientStart, gradientEnd) : await getSvg(svgPath, color)
          const dataUrl = await svgToImage(svg, { mimetype: 'image/png', width: 512, height: 512, outputFormat: 'base64' })
          downloadUrl(dataUrl as string, `${name}_${suffix}.png`)
          break
        }
        case 'vue':
        case 'react': {
          const svg = fillMode === 'gradient' ? await getSvgWithGradient(svgPath, gradientStart, gradientEnd) : await getSvg(svgPath, color)
          const code = svgToComponent(svg, fmt as 'vue' | 'react', name)
          const blob = new Blob([code], { type: 'text/plain;charset=utf-8' })
          const url = URL.createObjectURL(blob)
          downloadUrl(url, `${name}${typeSuffix}.${fmt === 'vue' ? 'vue' : 'js'}`)
          setTimeout(() => URL.revokeObjectURL(url), 1000)
          break
        }
      }
    } catch (err) { console.error(err) }
  }

  const formattedName = icon.value ? icon.value.name.replace(/([A-Z])/g, ' $1') : 'Preview'
  const fav = icon.value ? isAFavorite(icon.value.componentName) : false

  return (
    <aside class="editor-sidebar">
      <div class="h-[75px] border-b border-surface1 flex items-center justify-between px-4">
        <div class="text-sm font-medium truncate">{formattedName}</div>
        {icon.value && (
          <button onClick={handleFavorite} class="focus:outline-none p-2 rounded-full focus:bg-mantle hover:bg-mantle cursor-pointer transition-colors duration-200" aria-label="Favorite">
            {fav ? (
              <SvgIcon path="fluent/ic_fluent_heart_24_filled.svg" size={20} class="text-red" />
            ) : (
              <SvgIcon path="fluent/ic_fluent_heart_24_regular.svg" size={20} class="text-overlay1" />
            )}
          </button>
        )}
      </div>
      <div class="h-64">
        <div class="icon-editor-panel dots-pattern-background relative">
          {icon.value ? (
            <>
              <div class="flex items-center justify-center w-full h-full">
                <SvgIcon
                  path={`fluent/${icon.value.svgFileName}`}
                  color={fillMode === 'solid' && colorChanged ? color : undefined}
                  gradientStart={fillMode === 'gradient' ? gradientStart : undefined}
                  gradientEnd={fillMode === 'gradient' ? gradientEnd : undefined}
                  size={128}
                  class="text-subtext0"
                />
              </div>
            </>
          ) : (
            <div class="text-overlay0 text-sm">Select an icon to preview</div>
          )}
        </div>
      </div>

      {/* ── Color Picker Row ── */}
      {icon.value && (
        <div class="flex items-center justify-center gap-4 py-2 px-4 border-b border-surface1">
          <div class="flex items-center gap-2">
            <span class="text-xs text-overlay1">Gradient</span>
            <GradientPicker
              start={gradientStart}
              end={gradientEnd}
              isDark={isDark.value}
              onChange={(s, e) => { setFillMode('gradient'); setGradientStart(s); setGradientEnd(e) }}
            />
          </div>
          <div class="w-px h-6 bg-surface1" />
          <div class="flex items-center gap-2">
            <span class="text-xs text-overlay1">Solid</span>
            <ColorPicker
              color={color}
              isDark={isDark.value}
              onChange={(c) => { setFillMode('solid'); setColor(c); setColorChanged(true) }}
            />
          </div>
        </div>
      )}

      {/* ── Copy Section ── */}
      <div class="px-4 py-3 border-b border-surface1">
        <div class="flex items-center justify-between mb-2">
          <div class="flex gap-1">
            {copyFormats.map(f => (
              <button
                key={f}
                onClick={() => setCopyType(f)}
                class={`px-2.5 py-1 text-xs rounded-full font-medium transition-colors duration-200 cursor-pointer ${
                  copyType === f
                    ? 'bg-surface1 text-subtext1'
                    : 'text-overlay1 hover:text-subtext1'
                }`}
              >
                {f === 'svg' ? 'SVG' : f === 'vue' ? 'Vue' : 'React'}
              </button>
            ))}
          </div>
          <button
            onClick={handleCopy}
            disabled={!snippet}
            class="flex items-center gap-1 px-2.5 py-1 text-xs rounded-md bg-mantle text-overlay1 hover:text-subtext1 hover:bg-surface0 transition-colors duration-200 cursor-pointer disabled:opacity-40"
            aria-label="Copy snippet"
          >
            <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
            </svg>
            Copy
          </button>
        </div>
        {icon.value ? (
          <pre class="preview-code text-xs font-mono bg-mantle border border-surface1 rounded-lg p-4 mr-2 max-h-48 overflow-y-auto whitespace-pre-wrap break-all leading-relaxed">
            <code ref={codeRef} class={`block px-1 ${copyType === 'react' ? 'language-jsx' : 'language-markup'}`}></code>
          </pre>
        ) : (
          <div class="text-xs text-overlay0 py-4 text-center">Select an icon to preview</div>
        )}
      </div>

      {/* ── Download Section ── */}
      <div class="px-4 py-3 border-b border-surface1">
        <p class="text-xs font-medium text-overlay1 mb-2">Download</p>
        <div class="relative">
          <div class="flex rounded-lg overflow-hidden">
            <button
              onClick={() => handleDownload()}
              disabled={!icon.value}
              class="flex-1 py-2 px-3 text-sm bg-mauve text-white font-medium cursor-pointer disabled:opacity-50 transition-colors duration-200 hover:bg-mauve/80 flex items-center gap-2"
            >
              <svg class="h-4 w-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>
              </svg>
              Download as {exportType.toUpperCase()}
            </button>
            <button
              onClick={() => setShowDownloadMenu(v => !v)}
              disabled={!icon.value}
              class="py-2 px-2 bg-mauve text-white cursor-pointer disabled:opacity-50 transition-colors duration-200 hover:bg-mauve/80 border-l border-white/20"
              aria-label="Select download format"
            >
              <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M6 9l6 6 6-6"/>
              </svg>
            </button>
          </div>
          {showDownloadMenu && (
            <div class="absolute bottom-full left-0 right-0 mb-1 bg-base border border-surface1 rounded-lg shadow-lg overflow-hidden z-50">
              {exportOptions.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => { setExportType(opt.value); setShowDownloadMenu(false) }}
                  class={`w-full text-left px-3 py-2 text-sm transition-colors duration-200 cursor-pointer ${
                    exportType === opt.value
                      ? 'text-subtext1 font-medium'
                      : 'text-overlay1 hover:bg-mantle'
                  }`}
                >
                  {opt.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div class="p-4 text-center">
        <a href="https://www.buymeacoffee.com/michyamrane" target="_blank" rel="noopener" class="cursor-pointer hover:opacity-90 transition-opacity duration-200 inline-block">
          <svg class="h-12 w-12 mx-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
          <p class="font-semibold mt-1">Buy me a coffee</p>
          <p class="text-overlay1 text-xs mt-1">Help keep this project alive.</p>
        </a>
      </div>
    </aside>
  )
}
