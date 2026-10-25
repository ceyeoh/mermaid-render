import { expect, test } from 'claude-code/testing'
import { parseSegments } from './segments'

test('a mermaid fence between text splits into markdown, mermaid, markdown', () => {
  const text = 'Before\n\n```mermaid\ngraph TD\n  A --> B\n```\n\nAfter'
  expect(parseSegments(text)).toEqual([
    { kind: 'markdown', text: 'Before\n\n' },
    { kind: 'mermaid', source: 'graph TD\n  A --> B', fence: '```mermaid\ngraph TD\n  A --> B\n```' },
    { kind: 'markdown', text: '\n\nAfter' },
  ])
})

test('tilde fences, longer fences, indented fences and trailing attributes all open a diagram', () => {
  const cases = [
    '~~~mermaid\ngraph LR\n~~~',
    '````mermaid\ngraph LR\n````',
    '   ```mermaid\n   graph LR\n   ```',
    '```Mermaid title="flow" {.wide}\ngraph LR\n```',
    '```mermaid\ngraph LR\n`````  ',
  ]
  for (const text of cases) {
    expect(parseSegments(text)).toEqual([{ kind: 'mermaid', source: 'graph LR', fence: text }])
  }
})

test('a fence closes only on the same character repeated at least as many times', () => {
  const text = '````mermaid\ngraph LR\n```\n~~~~\n````'
  const [segment] = parseSegments(text)
  expect(segment).toEqual({ kind: 'mermaid', source: 'graph LR\n```\n~~~~', fence: text })
})

test('an unclosed mermaid fence stays markdown', () => {
  const text = 'Drawing:\n```mermaid\ngraph TD\n  A -->'
  expect(parseSegments(text)).toEqual([{ kind: 'markdown', text }])
})

test('other fences stay markdown, even when they mention mermaid or hold a mermaid fence', () => {
  const text = '```js\nconst mermaid = "```mermaid"\n```\n\n````md\n```mermaid\ngraph TD\n```\n````\n\n```mermaidish\nx\n```'
  expect(parseSegments(text)).toEqual([{ kind: 'markdown', text }])
})

test('a fence indented four spaces is code, not a diagram', () => {
  const text = '    ```mermaid\n    graph TD\n    ```'
  expect(parseSegments(text)).toEqual([{ kind: 'markdown', text }])
})

test('adjacent diagrams drop the whitespace between them', () => {
  expect(parseSegments('```mermaid\na\n```\n\n```mermaid\nb\n```\n').map(segment => segment.kind)).toEqual([
    'mermaid',
    'mermaid',
  ])
})
