# Clean Database Script
# Run this after closing the Electron application

Write-Host "Cleaning database..." -ForegroundColor Yellow

# Stop any remaining Electron processes
Write-Host "Stopping Electron processes..." -ForegroundColor Blue
Get-Process | Where-Object {$_.ProcessName -like "*electron*"} | Stop-Process -Force -ErrorAction SilentlyContinue

# Wait a moment for processes to fully stop
Start-Sleep -Seconds 2

# Remove the old database file
$dbPath = "$env:APPDATA\projetgestion\clothing_management.db"
if (Test-Path $dbPath) {
    Remove-Item $dbPath -Force
    Write-Host "✅ Database file deleted successfully!" -ForegroundColor Green
    Write-Host "Location: $dbPath" -ForegroundColor Gray
} else {
    Write-Host "ℹ️  Database file not found (already clean)" -ForegroundColor Blue
}

Write-Host "✅ Database cleaned! You can now restart your application." -ForegroundColor Green
Write-Host "The app will create a fresh database with no sample data." -ForegroundColor Gray