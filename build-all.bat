@echo off
setlocal

cd /d "%~dp0"

echo ========================================
echo  Event SOP and Risk Planner - Build Script
echo  Output: NSIS installer + Portable version
echo ========================================
echo.

echo [1/4] Installing dependencies...
call npm install
if errorlevel 1 (
    echo.
    echo [ERROR] npm install failed.
    goto :end
)
echo.

echo [2/4] Running TypeScript type-check...
call npm run type-check
if errorlevel 1 (
    echo.
    echo [ERROR] Type-check failed. Fix issues and retry.
    goto :end
)
echo.

echo [3/4] Running ESLint...
call npm run lint
if errorlevel 1 (
    echo.
    echo [ERROR] Lint failed. Fix issues and retry.
    goto :end
)
echo.

echo [4/4] Building NSIS installer + Portable version...
call npm run build
if errorlevel 1 (
    echo.
    echo [ERROR] electron-builder build failed.
    goto :end
)
echo.

echo ========================================
echo  Build complete. Output in release\ folder:
echo  - NSIS installer: *.exe (with installer wizard)
echo  - Portable: *-portable-*.exe (standalone, no install)
echo ========================================

:end
echo.
pause
endlocal