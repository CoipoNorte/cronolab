@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0\.."
title CronoLab - Publicar en GitHub Pages

echo.
echo   ============================================================
echo      CRONOLAB  ^|  PUBLICAR EN GITHUB PAGES (rama gh-pages)
echo   ============================================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo   [ERROR] No se encuentra 'node'. Instala Node.js LTS desde https://nodejs.org
  echo.
  pause
  exit /b 1
)

:: --- dependencias instaladas? ---
if not exist "node_modules" (
  echo   [1/3] No hay node_modules. Instalando dependencias...
  echo.
  call npm install
  if errorlevel 1 (
    echo.
    echo   [FALLO] No se pudieron instalar las dependencias.
    pause
    exit /b 1
  )
) else (
  echo   [1/3] Dependencias encontradas.
)

echo.
echo   [2/3] Compilando la web...
echo.
call npm run build
if errorlevel 1 (
  echo.
  echo   [FALLO] Error al compilar. Corrige los errores y vuelve a intentarlo.
  echo.
  pause
  exit /b 1
)

if not exist "dist\index.html" (
  echo.
  echo   [FALLO] No se genero dist\index.html
  echo.
  pause
  exit /b 1
)

echo.
echo   [3/3] Subiendo dist\ a la rama gh-pages...
echo.
call npx gh-pages -d dist -b gh-pages --dotfiles
if errorlevel 1 (
  echo.
  echo   [FALLO] No se pudo publicar.
  echo   Comprueba que:
  echo     - el remoto 'origin' apunta a tu repositorio  ^(git remote -v^)
  echo     - tienes permisos y estas autenticado en GitHub
  echo.
  pause
  exit /b 1
)

echo.
echo   ============================================================
echo      PUBLICADO CORRECTAMENTE
echo.
echo      Web:  https://coiponorte.github.io/cronolab/
echo.
echo      Si es la primera vez, activa GitHub Pages en:
echo      Settings ^> Pages ^> Branch: gh-pages ^> carpeta raiz
echo   ============================================================
echo.

choice /c SN /n /m "   Abrir la web en el navegador? S = si, N = no: "
if errorlevel 2 goto fin
start "" "https://coiponorte.github.io/cronolab/"

:fin
echo.
endlocal & exit /b 0
