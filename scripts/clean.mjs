#!/usr/bin/env node
/* ============================================================
   clean.mjs — borra lo generado para empezar de cero.
   Elimina dist/, la caché de Vite y la caché de gh-pages.
   Uso:  npm run clean
   ============================================================ */

import { rmSync, existsSync } from "node:fs";

const TARGETS = [
  "dist",
  "node_modules/.vite",
  "node_modules/.cache/gh-pages",
  ".vite",
];

const c = { reset: "\x1b[0m", green: "\x1b[32m", dim: "\x1b[2m", cyan: "\x1b[36m", bold: "\x1b[1m" };

console.log("");
console.log(`${c.cyan}${c.bold}  CRONOLAB · LIMPIEZA${c.reset}`);
console.log("");

let borrados = 0;
for (const target of TARGETS) {
  if (existsSync(target)) {
    rmSync(target, { recursive: true, force: true });
    console.log(`${c.green}  ✓${c.reset} borrado  ${target}`);
    borrados++;
  } else {
    console.log(`${c.dim}  ·  no existe ${target}${c.reset}`);
  }
}

console.log("");
console.log(`${c.green}  ${borrados} carpeta(s) eliminada(s). Ejecuta 'npm run build' para regenerar.${c.reset}`);
console.log("");
