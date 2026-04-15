param(
  [string]$ProjectRef = "xhdowzacfujckjelqhtd",
  [string]$StoragePath = "$env:APPDATA\Ordax\Secrets",
  [string]$WritePublicEnvFile
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

foreach ($assemblyName in @(
  "System.Security.Cryptography.ProtectedData",
  "System.Security"
)) {
  try {
    Add-Type -AssemblyName $assemblyName -ErrorAction Stop
    break
  } catch {
  }
}

function Unprotect-Secret {
  param([Parameter(Mandatory = $true)][string]$Value)

  $bytes = [Convert]::FromBase64String($Value)
  $plainBytes = [System.Security.Cryptography.ProtectedData]::Unprotect(
    $bytes,
    $null,
    [System.Security.Cryptography.DataProtectionScope]::CurrentUser
  )

  return [System.Text.Encoding]::UTF8.GetString($plainBytes)
}

$targetFile = Join-Path (Join-Path $StoragePath $ProjectRef) "supabase-secrets.json.dpapi"

if (-not (Test-Path $targetFile)) {
  throw "Secure secret store not found at $targetFile"
}

$payload = Get-Content $targetFile -Raw | ConvertFrom-Json

$env:VITE_SUPABASE_URL = Unprotect-Secret $payload.keys.VITE_SUPABASE_URL
$env:VITE_SUPABASE_PUBLISHABLE_KEY = Unprotect-Secret $payload.keys.VITE_SUPABASE_PUBLISHABLE_KEY
$env:SUPABASE_SERVICE_ROLE_KEY = Unprotect-Secret $payload.keys.SUPABASE_SERVICE_ROLE_KEY

if ($WritePublicEnvFile) {
  @(
    "VITE_SUPABASE_URL=$($env:VITE_SUPABASE_URL)"
    "VITE_SUPABASE_PUBLISHABLE_KEY=$($env:VITE_SUPABASE_PUBLISHABLE_KEY)"
  ) | Set-Content -Path $WritePublicEnvFile -Encoding UTF8
}

Write-Output "Supabase secrets loaded into current shell for project $ProjectRef"
