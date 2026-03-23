@echo off
echo Cleaning up Nuxt project temporary files and folders...
echo.

REM Delete .nuxt folder (Nuxt build cache)
if exist ".nuxt" (
    echo Deleting .nuxt folder...
    rmdir /s /q ".nuxt"
    echo .nuxt folder deleted.
) else (
    echo .nuxt folder not found.
)

REM Delete .output folder (Nuxt production build)
if exist ".output" (
    echo Deleting .output folder...
    rmdir /s /q ".output"
    echo .output folder deleted.
) else (
    echo .output folder not found.
)

REM Delete dist folder (alternative build output)
if exist "dist" (
    echo Deleting dist folder...
    rmdir /s /q "dist"
    echo dist folder deleted.
) else (
    echo dist folder not found.
)

REM Delete node_modules folder
if exist "node_modules" (
    echo Deleting node_modules folder...
    rmdir /s /q "node_modules"
    echo node_modules folder deleted.
) else (
    echo node_modules folder not found.
)

REM Delete package-lock.json
if exist "package-lock.json" (
    echo Deleting package-lock.json...
    del "package-lock.json"
    echo package-lock.json deleted.
) else (
    echo package-lock.json not found.
)

REM Delete .nitro folder (Nitro cache)
if exist ".nitro" (
    echo Deleting .nitro folder...
    rmdir /s /q ".nitro"
    echo .nitro folder deleted.
) else (
    echo .nitro folder not found.
)

REM Delete .turbo folder (if using turbo)
if exist ".turbo" (
    echo Deleting .turbo folder...
    rmdir /s /q ".turbo"
    echo .turbo folder deleted.
) else (
    echo .turbo folder not found.
)

REM Delete temporary log files
if exist "*.log" (
    echo Deleting log files...
    del "*.log"
    echo Log files deleted.
) else (
    echo No log files found.
)

echo.
echo Cleanup completed!
echo.
echo Installing dependencies...
call npm install

echo.
echo Upgrading Nuxt to latest version...
call npx nuxt upgrade --dedupe

echo.
echo Syncing package.json versions...
node "%~dp0sync-versions.cjs"

echo.
echo ========================================
echo   All done! Project is ready for development.
echo ========================================
echo.
pause