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

function Stop-PreviewProcessTree {
  param([Parameter(Mandatory = $true)][int]$RootProcessId)

  $allProcesses = @(Get-CimInstance Win32_Process)
  $processIds = [System.Collections.Generic.List[int]]::new()
  $pending = [System.Collections.Generic.Queue[int]]::new()
  $pending.Enqueue($RootProcessId)

  while ($pending.Count -gt 0) {
    $processId = $pending.Dequeue()
    if ($processIds.Contains($processId)) {
      continue
    }

    $processIds.Add($processId)
    foreach ($child in @($allProcesses | Where-Object { $_.ParentProcessId -eq $processId })) {
      $pending.Enqueue([int]$child.ProcessId)
    }
  }

  for ($index = $processIds.Count - 1; $index -ge 0; $index--) {
    Stop-Process -Id $processIds[$index] -Force -ErrorAction SilentlyContinue
  }
}

function Write-PreviewLogs {
  param(
    [Parameter(Mandatory = $true)][string]$OutputLog,
    [Parameter(Mandatory = $true)][string]$ErrorLog
  )

  Write-Host "===== Preview stdout ($OutputLog) ====="
  Get-Content -LiteralPath $OutputLog -ErrorAction SilentlyContinue
  Write-Host "===== Preview stderr ($ErrorLog) ====="
  Get-Content -LiteralPath $ErrorLog -ErrorAction SilentlyContinue
}

$repoRoot = (Get-Location).Path
$nodeCommand = (@(Get-Command node -CommandType Application -ErrorAction Stop))[0].Source
$viteEntryPoint = Join-Path $repoRoot "node_modules\\vite\\bin\\vite.js"
$playwrightCommand = Join-Path $repoRoot "node_modules\\.bin\\playwright.cmd"
$logsDir = Join-Path $repoRoot ".e2e-logs"
$previewOutputLog = Join-Path $logsDir "$Name-preview.stdout.log"
$previewErrorLog = Join-Path $logsDir "$Name-preview.stderr.log"
$previewProcess = $null

if (-not (Test-Path -LiteralPath $viteEntryPoint)) {
  throw "Vite CLI was not found at $viteEntryPoint. Run npm ci before certification."
}
if (-not (Test-Path -LiteralPath $playwrightCommand)) {
  throw "Playwright CLI was not found at $playwrightCommand. Run npm ci before certification."
}

New-Item -ItemType Directory -Path $logsDir -Force | Out-Null
$env:PLAYWRIGHT_SKIP_WEBSERVER = "1"

try {
  $buildStopwatch = [System.Diagnostics.Stopwatch]::StartNew()
  & $nodeCommand $viteEntryPoint build --outDir $DistDir --logLevel error
  $buildExitCode = $LASTEXITCODE
  $buildStopwatch.Stop()
  Write-Host "$Name build completed in $([math]::Round($buildStopwatch.Elapsed.TotalSeconds, 3))s."
  if ($buildExitCode -ne 0) {
    throw "$Name Vite build failed with exit code $buildExitCode."
  }

  $previewStopwatch = [System.Diagnostics.Stopwatch]::StartNew()
  $previewProcess = Start-Process `
    -FilePath $nodeCommand `
    -ArgumentList @($viteEntryPoint, "preview", "--host", "127.0.0.1", "--port", $Port.ToString(), "--strictPort", "--outDir", $DistDir, "--logLevel", "error") `
    -WorkingDirectory $repoRoot `
    -WindowStyle Hidden `
    -RedirectStandardOutput $previewOutputLog `
    -RedirectStandardError $previewErrorLog `
    -PassThru
  $previewProcessStartSeconds = [math]::Round($previewStopwatch.Elapsed.TotalSeconds, 3)
  Write-Host "$Name preview process started in $previewProcessStartSeconds s (PID $($previewProcess.Id))."

  $readinessUrl = "http://127.0.0.1:$Port/"
  $readinessDeadline = (Get-Date).AddSeconds(120)
  $lastReadinessError = $null
  $isReady = $false

  while ((Get-Date) -lt $readinessDeadline) {
    if ($previewProcess.HasExited) {
      throw "$Name preview exited before HTTP readiness with exit code $($previewProcess.ExitCode)."
    }

    try {
      $response = Invoke-WebRequest -Uri $readinessUrl -UseBasicParsing -TimeoutSec 5
      if ($response.StatusCode -eq 200) {
        $isReady = $true
        break
      }
      $lastReadinessError = "HTTP $($response.StatusCode)"
    } catch {
      $lastReadinessError = $_.Exception.Message
    }

    Start-Sleep -Milliseconds 500
  }

  if (-not $isReady) {
    throw "$Name preview did not return HTTP 200 from $readinessUrl within 120 seconds. Last error: $lastReadinessError"
  }

  $previewStopwatch.Stop()
  Write-Host "$Name preview HTTP readiness completed in $([math]::Round($previewStopwatch.Elapsed.TotalSeconds, 3))s."

  & $playwrightCommand @PlaywrightArgs
  $playwrightExitCode = $LASTEXITCODE
  if ($playwrightExitCode -ne 0) {
    throw "$Name Playwright gate failed with exit code $playwrightExitCode."
  }
} catch {
  Write-PreviewLogs -OutputLog $previewOutputLog -ErrorLog $previewErrorLog
  throw
} finally {
  if ($null -ne $previewProcess) {
    Stop-PreviewProcessTree -RootProcessId $previewProcess.Id
    Write-Host "$Name preview process tree stopped."
  }
}
