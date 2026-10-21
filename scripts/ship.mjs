#!/usr/bin/env node
/* ============================================================
   ship.mjs — "enviar todo": guarda, compila, sube y publica.

   Es la cadena completa en un solo comando:
     1. npm run push    → commit + push a main
     2. npm run build   → genera dist/index.html (archivo único)
     3. npm run deploy  → publica dist/ en la rama gh-pages

   Uso:  npm run ship  "mensaje del commit"
   ============================================================ */

import { spawnSync } from "node:child_process";
import { existsSync, statSync } from "node:fs";

const c = {
  reset: "\x1b[0m", bold: "\x1b[1m", dim: "\x1b[2m",
  green: "\x1b[32m", yellow: "\x1b[33m", red: "\x1b[31m",
  cyan: "\x1b[36m", magenta: "\x1b[35m",
};

function phase(title) {
  console.log("");
  console.log(`${c.magenta}${c.bold}━━━ ${title} ${"━".repeat(Math.max(0, 44 - title.length))}${c.reset}`);
  console.log("");
}

function run(cmd) {
  const res = spawnSync(cmd, { stdio: "inherit", shell: true });
  return res.status === 0;
}

const args = process.argv.slice(2).filter((a) => a !== "--");
const message = args.length ? args.join(" ") : "";

console.log("");
console.log(`${c.cyan}${c.bold}  ╔══════════════════════════════════════╗${c.reset}`);
console.log(`${c.cyan}${c.bold}  ║   CRONOLAB · SHIP (push + deploy)    ║${c.reset}`);
console.log(`${c.cyan}${c.bold}  ╚══════════════════════════════════════╝${c.reset}`);

/* ---------- 1. push ---------- */
phase("1/3 · GUARDAR Y SUBIR A MAIN");
if (!run(`node scripts/push.mjs ${message ? JSON.stringify(message) : ""}`)) {
  console.log(`${c.red}  ✗ Falló el push. Se cancela el despliegue.${c.reset}`);
  process.exit(1);
}

/* ---------- 2. build ---------- */
phase("2/3 · COMPILANDO LA WEB");
if (!run("npm run build")) {
  console.log(`${c.red}  ✗ Falló la compilación. Revisa los errores de arriba.${c.reset}`);
  process.exit(1);
}
if (!existsSync("dist/index.html")) {
  console.log(`${c.red}  ✗ No se generó dist/index.html${c.reset}`);
  process.exit(1);
}
const kb = Math.round(statSync("dist/index.html").size / 1024);
console.log(`${c.green}  ✓${c.reset} dist/index.html generado (${kb} KB, archivo único)`);

/* ---------- 3. deploy ---------- */
phase("3/3 · PUBLICANDO EN GH-PAGES");
if (!run("npx gh-pages -d dist -b gh-pages --dotfiles")) {
  console.log(`${c.red}  ✗ Falló el despliegue.${c.reset}`);
  console.log(`${c.dim}    Recuerda activar GitHub Pages en:${c.reset}`);
  console.log(`${c.dim}    Settings → Pages → Branch: gh-pages / (root)${c.reset}`);
  process.exit(1);
}

console.log("");
console.log(`${c.green}${c.bold}  ╔══════════════════════════════════════╗${c.reset}`);
console.log(`${c.green}${c.bold}  ║   ¡DESPLEGADO CON ÉXITO!             ║${c.reset}`);
console.log(`${c.green}${c.bold}  ╚══════════════════════════════════════╝${c.reset}`);
console.log("");
console.log(`  ${c.bold}Código:${c.reset}  https://github.com/CoipoNorte/cronolab`);
console.log(`  ${c.bold}Web:${c.reset}     https://coiponorte.github.io/cronolab/`);
console.log("");
console.log(`${c.dim}  (GitHub puede tardar 1-2 minutos en refrescar la página)${c.reset}`);
console.log("");
