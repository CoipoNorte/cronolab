@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0\.."
title CronoLab - Subir a main

echo.
echo   ============================================================
echo      CRONOLAB  ^|  SUBIR CAMBIOS A LA RAMA MAIN
echo   ============================================================
echo.

:: --- comprobar que git existe ---
where git >nul 2>nul
if errorlevel 1 (
  echo   [ERROR] No se encuentra 'git'.
  echo   Instalalo desde https://git-scm.com/download/win y reinicia la consola.
  echo.
  pause
  exit /b 1
)

:: --- comprobar que node existe ---
where node >nul 2>nul
if errorlevel 1 (
  echo   [ERROR] No se encuentra 'node'.
  echo   Instala Node.js LTS desde https://nodejs.org
  echo.
  pause
  exit /b 1
)

:: --- mensaje del commit: parametro o automatico ---
set "MSG=%~1"
if "%MSG%"=="" (
  set /p "MSG=  Mensaje del commit (ENTER = automatico): "
)

echo.
node scripts\push.mjs %MSG%
set "CODE=%ERRORLEVEL%"

echo.
if "%CODE%"=="0" (
  echo   [OK] Cambios subidos correctamente a main.
) else (
  echo   [FALLO] Algo salio mal. Revisa los mensajes de arriba.
)
echo.
endlocal & exit /b %CODE%
