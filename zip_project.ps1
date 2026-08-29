# PowerShell script to compress DentisCraft project excluding node_modules/dist
$projectName = "dentiscraft"
$sourceDir = "C:\Users\User\.gemini\antigravity\scratch\dentiscraft"
$tempDir = "C:\Users\User\.gemini\antigravity\scratch\dentiscraft_zip_temp"
$destinationZip = "C:\Users\User\.gemini\antigravity\brain\595dde5d-a901-4d11-ae28-a2c1516f444e\dentiscraft.zip"

Write-Host "Iniciando empaquetado de DentisCraft..."

# Clean up existing temp and zip
if (Test-Path $tempDir) {
    Remove-Item $tempDir -Recurse -Force
}
if (Test-Path $destinationZip) {
    Remove-Item $destinationZip -Force
}

# Create temp directory
New-Item -ItemType Directory -Path $tempDir | Out-Null

# Copy source files excluding node_modules, dist
Copy-Item -Path "$sourceDir\*" -Destination $tempDir -Recurse -Exclude "node_modules", "dist", ".git", "dentiscraft.zip"

# Zip the temp folder
Compress-Archive -Path "$tempDir\*" -DestinationPath $destinationZip -Force

# Clean up temp
Remove-Item $tempDir -Recurse -Force

Write-Host "Proyecto DentisCraft empaquetado exitosamente en $destinationZip"
