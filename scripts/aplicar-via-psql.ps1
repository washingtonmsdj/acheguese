# Script PowerShell para aplicar migration via psql

$env:PGPASSWORD = "Acheguese2024!"

Write-Host "Aplicando migration..." -ForegroundColor Cyan
Write-Host ""

psql `
  -h aws-0-sa-east-1.pooler.supabase.com `
  -p 5432 `
  -U postgres.xhdowzacfujckjelqhtd `
  -d postgres `
  -f supabase/migrations/20260328000002_rpc_invite_member_secure.sql

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "Migration aplicada com sucesso!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Testando RPC..." -ForegroundColor Cyan
    Write-Host ""
    
    psql `
      -h aws-0-sa-east-1.pooler.supabase.com `
      -p 5432 `
      -U postgres.xhdowzacfujckjelqhtd `
      -d postgres `
      -c "SELECT invite_profile_member_by_email('00000000-0000-0000-0000-000000000000', 'teste@exemplo.com', 'member');"
} else {
    Write-Host ""
    Write-Host "Erro ao aplicar migration" -ForegroundColor Red
    exit 1
}
