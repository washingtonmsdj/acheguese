Param(
  [Parameter(Mandatory = $true)]
  [ValidateSet("before", "after")]
  [string]$Phase,

  [string]$SqlFile = "docs/architecture/sql/economic-circulation-performance-check.sql",
  [string]$OutputDir = ".tmp/bench",
  [switch]$CompareAfter
)

$ErrorActionPreference = "Stop"

if (-not (Get-Command psql -ErrorAction SilentlyContinue)) {
  throw "psql nao encontrado no PATH."
}

if (-not (Test-Path -LiteralPath $SqlFile)) {
  throw "Arquivo SQL nao encontrado: $SqlFile"
}

New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null

$outputFile = Join-Path $OutputDir ("economic-circulation-{0}.txt" -f $Phase)

Write-Host "Executando benchmark phase=$Phase ..."
psql -v ON_ERROR_STOP=1 -f $SqlFile | Out-File -LiteralPath $outputFile -Encoding utf8
Write-Host "Resultado salvo em: $outputFile"

if ($Phase -eq "after" -or $CompareAfter) {
  $beforeFile = Join-Path $OutputDir "economic-circulation-before.txt"
  $afterFile = Join-Path $OutputDir "economic-circulation-after.txt"
  if ((Test-Path -LiteralPath $beforeFile) -and (Test-Path -LiteralPath $afterFile)) {
    Write-Host "Comparando before/after ..."
    node scripts/compare-economic-benchmark.mjs $beforeFile $afterFile
  } else {
    Write-Host "Comparacao ignorada: arquivos before/after ainda incompletos."
  }
}

