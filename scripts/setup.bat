@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0\.."
title CronoLab - Primera instalacion

echo.
echo   ============================================================
echo      CRONOLAB  ^|  PRIMERA INSTALACION
echo   ============================================================
echo.
echo   Este script prepara el proyecto desde cero:
echo     1. comprueba Node.js y git
echo     2. instala las dependencias
echo     3. conecta el repositorio de GitHub
echo     4. hace una compilacion de prueba
echo.
pause
echo.

echo   [1/4] Comprobando herramientas...
where node >nul 2>nul
if errorlevel 1 (
  echo        [ERROR] Falta Node.js. Descargalo aqui: https://nodejs.org
  start "" "https://nodejs.org"
  pause
  exit /b 1
)
for /f "tokens=*" %%v in ('node -v') do echo        Node.js %%v  OK
where git >nul 2>nul
if errorlevel 1 (
  echo        [AVISO] Falta git: podras desarrollar pero no subir ni publicar.
  echo        Descargalo en https://git-scm.com/download/win
) else (
  for /f "tokens=3" %%v in ('git --version') do echo        git %%v  OK
)

echo.
echo   [2/4] Instalando dependencias (puede tardar un par de minutos)...
echo.
call npm install
if errorlevel 1 (
  echo.
  echo        [FALLO] npm install no termino bien.
  pause
  exit /b 1
)

echo.
echo   [3/4] Conectando con GitHub...
where git >nul 2>nul
if errorlevel 1 goto sin_git

if exist ".git" goto hay_repo
git init >nul 2>nul
git checkout -B main >nul 2>nul
echo        Repositorio git inicializado en la rama main.

:hay_repo
git remote get-url origin >nul 2>nul
if errorlevel 1 goto add_remote
for /f "tokens=*" %%r in ('git remote get-url origin') do echo        Remoto ya configurado: %%r
goto fin_git

:add_remote
git remote add origin https://github.com/CoipoNorte/cronolab.git
echo        Remoto 'origin' conectado al repositorio de CronoLab.
goto fin_git

:sin_git
echo        Saltado: git no esta instalado.

:fin_git

echo.
echo   [4/4] Compilacion de prueba...
echo.
call npm run build
if errorlevel 1 (
  echo.
  echo        [FALLO] La compilacion dio error.
  pause
  exit /b 1
)

echo.
echo   ============================================================
echo      TODO LISTO
echo.
echo      npm run dev     - desarrollar (http://localhost:5173)
echo      cronolab.bat    - panel de control con menu
echo      scripts\ship.bat- subir a main y publicar la web
echo   ============================================================
echo.
pause
endlocal & exit /b 0
