param(
  [string]$ProjectRef = "xhdowzacfujckjelqhtd",
  [string]$SourceSha = "694b4f962cc26695abc3bd87afed0e806f5cf580",
  [string]$PriorSnapshotId = "20260815T201851Z",
  [string]$PriorSnapshotSha256 = "39ad4c122f0c0d94e4944553bbb68ddb3fe4e529e3e730b01c92e289fb823779",
  [string]$DriveRecoveryRoot = "G:\Meu Drive\Achegue-se Recovery"
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

function Require-Command([string]$Name) {
  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
    throw "Required recovery tool missing: $Name"
  }
}

function Write-JsonFile([string]$Path, $Value, [int]$Depth = 12) {
  $Value | ConvertTo-Json -Depth $Depth | Set-Content -LiteralPath $Path -Encoding UTF8
}

function Invoke-PsqlScalar([string]$Sql) {
  $output = & psql -X -q -v ON_ERROR_STOP=1 -At -c $Sql 2>&1
  if ($LASTEXITCODE -ne 0) { throw "psql query failed without publishing query output" }
  return (($output | Out-String).Trim())
}

function Invoke-PsqlJson([string]$Sql, [string]$Path) {
  $value = Invoke-PsqlScalar $Sql
  if ([string]::IsNullOrWhiteSpace($value)) { throw "psql JSON query returned empty output" }
  try { $null = $value | ConvertFrom-Json } catch { throw "psql JSON query did not return valid JSON" }
  $value | Set-Content -LiteralPath $Path -Encoding UTF8
}

function Invoke-PgDump([string]$Name, [string[]]$Arguments, [string]$OutputPath, [string]$LogPath) {
  & pg_dump @Arguments "--file=$OutputPath" 2> $LogPath
  if ($LASTEXITCODE -ne 0) { throw "pg_dump failed: $Name (see private local log)" }
  if (-not (Test-Path -LiteralPath $OutputPath -PathType Leaf)) { throw "pg_dump output missing: $Name" }
  if ((Get-Item -LiteralPath $OutputPath).Length -le 0) { throw "pg_dump output empty: $Name" }
}

function Get-RemoteCoreState([string]$CapturedAt, [int]$EdgeFunctions, [int]$SecretNames) {
  $migrationCount = [int](Invoke-PsqlScalar "select count(*) from supabase_migrations.schema_migrations")
  $latestMigration = Invoke-PsqlScalar "select coalesce(max(version),'') from supabase_migrations.schema_migrations"
  $authUsers = [int](Invoke-PsqlScalar "select count(*) from auth.users")
  $authIdentities = [int](Invoke-PsqlScalar "select count(*) from auth.identities")
  $authMfaFactors = [int](Invoke-PsqlScalar "select count(*) from auth.mfa_factors")
  $storageObjects = [int](Invoke-PsqlScalar "select count(*) from storage.objects")
  $storageTotalBytes = [int64](Invoke-PsqlScalar "select coalesce(sum((metadata->>'size')::bigint),0) from storage.objects where metadata ? 'size'")
  return [ordered]@{
    schemaVersion = "ACHEGUESE_REMOTE_STATE_V1"
    capturedAt = $CapturedAt
    migrationCount = $migrationCount
    latestMigration = $latestMigration
    authUsers = $authUsers
    authIdentities = $authIdentities
    authMfaFactors = $authMfaFactors
    storageObjects = $storageObjects
    storageTotalBytes = $storageTotalBytes
    edgeFunctions = $EdgeFunctions
    secretNames = $SecretNames
  }
}

function Get-SupabaseFunctionsInventory {
  $raw = & supabase functions list --project-ref $ProjectRef --output json 2>&1
  if ($LASTEXITCODE -ne 0) { throw "Supabase CLI could not list Edge Functions" }
  $text = ($raw | Out-String).Trim()
  try { $parsed = $text | ConvertFrom-Json } catch { throw "Supabase functions inventory was not valid JSON" }
  if ($parsed.functions) { $parsed = $parsed.functions }
  return @($parsed | ForEach-Object {
    [ordered]@{
      name = $_.name
      slug = $_.slug
      status = $_.status
      version = $_.version
      verifyJwt = if ($null -ne $_.verify_jwt) { [bool]$_.verify_jwt } elseif ($null -ne $_.verifyJwt) { [bool]$_.verifyJwt } else { $null }
    }
  } | Sort-Object slug)
}

function Get-SupabaseSecretNames {
  $raw = & supabase secrets list --project-ref $ProjectRef --output json 2>&1
  if ($LASTEXITCODE -ne 0) { throw "Supabase CLI could not list secret names" }
  $text = ($raw | Out-String).Trim()
  try { $parsed = $text | ConvertFrom-Json } catch { throw "Supabase secret inventory was not valid JSON" }
  if ($parsed.secrets) { $parsed = $parsed.secrets }
  $names = @($parsed | ForEach-Object { if ($_.name) { [string]$_.name } } | Where-Object { $_ } | Sort-Object -Unique)
  if ($names.Count -eq 0) { throw "Supabase secret-name inventory was empty" }
  return $names
}

foreach ($tool in @("git", "supabase", "pg_dump", "pg_restore", "psql")) { Require-Command $tool }

$expectedMain = (git ls-remote origin refs/heads/main | ForEach-Object { ($_ -split "\s+")[0] }).Trim()
if ($expectedMain -ne $SourceSha) {
  throw "Recovery blocked: main moved. Expected production SHA $SourceSha, observed $expectedMain"
}

$env:PGHOST = "aws-0-us-west-2.pooler.supabase.com"
$env:PGPORT = "5432"
$env:PGUSER = "postgres.$ProjectRef"
$env:PGDATABASE = "postgres"
$env:PGSSLMODE = "require"

$pgpass = Join-Path $env:APPDATA "postgresql\pgpass.conf"
if (-not (Test-Path -LiteralPath $pgpass -PathType Leaf)) {
  throw "Recovery blocked: expected private pgpass file is absent"
}

if ((Invoke-PsqlScalar "select 1") -ne "1") { throw "Recovery blocked: remote database connectivity check failed" }

$now = [DateTimeOffset]::UtcNow
$snapshotId = $now.ToString("yyyyMMdd'T'HHmmss'Z'")
$capturedAt = $now.ToString("o")
$validUntil = $now.AddHours(24).ToString("o")
$workRoot = Join-Path $env:RUNNER_TEMP "acheguese-recovery-$snapshotId"
$stage = Join-Path $workRoot "package"
$databaseDir = Join-Path $stage "database"
$inventoryDir = Join-Path $stage "inventories"
$logsDir = Join-Path $stage "logs"
$sourceDir = Join-Path $stage "source"
$localZip = Join-Path $workRoot "Acheguese-Recovery-$snapshotId.zip"
$destinationDir = Join-Path $DriveRecoveryRoot $snapshotId
$destinationZip = Join-Path $destinationDir "Acheguese-Recovery-$snapshotId.zip"
$externalAttestation = Join-Path $destinationDir "OFF-DEVICE-ATTESTATION-$snapshotId.json"

Remove-Item -LiteralPath $workRoot -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Force -Path $databaseDir,$inventoryDir,$logsDir,$sourceDir | Out-Null

$functions = Get-SupabaseFunctionsInventory
$secretNames = Get-SupabaseSecretNames
$baselineStart = Get-RemoteCoreState $capturedAt $functions.Count $secretNames.Count
Write-JsonFile (Join-Path $inventoryDir "baseline-start.json") $baselineStart

$priorZip = Join-Path (Join-Path $DriveRecoveryRoot $PriorSnapshotId) "Acheguese-Recovery-$PriorSnapshotId.zip"
if (-not (Test-Path -LiteralPath $priorZip -PathType Leaf)) { throw "Recovery blocked: prior verified Storage snapshot is unavailable" }
$priorHash = (Get-FileHash -LiteralPath $priorZip -Algorithm SHA256).Hash.ToLowerInvariant()
if ($priorHash -ne $PriorSnapshotSha256) { throw "Recovery blocked: prior snapshot hash mismatch" }

$priorExtract = Join-Path $workRoot "prior"
Expand-Archive -LiteralPath $priorZip -DestinationPath $priorExtract -Force
$priorStorage = Join-Path $priorExtract "storage"
if (-not (Test-Path -LiteralPath $priorStorage -PathType Container)) { throw "Recovery blocked: prior Storage copy is missing" }
Copy-Item -LiteralPath $priorStorage -Destination (Join-Path $stage "storage") -Recurse -Force

$localStorageFiles = @(Get-ChildItem -LiteralPath (Join-Path $stage "storage\objects") -Recurse -File -ErrorAction SilentlyContinue)
$localStorageCount = $localStorageFiles.Count
$localStorageBytes = [int64](($localStorageFiles | Measure-Object Length -Sum).Sum)
if ($null -eq $localStorageBytes) { $localStorageBytes = 0 }
if ($localStorageCount -ne $baselineStart.storageObjects -or $localStorageBytes -ne $baselineStart.storageTotalBytes) {
  throw "Recovery blocked: Storage changed since prior verified binary copy; full binary download is required"
}

$common = @("--no-owner", "--no-privileges")
Invoke-PgDump "application-schema" ($common + @("--schema=public", "--schema=extensions", "--schema-only")) (Join-Path $databaseDir "application-schema.sql") (Join-Path $logsDir "pg_dump-application-schema.log")
Invoke-PgDump "application-data" ($common + @("--schema=public", "--schema=extensions", "--data-only")) (Join-Path $databaseDir "application-data.sql") (Join-Path $logsDir "pg_dump-application-data.log")
Invoke-PgDump "application-custom" ($common + @("--schema=public", "--schema=extensions", "--format=custom")) (Join-Path $databaseDir "application.custom") (Join-Path $logsDir "pg_dump-application-custom.log")
Invoke-PgDump "auth-data" ($common + @("--schema=auth", "--data-only")) (Join-Path $databaseDir "auth-data.sql") (Join-Path $logsDir "pg_dump-auth-data.log")
Invoke-PgDump "migration-history-schema" ($common + @("--schema=supabase_migrations", "--schema-only")) (Join-Path $databaseDir "migration-history-schema.sql") (Join-Path $logsDir "pg_dump-migration-history-schema.log")
Invoke-PgDump "migration-history-data" ($common + @("--schema=supabase_migrations", "--data-only")) (Join-Path $databaseDir "migration-history-data.sql") (Join-Path $logsDir "pg_dump-migration-history-data.log")
Invoke-PgDump "storage-metadata" ($common + @("--schema=storage", "--data-only")) (Join-Path $databaseDir "storage-metadata.sql") (Join-Path $logsDir "pg_dump-storage-metadata.log")

$restoreList = & pg_restore --list (Join-Path $databaseDir "application.custom") 2>&1
if ($LASTEXITCODE -ne 0) { throw "Recovery blocked: pg_restore could not validate custom dump" }
$restoreEntries = @($restoreList | Where-Object { $_ -match '^\d+;' }).Count
if ($restoreEntries -le 0) { throw "Recovery blocked: custom dump had no restore entries" }

& git fetch origin $SourceSha --depth=1 2>$null
if ($LASTEXITCODE -ne 0) { throw "Recovery blocked: source SHA could not be fetched" }
$sourceZip = Join-Path $sourceDir "acheguese-$SourceSha.zip"
& git archive --format=zip --output=$sourceZip $SourceSha
if ($LASTEXITCODE -ne 0 -or -not (Test-Path -LiteralPath $sourceZip)) { throw "Recovery blocked: source archive failed" }

Write-JsonFile (Join-Path $inventoryDir "edge-functions.json") $functions
Write-JsonFile (Join-Path $inventoryDir "secret-names.json") $secretNames
Write-JsonFile (Join-Path $inventoryDir "turnstile.json") ([ordered]@{ snapshotId=$snapshotId; namesOnly=$true; matchingSecretNames=@($secretNames | Where-Object { $_ -eq 'TURNSTILE_SECRET_KEY' }) })

Invoke-PsqlJson "select coalesce(jsonb_agg(jsonb_build_object('version',version,'name',name) order by version),'[]'::jsonb) from supabase_migrations.schema_migrations" (Join-Path $inventoryDir "migrations-applied.json")
Invoke-PsqlJson "select coalesce(jsonb_agg(jsonb_build_object('extname',e.extname,'extversion',e.extversion,'schema',n.nspname) order by e.extname),'[]'::jsonb) from pg_extension e join pg_namespace n on n.oid=e.extnamespace" (Join-Path $inventoryDir "extensions.json")
Invoke-PsqlJson "select coalesce(jsonb_agg(name order by name),'[]'::jsonb) from storage.buckets" (Join-Path $inventoryDir "storage-buckets.json")

$authState = [ordered]@{ schemaVersion="ACHEGUESE_AUTH_STATE_V1"; capturedAt=$capturedAt; users=$baselineStart.authUsers; identities=$baselineStart.authIdentities; mfaFactors=$baselineStart.authMfaFactors }
Write-JsonFile (Join-Path $inventoryDir "auth-state.json") $authState

$businessTechnicalTotal = [int](Invoke-PsqlScalar "select count(*) from public.business_data where metadata->>'source'='e2e' and metadata->>'source_kind'='technical_fixture'")
$businessTechnicalActive = [int](Invoke-PsqlScalar "select count(*) from public.business_data where metadata->>'source'='e2e' and metadata->>'source_kind'='technical_fixture' and status='active'")
$activeBusinesses = [int](Invoke-PsqlScalar "select count(*) from public.business_data where status='active'")
$officialEducation = [int](Invoke-PsqlScalar "select count(*) from public.business_data where status='active' and metadata->>'source'='public_education_seed'")
if ($businessTechnicalActive -ne 0 -or $officialEducation -ne 15) { throw "Recovery blocked: Business hygiene invariants changed" }
$businessHygiene = [ordered]@{
  schemaVersion="ACHEGUESE_BUSINESS_TEST_DATA_HYGIENE_V1"; capturedAt=$capturedAt;
  technicalRowsTotal=$businessTechnicalTotal; technicalRowsActive=$businessTechnicalActive;
  activeBusinesses=$activeBusinesses; activeOfficialEducationSeed=$officialEducation;
  mutation="No deletion; technical rows remain archived with status=inactive and source metadata=e2e"
}
Write-JsonFile (Join-Path $inventoryDir "business-test-data-hygiene.json") $businessHygiene

$storageVerification = [ordered]@{
  schemaVersion="ACHEGUESE_STORAGE_OBJECT_VERIFICATION_V1"; capturedAt=$capturedAt; sourceSnapshotId=$PriorSnapshotId;
  remoteObjectCount=$baselineStart.storageObjects; remoteTotalBytes=$baselineStart.storageTotalBytes;
  localObjectCount=$localStorageCount; localTotalBytes=$localStorageBytes;
  countMatch=($localStorageCount -eq $baselineStart.storageObjects); bytesMatch=($localStorageBytes -eq $baselineStart.storageTotalBytes);
  reusedBecause="Remote Storage object count and byte total matched the prior verified binary snapshot exactly"
}
Write-JsonFile (Join-Path $inventoryDir "storage-object-verification.json") $storageVerification

$tooling = [ordered]@{
  capturedAt=$capturedAt;
  supabaseCli=((& supabase --version) | Out-String).Trim();
  pgDump=((& pg_dump --version) | Out-String).Trim();
  pgRestore=((& pg_restore --version) | Out-String).Trim();
  psql=((& psql --version) | Out-String).Trim();
  connectionMode="Supavisor session mode IPv4"; host=$env:PGHOST; port=[int]$env:PGPORT; username=$env:PGUSER; database=$env:PGDATABASE; sslmode=$env:PGSSLMODE;
  pgpassfilePresent=$true; dockerUsed=$false; localSupabaseUsed=$false; sourceHead=$SourceSha
}
Write-JsonFile (Join-Path $inventoryDir "tooling.json") $tooling

$baselineEndTime = [DateTimeOffset]::UtcNow.ToString("o")
$functionsEnd = Get-SupabaseFunctionsInventory
$secretNamesEnd = Get-SupabaseSecretNames
$baselineEnd = Get-RemoteCoreState $baselineEndTime $functionsEnd.Count $secretNamesEnd.Count
Write-JsonFile (Join-Path $inventoryDir "baseline-end.json") $baselineEnd
Write-JsonFile (Join-Path $inventoryDir "remote-state.json") $baselineEnd

foreach ($key in @("migrationCount","latestMigration","authUsers","authIdentities","authMfaFactors","storageObjects","storageTotalBytes","edgeFunctions","secretNames")) {
  if ($baselineStart[$key] -ne $baselineEnd[$key]) { throw "Recovery blocked: remote state changed during capture ($key)" }
}

$readme = @"
# Achegue-se Recovery Snapshot $snapshotId

Manual recovery evidence captured from the remote-only Supabase project after auth hardening and immediately before the final Phase 4.6 certification.

- Production head represented: $SourceSha
- Remote state: inventories/remote-state.json
- Database dumps: database/
- Storage binary copy: storage/
- Storage binaries were reused from $PriorSnapshotId only after current remote object count and byte total matched exactly.
- No secrets are included in manifests or reports. Database dumps are private recovery material and must not be published.
- No migration, policy, Auth, Storage, schema, CUTOVER or business-row mutation was performed by this capture.
"@
$readme | Set-Content -LiteralPath (Join-Path $stage "README.md") -Encoding UTF8

$runbook = @"
# Manual Restore Runbook

This package is a remote-only manual recovery artifact. It is not managed PITR and does not guarantee an RTO.

1. Preserve the package privately and verify CHECKSUMS.sha256.
2. Confirm the target Supabase project and migration history before any restore.
3. Restore schema/data only under an approved operator change window.
4. Restore Auth and Storage metadata only with Supabase platform compatibility checks; do not replay credentials or tokens blindly.
5. Restore Storage binary objects from storage/objects only after validating the object inventory.
6. Run application, authorization, migration and security verification before reopening traffic.

Never print credentials, token material or dump contents in logs.
"@
$runbook | Set-Content -LiteralPath (Join-Path $stage "RESTORE-RUNBOOK.md") -Encoding UTF8

$internalAttestation = [ordered]@{
  schemaVersion="ACHEGUESE_OFF_DEVICE_ATTESTATION_V1"; snapshotId=$snapshotId; capturedAt=$capturedAt;
  artifact="Acheguese-Recovery-$snapshotId.zip"; status="PENDING_OFF_DEVICE_READBACK"; private=$true; localOnly=$false;
  readbackHashMatch=$false; packageSha256=$null; packageBytes=$null; sourceStateMutation="none during capture"
}
Write-JsonFile (Join-Path $stage "ATTESTATION.json") $internalAttestation

$dumpFiles = @(
  "database/application-data.sql","database/application-schema.sql","database/application.custom","database/auth-data.sql",
  "database/migration-history-data.sql","database/migration-history-schema.sql","database/storage-metadata.sql"
)
$dumpValidationFiles = @()
foreach ($rel in $dumpFiles) {
  $full = Join-Path $stage $rel
  $dumpValidationFiles += [ordered]@{ path=$rel; bytes=(Get-Item $full).Length; sha256=(Get-FileHash $full -Algorithm SHA256).Hash.ToLowerInvariant() }
}
$dumpValidation = [ordered]@{
  schemaVersion="ACHEGUESE_DUMP_VALIDATION_V1"; snapshotId=$snapshotId; capturedAt=$capturedAt; remoteOnly=$true; productionHead=$SourceSha;
  database=[ordered]@{ plainSqlFiles=$dumpValidationFiles; customFormat=[ordered]@{ path="database/application.custom"; bytes=(Get-Item (Join-Path $databaseDir "application.custom")).Length; sha256=(Get-FileHash (Join-Path $databaseDir "application.custom") -Algorithm SHA256).Hash.ToLowerInvariant(); pgRestoreListExit=0; pgRestoreEntries=$restoreEntries } };
  storage=$storageVerification; mutationScope="read-only recovery capture; no production mutation"; secretsIncluded=$false
}
Write-JsonFile (Join-Path $stage "DUMP-VALIDATION.json") $dumpValidation

$validationReport = [ordered]@{
  schemaVersion="ACHEGUESE_RECOVERY_VALIDATION_REPORT_V1"; snapshotId=$snapshotId; capturedAt=$capturedAt; validUntil=$validUntil;
  checks=[ordered]@{ remoteStateCaptured=$true; applicationDumpsNonEmpty=$true; customDumpValidated=$true; storageCountMatch=$true; storageBytesMatch=$true; technicalBusinessRowsActive=$businessTechnicalActive; officialEducationSeedPreserved=$officialEducation; productionHead=$SourceSha; noDestructiveDeletion=$true; noMigrationPolicyCutoverChange=$true };
  result="RECOVERY_CAPTURED_PRE_PHASE_4_6_FINAL_CERTIFICATION"
}
Write-JsonFile (Join-Path $stage "VALIDATION-REPORT.json") $validationReport

$manifestEntries = @()
foreach ($file in Get-ChildItem -LiteralPath $stage -Recurse -File | Sort-Object FullName) {
  $rel = $file.FullName.Substring($stage.Length + 1).Replace("\","/")
  if ($rel -in @("MANIFEST.json","CHECKSUMS.sha256")) { continue }
  $manifestEntries += [ordered]@{ path=$rel; bytes=$file.Length; sha256=(Get-FileHash $file.FullName -Algorithm SHA256).Hash.ToLowerInvariant() }
}
$manifest = [ordered]@{ schemaVersion="ACHEGUESE_RECOVERY_MANIFEST_V1"; snapshotId=$snapshotId; capturedAt=$capturedAt; validUntil=$validUntil; projectRef=$ProjectRef; head=$SourceSha; remoteOnly=$true; restrictedPrivateArtifact=$true; secretsIncluded=$false; files=$manifestEntries }
Write-JsonFile (Join-Path $stage "MANIFEST.json") $manifest

$checksumLines = @()
foreach ($file in Get-ChildItem -LiteralPath $stage -Recurse -File | Sort-Object FullName) {
  $rel = $file.FullName.Substring($stage.Length + 1).Replace("\","/")
  if ($rel -eq "CHECKSUMS.sha256") { continue }
  $hash = (Get-FileHash $file.FullName -Algorithm SHA256).Hash.ToLowerInvariant()
  $checksumLines += "$hash  $rel"
}
$checksumLines | Set-Content -LiteralPath (Join-Path $stage "CHECKSUMS.sha256") -Encoding ASCII

Compress-Archive -Path (Join-Path $stage "*") -DestinationPath $localZip -CompressionLevel Optimal -Force
$sourceBytes = (Get-Item -LiteralPath $localZip).Length
$sourceHash = (Get-FileHash -LiteralPath $localZip -Algorithm SHA256).Hash.ToLowerInvariant()
if ($sourceBytes -le 0) { throw "Recovery blocked: ZIP is empty" }

New-Item -ItemType Directory -Force -Path $destinationDir | Out-Null
Copy-Item -LiteralPath $localZip -Destination $destinationZip -Force
$destinationBytes = (Get-Item -LiteralPath $destinationZip).Length
$destinationHash = (Get-FileHash -LiteralPath $destinationZip -Algorithm SHA256).Hash.ToLowerInvariant()
$hashMatch = ($sourceBytes -eq $destinationBytes -and $sourceHash -eq $destinationHash)
if (-not $hashMatch) { throw "Recovery blocked: local-to-Drive readback hash mismatch" }

$offDevice = [ordered]@{
  schemaVersion="ACHEGUESE_OFF_DEVICE_ATTESTATION_V1"; snapshotId=$snapshotId; capturedAt=([DateTimeOffset]::UtcNow.ToString("o"));
  destination="Private Google Drive synced folder"; path=$destinationZip; private=$true; localOnly=$false; status="VERIFIED";
  sourceBytes=$sourceBytes; destinationBytes=$destinationBytes; sourceSha256=$sourceHash; destinationSha256=$destinationHash; readbackHashMatch=$true;
  storageObjectCount=$baselineEnd.storageObjects; storageTotalBytes=$baselineEnd.storageTotalBytes
}
Write-JsonFile $externalAttestation $offDevice

Write-Host "RECOVERY_CAPTURE_PASS"
Write-Host "SNAPSHOT_ID=$snapshotId"
Write-Host "CAPTURED_AT=$capturedAt"
Write-Host "VALID_UNTIL=$validUntil"
Write-Host "PACKAGE_BYTES=$sourceBytes"
Write-Host "PACKAGE_SHA256=$sourceHash"
Write-Host "STORAGE_OBJECTS=$($baselineEnd.storageObjects)"
Write-Host "STORAGE_TOTAL_BYTES=$($baselineEnd.storageTotalBytes)"
Write-Host "EDGE_FUNCTIONS=$($baselineEnd.edgeFunctions)"
Write-Host "SECRET_NAMES=$($baselineEnd.secretNames)"
