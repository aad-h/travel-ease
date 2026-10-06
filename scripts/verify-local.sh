#!/usr/bin/env bash

# Run the same checks used before publishing a TravelEase change.
set -euo pipefail

printf '%s\n' '== TravelEase local verification =='
npm test
npx tsc --noEmit
npm run build
printf '%s\n' 'All local checks passed.'
