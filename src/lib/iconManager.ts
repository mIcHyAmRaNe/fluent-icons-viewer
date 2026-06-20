const svgCache = new Map<string, string>()

export async function getSvg(path: string, color?: string): Promise<string> {
  let data = svgCache.get(path)
  if (!data) {
    const res = await fetch(`/icons/${path}`)
    if (!res.ok) throw new Error(`Failed to fetch /icons/${path}: ${res.status}`)
    data = await res.text()
    svgCache.set(path, data)
  }
  return color ? data.replace(/#212121/g, color) : data.replace(/#212121/g, 'currentColor')
}

export function svgToComponent(svgString: string, type: 'vue' | 'react', name: string): string {
  if (type === 'vue') {
    return `<template>\n  ${svgString}\n</template>\n<script>\nexport default {\n  name: '${name}'\n}\n<\/script>`
  }
  return `export function ${name}(props) {\n  return (\n    ${svgString}\n  )\n}`
}

export function svgToImage(svg: string | Element, options: {
  mimetype?: string
  quality?: number
  width?: number
  height?: number
  outputFormat?: 'base64' | 'blob'
} = {}): Promise<string | Blob> {
  const { mimetype = 'image/png', quality = 1, width = 512, height = 512, outputFormat = 'base64' } = options
  return new Promise((resolve) => {
    let svgNode: Element
    if (typeof svg === 'string') {
      const container = document.createElement('div')
      container.style.display = 'none'
      container.innerHTML = svg
      svgNode = container.firstElementChild!
    } else {
      svgNode = svg
    }
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!
    const svgXml = new XMLSerializer().serializeToString(svgNode)
    const svgBase64 = 'data:image/svg+xml;base64,' + btoa(svgXml)
    const img = new Image()
    img.onload = () => {
      canvas.width = width
      canvas.height = height
      ctx.drawImage(img, 0, 0, width, height)
      if (outputFormat === 'blob') {
        canvas.toBlob((blob) => resolve(blob!), mimetype, quality)
      } else {
        resolve(canvas.toDataURL(mimetype, quality))
      }
    }
    img.src = svgBase64
  })
}

export async function getSvgWithGradient(path: string, start: string, end: string): Promise<string> {
  const svg = await getSvg(path)
  const gradId = 'ig' + Date.now()
  const defs = `<defs><linearGradient id="${gradId}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="${start}"/><stop offset="100%" stop-color="${end}"/></linearGradient></defs>`
  return svg.replace(/fill="currentColor"/g, `fill="url(#${gradId})"`).replace('>', `>${defs}`)
}

export function downloadUrl(url: string, filename: string) {
  const a = document.createElement('a')
  a.style.display = 'none'
  a.download = filename
  a.href = url
  document.body.appendChild(a)
  a.click()
  a.remove()
}

export async function downloadAsZip(files: { name: string; content: string }[], zipFileName = 'fluenticons') {
  const { default: JSZip } = await import('jszip')
  const zip = new JSZip()
  files.forEach(f => zip.file(f.name, f.content))
  const blob = await zip.generateAsync({ type: 'blob' })
  downloadUrl(URL.createObjectURL(blob), zipFileName + '.zip')
}
