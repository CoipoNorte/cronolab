@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0\.."
title CronoLab - Ship (subir + publicar)

echo.
echo   ============================================================
echo      CRONOLAB  ^|  SHIP: subir a main Y publicar en gh-pages
echo   ============================================================
echo.
echo   Este script hace, en orden:
echo     1. commit y push a la rama main
echo     2. compilar la web  ^(dist\index.html^)
echo     3. publicar en la rama gh-pages
echo.

where git >nul 2>nul
if errorlevel 1 (
  echo   [ERROR] No se encuentra 'git'. Instalalo desde https://git-scm.com
  echo.
  pause
  exit /b 1
)
where node >nul 2>nul
if errorlevel 1 (
  echo   [ERROR] No se encuentra 'node'. Instala Node.js LTS desde https://nodejs.org
  echo.
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo   Instalando dependencias por primera vez...
  echo.
  call npm install
  if errorlevel 1 (
    echo   [FALLO] No se pudieron instalar las dependencias.
    pause
    exit /b 1
  )
  echo.
)

set "MSG=%~1"
if "%MSG%"=="" (
  set /p "MSG=  Mensaje del commit (ENTER = automatico): "
)

echo.
node scripts\ship.mjs %MSG%
set "CODE=%ERRORLEVEL%"

echo.
if not "%CODE%"=="0" goto fallo

echo   [OK] Todo subido y publicado.
echo.
choice /c SN /n /m "   Abrir la web en el navegador? S = si, N = no: "
if errorlevel 2 goto fin
start "" "https://coiponorte.github.io/cronolab/"
goto fin

:fallo
echo   [FALLO] El proceso se detuvo. Revisa los mensajes de arriba.

:fin

echo.
pause
endlocal & exit /b %CODE%
