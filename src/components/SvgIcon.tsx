import { useEffect, useRef } from 'preact/hooks'
import { getSvg, getSvgWithGradient } from '../lib/iconManager'

interface Props {
  path: string
  color?: string
  gradientStart?: string
  gradientEnd?: string
  class?: string
  size?: number
}

export default function SvgIcon(props: Props) {
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    let cancelled = false
    const load = props.gradientStart && props.gradientEnd
      ? getSvgWithGradient(props.path, props.gradientStart, props.gradientEnd)
      : getSvg(props.path, props.color)
    load.then(html => { if (!cancelled) el.innerHTML = html })
      .catch(() => { if (!cancelled) el.innerHTML = '' })
    return () => { cancelled = true }
  }, [props.path, props.color, props.gradientStart, props.gradientEnd])

  const size = props.size ?? 24
  return (
    <span ref={ref} class={`inline-flex items-center justify-center flex-shrink-0 ${props.class ?? ''}`} style={{ width: `${size}px`, height: `${size}px` }} />
  )
}
