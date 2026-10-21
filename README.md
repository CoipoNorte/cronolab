<div align="center">

# 🕹️ CronoLab

### Aprende a programar videojuegos 2.5D jugando con ellos

**Siete juegos jugables · dos editores · un tutorial de 8 pasos · puente a Unity — todo en una sola página web.**

[![Ver la web](https://img.shields.io/badge/▶_VER_LA_WEB-coiponorte.github.io/cronolab-ffd23f?style=for-the-badge)](https://coiponorte.github.io/cronolab/)
[![Tutorial](https://img.shields.io/badge/🚀_TUTORIAL-paso_a_paso-4ade80?style=for-the-badge)](https://coiponorte.github.io/cronolab/#/tutorial)

![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind-4-06B6D4?logo=tailwindcss&logoColor=white)
![Licencia MIT](https://img.shields.io/badge/licencia-MIT-ffd23f)

</div>

---

## ¿Qué es esto?

CronoLab es un **curso interactivo en español** para alguien que nunca ha programado y quiere hacer un juego
de desplazamiento lateral 2.5D al estilo *Chrono Trigger*.

La idea es simple: **primero juegas, después entiendes**. Cada juego de la página viene acompañado del código
real que lo mueve, explicado línea a línea y en lenguaje humano. Nada de teoría sin recompensa.

> No hay nada que instalar para aprender. Todo corre en el navegador, incluso sin conexión.

---

## ✨ Qué incluye

### 🎮 Siete juegos, todos jugables

| # | Juego | Lo que enseña |
|---|-------|---------------|
| 1 | **Pradera del Bucle** | bucle de juego, delta time, físicas, parallax 2.5D, cámara con lerp |
| 2 | **Plataformas por tilemap** | el nivel como array de strings, colisión contra tiles |
| 3 | **Aldea de los NPC** | diálogos, máquina de estados, eventos automáticos, inventario |
| 4 | **Arena de evasión** | hordas, IA mínima, combate tipo Mario, sistema de combos |
| 5 | **Mundo RPG cenital** | movimiento en 4 direcciones, misiones, cambio de escena, guardado |
| 6 | **Batalla ATB** | combate por turnos, barras ATB, menús, PM, críticos |
| 7 | **Crono Jump** *(tutorial)* | un clon de Mario con meteoritos, construido en 8 pasos |

### 🛠️ Dos editores en vivo

- **Editor de sprites** — pinta personajes, enemigos, objetos y escenarios píxel a píxel y mira tu dibujo
  caminar al instante. Exporta el resultado como código.
- **Editor de niveles** — diseña tu tilemap con el ratón y pulsa *JUGAR* para probarlo en el acto.
  Exporta a JSON compatible con Tiled y Unity.

### 🚀 Tutorial guiado: "Crono Jump"

Una vista aparte con **8 pasos**, cada uno con su **demo jugable** que solo contiene lo programado hasta ahí:

1. El lienzo y el bucle
2. El héroe y el movimiento
3. Gravedad y salto
4. Obstáculos: bloques, plataformas y pinchos
5. Monedas y puntuación
6. **Proyectiles que caen** (con aviso previo)
7. Daño, vidas e invulnerabilidad
8. Pulido: partículas, temblor, sonido y victoria

Al terminar puedes **descargar el juego completo en un `.html` de 17 KB** que funciona con doble clic,
sin internet y sin instalar nada.

### 🧩 Puente a Unity

Un diccionario de traducción web ↔ Unity y **seis scripts C# descargables** listos para `Assets/Scripts`:
`Movimiento2D`, `Parallax`, `DialogoNPC`, `Pisoton`, `QuestManager` y `SaveSystem`.

### 📦 Centro de descargas

Los `.zip` se generan **en tu navegador** con el código real que está corriendo la página:
los motores en TypeScript, los scripts de Unity y las 26 lecciones comentadas por separado.

---

## ⚡ Empezar en 30 segundos

### Windows (la forma fácil)

Haz doble clic en **`cronolab.bat`** y elige una opción del menú.
Si es tu primera vez, usa `scripts\setup.bat`: comprueba todo, instala y deja el proyecto listo.

### Cualquier sistema

```bash
git clone https://github.com/CoipoNorte/cronolab.git
cd cronolab
npm install
npm run dev
```

Abre <http://localhost:5173> — y el tutorial en <http://localhost:5173/#/tutorial>.

> **Requisito único:** [Node.js 18 o superior](https://nodejs.org). Nada más.

---

## 📜 Comandos disponibles

| Comando | Qué hace |
|---------|----------|
| `npm run dev` | Servidor de desarrollo con recarga automática |
| `npm run build` | Compila todo en un único `dist/index.html` |
| `npm run serve` | Previsualiza la versión compilada en el puerto 4173 |
| `npm run push` | Commit + push seguro a la rama `main` |
| `npm run deploy` | Compila y publica en la rama `gh-pages` |
| `npm run ship` | **Todo junto:** push a `main` + build + deploy |
| `npm run clean` | Borra `dist/` y las cachés |

### Scripts de Windows (`.bat`)

| Archivo | Para qué |
|---------|----------|
| `cronolab.bat` | Panel de control con menú interactivo |
| `scripts\setup.bat` | Primera instalación guiada paso a paso |
| `scripts\dev.bat` | Arranca el modo desarrollo y abre el navegador |
| `scripts\push.bat` | Sube los cambios a `main` |
| `scripts\deploy.bat` | Compila y publica en GitHub Pages |
| `scripts\ship.bat` | Sube **y** publica de una sola vez |

En macOS y Linux: `bash scripts/ship.sh "mi mensaje"`.

---

## 🌍 Publicar tu propia versión

### Opción A — automática (recomendada)

Cada `git push` a `main` dispara el workflow de GitHub Actions
([`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)) que compila y publica solo.

Solo tienes que activarlo una vez:

1. **Settings → Pages → Source:** `GitHub Actions`
2. Haz push a `main` y mira cómo se despliega en la pestaña *Actions*

```bash
npm run push "mi primer cambio"
```

### Opción B — manual desde tu equipo

1. **Settings → Pages → Source:** `Deploy from a branch` → rama `gh-pages` → carpeta `/ (root)`
2. Ejecuta:

```bash
npm run ship "mi primer cambio"
```

En Windows basta con `scripts\ship.bat`.

> **Por qué funciona sin configurar rutas:** `vite-plugin-singlefile` incrusta JavaScript, CSS e imágenes
> dentro de un único `index.html`. No hay peticiones a archivos externos, así que la web funciona en
> cualquier subcarpeta sin tocar `base` en la configuración de Vite.

---

## 🗂️ Estructura del proyecto

```
cronolab/
├─ cronolab.bat              # panel de control (Windows)
├─ scripts/                  # automatización: push, deploy, ship, setup
│  ├─ push.mjs · ship.mjs · clean.mjs      (lógica multiplataforma)
│  └─ *.bat · ship.sh                       (lanzadores)
├─ .github/workflows/
│  └─ deploy.yml             # despliegue automático en cada push
├─ src/
│  ├─ game/                  # ⚙️ los motores: lógica pura, sin React
│  │  ├─ engine.ts           # juego principal: bucle, físicas, parallax, audio
│  │  ├─ sprites.ts          # todos los sprites como arrays de strings
│  │  ├─ minis.ts            # plataformas, diálogos y arena de evasión
│  │  ├─ battle.ts           # combate ATB por turnos
│  │  ├─ topdown.ts          # mundo RPG con misiones y guardado
│  │  ├─ tutorial.ts         # motor progresivo del tutorial (8 pasos)
│  │  ├─ standalone.ts       # genera el juego descargable en .html
│  │  └─ *Snippets.ts        # las lecciones y su código comentado
│  ├─ components/            # 🎨 la interfaz en React
│  │  ├─ MiniFrame.tsx       # marco arcade reutilizable (todos los minis)
│  │  ├─ TutorialPage.tsx    # la vista del proyecto guiado
│  │  ├─ SpriteEditor.tsx · LevelEditor.tsx
│  │  └─ ...
│  └─ App.tsx                # enrutado por hash (#/tutorial)
└─ index.html
```

**Regla de oro del proyecto:** la carpeta `game/` no sabe que React existe. Son motores de juego en
TypeScript plano que exponen `update(dt, input)`, `draw(ctx)` y `hud()`. React solo los monta en un canvas.
Por eso puedes copiar cualquier motor a otro proyecto y funcionará igual.

---

## 🧠 Ruta de aprendizaje sugerida

1. **Juega** la Pradera del Bucle y mueve los sliders de gravedad y salto
2. **Lee** las seis funciones del panel de código
3. **Pinta** un personaje en el editor de sprites
4. **Diseña** un nivel y juégalo
5. **Completa** el tutorial de 8 pasos y descarga tu juego
6. **Descarga** los packs y ábrelos en tu editor
7. **Salta a Unity** con el diccionario y los scripts C#

---

## 🤝 Contribuir

Las ideas, correcciones y mejoras son bienvenidas:

1. Haz un fork y crea una rama: `git checkout -b mi-mejora`
2. Comprueba que compila: `npm run build`
3. Abre un Pull Request explicando qué aporta

Si añades un juego nuevo, respeta la interfaz `Mini` (`update` / `draw` / `hud`) para que encaje
automáticamente en el marco arcade.

---

## 📄 Licencia

[MIT](LICENSE) — úsalo, modifícalo y publica tu propia versión.
Si te sirvió para hacer tu primer juego, cuéntamelo: eso es el mejor agradecimiento posible.

---

<div align="center">

**Hecho con nostalgia de 16 bits.**
Bucles, sprites y un puñado de números. Nada más.

[🎮 Jugar ahora](https://coiponorte.github.io/cronolab/) · [🚀 Ir al tutorial](https://coiponorte.github.io/cronolab/#/tutorial)

</div>
