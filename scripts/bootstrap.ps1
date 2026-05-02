# TrueKit bootstrap — run from PowerShell in C:\Files\App\truekit
# Wipes the corrupt sandbox leftovers, installs cleanly, inits git, and pushes.

$ErrorActionPreference = "Stop"

# Halt the script immediately if any native command exits non-zero.
function Invoke-Native {
    param([string]$Command, [string[]]$ArgsList)
    & $Command @ArgsList
    if ($LASTEXITCODE -ne 0) {
        throw "$Command exited with code $LASTEXITCODE"
    }
}

# ----------------------------------------------------------------------------
# 1. Wipe leftovers from earlier sandbox install attempts. These are corrupt:
#    - node_modules has a partial @prisma/engines install missing fetch-engine
#    - .git was created with a stale config.lock that the sandbox couldn't unlink
# ----------------------------------------------------------------------------
Write-Host "==> Cleaning sandbox leftovers..." -ForegroundColor Cyan
foreach ($p in @(".\node_modules", ".\node_modules.old", ".\package-lock.json", ".\.git")) {
    if (Test-Path $p) {
        Write-Host "    removing $p"
        Remove-Item -Recurse -Force $p
    }
}

# ----------------------------------------------------------------------------
# 2. Install npm deps fresh.
# ----------------------------------------------------------------------------
Write-Host "==> Installing npm dependencies..." -ForegroundColor Cyan
Invoke-Native "npm" @("install", "--no-audit", "--no-fund")

# ----------------------------------------------------------------------------
# 3. Generate the Prisma client (schema -> typed client).
# ----------------------------------------------------------------------------
Write-Host "==> Generating Prisma client..." -ForegroundColor Cyan
Invoke-Native "npx" @("--yes", "prisma", "generate")

# ----------------------------------------------------------------------------
# 4. Quick sanity check: typecheck (catches anything wrong with the scaffold).
# ----------------------------------------------------------------------------
Write-Host "==> Running typecheck..." -ForegroundColor Cyan
Invoke-Native "npm" @("run", "typecheck")

# ----------------------------------------------------------------------------
# 5. Init git and push to GitHub.
# ----------------------------------------------------------------------------
Write-Host "==> Initialising git..." -ForegroundColor Cyan
Invoke-Native "git" @("init", "-b", "main")
Invoke-Native "git" @("config", "user.email", "leaffeng1115@gmail.com")
Invoke-Native "git" @("config", "user.name", "Ross")
Invoke-Native "git" @("remote", "add", "origin", "https://github.com/rosscyking1115/truekit.git")

Write-Host "==> Staging files..." -ForegroundColor Cyan
Invoke-Native "git" @("add", ".")

Write-Host "==> Committing..." -ForegroundColor Cyan
Invoke-Native "git" @("commit", "-m", "feat: scaffold TrueKit Phase 1 foundation")

Write-Host "==> Pushing to GitHub..." -ForegroundColor Cyan
# If the remote already has commits (e.g. an initial README), use --force on a
# brand-new repo or pull --rebase first. We assume the repo is empty.
Invoke-Native "git" @("push", "-u", "origin", "main")

Write-Host ""
Write-Host "Done. Next:" -ForegroundColor Green
Write-Host "  1. Copy-Item .env.example .env.local"
Write-Host "  2. Fill in Supabase + Stripe + Resend keys in .env.local"
Write-Host "  3. npm run db:push   (after DATABASE_URL is set)"
Write-Host "  4. npm run dev"
