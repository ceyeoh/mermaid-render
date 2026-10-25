import { renderMermaidASCII, renderMermaidSVG } from './beautiful-mermaid.js'

const SVG_LIMIT = 131072
const SVG_NAMESPACE = 'http://www.w3.org/2000/svg'
const LIGHT = { bg: '#FFFFFF', fg: '#27272A' }
const DARK = { bg: '#1F1F1E', fg: '#E8E6E3' }
const THEME =
  `svg{--bg:${LIGHT.bg};--fg:${LIGHT.fg}}` +
  `@media (prefers-color-scheme: dark){svg{--bg:${DARK.bg};--fg:${DARK.fg}}}`

function themeAdaptive(svg) {
  const withoutImports = svg.replace(/^[ \t]*@import url\([^)]*\);?[ \t]*\r?\n?/gm, '')
  // An inline --bg/--fg on the root would beat the stylesheet, so the dark-mode query could never apply.
  const withoutInlineColors = withoutImports.replace(/^(<svg\b[^>]*?)\sstyle="([^"]*)"/, (_, open, style) => {
    const kept = style
      .split(';')
      .filter(declaration => !/^\s*--(bg|fg)\s*:/.test(declaration) && declaration.trim() !== '')
      .join(';')
    return kept === '' ? open : `${open} style="${kept}"`
  })
  return withoutInlineColors.replace('<style>', `<style>\n  ${THEME}`)
}

function hasExternalReference(svg) {
  return svg.replaceAll(SVG_NAMESPACE, '').match(/https?:\/\//) !== null
}

const RENDERERS = {
  svg(source) {
    const svg = themeAdaptive(renderMermaidSVG(source, { transparent: true, font: 'system-ui' }))
    if (hasExternalReference(svg)) return { ok: false, reason: 'external reference' }
    if (svg.length > SVG_LIMIT) return { ok: false, reason: 'too large' }
    return { ok: true, output: svg }
  },
  ascii(source) {
    const ascii = renderMermaidASCII(source, { colorMode: 'none' })
    return { ok: true, output: ascii.replace(/[ \t]+$/gm, '').replace(/\n+$/, '') }
  },
}

function renderOne(render, source) {
  try {
    return render(source)
  } catch (error) {
    return { ok: false, reason: error instanceof Error ? error.message : String(error) }
  }
}

async function readStdin() {
  let text = ''
  process.stdin.setEncoding('utf8')
  for await (const chunk of process.stdin) text += chunk
  return text
}

const request = JSON.parse(await readStdin())
const render = RENDERERS[request.format]
if (render === undefined || !Array.isArray(request.sources)) {
  process.stderr.write(`render.mjs: expected { format: "svg" | "ascii", sources: string[] }\n`)
  process.exit(2)
}
process.stdout.write(JSON.stringify(request.sources.map(source => renderOne(render, String(source)))))
