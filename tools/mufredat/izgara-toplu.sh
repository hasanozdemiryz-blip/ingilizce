#!/bin/sh
# Bir partiyi isler: stdin'den "no creation url" satirlari → izgara-isle.mjs her biri,
# sonra kontrol sayfasi. Kullanim: sh tools/mufredat/izgara-toplu.sh <kontrol.jpg> < satirlar
# (19 Ekim 2026, LGS eki; izgara-isle.mjs ile ayni klasorler.)
cikti="$1"; nolar=""
while read -r no id url; do
  [ -z "$no" ] && continue
  node "$(dirname "$0")/izgara-isle.mjs" "$no" "$id" "$url" > /dev/null || echo "HATA: $no"
  nolar="$nolar $no"
done
node "$(dirname "$0")/kontrol-sayfasi.mjs" "$cikti" $nolar
