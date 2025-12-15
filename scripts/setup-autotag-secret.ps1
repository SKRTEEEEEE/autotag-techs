# Script to automatically set up AUTOTAG_TOKEN secret in all GitHub repositories
# Usage: .\setup-autotag-secret.ps1 [-Token "<your-token>"]
# If no token provided, reads from .env file

param(
    [Parameter(Mandatory = $false)]
    [string]$Token,
    
    [Parameter(Mandatory = $false)]
    [switch]$Force
)

# Try to load token from .env if not provided
if ([string]::IsNullOrEmpty($Token)) {
    if (Test-Path ".env") {
        $envContent = Get-Content ".env"
        $tokenLine = $envContent | Select-String "AUTOTAG_TOKEN"
        if ($tokenLine) {
            $Token = $tokenLine.Line.Split("=")[1].Trim()
        }
    }
}

if ([string]::IsNullOrEmpty($Token)) {
    Write-Host "$RedError: GitHub PAT token is required$Reset"
    Write-Host "Usage: $PSCommandPath [-Token '<your-token>']"
    Write-Host ""
    Write-Host "Options:"
    Write-Host "  1. Pass token as parameter: -Token '<your-token>'"
    Write-Host "  2. Create .env file with: AUTOTAG_TOKEN=<your-token>"
    exit 1
}

# Colors for output
$Green = "`e[32m"
$Red = "`e[31m"
$Yellow = "`e[33m"
$Reset = "`e[0m"

function Write-Success {
    Write-Host "$Green✓ $args$Reset"
}

function Write-Error-Custom {
    Write-Host "$Red✗ $args$Reset"
}

function Write-Warning-Custom {
    Write-Host "$Yellow⊘ $args$Reset"
}

# Validate token format
if ($Token -notmatch '^ghp_') {
    Write-Host "$YellowWarning: Token doesn't look like a PAT (should start with ghp_)$Reset"
}

Write-Host "$Green`nSetting up AUTOTAG_TOKEN secret in all repositories...$Reset`n"

# Get list of repositories
Write-Host "Fetching repositories..."
$repos = gh repo list --json nameWithOwner -q '.[].nameWithOwner'

if (-not $repos) {
    Write-Error-Custom "No repositories found or authentication failed"
    exit 1
}

$successCount = 0
$failCount = 0
$skipCount = 0

# Process each repository
foreach ($repo in $repos) {
    Write-Host -NoNewline "Processing $repo... "
    
    # Check if secret already exists
    $secrets = gh secret list --repo $repo 2>$null
    
    if ($secrets -match "AUTOTAG_TOKEN") {
        Write-Warning-Custom "skipped (secret already exists)"
        $skipCount++
    }
    else {
        # Create the secret
        try {
            $Token | gh secret set AUTOTAG_TOKEN --repo $repo 2>$null
            Write-Success "done"
            $successCount++
        }
        catch {
            Write-Error-Custom "failed"
            $failCount++
        }
    }
}

Write-Host "`n$Green`Summary:$Reset"
Write-Host "  $Green✓ Created: $successCount$Reset"
Write-Host "  $Yellow⊘ Skipped: $skipCount$Reset"
Write-Host "  $Red✗ Failed:  $failCount$Reset`n"

if ($failCount -eq 0) {
    Write-Host "$GreenAll done! AUTOTAG_TOKEN is now available in your repositories.$Reset"
    exit 0
}
else {
    Write-Host "$YellowSome repositories failed. Please check manually.$Reset"
    exit 1
}
