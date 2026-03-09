@echo off
chcp 65001 >nul
set "ROOT=%~dp0"
title Microgrid Advisor

echo [Backend] Starting FastAPI...
start /B cmd /c "cd /d %ROOT%backend && python app/main.py > %ROOT%backend\server.log 2>&1"

echo [Frontend] Starting Vite dev server...
echo.
echo   Frontend ^> http://localhost:5173
echo   Backend  ^> http://localhost:6001/docs
echo   (Press Ctrl+C to stop both)
echo.

timeout /t 3 /nobreak >nul
start "" "http://localhost:5173/"

cd /d %ROOT%frontend
npm run dev
