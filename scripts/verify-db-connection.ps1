<#
.SYNOPSIS
    Verifies PostgreSQL database connection status for GigCircle.
.DESCRIPTION
    1. Parses connection parameters from .env file or command arguments.
    2. Verifies TCP network socket connection to PostgreSQL.
    3. Checks backend health endpoint (/api/healthz) if running.
    4. Authenticates and lists database tables using psql CLI if available.
#>

param (
    [string]$EnvFilePath = "$PSScriptRoot\..\.env",
    [string]$DbHost = "db.lbpkqjcbekjktpopkphd.supabase.co",
    [int]$DbPort = 5432,
    [string]$DbName = "postgres",
    [string]$DbUser = "postgres",
    [string]$DbPassword = ""
)

Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "   GigCircle Database Connection Verification" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan

# 1. Parse .env file if it exists
if (Test-Path $EnvFilePath) {
    Write-Host "[1/4] Loading environment configuration from .env..." -ForegroundColor Yellow
    Get-Content $EnvFilePath | ForEach-Object {
        $line = $_.Trim()
        if ($line -and -not $line.StartsWith("#")) {
            $key, $value = $line -split "=", 2
            switch ($key) {
                "DATABASE_USERNAME" { if ($value) { $DbUser = $value } }
                "DATABASE_PASSWORD" { if ($value) { $DbPassword = $value } }
                "DATABASE_URL" {
                    if ($value -match "jdbc:postgresql://([^:/]+):?(\d+)?/([^?]+)") {
                        $DbHost = $Matches[1]
                        if ($Matches[2]) { $DbPort = [int]$Matches[2] }
                        $DbName = $Matches[3]
                    }
                }
            }
        }
    }
}

Write-Host "Target PostgreSQL Configuration:" -ForegroundColor Gray
Write-Host "  Host     : $DbHost" -ForegroundColor Gray
Write-Host "  Port     : $DbPort" -ForegroundColor Gray
Write-Host "  Database : $DbName" -ForegroundColor Gray
Write-Host "  User     : $DbUser" -ForegroundColor Gray

# 2. Test TCP socket connection to PostgreSQL server
Write-Host "`n[2/4] Verifying TCP socket connection to PostgreSQL..." -ForegroundColor Yellow
try {
    $tcp = New-Object System.Net.Sockets.TcpClient
    $asyncResult = $tcp.BeginConnect($DbHost, $DbPort, $null, $null)
    $success = $asyncResult.AsyncWaitHandle.WaitOne(3000, $false)
    
    if ($success -and $tcp.Connected) {
        $tcp.Close()
        Write-Host "SUCCESS: PostgreSQL server port ($DbPort) is reachable!" -ForegroundColor Green
    } else {
        $tcp.Close()
        Write-Host "FAILED: Unable to connect to PostgreSQL port $DbPort on $DbHost. Ensure PostgreSQL service is running." -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "ERROR: Connection test failed: $_" -ForegroundColor Red
    exit 1
}

# 3. Check Spring Boot Backend Health Endpoint
Write-Host "`n[3/4] Checking Spring Boot backend health endpoint..." -ForegroundColor Yellow
try {
    $healthResponse = Invoke-RestMethod -Uri "http://localhost:8080/api/healthz" -Method Get -TimeoutSec 3 -ErrorAction Stop
    Write-Host "SUCCESS: Backend status is '$($healthResponse.status)' with DB configured: $($healthResponse.databaseConfigured)" -ForegroundColor Green
} catch {
    Write-Host "INFO: Backend app is not currently running on http://localhost:8080 (optional)." -ForegroundColor Gray
}

# 4. Check for psql tool to authenticate & list tables
Write-Host "`n[4/4] Authenticating and querying PostgreSQL table status..." -ForegroundColor Yellow
$psqlCmd = Get-Command "psql" -ErrorAction SilentlyContinue

if ($psqlCmd) {
    Write-Host "Found psql CLI tool at: $($psqlCmd.Source)" -ForegroundColor Green
    $env:PGPASSWORD = $DbPassword
    
    $tableQuery = "SELECT table_name FROM information_schema.tables WHERE table_schema='public';"
    $tables = psql -h $DbHost -p $DbPort -U $DbUser -d $DbName -t -c $tableQuery 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "SUCCESS: Authenticated to database '$DbName' successfully!" -ForegroundColor Green
        Write-Host "Existing Tables in '$DbName':" -ForegroundColor Cyan
        $tables | ForEach-Object { if ($_.Trim()) { Write-Host "  - $($_.Trim())" } }
    } else {
        Write-Host "ERROR: psql authentication/query failed: $tables" -ForegroundColor Red
    }
} else {
    Write-Host "INFO: 'psql' CLI utility is not installed on PATH." -ForegroundColor Gray
    Write-Host "      The TCP socket connection to PostgreSQL on port $DbPort succeeded." -ForegroundColor Green
}

Write-Host "`n===============================================" -ForegroundColor Cyan
Write-Host "   Verification Complete!" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
