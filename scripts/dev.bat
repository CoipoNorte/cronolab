@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0\.."
title CronoLab - Desarrollo

echo.
echo   ============================================================
echo      CRONOLAB  ^|  MODO DESARROLLO
echo   ============================================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo   [ERROR] No se encuentra 'node'. Instala Node.js LTS desde https://nodejs.org
  echo.
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo   Primera ejecucion: instalando dependencias...
  echo.
  call npm install
  if errorlevel 1 (
    echo   [FALLO] No se pudieron instalar las dependencias.
    pause
    exit /b 1
  )
  echo.
)

echo   Arrancando Vite...
echo.
echo     Web:      http://localhost:5173
echo     Tutorial: http://localhost:5173/#/tutorial
echo.
echo   Los cambios en src\ se recargan solos.
echo   Pulsa CTRL+C para detener el servidor.
echo.

timeout /t 3 >nul
start "" "http://localhost:5173"
call npm run dev

endlocal & exit /b 0
