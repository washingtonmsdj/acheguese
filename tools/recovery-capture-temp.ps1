param(
  [Parameter(Mandatory = $true)][string]$CandidateSha,
  [Parameter(Mandatory = $true)][string]$CandidatePath,
  [Parameter(Mandatory = $true)][string]$ProjectRef,
  [Parameter(Mandatory = $true)][string]$PreviousSnapshotId,
  [Parameter(Mandatory = $true)][int64]$PreviousStorageObjects,
  [Parameter(Mandatory = $true)][int64]$PreviousStorageBytes
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$env:PGHOST = "aws-0-us-west-2.pooler.supabase.com"
$env:PGPORT = "5432"
$env:PGUSER = "postgres.$ProjectRef"
$env:PGDATABASE = "postgres"
$env:PGSSLMODE = "require"
$env:PGCONNECT_TIMEOUT = "15"

function Add-PostgresToPath {
  if (Get-Command psql -ErrorAction SilentlyContinue) { return }

  $root = "C:\Program Files\PostgreSQL"
  if (-not (Test-Path -LiteralPath $root)) {
    throw "PostgreSQL installation root was not found."
  }

  $bins = @(Get-ChildItem -LiteralPath $root -Directory -ErrorAction Stop |
    Sort-Object { [version]($_.Name -replace '[^0-9\.]','') } -Descending |
    ForEach-Object { Join-Path $_.FullName "bin" } |
    Where-Object { Test-Path -LiteralPath (Join-Path $_ "psql.exe") })

  if ($bins.Count -eq 0) { throw "PostgreSQL client binaries were not found under $root." }
  $env:PATH = "$($bins[0]);$env:PATH"
}

function Resolve-SupabaseInvocation {
  $cmd = Get-Command supabase -ErrorAction SilentlyContinue
  if ($cmd) {
    return [ordered]@{ command = $cmd.Source; prefix = @() }
  }

  $npx = Get-Command npx -ErrorAction SilentlyContinue
  if ($npx) {
    return [ordered]@{ command = $npx.Source; prefix = @("--yes", "supabase@2.114.0") }
  }

  throw "Supabase CLI and npx fallback are unavailable."
}

function Invoke-Supabase([string[]]$Arguments) {
  $args = @($script:SupabaseInvocation.prefix) + $Arguments
  return & $script:SupabaseInvocation.command @args
}

function Invoke-PsqlJson([string]$Sql, [string]$Path) {
  $raw = (& psql -X -v ON_ERROR_STOP=1 -Atqc $Sql 2>&1 | Out-String).Trim()
  if ($LASTEXITCODE -ne 0) { throw "psql inventory query failed: $raw" }
  if ([string]::IsNullOrWhiteSpace($raw)) { $raw = "null" }
  $parsed = $raw | ConvertFrom-Json
  Set-Content -LiteralPath $Path -Value $raw -Encoding UTF8
  return $parsed
}

function Invoke-PgDump([string[]]$Arguments, [string]$LogPath) {
  & pg_dump @Arguments 2> $LogPath
  if ($LASTEXITCODE -ne 0) {
    $tail = (Get-Content -LiteralPath $LogPath -Tail 30 -ErrorAction SilentlyContinue) -join "`n"
    throw "pg_dump failed. $tail"
  }
}

function Write-JsonFile($Value, [string]$Path) {
  $Value | ConvertTo-Json -Depth 30 | Set-Content -LiteralPath $Path -Encoding UTF8
}

function Normalize-Array($Value, [string]$CollectionProperty) {
  if ($null -eq $Value) { return @() }
  $property = $Value.PSObject.Properties[$CollectionProperty]
  if ($property) { return @($property.Value) }
  return @($Value)
}

Add-PostgresToPath
$script:SupabaseInvocation = Resolve-SupabaseInvocation

foreach ($tool in @("psql", "pg_dump", "pg_restore")) {
  if (-not (Get-Command $tool -ErrorAction SilentlyContinue)) {
    throw "Required PostgreSQL tool '$tool' is unavailable after discovery."
  }
}

$actualSha = (& git -C $CandidatePath rev-parse HEAD | Out-String).Trim().ToLowerInvariant()
if ($actualSha -ne $CandidateSha.ToLowerInvariant()) {
  throw "Candidate checkout SHA mismatch. Expected=$CandidateSha Actual=$actualSha"
}

$probe = (& psql -X -Atqc "select 1" 2>&1 | Out-String).Trim()
if ($LASTEXITCODE -ne 0 -or $probe -ne "1") {
  throw "Remote PostgreSQL authentication through the secure local credential store failed."
}

$supabaseVersion = (Invoke-Supabase @("--version") | Out-String).Trim()
Write-Host "Pinned candidate checkout: $actualSha"
Write-Host "PostgreSQL client: $(& pg_dump --version)"
Write-Host "Supabase CLI: $supabaseVersion"

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
foreach ($dir in @($root,$package,$dbDir,$inventoryDir,$logsDir,$sourceDir,$storageDir)) {
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

$baselineStart = Invoke-PsqlJson $baselineSql (Join-Path $inventoryDir "baseline-start.json")
if ([int64]$baselineStart.storageObjects -ne $PreviousStorageObjects -or [int64]$baselineStart.storageTotalBytes -ne $PreviousStorageBytes) {
  throw "Storage changed since the prior verified physical copy; reuse is forbidden."
}
if ([int64]$baselineStart.technicalBusinessActive -ne 0) {
  throw "Business hygiene regression: technical fixture rows are active."
}
if ([int64]$baselineStart.officialEducationSeed -ne 15) {
  throw "Official education seed drift detected. Expected 15 INEP-backed rows."
}

Invoke-PgDump @("--no-owner","--no-privileges","--schema=public","--schema=extensions","--schema-only","--file=$dbDir/application-schema.sql") (Join-Path $logsDir "application-schema.log")
Invoke-PgDump @("--no-owner","--no-privileges","--schema=public","--schema=extensions","--data-only","--file=$dbDir/application-data.sql") (Join-Path $logsDir "application-data.log")
Invoke-PgDump @("--no-owner","--no-privileges","--schema=public","--schema=extensions","--format=custom","--file=$dbDir/application.custom") (Join-Path $logsDir "application-custom.log")
Invoke-PgDump @("--no-owner","--no-privileges","--schema=auth","--data-only","--file=$dbDir/auth-data.sql") (Join-Path $logsDir "auth-data.log")
Invoke-PgDump @("--no-owner","--no-privileges","--schema=supabase_migrations","--schema-only","--file=$dbDir/migration-history-schema.sql") (Join-Path $logsDir "migration-history-schema.log")
Invoke-PgDump @("--no-owner","--no-privileges","--schema=supabase_migrations","--data-only","--file=$dbDir/migration-history-data.sql") (Join-Path $logsDir "migration-history-data.log")
Invoke-PgDump @("--no-owner","--no-privileges","--data-only","--table=storage.buckets","--table=storage.objects","--file=$dbDir/storage-metadata.sql") (Join-Path $logsDir "storage-metadata.log")

$restoreList = & pg_restore --list (Join-Path $dbDir "application.custom") 2>&1
if ($LASTEXITCODE -ne 0) { throw "pg_restore could not validate application.custom" }
$restoreEntryCount = @($restoreList | Where-Object { $_ -and -not $_.StartsWith(";") }).Count
Write-JsonFile ([ordered]@{
  customDumpReadable = $true
  customDumpEntryCount = $restoreEntryCount
  validatedAt = [DateTimeOffset]::UtcNow.ToString("o")
}) (Join-Path $package "DUMP-VALIDATION.json")

Invoke-PsqlJson "select coalesce(json_agg(json_build_object('version',version,'name',name) order by version),'[]'::json)::text from supabase_migrations.schema_migrations;" (Join-Path $inventoryDir "migrations-applied.json") | Out-Null
Invoke-PsqlJson "select coalesce(json_agg(json_build_object('name',e.extname,'version',e.extversion) order by e.extname),'[]'::json)::text from pg_extension e;" (Join-Path $inventoryDir "extensions.json") | Out-Null
Invoke-PsqlJson "select coalesce(json_agg(json_build_object('id',id,'name',name,'public',public,'fileSizeLimit',file_size_limit,'allowedMimeTypes',allowed_mime_types) order by name),'[]'::json)::text from storage.buckets;" (Join-Path $inventoryDir "storage-buckets.json") | Out-Null

Write-JsonFile ([ordered]@{
  capturedAt = [DateTimeOffset]::UtcNow.ToString("o")
  users = [int64]$baselineStart.authUsers
  identities = [int64]$baselineStart.authIdentities
  mfaFactors = [int64]$baselineStart.authMfaFactors
}) (Join-Path $inventoryDir "auth-state.json")

Write-JsonFile ([ordered]@{
  capturedAt = [DateTimeOffset]::UtcNow.ToString("o")
  technicalRowsTotal = [int64]$baselineStart.technicalBusinessRows
  technicalRowsActive = [int64]$baselineStart.technicalBusinessActive
  activeBusinesses = [int64]$baselineStart.activeBusinesses
  activeOfficialEducationSeed = [int64]$baselineStart.officialEducationSeed
  mutation = "No deletion; technical rows remain archived with status=inactive and source metadata=e2e"
}) (Join-Path $inventoryDir "business-test-data-hygiene.json")

$functionsRaw = (Invoke-Supabase @("functions","list","--project-ref",$ProjectRef,"--output","json") 2>&1 | Out-String).Trim()
if ($LASTEXITCODE -ne 0) { throw "Supabase CLI could not list Edge Functions." }
$functionsParsed = $functionsRaw | ConvertFrom-Json
$functionItems = Normalize-Array $functionsParsed "functions"
$functionInventory = @($functionItems | ForEach-Object {
  $nameProperty = $_.PSObject.Properties['name']
  $slugProperty = $_.PSObject.Properties['slug']
  $versionProperty = $_.PSObject.Properties['version']
  $statusProperty = $_.PSObject.Properties['status']
  $verifyProperty = $_.PSObject.Properties['verify_jwt']
  $name = if ($nameProperty) { [string]$nameProperty.Value } elseif ($slugProperty) { [string]$slugProperty.Value } else { "" }
  if ($name) {
    [ordered]@{
      name = $name
      slug = if ($slugProperty) { [string]$slugProperty.Value } else { $null }
      version = if ($versionProperty -and $versionProperty.Value) { [int]$versionProperty.Value } else { $null }
      status = if ($statusProperty) { [string]$statusProperty.Value } else { $null }
      verifyJwt = if ($verifyProperty) { [bool]$verifyProperty.Value } else { $null }
    }
  }
})
Write-JsonFile $functionInventory (Join-Path $inventoryDir "edge-functions.json")

$secretsRaw = (Invoke-Supabase @("secrets","list","--project-ref",$ProjectRef,"--output","json") 2>&1 | Out-String).Trim()
if ($LASTEXITCODE -ne 0) { throw "Supabase CLI could not list secret names." }
$secretsParsed = $secretsRaw | ConvertFrom-Json
$secretItems = Normalize-Array $secretsParsed "secrets"
$secretNames = @($secretItems | ForEach-Object {
  $nameProperty = $_.PSObject.Properties['name']
  if (-not $nameProperty) { $nameProperty = $_.PSObject.Properties['Name'] }
  if ($nameProperty) { [string]$nameProperty.Value }
} | Where-Object { $_ } | Sort-Object -Unique)
Write-JsonFile $secretNames (Join-Path $inventoryDir "secret-names.json")
Write-JsonFile @($secretNames | Where-Object { $_ -match 'TURNSTILE' }) (Join-Path $inventoryDir "turnstile.json")

$previousZip = "G:\Meu Drive\Achegue-se Recovery\$PreviousSnapshotId\Acheguese-Recovery-$PreviousSnapshotId.zip"
if (-not (Test-Path -LiteralPath $previousZip)) {
  throw "Prior verified recovery package is unavailable on the private synced Drive mount."
}
$previousExtract = Join-Path $root "previous"
Expand-Archive -LiteralPath $previousZip -DestinationPath $previousExtract -Force
$previousObjects = Join-Path $previousExtract "storage\objects"
if (-not (Test-Path -LiteralPath $previousObjects)) { throw "Prior package has no storage/objects payload." }
$targetObjects = Join-Path $storageDir "objects"
Copy-Item -LiteralPath $previousObjects -Destination $targetObjects -Recurse -Force
$localStorageFiles = @(Get-ChildItem -LiteralPath $targetObjects -Recurse -File)
$localStorageCount = $localStorageFiles.Count
$localStorageBytes = [int64](($localStorageFiles | Measure-Object -Property Length -Sum).Sum)
if ($localStorageCount -ne [int64]$baselineStart.storageObjects -or $localStorageBytes -ne [int64]$baselineStart.storageTotalBytes) {
  throw "Reused Storage payload does not match current remote inventory."
}
Write-JsonFile ([ordered]@{
  schemaVersion = "ACHEGUESE_STORAGE_OBJECT_VERIFICATION_V1"
  capturedAt = [DateTimeOffset]::UtcNow.ToString("o")
  sourceSnapshotId = $PreviousSnapshotId
  remoteObjectCount = [int64]$baselineStart.storageObjects
  remoteTotalBytes = [int64]$baselineStart.storageTotalBytes
  localObjectCount = $localStorageCount
  localTotalBytes = $localStorageBytes
  countMatch = $true
  bytesMatch = $true
  reusedBecause = "Remote Storage object count and total bytes are unchanged since the prior verified physical copy"
}) (Join-Path $inventoryDir "storage-object-verification.json")

$sourceZip = Join-Path $sourceDir "acheguese-$CandidateSha.zip"
& git -C $CandidatePath archive --format=zip --output=$sourceZip $CandidateSha
if ($LASTEXITCODE -ne 0 -or -not (Test-Path -LiteralPath $sourceZip)) { throw "git archive failed." }

$baselineEnd = Invoke-PsqlJson $baselineSql (Join-Path $inventoryDir "baseline-end.json")
foreach ($field in @('migrationCount','latestMigration','authUsers','authIdentities','authMfaFactors','storageBuckets','storageObjects','storageTotalBytes','technicalBusinessRows','technicalBusinessActive','activeBusinesses','officialEducationSeed','cutoverPresent')) {
  if ([string]$baselineStart.$field -ne [string]$baselineEnd.$field) {
    throw "Remote state changed during recovery capture: $field"
  }
}

$remoteState = [ordered]@{
  capturedAt = $capturedAt
  migrationCount = [int64]$baselineEnd.migrationCount
  latestMigration = [string]$baselineEnd.latestMigration
  authUsers = [int64]$baselineEnd.authUsers
  authIdentities = [int64]$baselineEnd.authIdentities
  authMfaFactors = [int64]$baselineEnd.authMfaFactors
  storageBuckets = [int64]$baselineEnd.storageBuckets
  storageObjects = [int64]$baselineEnd.storageObjects
  storageTotalBytes = [int64]$baselineEnd.storageTotalBytes
  edgeFunctions = $functionInventory.Count
  secretNames = $secretNames.Count
  cutoverPresent = [bool]$baselineEnd.cutoverPresent
  technicalBusinessRows = [int64]$baselineEnd.technicalBusinessRows
  technicalBusinessActive = [int64]$baselineEnd.technicalBusinessActive
  activeBusinesses = [int64]$baselineEnd.activeBusinesses
  activeOfficialEducationSeed = [int64]$baselineEnd.officialEducationSeed
}
Write-JsonFile $remoteState (Join-Path $inventoryDir "remote-state.json")

Write-JsonFile ([ordered]@{
  supabaseCli = $supabaseVersion
  pgDump = (& pg_dump --version | Out-String).Trim()
  pgRestore = (& pg_restore --version | Out-String).Trim()
  psql = (& psql --version | Out-String).Trim()
  connectionMode = "Supavisor session mode IPv4"
  host = $env:PGHOST
  port = [int]$env:PGPORT
  username = $env:PGUSER
  database = $env:PGDATABASE
  sslmode = $env:PGSSLMODE
  dockerUsed = $false
  localSupabaseUsed = $false
}) (Join-Path $inventoryDir "tooling.json")

$readme = @"
# Achegue-se manual recovery snapshot $snapshotId

Private release-recovery package for Supabase Free.

- Candidate source SHA: $CandidateSha
- Supabase project: $ProjectRef
- Captured at: $capturedAt
- Valid until: $validUntil (24h freshness policy)
- Coverage: Database, Auth, Storage
- Remote-only capture; Docker/local Supabase was not used.
- Storage physical objects were reused from verified snapshot $PreviousSnapshotId only after current remote count and total bytes matched exactly ($($baselineEnd.storageObjects) objects / $($baselineEnd.storageTotalBytes) bytes).
- No secrets or secret values are stored; only secret names are inventoried.
- This capture performs no schema, migration, policy, Auth, Storage, Business, or CUTOVER mutation.
"@
Set-Content -LiteralPath (Join-Path $package "README.md") -Value $readme -Encoding UTF8

$runbook = @"
# Restore runbook

1. Verify every entry in CHECKSUMS.sha256 before using the package.
2. Confirm the intended target project and migration history before any restore operation.
3. Restore application schema/data only inside an explicitly approved recovery window.
4. Treat Auth and Storage metadata as sensitive platform state; do not blindly replay credentials, tokens, sessions, or incompatible platform-owned rows.
5. Restore Storage binaries only after bucket/object inventory validation.
6. Re-run application, Auth, migration, territorial, Business, and security verification before reopening traffic.
7. Never print credentials, tokens, secret values, or dump contents into CI logs.
"@
Set-Content -LiteralPath (Join-Path $package "RESTORE-RUNBOOK.md") -Value $runbook -Encoding UTF8

Write-JsonFile ([ordered]@{
  schemaVersion = "ACHEGUESE_RECOVERY_ATTESTATION_V1"
  snapshotId = $snapshotId
  candidateSha = $CandidateSha
  projectRef = $ProjectRef
  capturedAt = $capturedAt
  validUntil = $validUntil
  coverage = @("DATABASE","AUTH","STORAGE")
  remoteState = $remoteState
  storagePhysicalCopy = [ordered]@{ reusedFrom = $PreviousSnapshotId; countMatch = $true; bytesMatch = $true }
  mutationPerformed = $false
}) (Join-Path $package "ATTESTATION.json")

Write-JsonFile ([ordered]@{
  dumpValidation = $true
  baselineStable = $true
  storagePhysicalCopyVerified = $true
  businessTechnicalActiveZero = $true
  officialEducationSeedPreserved = $true
  exactCandidateSourceArchived = $true
  noMutationPerformed = $true
}) (Join-Path $package "VALIDATION-REPORT.json")

$manifestEntries = @(Get-ChildItem -LiteralPath $package -Recurse -File | ForEach-Object {
  [ordered]@{
    path = $_.FullName.Substring($package.Length + 1).Replace('\','/')
    bytes = [int64]$_.Length
  }
} | Sort-Object path)
Write-JsonFile ([ordered]@{
  schemaVersion = "ACHEGUESE_RECOVERY_MANIFEST_V1"
  snapshotId = $snapshotId
  candidateSha = $CandidateSha
  files = $manifestEntries
}) (Join-Path $package "MANIFEST.json")

$checksumLines = @(Get-ChildItem -LiteralPath $package -Recurse -File | Where-Object { $_.Name -ne 'CHECKSUMS.sha256' } | Sort-Object FullName | ForEach-Object {
  $relative = $_.FullName.Substring($package.Length + 1).Replace('\','/')
  $hash = (Get-FileHash -Algorithm SHA256 -LiteralPath $_.FullName).Hash.ToLowerInvariant()
  "$hash  $relative"
})
Set-Content -LiteralPath (Join-Path $package "CHECKSUMS.sha256") -Value $checksumLines -Encoding ASCII

$zipPath = Join-Path $root "Acheguese-Recovery-$snapshotId.zip"
Compress-Archive -Path (Join-Path $package '*') -DestinationPath $zipPath -CompressionLevel Optimal -Force
$sourceBytes = [int64](Get-Item -LiteralPath $zipPath).Length
$sourceSha = (Get-FileHash -Algorithm SHA256 -LiteralPath $zipPath).Hash.ToLowerInvariant()

$driveFolder = "G:\Meu Drive\Achegue-se Recovery\$snapshotId"
New-Item -ItemType Directory -Path $driveFolder -Force | Out-Null
$destinationZip = Join-Path $driveFolder "Acheguese-Recovery-$snapshotId.zip"
Copy-Item -LiteralPath $zipPath -Destination $destinationZip -Force
Start-Sleep -Seconds 3
$destinationBytes = [int64](Get-Item -LiteralPath $destinationZip).Length
$destinationSha = (Get-FileHash -Algorithm SHA256 -LiteralPath $destinationZip).Hash.ToLowerInvariant()
$readbackMatch = ($sourceBytes -eq $destinationBytes -and $sourceSha -eq $destinationSha)
if (-not $readbackMatch) { throw "Private Drive readback verification failed." }

$offDeviceAttestation = [ordered]@{
  schemaVersion = "ACHEGUESE_OFF_DEVICE_ATTESTATION_V1"
  snapshotId = $snapshotId
  capturedAt = [DateTimeOffset]::UtcNow.ToString("o")
  destination = "Private Google Drive synced folder"
  path = $destinationZip
  private = $true
  localOnly = $false
  status = "VERIFIED"
  sourceBytes = $sourceBytes
  destinationBytes = $destinationBytes
  sourceSha256 = $sourceSha
  destinationSha256 = $destinationSha
  readbackHashMatch = $readbackMatch
  storageObjectCount = [int64]$baselineEnd.storageObjects
  storageTotalBytes = [int64]$baselineEnd.storageTotalBytes
}
$attestationPath = Join-Path $driveFolder "OFF-DEVICE-ATTESTATION-$snapshotId.json"
Write-JsonFile $offDeviceAttestation $attestationPath

$outputs = [ordered]@{
  snapshot_id = $snapshotId
  captured_at = $capturedAt
  valid_until = $validUntil
  artifact_bytes = $sourceBytes
  artifact_sha256 = $sourceSha
  migration_count = $remoteState.migrationCount
  latest_migration = $remoteState.latestMigration
  auth_users = $remoteState.authUsers
  auth_identities = $remoteState.authIdentities
  auth_mfa = $remoteState.authMfaFactors
  storage_buckets = $remoteState.storageBuckets
  storage_objects = $remoteState.storageObjects
  storage_bytes = $remoteState.storageTotalBytes
  edge_functions = $remoteState.edgeFunctions
  secret_names = $remoteState.secretNames
  technical_rows = $remoteState.technicalBusinessRows
  technical_active = $remoteState.technicalBusinessActive
  active_businesses = $remoteState.activeBusinesses
  education_seed = $remoteState.activeOfficialEducationSeed
  cutover_present = $remoteState.cutoverPresent.ToString().ToLowerInvariant()
  readback_match = $readbackMatch.ToString().ToLowerInvariant()
}
foreach ($entry in $outputs.GetEnumerator()) {
  "$($entry.Key)=$($entry.Value)" | Add-Content -Path $env:GITHUB_OUTPUT -Encoding UTF8
}

Write-Host "RECOVERY_SNAPSHOT_PASS"
Write-Host "SnapshotId=$snapshotId"
Write-Host "CapturedAt=$capturedAt"
Write-Host "ValidUntil=$validUntil"
Write-Host "Migration=$($remoteState.migrationCount)/$($remoteState.latestMigration)"
Write-Host "Auth=$($remoteState.authUsers)/$($remoteState.authIdentities)/$($remoteState.authMfaFactors)"
Write-Host "Storage=$($remoteState.storageBuckets)/$($remoteState.storageObjects)/$($remoteState.storageTotalBytes)"
Write-Host "BusinessTechnical=$($remoteState.technicalBusinessRows)/$($remoteState.technicalBusinessActive) ActiveBusinesses=$($remoteState.activeBusinesses) EducationSeed=$($remoteState.activeOfficialEducationSeed)"
Write-Host "EdgeFunctions=$($remoteState.edgeFunctions) SecretNames=$($remoteState.secretNames)"
Write-Host "ArtifactBytes=$sourceBytes ArtifactSha256=$sourceSha Readback=$readbackMatch"
