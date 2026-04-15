# Script para corrigir hooks condicionais em páginas admin
# Move a validação de admin para depois dos hooks

$files = @(
    "src/modules/admin/pages/AdminConfiguracoes.tsx",
    "src/modules/admin/pages/AdminGamificacao.tsx",
    "src/modules/admin/pages/AdminMotoristas.tsx",
    "src/modules/admin/pages/AdminEmpresas.tsx",
    "src/modules/admin/pages/AdminClassificados.tsx",
    "src/modules/admin/pages/AdminCupons.tsx",
    "src/modules/admin/pages/AdminEventos.tsx",
    "src/modules/admin/pages/AdminModeracaoCompleta.tsx",
    "src/modules/admin/pages/AdminPontosEmbarque.tsx",
    "src/modules/admin/pages/AdminRealtimeDashboard.tsx",
    "src/modules/admin/pages/AdminReivindicacoes.tsx",
    "src/modules/admin/pages/AdminReportsPassageiros.tsx",
    "src/modules/admin/pages/AdminServicos.tsx"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "Processando $file..."
        
        $content = Get-Content $file -Raw
        
        # Padrão: encontrar validação de admin antes dos hooks
        $pattern = '(?s)(const \{ canModerate, isChecking \} = useAdminGuard\(\);.*?)\s+// Validação de admin\s+if \(!isChecking && !canModerate\) \{.*?return \(.*?\);.*?\}'
        
        if ($content -match $pattern) {
            Write-Host "  Encontrado padrão de validação condicional"
            
            # Remover a validação condicional e mover para o final
            $content = $content -replace $pattern, '$1'
            
            # Adicionar validação no final antes do return principal
            $validationCode = @"

  // Validação de admin
  if (!isChecking && !canModerate) {
    return (
      <div className="min-h-screen bg-[#0A0F14] flex items-center justify-center p-4">
        <div className="text-center">
          <Shield className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Acesso Negado</h1>
          <p className="text-gray-400">Apenas administradores podem acessar esta página.</p>
        </div>
      </div>
    );
  }
"@
            
            # Inserir antes do return principal (antes do último return)
            $content = $content -replace '(\s+return \(\s+<div)', "$validationCode`$1"
            
            Set-Content $file -Value $content -NoNewline
            Write-Host "  ✓ Corrigido"
        } else {
            Write-Host "  - Padrão não encontrado ou já corrigido"
        }
    }
}

Write-Host "`nConcluído!"
