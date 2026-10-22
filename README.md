<div align="center">

# 🕹️ CronoLab

### Aprende a programar videojuegos 2.5D jugando con ellos

**Ocho juegos · dos editores · 13 micro-demos · narrativa · producción · sistemas avanzados · combate y balance · Unity y Godot.**

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

### 🎮 Ocho juegos y simuladores, todos interactivos

| # | Juego | Lo que enseña |
|---|-------|---------------|
| 1 | **Pradera del Bucle** | bucle de juego, delta time, físicas, parallax 2.5D, cámara con lerp |
| 2 | **Plataformas por tilemap** | el nivel como array de strings, colisión contra tiles |
| 3 | **Aldea de los NPC** | diálogos, máquina de estados, eventos automáticos, inventario |
| 4 | **Arena de evasión** | hordas, IA mínima, combate tipo Mario, sistema de combos |
| 5 | **Mundo RPG cenital** | movimiento en 4 direcciones, misiones, cambio de escena, guardado |
| 6 | **Batalla ATB** | combate por turnos, barras ATB, menús, PM, críticos |
| 7 | **Crono Jump** *(tutorial)* | clon de Mario con meteoritos, enemigos, power-ups y 3 niveles, en 14 pasos |
| 8 | **Sala de depuración** | hitboxes, sensores, vectores, breakpoints y avance por fotograma |

### 🛠️ Dos editores en vivo

- **Editor de sprites** — pinta personajes, enemigos, objetos y escenarios píxel a píxel y mira tu dibujo
  caminar al instante. Exporta el resultado como código.
- **Editor de niveles** — diseña tu tilemap con el ratón y pulsa *JUGAR* para probarlo en el acto.
  Exporta a JSON compatible con Tiled y Unity.

### Laboratorios de producción

- **13 mecánicas de game feel** — coyote time, salto variable, doble salto, buffer, dash, cámara con zona
  muerta, hitstop, IA por estados, object pooling, power-ups y curvas de animación. Cada demo permite
  activar/desactivar la técnica para comparar la misma escena.
- **Taller narrativo ramificado** — editor de nodos, decisiones, condiciones, efectos, variables de prueba,
  eventos, validación automática de rutas e importación/exportación JSON.
- **Laboratorio de depuración** — pausa, avance fotograma a fotograma, cámara lenta, hitboxes, sensores,
  vectores, IDs, puntos de contacto, inspector en vivo, registro de eventos y breakpoints de juego.
- **Sistemas de producción** — mezclador de audio por canales, tres ranuras con migraciones, logros por
  eventos, localización con plurales en tres idiomas y accesibilidad con movimiento reducido y modos de color.
- **Sistemas avanzados** — generación procedural reproducible, controles reasignables con gamepad,
  inventario/crafting/economía y replays deterministas con telemetría local.
- **Combate y balance** — fórmula de daño explicable, resistencias elementales, estados apilables,
  jefes por fases, simulación Monte Carlo de miles de batallas y botín ponderado.

### 🚀 Tutorial guiado: "Crono Jump"

Una vista aparte con **14 pasos**, cada uno con su **demo jugable** que solo contiene lo programado hasta ahí:

| # | Paso | Sistema que enseña |
|---|------|--------------------|
| 1 | El lienzo y el bucle | canvas, delta time, separar update y draw |
| 2 | El héroe y el movimiento | entrada, inercia, cámara con lerp |
| 3 | Gravedad y salto | integración, buffer de salto |
| 4 | Obstáculos | AABB, resolver X e Y por separado |
| 5 | Monedas y puntuación | recolección, feedback, falso 3D |
| 6 | **Proyectiles que caen** | spawner, aviso previo, dificultad creciente |
| 7 | Daño, vidas e invulnerabilidad | temporizadores, parpadeo, game over |
| 8 | Pulido: jugo | partículas, temblor, sonido, victoria |
| 9 | **Enemigos y combos** | patrulla, pisotón, multiplicador con tiempo |
| 10 | **Power-ups temporales** | escudo que absorbe daño, imán que atrae monedas |
| 11 | **Checkpoints** | punto de reaparición, perder sin frustrarse |
| 12 | **Menú de pausa** | congelar el mundo, navegación, latch de teclas |
| 13 | **Varios niveles** | reiniciar el mundo sin reiniciar la partida |
| 14 | **Récord guardado** | localStorage con try/catch, persistencia real |

Al terminar puedes **descargar el juego completo en un `.html` de 26 KB** que funciona con doble clic,
sin internet y sin instalar nada.

### 🧰 Guía de instalación de motores

Una vista dedicada (`#/instalar`) que acompaña el salto del navegador a un motor real:

- **Unity** y **Godot** con sus pasos reales, marcables uno a uno y guardados en el navegador
- Requisitos de hardware honestos (disco, RAM, procesador) para cada opción
- Tabla comparativa: precio, tamaño, lenguaje, curva de aprendizaje y juegos famosos
- Tu primer script en **C#** y en **GDScript**, equivalentes al paso 3 del tutorial
- Seis problemas típicos de la primera instalación con su solución

### 🧩 Puente a Unity

Un diccionario de traducción web ↔ Unity y **seis scripts C# descargables** listos para `Assets/Scripts`:
`Movimiento2D`, `Parallax`, `DialogoNPC`, `Pisoton`, `QuestManager` y `SaveSystem`.

Además, el Centro de Descargas genera tres ZIP específicos para Unity 6:

| ZIP | Contenido |
|-----|-----------|
| **Crono Jump · Proyecto completo** | Proyecto Unity 6.3 LTS; genera escena, jugador, plataformas, monedas, slimes, meteoritos, checkpoints, HUD, tres niveles y récord |
| **RPG Pack** | DialogueRunner desde JSON, condiciones, efectos, QuestManager, inventario, SaveSystem y portales |
| **Production Pack** | Audio por canales, logros, localización, accesibilidad y tres ranuras JSON |

El proyecto completo usa `RuntimeInitializeOnLoadMethod`: abre la escena generada y pulsa **Play**, sin configurar prefabs ni importar imágenes.

### ZIPS para Godot 4

| ZIP | Contenido |
|-----|-----------|
| **Crono Jump · Proyecto completo** | Proyecto importable con `project.godot`, escena principal, CharacterBody2D, monedas, slimes, meteoritos, checkpoints, HUD, tres niveles y récord |
| **Godot RPG Pack** | Diálogo JSON, condiciones, efectos, señales, misiones, inventario, SaveSlots y portales de escena |
| **Godot Production Pack** | AudioServer por buses, logros, localización, accesibilidad y tres ranuras JSON |

El proyecto no necesita addons ni imágenes externas: importa `CronoJump-Godot/project.godot` en el Project Manager y pulsa **Play**.

### 📦 Centro de descargas

Los `.zip` se generan **en tu navegador** con el código real que está corriendo la página:
los dieciséis motores y generadores en TypeScript, el juego en .html, ocho packs de motor y 73 lecciones comentadas.

### Sistemas de producción incluidos

| Sistema | Ejemplo práctico |
|---------|------------------|
| Mezclador de audio | Canales master, música, SFX y UI; diseñador de sonidos WebAudio |
| Ranuras de guardado | Tres slots reales, exportación/importación y migración v1 → v2 |
| Logros | Seis logros progresivos y ocultos conectados a eventos del juego |
| Localización | Español, inglés y portugués con variables, plurales y fallback visible |
| Accesibilidad | Movimiento reducido, contraste, texto, temblor, flashes, subtítulos y daltonismo |

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
│  │  ├─ mechanics.ts        # 13 micro-demos de game feel
│  │  ├─ narrative.ts        # grafo de diálogo, condiciones, efectos y validación
│  │  ├─ debugWorld.ts       # escena instrumentada con hitboxes y breakpoints
│  │  ├─ production.ts       # audio, ranuras, logros, idiomas y accesibilidad
│  │  ├─ unityPacks.ts       # genera los proyectos y packs ZIP de Unity
│  │  ├─ godotPacks.ts       # genera los proyectos y packs ZIP de Godot
│  │  ├─ advancedSystems.ts  # procedural, controles, crafting, replay y telemetría
│  │  ├─ combatSystems.ts    # daño, estados, fases, simulación y botín
│  │  ├─ combatPacks.ts      # packs de combate para Unity y Godot
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
5. **Compara** las 13 mecánicas con sus interruptores
6. **Ramifica** una conversación y prueba condiciones narrativas
7. **Depura** una colisión con pausa y avance de un frame
8. **Completa** el tutorial de 14 pasos y descarga tu juego
9. **Descarga** los packs y ábrelos en tu editor
10. **Instala Unity o Godot** con la guía paso a paso y reconstruye Crono Jump

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
