@echo off
REM Quick Docker Check for DevForge

echo Checking Docker installation...
echo.

docker --version >nul 2>&1
if errorlevel 1 (
    echo [X] Docker is NOT installed
    echo.
    echo Docker Desktop is required for code execution.
    echo.
    echo Download from: https://docs.docker.com/desktop/install/windows-install/
    echo.
    echo After installing Docker:
    echo 1. Restart your computer
    echo 2. Run setup-piston.bat
    echo.
    pause
    exit /b 1
) else (
    echo [OK] Docker is installed!
    docker --version
    echo.

    REM Check if Docker is running
    docker ps >nul 2>&1
    if errorlevel 1 (
        echo [!] Docker is installed but not running
        echo.
        echo Please start Docker Desktop and try again.
        echo.
        pause
        exit /b 1
    ) else (
        echo [OK] Docker is running!
        echo.

        REM Check if Piston is installed
        docker ps | findstr piston >nul 2>&1
        if errorlevel 1 (
            echo [!] Piston is NOT running
            echo.
            echo Run setup-piston.bat to install Piston
            echo.
        ) else (
            echo [OK] Piston is running!
            echo.
            curl -s http://localhost:2000/api/v2/piston/runtimes >nul 2>&1
            if errorlevel 1 (
                echo [!] Piston API not responding
                echo     Try: docker restart piston
            ) else (
                echo [OK] Piston API is working!
                echo.
                echo ============================================
                echo    Everything is ready! Code execution
                echo    will work for all supported languages.
                echo ============================================
            )
        )
        echo.
        pause
        exit /b 0
    )
)
