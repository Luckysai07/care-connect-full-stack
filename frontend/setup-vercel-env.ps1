# CareConnect - Vercel Environment Variables Setup (PowerShell)
# This script configures environment variables for Vercel deployment

Write-Host "🔧 CareConnect - Vercel Environment Setup`n" -ForegroundColor Cyan

# Configuration
$BACKEND_URL = "https://care-connect-api-bl1z.onrender.com"

Write-Host "This script will:" -ForegroundColor Yellow
Write-Host "  1. Check if you're logged in to Vercel" -ForegroundColor White
Write-Host "  2. Set VITE_API_URL environment variable" -ForegroundColor White
Write-Host "  3. Deploy your frontend to production`n" -ForegroundColor White

# Check if Vercel CLI is installed
try {
    $null = vercel --version
} catch {
    Write-Host "❌ Vercel CLI is not installed!" -ForegroundColor Red
    Write-Host "`n📦 Install it with: npm install -g vercel" -ForegroundColor Yellow
    exit 1
}

# Check if logged in
Write-Host "🔍 Checking Vercel login status..." -ForegroundColor Cyan
try {
    $whoami = vercel whoami 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "Not logged in"
    }
    Write-Host "✅ Logged in successfully`n" -ForegroundColor Green
} catch {
    Write-Host "❌ Not logged in to Vercel`n" -ForegroundColor Red
    Write-Host "📝 Please run: " -NoNewline -ForegroundColor Yellow
    Write-Host "vercel login" -ForegroundColor White
    Write-Host "`nAfter logging in, run this script again.`n" -ForegroundColor Yellow
    exit 1
}

Write-Host "════════════════════════════════════════" -ForegroundColor DarkGray
Write-Host "  Setting Environment Variables" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════`n" -ForegroundColor DarkGray

# Function to add environment variable
function Add-VercelEnv {
    param(
        [string]$Key,
        [string]$Value,
        [string]$Environment
    )
    
    Write-Host "📌 Setting $Key for $Environment..." -ForegroundColor White
    
    # Try to remove existing variable (ignore errors)
    try {
        vercel env rm $Key $Environment -y 2>$null | Out-Null
    } catch {}
    
    # Add the variable
    try {
        echo $Value | vercel env add $Key $Environment 2>&1 | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "   ✅ Set successfully" -ForegroundColor Green
            return $true
        } else {
            Write-Host "   ⚠️  Warning: Could not set" -ForegroundColor Yellow
            return $false
        }
    } catch {
        Write-Host "   ⚠️  Warning: Could not set" -ForegroundColor Yellow
        return $false
    }
}

# Add VITE_API_URL to all environments
$success = $true
foreach ($env in @("production", "preview", "development")) {
    $result = Add-VercelEnv -Key "VITE_API_URL" -Value $BACKEND_URL -Environment $env
    $success = $success -and $result
}

Write-Host "`n════════════════════════════════════════" -ForegroundColor DarkGray

if ($success) {
    Write-Host "✅ Environment variables configured!`n" -ForegroundColor Green
    
    Write-Host "📦 Deploying to production..." -ForegroundColor Cyan
    Write-Host "   (This may take 1-2 minutes)`n" -ForegroundColor DarkGray
    
    try {
        vercel --prod
        Write-Host "`n🎉 Deployment complete!" -ForegroundColor Green
        Write-Host "`n✨ Your frontend should now connect to:" -ForegroundColor Cyan
        Write-Host "   $BACKEND_URL`n" -ForegroundColor White
        Write-Host "🌐 Visit your site and try logging in!`n" -ForegroundColor Yellow
    } catch {
        Write-Host "`n⚠️  Deployment failed" -ForegroundColor Yellow
        Write-Host "   You can manually deploy from Vercel dashboard`n" -ForegroundColor DarkGray
    }
} else {
    Write-Host "`n⚠️  Some environment variables could not be set automatically`n" -ForegroundColor Yellow
    Write-Host "📝 Manual alternative:" -ForegroundColor Yellow
    Write-Host "   1. Go to https://vercel.com/dashboard" -ForegroundColor White
    Write-Host "   2. Select your project" -ForegroundColor White
    Write-Host "   3. Go to Settings → Environment Variables" -ForegroundColor White
    Write-Host "   4. Add:" -ForegroundColor White
    Write-Host "      Key: VITE_API_URL" -ForegroundColor Cyan
    Write-Host "      Value: $BACKEND_URL" -ForegroundColor Cyan
    Write-Host "   5. Redeploy your site`n" -ForegroundColor White
}

Write-Host "════════════════════════════════════════`n" -ForegroundColor DarkGray
