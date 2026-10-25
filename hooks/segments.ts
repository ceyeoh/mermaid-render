export type Segment =
  | { kind: 'markdown'; text: string }
  | { kind: 'mermaid'; source: string; fence: string }

const OPENER = /^( {0,3})(`{3,}|~{3,})(.*)$/

type Fence = { char: string; length: number; indent: number; isMermaid: boolean; start: number; body: string[] }

function openFence(line: string, start: number): Fence | undefined {
  const match = OPENER.exec(line)
  if (match === null) return undefined
  const [, indent = '', marker = '', info = ''] = match
  if (marker[0] === '`' && info.includes('`')) return undefined
  const language = info.trim().split(/\s+/)[0]?.toLowerCase()
  return { char: marker[0] ?? '`', length: marker.length, indent: indent.length, isMermaid: language === 'mermaid', start, body: [] }
}

function closes(fence: Fence, line: string): boolean {
  const match = /^ {0,3}(`+|~+)[ \t]*$/.exec(line)
  const marker = match?.[1]
  return marker !== undefined && marker[0] === fence.char && marker.length >= fence.length
}

function dedent(line: string, indent: number): string {
  let cut = 0
  while (cut < indent && line[cut] === ' ') cut++
  return line.slice(cut)
}

export function parseSegments(text: string): Segment[] {
  const lines = text.split(/(?<=\n)/)
  const segments: Segment[] = []
  let fence: Fence | undefined
  let offset = 0
  let markdownStart = 0

  for (const raw of lines) {
    const line = raw.replace(/\r?\n$/, '')
    if (fence === undefined) {
      fence = openFence(line, offset)
    } else if (closes(fence, line)) {
      if (fence.isMermaid) {
        segments.push({ kind: 'markdown', text: text.slice(markdownStart, fence.start) })
        segments.push({
          kind: 'mermaid',
          source: fence.body.join('\n'),
          fence: text.slice(fence.start, offset + line.length),
        })
        markdownStart = offset + line.length
      }
      fence = undefined
    } else {
      fence.body.push(dedent(line, fence.indent))
    }
    offset += raw.length
  }
  segments.push({ kind: 'markdown', text: text.slice(markdownStart) })

  return segments.filter(segment => segment.kind === 'mermaid' || segment.text.trim() !== '')
}
