$ErrorActionPreference = "Stop"
$canonicalScript = Join-Path $PSScriptRoot "..\..\tools\release\push-to-github.ps1"
& $canonicalScript
