import { execFileSync } from 'node:child_process'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'

const renderer = fileURLToPath(new URL('./render.mjs', import.meta.url))
const SOURCES = [
  'graph TD\n  A[Start] --> B{Ok?}\n  B -->|yes| C[Ship]\n  B -->|no| D[Fix]',
  'sequenceDiagram\n  Alice->>Bob: hi\n  Bob-->>Alice: yo',
  'pie title Pets\n  "Dogs" : 3\n  "Cats" : 2',
  'this is not mermaid at all ((( -->',
]

function render(format) {
  const stdout = execFileSync(process.execPath, [renderer], {
    input: JSON.stringify({ format, sources: SOURCES }),
    encoding: 'utf8',
  })
  const results = JSON.parse(stdout)
  assert.equal(results.length, SOURCES.length, `${format}: one result per source, in order`)
  return results
}

const svg = render('svg')
assert.equal(svg[0].ok, true, 'svg: flowchart renders')
assert.equal(svg[1].ok, true, 'svg: sequence diagram renders')
assert.equal(svg[2].ok, false, 'svg: pie is refused, not drawn')
assert.equal(svg[3].ok, false, 'svg: garbage is refused, not drawn')
for (const result of svg.slice(0, 2)) {
  assert.match(result.output, /^<svg\b/, 'svg: output is an svg document')
  assert.ok(result.output.length <= 131072, 'svg: fits the Svg element limit')
  assert.deepEqual(
    result.output.match(/https?:\/\/[^\s"')]*/g),
    ['http://www.w3.org/2000/svg'],
    'svg: no external URL besides the svg namespace',
  )
  assert.doesNotMatch(result.output, /@import/, 'svg: no stylesheet import')
  assert.doesNotMatch(result.output.match(/^<svg\b[^>]*>/)[0], /--(bg|fg)\s*:/, 'svg: root carries no inline colors')
  assert.match(result.output, /@media \(prefers-color-scheme: dark\)\{svg\{--bg:[^;]+;--fg:[^}]+\}\}/, 'svg: dark-mode colors present')
  assert.match(result.output, /svg\{--bg:#FFFFFF;--fg:#27272A\}/, 'svg: light-mode colors present')
}
assert.equal(typeof svg[2].reason, 'string', 'svg: a refusal says why')

const ascii = render('ascii')
assert.equal(ascii[0].ok, true, 'ascii: flowchart renders')
assert.equal(ascii[1].ok, true, 'ascii: sequence diagram renders')
assert.equal(ascii[2].ok, false, 'ascii: pie is refused, not drawn')
assert.equal(ascii[3].ok, false, 'ascii: garbage is refused, not drawn')
assert.match(ascii[0].output, /Start/, 'ascii: flowchart shows its node labels')
assert.match(ascii[0].output, /[┌─│└]/, 'ascii: flowchart is drawn with box-drawing characters')
assert.match(ascii[1].output, /Alice[\s\S]*Bob/, 'ascii: sequence diagram shows its actors')
assert.doesNotMatch(ascii[0].output, /\x1b\[/, 'ascii: no color escapes')

console.log('render.check: all assertions passed')
console.log(ascii[0].output)
