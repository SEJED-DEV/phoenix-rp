# setup-client.ps1
# Provision a fresh Windows machine for the Phoenix RP site + bot + Cloudflare tunnel.
#
# HOW TO USE (on the client machine):
#   1. Right-click PowerShell -> "Run as administrator"
#   2. powershell -ExecutionPolicy Bypass -File setup-client.ps1
#
# Optional: pass the private repo URL to also clone + build + start the app:
#   powershell -ExecutionPolicy Bypass -File setup-client.ps1 -RepoUrl "https://github.com/USER/phoenix-site.git"

param(
    [string]$RepoUrl = "",
    [string]$DeployDir = "$env:USERPROFILE\phoenix-site"
)

$ErrorActionPreference = "Continue"

function Write-Step($msg) { Write-Host "`n=== $msg ===" -ForegroundColor Cyan }
function Refresh-Path {
    $env:Path = [Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [Environment]::GetEnvironmentVariable("Path", "User")
}

Write-Step "Checking winget"
if (-not (Get-Command winget -ErrorAction SilentlyContinue)) {
    Write-Host "winget not found. Install it from https://apps.microsoft.com/detail/9nblpghn4njr then re-run." -ForegroundColor Red
    exit 1
}

Write-Step "Installing Git"
if (Get-Command git -ErrorAction SilentlyContinue) {
    Write-Host "git already installed" -ForegroundColor Green
} else {
    winget install --id Git.Git -e --accept-source-agreements --accept-package-agreements
}

Write-Step "Installing Node.js LTS"
if (Get-Command node -ErrorAction SilentlyContinue) {
    Write-Host "node already installed: $(node -v)" -ForegroundColor Green
} else {
    winget install --id OpenJS.NodeJS.LTS -e --accept-source-agreements --accept-package-agreements
    Refresh-Path
}

Write-Step "Installing cloudflared (Cloudflare Tunnel)"
if (Get-Command cloudflared -ErrorAction SilentlyContinue) {
    Write-Host "cloudflared already installed: $(cloudflared --version)" -ForegroundColor Green
} else {
    winget install --id Cloudflare.cloudflared -e --accept-source-agreements --accept-package-agreements
    Refresh-Path
}

Write-Step "Verifying Node + npm"
Refresh-Path
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "node not on PATH. Close and reopen PowerShell as admin, then re-run." -ForegroundColor Red
    exit 1
}
node -v
npm -v

Write-Step "Installing PM2"
npm install -g pm2 pm2-windows-startup

Write-Step "Installing PM2 auto-start at boot"
pm2-startup install

if ($RepoUrl -ne "") {
    Write-Step "Cloning repo"
    if (Test-Path $DeployDir) {
        Write-Host "$DeployDir already exists - skipping clone" -ForegroundColor Yellow
    } else {
        git clone $RepoUrl $DeployDir
    }

    Write-Step "Installing app dependencies"
    Push-Location $DeployDir
    npm install

    Write-Step "Building production bundle"
    npm run build

    Write-Step "Starting site + bot under PM2"
    pm2 start ecosystem.config.cjs
    pm2 save
    Pop-Location
} else {
    Write-Host "`nNo -RepoUrl given - tools installed only." -ForegroundColor Yellow
}

Write-Host "`n=== NEXT STEPS ===" -ForegroundColor Cyan
Write-Host "1. Cloudflare Tunnel (one-time):"
Write-Host "   cloudflared tunnel login"
Write-Host "   cloudflared tunnel create phoenix-site"
Write-Host "   cloudflared tunnel route dns phoenix-site phoenixrp.online"
Write-Host "   cloudflared tunnel route dns phoenix-site www.phoenixrp.online"
Write-Host "2. Create config at $env:USERPROFILE\.cloudflared\config.yml"
Write-Host "   (see the README / handoff notes for the yaml contents)"
Write-Host "3. Test the tunnel: cloudflared tunnel run phoenix-site"
Write-Host "4. If you copied the app folder instead of cloning: run npm install, npm run build, then pm2 start ecosystem.config.cjs"
Write-Host "`nDone." -ForegroundColor Green
