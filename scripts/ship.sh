#!/usr/bin/env bash
# ============================================================
#  CronoLab · ship.sh — equivalente a ship.bat para macOS/Linux
#  Sube a main y publica en gh-pages.
#
#  Uso:  bash scripts/ship.sh "mensaje del commit"
#        (o: chmod +x scripts/ship.sh && ./scripts/ship.sh)
# ============================================================
set -e
cd "$(dirname "$0")/.."

VERDE='\033[0;32m'; ROJO='\033[0;31m'; CIAN='\033[0;36m'; NADA='\033[0m'

echo ""
echo -e "${CIAN}  ============================================================${NADA}"
echo -e "${CIAN}     CRONOLAB | SHIP: subir a main y publicar en gh-pages${NADA}"
echo -e "${CIAN}  ============================================================${NADA}"
echo ""

command -v node >/dev/null 2>&1 || { echo -e "${ROJO}  Falta Node.js: https://nodejs.org${NADA}"; exit 1; }
command -v git  >/dev/null 2>&1 || { echo -e "${ROJO}  Falta git: https://git-scm.com${NADA}"; exit 1; }

if [ ! -d node_modules ]; then
  echo "  Instalando dependencias..."
  npm install
fi

MSG="${1:-}"
if [ -z "$MSG" ]; then
  read -r -p "  Mensaje del commit (ENTER = automático): " MSG
fi

node scripts/ship.mjs "$MSG"

echo ""
echo -e "${VERDE}  Listo: https://coiponorte.github.io/cronolab/${NADA}"
echo ""
