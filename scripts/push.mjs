#!/usr/bin/env node
/* ============================================================
   push.mjs — sube los cambios a la rama main de forma segura.

   Qué hace, en orden:
     1. comprueba que estás dentro de un repo git
     2. crea el remoto "origin" si no existe
     3. se asegura de estar en la rama main
     4. hace add + commit (si hay algo que guardar)
     5. hace pull --rebase para no pisar trabajo ajeno
     6. hace push a origin main

   Uso:  npm run push  "mensaje del commit"
         node scripts/push.mjs "mensaje del commit"
   ============================================================ */

import { execSync, spawnSync } from "node:child_process";

const REPO = "https://github.com/CoipoNorte/cronolab.git";
const BRANCH = "main";

const c = {
  reset: "\x1b[0m", bold: "\x1b[1m", dim: "\x1b[2m",
  green: "\x1b[32m", yellow: "\x1b[33m", red: "\x1b[31m",
  cyan: "\x1b[36m", magenta: "\x1b[35m",
};

const log = (msg) => console.log(msg);
const step = (n, msg) => log(`${c.cyan}${c.bold}[${n}]${c.reset} ${msg}`);
const ok = (msg) => log(`${c.green}  ✓${c.reset} ${msg}`);
const warn = (msg) => log(`${c.yellow}  !${c.reset} ${msg}`);
const fail = (msg) => log(`${c.red}  ✗${c.reset} ${msg}`);

/** ejecuta y devuelve stdout; null si falla */
function run(cmd, { silent = true } = {}) {
  try {
    return execSync(cmd, { encoding: "utf8", stdio: silent ? "pipe" : "inherit" })?.trim() ?? "";
  } catch {
    return null;
  }
}

/** ejecuta mostrando la salida; devuelve true/false */
function runLive(cmd) {
  const parts = cmd.split(" ");
  const res = spawnSync(parts[0], parts.slice(1), { stdio: "inherit", shell: true });
  return res.status === 0;
}

log("");
log(`${c.magenta}${c.bold}  ╔══════════════════════════════════════╗${c.reset}`);
log(`${c.magenta}${c.bold}  ║   CRONOLAB · PUSH A MAIN             ║${c.reset}`);
log(`${c.magenta}${c.bold}  ╚══════════════════════════════════════╝${c.reset}`);
log("");

/* ---------- 1. ¿hay repositorio? ---------- */
step(1, "Comprobando repositorio git...");
if (run("git rev-parse --is-inside-work-tree") === null) {
  warn("No hay repositorio. Inicializando uno nuevo...");
  if (!runLive("git init")) { fail("No se pudo ejecutar 'git init'. ¿Está git instalado?"); process.exit(1); }
  ok("Repositorio creado");
} else ok("Repositorio encontrado");

/* ---------- 2. remoto origin ---------- */
step(2, "Comprobando el remoto 'origin'...");
const origin = run("git remote get-url origin");
if (!origin) {
  runLive(`git remote add origin ${REPO}`);
  ok(`Remoto añadido: ${REPO}`);
} else {
  ok(`Remoto actual: ${origin}`);
}

/* ---------- 3. rama main ---------- */
step(3, `Asegurando la rama '${BRANCH}'...`);
const branch = run("git rev-parse --abbrev-ref HEAD");
if (branch === null || branch === "HEAD") {
  runLive(`git checkout -B ${BRANCH}`);
  ok(`Rama '${BRANCH}' creada`);
} else if (branch !== BRANCH) {
  warn(`Estabas en '${branch}'. Cambiando a '${BRANCH}'...`);
  if (!runLive(`git checkout -B ${BRANCH}`)) { fail("No se pudo cambiar de rama"); process.exit(1); }
  ok(`Ahora en '${BRANCH}'`);
} else ok(`Ya estás en '${BRANCH}'`);

/* ---------- 4. commit ---------- */
step(4, "Guardando cambios...");
const status = run("git status --porcelain");
if (!status) {
  warn("No hay cambios que guardar (el árbol está limpio)");
} else {
  const files = status.split("\n").length;
  log(`${c.dim}     ${files} archivo(s) con cambios${c.reset}`);
  runLive("git add -A");

  const args = process.argv.slice(2).filter((a) => a !== "--");
  const stamp = new Date().toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" });
  const message = args.length ? args.join(" ") : `actualizar CronoLab · ${stamp}`;

  if (!runLive(`git commit -m "${message.replace(/"/g, "'")}"`)) {
    warn("No se creó commit (quizá no había nada en el índice)");
  } else ok(`Commit: "${message}"`);
}

/* ---------- 5. traer cambios remotos ---------- */
step(5, "Sincronizando con el remoto...");
const hasRemoteBranch = run(`git ls-remote --heads origin ${BRANCH}`);
if (hasRemoteBranch) {
  if (runLive(`git pull --rebase origin ${BRANCH}`)) ok("Sincronizado con origin/main");
  else {
    fail("Conflicto al hacer rebase. Resuélvelo y vuelve a ejecutar:");
    log(`${c.dim}     git status            → ver los conflictos${c.reset}`);
    log(`${c.dim}     git rebase --continue → seguir tras arreglarlos${c.reset}`);
    log(`${c.dim}     git rebase --abort    → cancelar y dejarlo como estaba${c.reset}`);
    process.exit(1);
  }
} else {
  warn("La rama remota todavía no existe: será el primer push");
}

/* ---------- 6. push ---------- */
step(6, `Subiendo a origin/${BRANCH}...`);
if (!runLive(`git push -u origin ${BRANCH}`)) {
  fail("El push falló. Causas típicas:");
  log(`${c.dim}     · no tienes permisos en el repositorio${c.reset}`);
  log(`${c.dim}     · falta autenticarte (usa un token personal de GitHub)${c.reset}`);
  log(`${c.dim}     · el remoto apunta a otra URL (git remote -v)${c.reset}`);
  process.exit(1);
}

log("");
ok(`${c.bold}¡Listo! Código en https://github.com/CoipoNorte/cronolab${c.reset}`);
log(`${c.dim}  Siguiente paso: npm run deploy  (publica la web en gh-pages)${c.reset}`);
log("");
