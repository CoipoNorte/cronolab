# 🤖 scripts/ — automatización de CronoLab

Todo lo necesario para instalar, desarrollar, subir y publicar el proyecto sin pelearse con la terminal.

## Cómo está organizado

Hay **dos capas**, para que funcione igual en cualquier sistema:

| Capa | Archivos | Qué son |
|------|----------|---------|
| **Lógica** | `push.mjs`, `ship.mjs`, `clean.mjs` | Scripts de Node.js. Multiplataforma. Los llama `npm run …` |
| **Lanzadores** | `*.bat` (Windows), `ship.sh` (macOS/Linux) | Doble clic y listo. Comprueban requisitos y llaman a la lógica |

Así, `npm run ship` y `scripts\ship.bat` hacen exactamente lo mismo.

---

## Los lanzadores de Windows

Todos se pueden ejecutar con **doble clic** desde el explorador de archivos.

### `../cronolab.bat` — panel de control
El punto de entrada recomendado. Menú con todas las acciones numeradas.

### `setup.bat` — primera instalación
Para cuando acabas de clonar el repositorio:
1. Comprueba que existen Node.js y git (y abre las descargas si faltan)
2. Instala las dependencias
3. Inicializa git y conecta el remoto `origin`
4. Hace una compilación de prueba

### `dev.bat` — desarrollar
Instala dependencias si hacen falta, arranca Vite y abre el navegador.

### `push.bat` — subir a main
Pide el mensaje del commit y llama a `push.mjs`.

### `deploy.bat` — publicar
Compila y sube `dist/` a la rama `gh-pages`. Al terminar ofrece abrir la web.

### `ship.bat` — subir y publicar
Las dos cosas anteriores en orden. El más usado en el día a día.

---

## La lógica en Node

### `push.mjs`
Push **seguro** a `main`, con seis comprobaciones:

1. ¿Existe el repositorio? Si no, lo inicializa
2. ¿Existe el remoto `origin`? Si no, lo añade
3. ¿Estás en `main`? Si no, cambia de rama
4. `git add -A` + commit (con mensaje automático si no das uno)
5. `git pull --rebase` para no pisar trabajo de otros
6. `git push -u origin main`

Si el rebase da conflicto, se detiene y te explica cómo resolverlo.

```bash
npm run push "arreglar el salto del héroe"
node scripts/push.mjs "arreglar el salto del héroe"
```

### `ship.mjs`
Encadena las tres fases y aborta a la primera que falle:
`push` → `build` → `gh-pages`. Verifica que `dist/index.html` exista y muestra su tamaño.

```bash
npm run ship "nueva batalla ATB"
```

### `clean.mjs`
Borra `dist/`, la caché de Vite y la de gh-pages.

```bash
npm run clean
```

---

## Problemas frecuentes

| Síntoma | Solución |
|---------|----------|
| `'git' no se reconoce…` | Instala [Git para Windows](https://git-scm.com/download/win) y **reinicia la consola** |
| `'node' no se reconoce…` | Instala [Node.js LTS](https://nodejs.org) y reinicia la consola |
| El push pide usuario y contraseña | GitHub ya no acepta contraseñas: crea un [token personal](https://github.com/settings/tokens) y úsalo como contraseña |
| `failed to push some refs` | Alguien subió cambios antes. `npm run push` ya hace `pull --rebase`; vuelve a intentarlo |
| La web publicada no cambia | GitHub Pages tarda 1-2 minutos. Después recarga con `Ctrl + F5` |
| Error 404 en la web | Revisa **Settings → Pages**: debe apuntar a `GitHub Actions` o a la rama `gh-pages` |
| Los acentos se ven raros en el `.bat` | Normal en consolas antiguas; no afecta a nada |
