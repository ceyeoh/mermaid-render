#!/bin/sh
# Rebuilds renderer/beautiful-mermaid.js and its license files from the pinned npm release.
set -eu

VERSION=1.1.3
# Its own dependencies are caret ranges; pin what the committed bundle was built from.
PINNED="elkjs@0.11.1 entities@7.0.1"
here=$(cd "$(dirname "$0")/.." && pwd)
out="$here/renderer"
work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT

cd "$work"
printf '{ "private": true }\n' > package.json
npm install --ignore-scripts --no-audit --no-fund --silent --save-exact "beautiful-mermaid@$VERSION" $PINNED
bun build node_modules/beautiful-mermaid/dist/index.js --target=browser --format=esm --minify --outfile="$work/beautiful-mermaid.js"

if grep -q 'require(' "$work/beautiful-mermaid.js"; then
  echo "bundle holds require(); render.mjs cannot import it" >&2
  exit 1
fi

cp "$work/beautiful-mermaid.js" "$out/beautiful-mermaid.js"
cp node_modules/beautiful-mermaid/LICENSE "$out/LICENSE-beautiful-mermaid"
cp node_modules/elkjs/LICENSE.md "$out/LICENSE-elkjs"
cp node_modules/entities/LICENSE "$out/LICENSE-entities"
echo "vendored beautiful-mermaid@$VERSION ($(wc -c < "$out/beautiful-mermaid.js" | tr -d ' ') bytes) into $out"
