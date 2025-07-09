#!/bin/bash
set -e

# Run the original build script
./build.sh

# Bundle for the browser
npx esbuild dist/index.js --bundle --outfile=browser/glsl-parser.js --format=esm --sourcemap
