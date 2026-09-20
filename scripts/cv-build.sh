#!/usr/bin/env bash
set -euo pipefail
project_root="$(cd "$(dirname "$0")/.." && pwd)"
export PATH="/Library/TeX/texbin:$PATH"
cd "$project_root/cv"
mkdir -p .build "$project_root/assets/pdf"
latexmk -pdf -interaction=nonstopmode -halt-on-error -outdir=.build main.tex
cp .build/main.pdf "$project_root/assets/pdf/cv.pdf"
echo "Built assets/pdf/cv.pdf"
