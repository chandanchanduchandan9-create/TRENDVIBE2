@echo off
title AI Outbound Voice Agent - Launcher
cd /d "%~dp0"

echo ==================================================
echo   TrendRaj AI Outbound Voice Agent - Demo Launcher
echo ==================================================
echo.

REM 1. Start ngrok tunnel if not already running on port 4040
powershell -NoProfile -Command "try { Invoke-WebRequest -UseBasicParsing -Uri 'http://127.0.0.1:4040/api/tunnels' -TimeoutSec 1 | Out-Null; exit 0 } catch { exit 1 }"
if %errorlevel% neq 0 (
    echo [*] Starting ngrok public tunnel on port 8000...
    where ngrok >nul 2>nul
    if %errorlevel% equ 0 (
        start "ngrok Tunnel" /min cmd /k "ngrok http 8000"
    ) else if exist "%LOCALAPPDATA%\Microsoft\WinGet\Links\ngrok.exe" (
        start "ngrok Tunnel" /min cmd /k ""%LOCALAPPDATA%\Microsoft\WinGet\Links\ngrok.exe" http 8000"
    ) else (
        start "ngrok Tunnel" /min cmd /k ""%LOCALAPPDATA%\Microsoft\WinGet\Packages\ngrok.ngrok_Microsoft.Winget.Source_8wekyb3d8bbwe\ngrok.exe" http 8000"
    )
    timeout /t 2 /nobreak >nul
) else (
    echo [+] ngrok tunnel is already running.
)

REM 2. Start Python voice server if not already running on port 8000
powershell -NoProfile -Command "try { Invoke-WebRequest -UseBasicParsing -Uri 'http://127.0.0.1:8000/health' -TimeoutSec 1 | Out-Null; exit 0 } catch { exit 1 }"
if %errorlevel% neq 0 (
    echo [*] Starting AI Voice Server on port 8000...
    start "AI Voice Server" /min cmd /k "python agent_server.py"
) else (
    echo [+] AI Voice Server is already running.
)

REM 3. Wait for server health and launch browser dashboard
echo [*] Waiting for dashboard to become ready...
powershell -NoProfile -Command "for ($i=0; $i -lt 20; $i++) { try { $r = Invoke-WebRequest -UseBasicParsing -Uri 'http://127.0.0.1:8000/health' -TimeoutSec 1; if ($r.StatusCode -eq 200) { exit 0 } } catch {}; Start-Sleep -Milliseconds 500 }; exit 1"

echo [+] Opening Demo Dashboard: http://localhost:8000/
start "" "http://localhost:8000/"
echo.
echo Keep the minimized ngrok and AI Voice Server windows open during your demo.
timeout /t 3 /nobreak >nul
