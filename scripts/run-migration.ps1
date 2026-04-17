#Requires -Version 5.1
<#
.SYNOPSIS
  Aplica a migration 20260416190000 via Supabase Management API
#>

Set-StrictMode -Off
$ErrorActionPreference = "Continue"

$ProjectRef = "xhdowzacfujckjelqhtd"
$MigrationFile = Join-Path $PSScriptRoot "..\supabase\migrations\20260416190000_migrate_vaga_status_enum.sql"

# ── Descriptografar service role key ─────────────────────────────────────────
Write-Host "[1/4] Descriptografando service role key..." -ForegroundColor Cyan

Add-Type -AssemblyName System.Security

$secretsFile = Join-Path $env:APPDATA "Ordax\Secrets\$ProjectRef\supabase-secrets.json.dpapi"
$payload = Get-Content $secretsFile -Raw | ConvertFrom-Json

$bytes = [Convert]::FromBase64String($payload.keys.SUPABASE_SERVICE_ROLE_KEY)
$plain = [System.Security.Cryptography.ProtectedData]::Unprotect(
    $bytes, $null,
    [System.Security.Cryptography.DataProtectionScope]::CurrentUser
)
$serviceRoleKey = [System.Text.Encoding]::UTF8.GetString($plain)

Write-Host "    Key: $($serviceRoleKey.Length) chars" -ForegroundColor Gray

# ── Ler SQL ───────────────────────────────────────────────────────────────────
Write-Host "[2/4] Lendo migration..." -ForegroundColor Cyan
$sql = Get-Content $MigrationFile -Raw
Write-Host "    SQL: $($sql.Length) chars" -ForegroundColor Gray

# ── Executar via Management API ───────────────────────────────────────────────
Write-Host "[3/4] Executando via Supabase Management API..." -ForegroundColor Cyan

$url = "https://api.supabase.com/v1/projects/$ProjectRef/database/query"
$headers = @{
    "Authorization" = "Bearer $serviceRoleKey"
    "Content-Type"  = "application/json"
}
$body = [System.Text.Encoding]::UTF8.GetBytes(
    (ConvertTo-Json @{ query = $sql } -Depth 5 -Compress)
)

try {
    $req = [System.Net.HttpWebRequest]::Create($url)
    $req.Method = "POST"
    $req.Timeout = 60000
    $req.Headers.Add("Authorization", "Bearer $serviceRoleKey")
    $req.ContentType = "application/json"
    $req.ContentLength = $body.Length

    $stream = $req.GetRequestStream()
    $stream.Write($body, 0, $body.Length)
    $stream.Close()

    $resp = $req.GetResponse()
    $reader = New-Object System.IO.StreamReader($resp.GetResponseStream())
    $result = $reader.ReadToEnd()
    $reader.Close()
    $resp.Close()

    Write-Host "[4/4] ✅ Migration aplicada com sucesso!" -ForegroundColor Green
    Write-Host "Resposta: $($result.Substring(0, [Math]::Min(300, $result.Length)))" -ForegroundColor Gray

} catch [System.Net.WebException] {
    $statusCode = [int]$_.Exception.Response.StatusCode
    $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
    $errorBody = $reader.ReadToEnd()
    $reader.Close()

    Write-Host "[4/4] ❌ HTTP $statusCode" -ForegroundColor Red
    Write-Host "Erro: $($errorBody.Substring(0, [Math]::Min(500, $errorBody.Length)))" -ForegroundColor Red

    # Se a Management API não aceitar SQL completo, tentar via REST direto
    Write-Host "`nTentando via REST API alternativa..." -ForegroundColor Yellow
    exit 2
}
