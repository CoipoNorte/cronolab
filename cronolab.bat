@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion
title CronoLab - Panel de control
cd /d "%~dp0"

:menu
cls
echo.
echo   ============================================================
echo      C R O N O L A B   ^|   Panel de control
echo      https://github.com/CoipoNorte/cronolab
echo   ============================================================
echo.
echo     [1]  Instalar dependencias        (npm install)
echo     [2]  Modo desarrollo              (npm run dev)
echo     [3]  Compilar la web              (npm run build)
echo     [4]  Previsualizar lo compilado   (npm run serve)
echo.
echo     [5]  Subir cambios a main         (git push)
echo     [6]  Publicar en GitHub Pages     (gh-pages)
echo     [7]  TODO: subir + publicar       (ship)
echo.
echo     [8]  Limpiar archivos generados   (npm run clean)
echo     [9]  Abrir la web publicada
echo     [0]  Salir
echo.
set "op="
set /p "op=  Elige una opcion y pulsa ENTER: "

if "%op%"=="1" goto install
if "%op%"=="2" goto dev
if "%op%"=="3" goto build
if "%op%"=="4" goto serve
if "%op%"=="5" goto push
if "%op%"=="6" goto deploy
if "%op%"=="7" goto ship
if "%op%"=="8" goto clean
if "%op%"=="9" goto abrir
if "%op%"=="0" goto fin
goto menu

:install
cls & echo. & echo   Instalando dependencias... & echo.
call npm install
goto pausa

:dev
cls & echo. & echo   Arrancando el servidor de desarrollo... & echo.
echo   Abre http://localhost:5173 en tu navegador.
echo   Pulsa CTRL+C en esta ventana para detenerlo.
echo.
call npm run dev
goto pausa

:build
cls & echo. & echo   Compilando (genera dist\index.html)... & echo.
call npm run build
goto pausa

:serve
cls & echo. & echo   Sirviendo la version compilada en http://localhost:4173 & echo.
call npm run serve
goto pausa

:push
cls & echo.
call scripts\push.bat
goto pausa

:deploy
cls & echo.
call scripts\deploy.bat
goto pausa

:ship
cls & echo.
call scripts\ship.bat
goto pausa

:clean
cls & echo. & echo   Limpiando archivos generados... & echo.
call npm run clean
goto pausa

:abrir
start "" "https://coiponorte.github.io/cronolab/"
goto menu

:pausa
echo.
echo   ------------------------------------------------------------
pause
goto menu

:fin
endlocal
exit /b 0
