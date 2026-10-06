#!/bin/sh
# Magnific ciktilarini gorseller/<kart>.png olarak indirir.
#   sh tools/gorsel-indir.sh kart1 URL1 kart2 URL2 ...
# URL: creations_wait sonucundaki `results.url` (imzali, suresi var).
# JPG gelirse PNG'ye cevrilir; sonra `npm run import:images`.
cd "$(dirname "$0")/.." || exit 1
mkdir -p gorseller
while [ $# -gt 1 ]; do
  curl -s -o "gorseller/$1.tmp" "$2" &&
    node -e "require('sharp')('gorseller/$1.tmp').png().toFile('gorseller/$1.png').then(()=>require('fs').unlinkSync('gorseller/$1.tmp'))"
  shift 2
done
