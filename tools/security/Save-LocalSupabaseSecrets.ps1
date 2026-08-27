param(
  [string]$ProjectRef = "xhdowzacfujckjelqhtd",
  [string]$SupabaseUrl,
  [string]$PublishableKey,
  [string]$ServiceRoleKey,
  [string]$StoragePath = "$env:APPDATA\AchegueSe\Secrets",
  [switch]$FetchFromSupabase
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

function Protect-Plaintext {
  param([Parameter(Mandatory = $true)][string]$Value)

  $bytes = [System.Text.Encoding]::UTF8.GetBytes($Value)
  $protected = [System.Security.Cryptography.ProtectedData]::Protect(
    $bytes,
    $null,
    [System.Security.Cryptography.DataProtectionScope]::CurrentUser
  )

  return [Convert]::ToBase64String($protected)
}

if ($FetchFromSupabase) {
  $apiKeys = supabase projects api-keys --project-ref $ProjectRef -o json | ConvertFrom-Json

  if (-not $SupabaseUrl) {
    $SupabaseUrl = "https://$ProjectRef.supabase.co"
  }

  if (-not $PublishableKey) {
    $publishable = $apiKeys | Where-Object { $_.type -eq "publishable" } | Select-Object -First 1
    if (-not $publishable) {
      $publishable = $apiKeys | Where-Object { $_.id -eq "anon" } | Select-Object -First 1
    }
    $PublishableKey = $publishable.api_key
  }

  if (-not $ServiceRoleKey) {
    $serviceRole = $apiKeys | Where-Object { $_.id -eq "service_role" } | Select-Object -First 1
    $ServiceRoleKey = $serviceRole.api_key
  }
}

if (-not $SupabaseUrl) {
  throw "SupabaseUrl e obrigatoria."
}

if (-not $PublishableKey) {
  throw "PublishableKey e obrigatoria."
}

if (-not $ServiceRoleKey) {
  throw "ServiceRoleKey e obrigatoria."
}

$targetDir = Join-Path $StoragePath $ProjectRef
$targetFile = Join-Path $targetDir "supabase-secrets.json.dpapi"

New-Item -ItemType Directory -Force -Path $targetDir | Out-Null

$payload = [ordered]@{
  project_ref = $ProjectRef
  saved_at = [DateTime]::UtcNow.ToString("o")
  keys = [ordered]@{
    VITE_SUPABASE_URL = Protect-Plaintext $SupabaseUrl
    VITE_SUPABASE_PUBLISHABLE_KEY = Protect-Plaintext $PublishableKey
    SUPABASE_SERVICE_ROLE_KEY = Protect-Plaintext $ServiceRoleKey
  }
}

$payload | ConvertTo-Json -Depth 5 | Set-Content -Path $targetFile -Encoding UTF8

Write-Output "Secure Supabase secrets saved to $targetFile"
