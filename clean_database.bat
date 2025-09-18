@echo off
echo Cleaning database...

echo Stopping Electron processes...
taskkill /f /im electron.exe >nul 2>&1

echo Waiting for processes to stop...
timeout /t 2 /nobreak >nul

echo Removing old database file...
set "dbPath=%APPDATA%\projetgestion\clothing_management.db"
if exist "%dbPath%" (
    del /f "%dbPath%"
    echo ✅ Database file deleted successfully!
    echo Location: %dbPath%
) else (
    echo ℹ️  Database file not found (already clean)
)

echo ✅ Database cleaned! You can now restart your application.
echo The app will create a fresh database with no sample data.
pause