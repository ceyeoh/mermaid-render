#!/bin/sh
# Rebuilds renderer/beautiful-mermaid.mjs and its license files from the pinned npm release.
# The build is unminified so the vendored code stays readable, and it is byte-for-byte
# reproducible with the bun version below.
set -eu

VERSION=1.1.3
# Its own dependencies are caret ranges; pin what the committed bundle was built from.
PINNED="elkjs@0.11.1 entities@7.0.1"
BUN_VERSION=1.4.4
here=$(cd "$(dirname "$0")/.." && pwd)
out="$here/renderer"
work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT

if [ "$(bun --version)" != "$BUN_VERSION" ]; then
  echo "warning: bun $(bun --version) is not $BUN_VERSION; the bundle may differ from the committed one" >&2
fi

cd "$work"
printf '{ "private": true }\n' > package.json
npm install --ignore-scripts --no-audit --no-fund --silent --save-exact "beautiful-mermaid@$VERSION" $PINNED
bun build node_modules/beautiful-mermaid/dist/index.js --target=browser --format=esm --outfile="$work/bundle.js"

if grep -q 'require(' "$work/bundle.js"; then
  echo "bundle holds require(); render.mjs cannot import it" >&2
  exit 1
fi

{
  echo "// Built by scripts/vendor.sh from npm: beautiful-mermaid@$VERSION with $PINNED,"
  echo "// bundled unminified by bun $BUN_VERSION. Not edited by hand."
  cat "$work/bundle.js"
} > "$out/beautiful-mermaid.mjs"
cp node_modules/beautiful-mermaid/LICENSE "$out/LICENSE-beautiful-mermaid"
cp node_modules/elkjs/LICENSE.md "$out/LICENSE-elkjs"
cp node_modules/entities/LICENSE "$out/LICENSE-entities"
echo "vendored beautiful-mermaid@$VERSION ($(wc -c < "$out/beautiful-mermaid.mjs" | tr -d ' ') bytes) into $out"
