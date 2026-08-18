param(
  [Parameter(Mandatory = $true)][string]$CandidateSha,
  [Parameter(Mandatory = $true)][string]$CandidatePath,
  [Parameter(Mandatory = $true)][string]$ProjectRef
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$env:PGHOST = "aws-0-us-west-2.pooler.supabase.com"
$env:PGPORT = "5432"
$env:PGUSER = "postgres.$ProjectRef"
$env:PGDATABASE = "postgres"
$env:PGSSLMODE = "require"
$env:PGCONNECT_TIMEOUT = "15"
$env:npm_config_loglevel = "silent"
$env:npm_config_audit = "false"
$env:npm_config_fund = "false"

$SupabaseVersion = "2.113.0"
$root = $null

function Add-PostgresToPath {
  if (Get-Command psql -ErrorAction SilentlyContinue) { return }
  $installRoot = "C:\Program Files\PostgreSQL"
  if (-not (Test-Path -LiteralPath $installRoot)) { throw "PostgreSQL installation root was not found." }
  $bins = @(Get-ChildItem -LiteralPath $installRoot -Directory -ErrorAction Stop |
    Where-Object { $_.Name -match '^\d+$' } |
    Sort-Object { [int]$_.Name } -Descending |
    ForEach-Object { Join-Path $_.FullName "bin" } |
    Where-Object { Test-Path -LiteralPath (Join-Path $_ "psql.exe") })
  if ($bins.Count -eq 0) { throw "PostgreSQL client binaries were not found." }
  $env:PATH = "$($bins[0]);$env:PATH"
}

function Invoke-NativeCapture([string]$Command, [string[]]$Arguments, [string]$StdoutPath, [string]$StderrPath) {
  $previousPreference = $ErrorActionPreference
  $ErrorActionPreference = "Continue"
  try {
    & $Command @Arguments 1> $StdoutPath 2> $StderrPath
    $exitCode = $LASTEXITCODE
  } finally {
    $ErrorActionPreference = $previousPreference
  }
  return $exitCode
}

function Invoke-PsqlJson([string]$Sql, [string]$Path) {
  $stdout = [System.IO.Path]::GetTempFileName()
  $stderr = [System.IO.Path]::GetTempFileName()
  try {
    $code = Invoke-NativeCapture "psql" @("-X","-v","ON_ERROR_STOP=1","-Atqc",$Sql) $stdout $stderr
    if ($code -ne 0) {
      $message = (Get-Content -LiteralPath $stderr -Raw -ErrorAction SilentlyContinue).Trim()
      throw "psql inventory query failed: $message"
    }
    $raw = (Get-Content -LiteralPath $stdout -Raw).Trim()
    if ([string]::IsNullOrWhiteSpace($raw)) { $raw = "null" }
    $raw | ConvertFrom-Json | Out-Null
    Set-Content -LiteralPath $Path -Value $raw -Encoding UTF8
    return ($raw | ConvertFrom-Json)
  } finally {
    Remove-Item -LiteralPath $stdout,$stderr -Force -ErrorAction SilentlyContinue
  }
}

function Invoke-PgDump([string[]]$Arguments, [string]$LogPath) {
  $stdout = [System.IO.Path]::GetTempFileName()
  try {
    $code = Invoke-NativeCapture "pg_dump" $Arguments $stdout $LogPath
    if ($code -ne 0) {
      $tail = (Get-Content -LiteralPath $LogPath -Tail 40 -ErrorAction SilentlyContinue) -join "`n"
      throw "pg_dump failed with exit code $code. $tail"
    }
  } finally {
    Remove-Item -LiteralPath $stdout -Force -ErrorAction SilentlyContinue
  }
}

function Invoke-SupabaseCapture([string[]]$Arguments, [string]$StdoutPath, [string]$StderrPath) {
  $npx = Get-Command npx.cmd -ErrorAction SilentlyContinue
  if (-not $npx) { throw "npx.cmd is unavailable." }
  $allArguments = @("--yes","supabase@$SupabaseVersion") + $Arguments
  return Invoke-NativeCapture $npx.Source $allArguments $StdoutPath $StderrPath
}

function Invoke-SupabaseJson([string[]]$Arguments, [string]$LogPath) {
  $stdout = [System.IO.Path]::GetTempFileName()
  try {
    $code = Invoke-SupabaseCapture $Arguments $stdout $LogPath
    if ($code -ne 0) {
      $tail = (Get-Content -LiteralPath $LogPath -Tail 40 -ErrorAction SilentlyContinue) -join "`n"
      throw "Supabase CLI failed with exit code $code. $tail"
    }
    $raw = (Get-Content -LiteralPath $stdout -Raw).Trim()
    if ([string]::IsNullOrWhiteSpace($raw)) { $raw = "[]" }
    return ($raw | ConvertFrom-Json)
  } finally {
    Remove-Item -LiteralPath $stdout -Force -ErrorAction SilentlyContinue
  }
}

function Invoke-SupabaseNoOutput([string[]]$Arguments, [string]$LogPath) {
  $stdout = [System.IO.Path]::GetTempFileName()
  try {
    $code = Invoke-SupabaseCapture $Arguments $stdout $LogPath
    if ($code -ne 0) {
      $tail = (Get-Content -LiteralPath $LogPath -Tail 40 -ErrorAction SilentlyContinue) -join "`n"
      throw "Supabase CLI Storage download failed with exit code $code. $tail"
    }
  } finally {
    Remove-Item -LiteralPath $stdout -Force -ErrorAction SilentlyContinue
  }
}

function Write-JsonFile($Value, [string]$Path) {
  $Value | ConvertTo-Json -Depth 40 | Set-Content -LiteralPath $Path -Encoding UTF8
}

function Normalize-Array($Value, [string]$CollectionProperty) {
  if ($null -eq $Value) { return @() }
  $property = $Value.PSObject.Properties[$CollectionProperty]
  if ($property) { return @($property.Value) }
  return @($Value)
}

function Get-FileSha256([string]$Path) {
  return (Get-FileHash -Algorithm SHA256 -LiteralPath $Path).Hash.ToLowerInvariant()
}

Add-PostgresToPath
foreach ($tool in @("psql","pg_dump","pg_restore","git")) {
  if (-not (Get-Command $tool -ErrorAction SilentlyContinue)) { throw "Required tool '$tool' is unavailable." }
}
if (-not (Get-Command npx.cmd -ErrorAction SilentlyContinue)) { throw "Required tool 'npx.cmd' is unavailable." }

$actualSha = (& git -C $CandidatePath rev-parse HEAD | Out-String).Trim().ToLowerInvariant()
if ($LASTEXITCODE -ne 0 -or $actualSha -ne $CandidateSha.ToLowerInvariant()) {
  throw "Candidate checkout SHA mismatch. Expected=$CandidateSha Actual=$actualSha"
}

$probeOut = [System.IO.Path]::GetTempFileName()
$probeErr = [System.IO.Path]::GetTempFileName()
try {
  $probeCode = Invoke-NativeCapture "psql" @("-X","-Atqc","select 1") $probeOut $probeErr
  $probe = (Get-Content -LiteralPath $probeOut -Raw).Trim()
  if ($probeCode -ne 0 -or $probe -ne "1") { throw "Remote PostgreSQL authentication through the secure local credential store failed." }
} finally {
  Remove-Item -LiteralPath $probeOut,$probeErr -Force -ErrorAction SilentlyContinue
}

$versionOut = [System.IO.Path]::GetTempFileName()
$versionErr = [System.IO.Path]::GetTempFileName()
try {
  $versionCode = Invoke-SupabaseCapture @("--version") $versionOut $versionErr
  if ($versionCode -ne 0) { throw "Pinned Supabase CLI could not start." }
  $resolvedSupabaseVersion = (Get-Content -LiteralPath $versionOut -Raw).Trim()
  if ($resolvedSupabaseVersion -ne $SupabaseVersion) { throw "Supabase CLI pin mismatch. Expected=$SupabaseVersion Actual=$resolvedSupabaseVersion" }
} finally {
  Remove-Item -LiteralPath $versionOut,$versionErr -Force -ErrorAction SilentlyContinue
}

Write-Host "Pinned candidate checkout: $actualSha"
Write-Host "PostgreSQL client: $(& pg_dump --version)"
Write-Host "Supabase CLI: $resolvedSupabaseVersion"

$now = [DateTimeOffset]::UtcNow
$snapshotId = $now.ToString("yyyyMMdd'T'HHmmss'Z'")
$capturedAt = $now.ToString("o")
$validUntil = $now.AddHours(24).ToString("o")
$root = Join-Path $env:RUNNER_TEMP "acheguese-recovery-$snapshotId"
$package = Join-Path $root "package"
$dbDir = Join-Path $package "database"
$inventoryDir = Join-Path $package "inventories"
$logsDir = Join-Path $package "logs"
$sourceDir = Join-Path $package "source"
$storageDir = Join-Path $package "storage"
$storageObjectsDir = Join-Path $storageDir "objects"
$storageWork = Join-Path $root "storage-cli"
foreach ($dir in @($root,$package,$dbDir,$inventoryDir,$logsDir,$sourceDir,$storageDir,$storageObjectsDir,$storageWork)) {
  New-Item -ItemType Directory -Path $dir -Force | Out-Null
}

$baselineSql = @"
select json_build_object(
  'capturedAt', now(),
  'migrationCount', (select count(*) from supabase_migrations.schema_migrations),
  'latestMigration', (select max(version) from supabase_migrations.schema_migrations),
  'authUsers', (select count(*) from auth.users),
  'authIdentities', (select count(*) from auth.identities),
  'authMfaFactors', (select count(*) from auth.mfa_factors),
  'storageBuckets', (select count(*) from storage.buckets),
  'storageObjects', (select count(*) from storage.objects),
  'storageTotalBytes', (select coalesce(sum((metadata->>'size')::bigint),0) from storage.objects where metadata ? 'size'),
  'technicalBusinessRows', (select count(*) from public.business_data where coalesce(metadata->>'source_kind','')='technical_fixture'),
  'technicalBusinessActive', (select count(*) from public.business_data where coalesce(metadata->>'source_kind','')='technical_fixture' and status='active'),
  'activeBusinesses', (select count(*) from public.business_data where status='active'),
  'officialEducationSeed', (select count(*) from public.education_profiles where school_inep_code is not null),
  'cutoverPresent', exists(select 1 from information_schema.tables where table_schema='public' and table_name ilike '%cutover%')
)::text;
"@
$storageInventorySql = @"
select coalesce(json_agg(json_build_object(
  'id', id,
  'bucketId', bucket_id,
  'name', name,
  'version', version,
  'updatedAt', updated_at,
  'createdAt', created_at,
  'size', coalesce((metadata->>'size')::bigint,0)
) order by bucket_id,name),'[]'::json)::text
from storage.objects;
"@

$baselineStart = Invoke-PsqlJson $baselineSql (Join-Path $inventoryDir "baseline-start.json")
$storageStart = Invoke-PsqlJson $storageInventorySql (Join-Path $inventoryDir "storage-objects-remote-start.json")
$storageStartRaw = (Get-Content -LiteralPath (Join-Path $inventoryDir "storage-objects-remote-start.json") -Raw).Trim()
if ([int64]$baselineStart.technicalBusinessActive -ne 0) { throw "Business hygiene regression: technical fixture rows are active." }
if ([int64]$baselineStart.officialEducationSeed -ne 15) { throw "Official education seed drift detected. Expected 15 INEP-backed rows." }

Invoke-PgDump @("--no-owner","--no-privileges","--schema=public","--schema=extensions","--schema-only","--file=$dbDir/application-schema.sql") (Join-Path $logsDir "application-schema.log")
Invoke-PgDump @("--no-owner","--no-privileges","--schema=public","--schema=extensions","--data-only","--file=$dbDir/application-data.sql") (Join-Path $logsDir "application-data.log")
Invoke-PgDump @("--no-owner","--no-privileges","--schema=public","--schema=extensions","--format=custom","--file=$dbDir/application.custom") (Join-Path $logsDir "application-custom.log")
Invoke-PgDump @("--no-owner","--no-privileges","--schema=auth","--data-only","--file=$dbDir/auth-data.sql") (Join-Path $logsDir "auth-data.log")
Invoke-PgDump @("--no-owner","--no-privileges","--schema=supabase_migrations","--schema-only","--file=$dbDir/migration-history-schema.sql") (Join-Path $logsDir "migration-history-schema.log")
Invoke-PgDump @("--no-owner","--no-privileges","--schema=supabase_migrations","--data-only","--file=$dbDir/migration-history-data.sql") (Join-Path $logsDir "migration-history-data.log")
Invoke-PgDump @("--no-owner","--no-privileges","--data-only","--table=storage.buckets","--table=storage.objects","--file=$dbDir/storage-metadata.sql") (Join-Path $logsDir "storage-metadata.log")

$restoreOut = [System.IO.Path]::GetTempFileName()
$restoreErr = [System.IO.Path]::GetTempFileName()
try {
  $restoreCode = Invoke-NativeCapture "pg_restore" @("--list",(Join-Path $dbDir "application.custom")) $restoreOut $restoreErr
  if ($restoreCode -ne 0) { throw "pg_restore could not validate application.custom" }
  $restoreEntries = @(Get-Content -LiteralPath $restoreOut | Where-Object { $_ -and -not $_.StartsWith(";") }).Count
} finally {
  Remove-Item -LiteralPath $restoreOut,$restoreErr -Force -ErrorAction SilentlyContinue
}
Write-JsonFile ([ordered]@{ customDumpReadable=$true; customDumpEntryCount=$restoreEntries; validatedAt=[DateTimeOffset]::UtcNow.ToString("o") }) (Join-Path $package "DUMP-VALIDATION.json")

Invoke-PsqlJson "select coalesce(json_agg(json_build_object('version',version,'name',name) order by version),'[]'::json)::text from supabase_migrations.schema_migrations;" (Join-Path $inventoryDir "migrations-applied.json") | Out-Null
Invoke-PsqlJson "select coalesce(json_agg(json_build_object('name',e.extname,'version',e.extversion) order by e.extname),'[]'::json)::text from pg_extension e;" (Join-Path $inventoryDir "extensions.json") | Out-Null
Invoke-PsqlJson "select coalesce(json_agg(json_build_object('id',id,'name',name,'public',public,'fileSizeLimit',file_size_limit,'allowedMimeTypes',allowed_mime_types) order by name),'[]'::json)::text from storage.buckets;" (Join-Path $inventoryDir "storage-buckets.json") | Out-Null
Write-JsonFile ([ordered]@{ capturedAt=[DateTimeOffset]::UtcNow.ToString("o"); users=[int64]$baselineStart.authUsers; identities=[int64]$baselineStart.authIdentities; mfaFactors=[int64]$baselineStart.authMfaFactors }) (Join-Path $inventoryDir "auth-state.json")
Write-JsonFile ([ordered]@{ capturedAt=[DateTimeOffset]::UtcNow.ToString("o"); technicalRowsTotal=[int64]$baselineStart.technicalBusinessRows; technicalRowsActive=[int64]$baselineStart.technicalBusinessActive; activeBusinesses=[int64]$baselineStart.activeBusinesses; activeOfficialEducationSeed=[int64]$baselineStart.officialEducationSeed; mutation="No mutation performed by recovery capture" }) (Join-Path $inventoryDir "business-test-data-hygiene.json")

$functionsParsed = Invoke-SupabaseJson @("functions","list","--project-ref",$ProjectRef,"--output","json") (Join-Path $logsDir "supabase-functions.log")
$functionItems = Normalize-Array $functionsParsed "functions"
$functionInventory = @($functionItems | ForEach-Object {
  $nameProp = $_.PSObject.Properties['name']; if (-not $nameProp) { $nameProp = $_.PSObject.Properties['slug'] }
  if ($nameProp) {
    $slugProp=$_.PSObject.Properties['slug']; $versionProp=$_.PSObject.Properties['version']; $statusProp=$_.PSObject.Properties['status']; $verifyProp=$_.PSObject.Properties['verify_jwt']
    [ordered]@{ name=[string]$nameProp.Value; slug=if($slugProp){[string]$slugProp.Value}else{$null}; version=if($versionProp -and $versionProp.Value){[int]$versionProp.Value}else{$null}; status=if($statusProp){[string]$statusProp.Value}else{$null}; verifyJwt=if($verifyProp){[bool]$verifyProp.Value}else{$null} }
  }
})
Write-JsonFile $functionInventory (Join-Path $inventoryDir "edge-functions.json")

$secretsParsed = Invoke-SupabaseJson @("secrets","list","--project-ref",$ProjectRef,"--output","json") (Join-Path $logsDir "supabase-secrets.log")
$secretItems = Normalize-Array $secretsParsed "secrets"
$secretNames = @($secretItems | ForEach-Object { $p=$_.PSObject.Properties['name']; if(-not $p){$p=$_.PSObject.Properties['Name']}; if($p){[string]$p.Value} } | Where-Object { $_ } | Sort-Object -Unique)
Write-JsonFile $secretNames (Join-Path $inventoryDir "secret-names.json")
Write-JsonFile @($secretNames | Where-Object { $_ -match 'TURNSTILE' }) (Join-Path $inventoryDir "turnstile.json")

$supabaseDir = Join-Path $storageWork "supabase"
$tempDir = Join-Path $supabaseDir ".temp"
New-Item -ItemType Directory -Path $tempDir -Force | Out-Null
Copy-Item -LiteralPath (Join-Path $CandidatePath "supabase\config.toml") -Destination (Join-Path $supabaseDir "config.toml") -Force
Set-Content -LiteralPath (Join-Path $tempDir "project-ref") -Value $ProjectRef -Encoding ASCII

$storageRows = @($storageStart)
$downloaded = New-Object System.Collections.Generic.List[object]
Push-Location $storageWork
try {
  $index = 0
  foreach ($object in $storageRows) {
    $index++
    $bucket = [string]$object.bucketId
    $name = [string]$object.name
    $expectedSize = [int64]$object.size
    if ([string]::IsNullOrWhiteSpace($bucket) -or [string]::IsNullOrWhiteSpace($name)) { throw "Storage object inventory contains an invalid bucket/name." }
    $relativePath = Join-Path $bucket ($name -replace '/', '\')
    $destination = [System.IO.Path]::GetFullPath((Join-Path $storageObjectsDir $relativePath))
    $allowedRoot = [System.IO.Path]::GetFullPath($storageObjectsDir) + [System.IO.Path]::DirectorySeparatorChar
    if (-not $destination.StartsWith($allowedRoot,[System.StringComparison]::OrdinalIgnoreCase)) { throw "Storage object path escapes recovery root." }
    New-Item -ItemType Directory -Path (Split-Path -Parent $destination) -Force | Out-Null
    $src = "ss:///$bucket/$name"
    $logPath = Join-Path $logsDir ("storage-{0:D3}.log" -f $index)
    Invoke-SupabaseNoOutput @("storage","cp",$src,$destination,"--experimental","--linked") $logPath
    if (-not (Test-Path -LiteralPath $destination)) { throw "Storage CLI reported success but object was not written." }
    $actualSize = [int64](Get-Item -LiteralPath $destination).Length
    if ($actualSize -ne $expectedSize) { throw "Storage object size mismatch for inventory item $index." }
    $downloaded.Add([ordered]@{ bucketId=$bucket; name=$name; version=[string]$object.version; updatedAt=[string]$object.updatedAt; expectedBytes=$expectedSize; actualBytes=$actualSize; sha256=(Get-FileSha256 $destination) })
  }
} finally {
  Pop-Location
}

$localStorageFiles = @(Get-ChildItem -LiteralPath $storageObjectsDir -Recurse -File)
$localStorageCount = $localStorageFiles.Count
$localStorageBytes = if ($localStorageFiles.Count -eq 0) { [int64]0 } else { [int64](($localStorageFiles | Measure-Object -Property Length -Sum).Sum) }
if ($localStorageCount -ne [int64]$baselineStart.storageObjects -or $localStorageBytes -ne [int64]$baselineStart.storageTotalBytes) {
  throw "Fresh Storage payload does not match remote inventory."
}
Write-JsonFile $downloaded (Join-Path $inventoryDir "storage-objects-downloaded.json")
Write-JsonFile ([ordered]@{ schemaVersion="ACHEGUESE_STORAGE_OBJECT_VERIFICATION_V2"; capturedAt=[DateTimeOffset]::UtcNow.ToString("o"); mode="FRESH_REMOTE_DOWNLOAD"; remoteObjectCount=[int64]$baselineStart.storageObjects; remoteTotalBytes=[int64]$baselineStart.storageTotalBytes; localObjectCount=$localStorageCount; localTotalBytes=$localStorageBytes; countMatch=$true; bytesMatch=$true; perObjectSha256Captured=$true }) (Join-Path $inventoryDir "storage-object-verification.json")

$sourceZip = Join-Path $sourceDir "acheguese-$CandidateSha.zip"
& git -C $CandidatePath archive --format=zip --output=$sourceZip $CandidateSha
if ($LASTEXITCODE -ne 0 -or -not (Test-Path -LiteralPath $sourceZip)) { throw "git archive failed." }

$baselineEnd = Invoke-PsqlJson $baselineSql (Join-Path $inventoryDir "baseline-end.json")
$storageEnd = Invoke-PsqlJson $storageInventorySql (Join-Path $inventoryDir "storage-objects-remote-end.json")
$storageEndRaw = (Get-Content -LiteralPath (Join-Path $inventoryDir "storage-objects-remote-end.json") -Raw).Trim()
foreach ($field in @('migrationCount','latestMigration','authUsers','authIdentities','authMfaFactors','storageBuckets','storageObjects','storageTotalBytes','technicalBusinessRows','technicalBusinessActive','activeBusinesses','officialEducationSeed','cutoverPresent')) {
  if ([string]$baselineStart.$field -ne [string]$baselineEnd.$field) { throw "Remote state changed during recovery capture: $field" }
}
if ($storageStartRaw -ne $storageEndRaw) { throw "Storage object inventory changed during recovery capture." }

$remoteState = [ordered]@{ capturedAt=$capturedAt; migrationCount=[int64]$baselineEnd.migrationCount; latestMigration=[string]$baselineEnd.latestMigration; authUsers=[int64]$baselineEnd.authUsers; authIdentities=[int64]$baselineEnd.authIdentities; authMfaFactors=[int64]$baselineEnd.authMfaFactors; storageBuckets=[int64]$baselineEnd.storageBuckets; storageObjects=[int64]$baselineEnd.storageObjects; storageTotalBytes=[int64]$baselineEnd.storageTotalBytes; edgeFunctions=$functionInventory.Count; secretNames=$secretNames.Count; cutoverPresent=[bool]$baselineEnd.cutoverPresent; technicalBusinessRows=[int64]$baselineEnd.technicalBusinessRows; technicalBusinessActive=[int64]$baselineEnd.technicalBusinessActive; activeBusinesses=[int64]$baselineEnd.activeBusinesses; activeOfficialEducationSeed=[int64]$baselineEnd.officialEducationSeed }
Write-JsonFile $remoteState (Join-Path $inventoryDir "remote-state.json")
Write-JsonFile ([ordered]@{ capturedAt=[DateTimeOffset]::UtcNow.ToString("o"); supabaseCli=$resolvedSupabaseVersion; pgDump=(& pg_dump --version | Out-String).Trim(); pgRestore=(& pg_restore --version | Out-String).Trim(); psql=(& psql --version | Out-String).Trim(); connectionMode="Supavisor session mode IPv4"; host=$env:PGHOST; port=[int]$env:PGPORT; username=$env:PGUSER; database=$env:PGDATABASE; sslmode=$env:PGSSLMODE; dockerUsed=$false; localSupabaseUsed=$false; storageCapture="Supabase CLI fresh remote copy" }) (Join-Path $inventoryDir "tooling.json")

$readme = @"
# Achegue-se manual recovery snapshot $snapshotId

Private release-recovery package for Supabase Free.

- Candidate source SHA: $CandidateSha
- Supabase project: $ProjectRef
- Captured at: $capturedAt
- Valid until: $validUntil
- Coverage: Database, Auth, Storage
- Remote-only capture; Docker/local Supabase was not used.
- Every Storage object was downloaded fresh from the linked remote project during this capture and hashed individually.
- No secret values are stored; only secret names are inventoried.
- This capture performs no schema, migration, policy, Auth, Storage, Business, or CUTOVER mutation.
"@
Set-Content -LiteralPath (Join-Path $package "README.md") -Value $readme -Encoding UTF8

$runbook = @"
# Restore runbook

1. Verify CHECKSUMS.sha256 and MANIFEST.json before using the package.
2. Restore only to an isolated, explicitly approved remote recovery project; never restore into Production during a drill.
3. Confirm migration history and platform compatibility before replaying application schema/data.
4. Treat Auth rows as sensitive platform state; do not blindly replay sessions, tokens, or incompatible platform-owned rows.
5. Restore Storage metadata and physical objects only through supported Supabase APIs/tools after bucket validation.
6. Restore external secret values from the authorized external vault; this package stores secret names only.
7. Re-run application, Auth, migration, territorial, Business, and security verification before opening traffic.
8. Never print credentials, tokens, secret values, or dump contents into CI logs.
"@
Set-Content -LiteralPath (Join-Path $package "RESTORE-RUNBOOK.md") -Value $runbook -Encoding UTF8

Write-JsonFile ([ordered]@{ schemaVersion="ACHEGUESE_RECOVERY_ATTESTATION_V2"; snapshotId=$snapshotId; candidateSha=$CandidateSha; projectRef=$ProjectRef; capturedAt=$capturedAt; validUntil=$validUntil; coverage=@("DATABASE","AUTH","STORAGE"); remoteState=$remoteState; storagePhysicalCopy=[ordered]@{ mode="FRESH_REMOTE_DOWNLOAD"; objects=$localStorageCount; bytes=$localStorageBytes; perObjectSha256=$true }; mutationPerformed=$false }) (Join-Path $package "ATTESTATION.json")
Write-JsonFile ([ordered]@{ dumpValidation=$true; baselineStable=$true; storageInventoryStable=$true; storageFreshRemoteDownload=$true; storagePhysicalCopyVerified=$true; businessTechnicalActiveZero=$true; officialEducationSeedPreserved=$true; exactCandidateSourceArchived=$true; noMutationPerformed=$true }) (Join-Path $package "VALIDATION-REPORT.json")

$manifestFiles = @(Get-ChildItem -LiteralPath $package -Recurse -File | Sort-Object FullName | ForEach-Object { [ordered]@{ path=$_.FullName.Substring($package.Length+1).Replace('\','/'); bytes=[int64]$_.Length; sha256=(Get-FileSha256 $_.FullName) } })
Write-JsonFile ([ordered]@{ schemaVersion="ACHEGUESE_RECOVERY_MANIFEST_V2"; snapshotId=$snapshotId; capturedAt=$capturedAt; validUntil=$validUntil; projectRef=$ProjectRef; candidateSha=$CandidateSha; remoteOnly=$true; files=$manifestFiles }) (Join-Path $package "MANIFEST.json")
$checksumLines = @(Get-ChildItem -LiteralPath $package -Recurse -File | Where-Object { $_.Name -ne 'CHECKSUMS.sha256' } | Sort-Object FullName | ForEach-Object { $relative=$_.FullName.Substring($package.Length+1).Replace('\','/'); "$(Get-FileSha256 $_.FullName)  $relative" })
Set-Content -LiteralPath (Join-Path $package "CHECKSUMS.sha256") -Value $checksumLines -Encoding ASCII

$zipPath = Join-Path $root "Acheguese-Recovery-$snapshotId.zip"
Compress-Archive -Path (Join-Path $package '*') -DestinationPath $zipPath -CompressionLevel Optimal -Force
$sourceBytes = [int64](Get-Item -LiteralPath $zipPath).Length
$sourceSha = Get-FileSha256 $zipPath
$driveRoot = "G:\Meu Drive\Achegue-se Recovery"
if (-not (Test-Path -LiteralPath $driveRoot)) { throw "Private Google Drive sync root is unavailable." }
$driveFolder = Join-Path $driveRoot $snapshotId
New-Item -ItemType Directory -Path $driveFolder -Force | Out-Null
$destinationZip = Join-Path $driveFolder "Acheguese-Recovery-$snapshotId.zip"
Copy-Item -LiteralPath $zipPath -Destination $destinationZip -Force
Start-Sleep -Seconds 5
$destinationBytes = [int64](Get-Item -LiteralPath $destinationZip).Length
$destinationSha = Get-FileSha256 $destinationZip
$readbackMatch = ($sourceBytes -eq $destinationBytes -and $sourceSha -eq $destinationSha)
if (-not $readbackMatch) { throw "Private Drive sync-target local readback verification failed." }
Write-JsonFile ([ordered]@{ schemaVersion="ACHEGUESE_OFF_DEVICE_SYNC_TARGET_ATTESTATION_V2"; snapshotId=$snapshotId; capturedAt=[DateTimeOffset]::UtcNow.ToString("o"); destination="Private Google Drive synced folder"; path=$destinationZip; private=$true; status="SYNC_TARGET_LOCAL_READBACK_VERIFIED_CLOUD_CONFIRMATION_PENDING"; sourceBytes=$sourceBytes; destinationBytes=$destinationBytes; sourceSha256=$sourceSha; destinationSha256=$destinationSha; readbackHashMatch=$readbackMatch; storageObjectCount=[int64]$baselineEnd.storageObjects; storageTotalBytes=[int64]$baselineEnd.storageTotalBytes }) (Join-Path $driveFolder "OFF-DEVICE-ATTESTATION-$snapshotId.json")

$outputs = [ordered]@{ snapshot_id=$snapshotId; captured_at=$capturedAt; valid_until=$validUntil; artifact_bytes=$sourceBytes; artifact_sha256=$sourceSha; migration_count=$remoteState.migrationCount; latest_migration=$remoteState.latestMigration; auth_users=$remoteState.authUsers; auth_identities=$remoteState.authIdentities; auth_mfa=$remoteState.authMfaFactors; storage_buckets=$remoteState.storageBuckets; storage_objects=$remoteState.storageObjects; storage_bytes=$remoteState.storageTotalBytes; edge_functions=$remoteState.edgeFunctions; secret_names=$remoteState.secretNames; technical_rows=$remoteState.technicalBusinessRows; technical_active=$remoteState.technicalBusinessActive; active_businesses=$remoteState.activeBusinesses; education_seed=$remoteState.activeOfficialEducationSeed; cutover_present=$remoteState.cutoverPresent.ToString().ToLowerInvariant(); readback_match=$readbackMatch.ToString().ToLowerInvariant() }
foreach ($entry in $outputs.GetEnumerator()) { "$($entry.Key)=$($entry.Value)" | Add-Content -Path $env:GITHUB_OUTPUT -Encoding UTF8 }

Write-Host "RECOVERY_SNAPSHOT_LOCAL_CAPTURE_PASS"
Write-Host "SnapshotId=$snapshotId"
Write-Host "CapturedAt=$capturedAt"
Write-Host "ValidUntil=$validUntil"
Write-Host "Migration=$($remoteState.migrationCount)/$($remoteState.latestMigration)"
Write-Host "Auth=$($remoteState.authUsers)/$($remoteState.authIdentities)/$($remoteState.authMfaFactors)"
Write-Host "Storage=$($remoteState.storageBuckets)/$($remoteState.storageObjects)/$($remoteState.storageTotalBytes) FreshDownload=True"
Write-Host "BusinessTechnical=$($remoteState.technicalBusinessRows)/$($remoteState.technicalBusinessActive) ActiveBusinesses=$($remoteState.activeBusinesses) EducationSeed=$($remoteState.activeOfficialEducationSeed)"
Write-Host "EdgeFunctions=$($remoteState.edgeFunctions) SecretNames=$($remoteState.secretNames)"
Write-Host "ArtifactBytes=$sourceBytes ArtifactSha256=$sourceSha SyncTargetReadback=$readbackMatch CloudConfirmation=PENDING"
