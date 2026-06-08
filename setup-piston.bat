@echo off
REM DevForge - Piston Code Execution Setup Script (Windows)
REM This script sets up Piston for running code in all supported languages

echo.
echo ======================================================
echo   DevForge - Setting up Piston Code Execution
echo ======================================================
echo.

REM Check if Docker is installed
docker --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker is not installed!
    echo.
    echo Please install Docker Desktop for Windows:
    echo https://docs.docker.com/desktop/install/windows-install/
    echo.
    pause
    exit /b 1
)

echo [OK] Docker is installed
echo.

REM Check if Piston container exists
docker ps -a | findstr piston >nul 2>&1
if not errorlevel 1 (
    echo [INFO] Piston container already exists
    echo       Stopping and removing old container...
    docker stop piston >nul 2>&1
    docker rm piston >nul 2>&1
    echo [OK] Old container removed
    echo.
)

REM Pull and run Piston
echo [INFO] Pulling Piston Docker image...
docker pull ghcr.io/engineer-man/piston

echo.
echo [WARNING] Piston requires privileged mode for cgroup access.
echo            This gives the container extensive system access.
echo            Only use on trusted local development machines.
echo.
echo [INFO] Starting Piston container...
docker run -d --name piston --privileged --restart unless-stopped -p 2000:2000 -v piston_packages:/piston/packages ghcr.io/engineer-man/piston

echo.
echo [INFO] Waiting for Piston to start...
timeout /t 5 /nobreak >nul

REM Test if Piston is running
curl -s http://localhost:2000/api/v2/runtimes >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Piston failed to start
    echo        Check Docker logs: docker logs piston
    pause
    exit /b 1
)

echo [OK] Piston container is running!
echo.
echo [NOTE] The container is running but has NO language packages installed.
echo        Language runtimes must be installed separately (advanced setup).
echo        For now, code execution will use local Node.js/Python fallback.
echo.

REM Configure backend
echo [INFO] Configuring backend...

if not exist backend\.env (
    echo PISTON_URL=http://localhost:2000/api/v2/piston/execute > backend\.env
) else (
    REM Check if PISTON_URL already exists
    findstr /C:"PISTON_URL" backend\.env >nul 2>&1
    if errorlevel 1 (
        echo PISTON_URL=http://localhost:2000/api/v2/piston/execute >> backend\.env
    ) else (
        echo [INFO] PISTON_URL already configured in .env
    )
)

echo [OK] Backend configuration updated
echo.
echo ======================================================
echo   Setup Complete!
echo ======================================================
echo.
echo Supported Languages:
echo   - JavaScript / TypeScript
echo   - Python
echo   - Java
echo   - C / C++
echo   - Go
echo   - Rust
echo   - Bash
echo.
echo Next Steps:
echo   1. Restart your backend server
echo   2. Go to any room - Code tab
echo   3. Write code and click Run!
echo.
echo Useful Commands:
echo   View logs:    docker logs piston
echo   Stop Piston:  docker stop piston
echo   Start Piston: docker start piston
echo   Remove:       docker stop piston ^&^& docker rm piston
echo.
pause
