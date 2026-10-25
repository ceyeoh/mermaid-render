# mermaid-render

A Claude Code mod that draws mermaid diagrams in assistant replies. When a reply holds a closed fenced code block whose language is `mermaid`, the block is drawn as a picture instead of as code.

- In the desktop app, VS Code and the mobile app, the diagram is an SVG. Its colors follow the light or dark color scheme.
- In the terminal, the diagram is drawn with Unicode box-drawing characters.

## Supported diagrams

Flowcharts (`graph` / `flowchart`), sequence diagrams, state diagrams, class diagrams and ER diagrams. Rendering comes from [beautiful-mermaid](https://github.com/lukilabs/beautiful-mermaid) 1.1.3, vendored in `renderer/`.

## When a diagram is not drawn

The block stays the code block it is today when any of these holds:

- the diagram type is one beautiful-mermaid does not draw (pie, gantt, mindmap, gitGraph and others), or the source does not parse;
- the fence is still streaming and has not closed yet;
- in the terminal, the drawing is wider than the window;
- the SVG would be over 131072 characters, or would reference anything outside itself;
- no JavaScript runtime could start.

Text written between two tool calls is often drawn as a summary of itself, and a summary holds no fence, so a diagram shows reliably only in the text that ends a reply.

## Install

This repository is its own plugin marketplace.

```bash
claude plugin marketplace add ceyeoh/mermaid-render
```

```bash
claude plugin install mermaid-render@mermaid-render --scope user
```

A user-scope install loads in every new terminal session and in the desktop app's Code tab.

## Requirements

Mods (function-hooks plugins) need a recent Claude Code. This mod was built and tested on Claude Code 2.1.310.

The renderer runs as a separate process, because its bundle is larger than a hooks module may import. It needs `node` (or `bun`) on the machine. The mod tries `node`, `/opt/homebrew/bin/node`, `/usr/local/bin/node`, `bun` and `/opt/homebrew/bin/bun`, in that order, and uses the first that starts. When none starts, every diagram stays code and one line goes to the debug log (`claude --debug`).

## Development

- `claude plugin test .` runs the hook and parser tests.
- `node renderer/render.check.mjs` runs the real renderer over a batch of diagrams.
- `scripts/vendor.sh` rebuilds `renderer/beautiful-mermaid.js` from the pinned npm release, with its license files.

## License

MIT. The vendored bundle includes beautiful-mermaid (MIT, `renderer/LICENSE-beautiful-mermaid`), elkjs (EPL-2.0, `renderer/LICENSE-elkjs`) and entities (BSD-2-Clause, `renderer/LICENSE-entities`).
