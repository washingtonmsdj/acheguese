[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [ValidatePattern("^[a-z0-9-]+$")]
  [string]$Name,

  [Parameter(Mandatory = $true)]
  [ValidateRange(1, 65535)]
  [int]$Port,

  [Parameter(Mandatory = $true)]
  [string]$DistDir,

  [Parameter(Mandatory = $true)]
  [string[]]$PlaywrightArgs
)

$ErrorActionPreference = "Stop"
$canonicalScript = Join-Path $PSScriptRoot "..\..\tools\release\run-preview-e2e.ps1"
& $canonicalScript @PSBoundParameters
