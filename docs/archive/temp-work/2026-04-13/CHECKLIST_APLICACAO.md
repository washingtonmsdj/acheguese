# ✅ Checklist de Aplicação - Correções SSOT

## Status Atual

```
┌─────────────────────────────────────────────────────────────┐
│                    CORREÇÕES SSOT                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ✅ Código TypeScript Corrigido                            │
│  ⏳ Migrations SQL Pendentes                               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 📋 Checklist Completo

### Fase 1: Código TypeScript ✅

- [x] Atualizar `isValidId()` para aceitar mock IDs em DEV
- [x] Adicionar validação robusta de coordenadas
- [x] Verificar sem erros de TypeScript
- [x] Criar migrations SQL
- [x] Criar documentação

### Fase 2: Aplicar Migrations SQL ⏳

- [ ] **PASSO 1**: Abrir Supabase SQL Editor
  ```
  URL: https://supabase.com/dashboard/project/xhdowzacfujckjelqhtd/sql
  ```

- [ ] **PASSO 2**: Copiar SQL
  ```
  Arquivo: APLICAR_NO_SUPABASE_SQL_EDITOR.sql
  Ação: Ctrl+A, Ctrl+C
  ```

- [ ] **PASSO 3**: Colar no SQL Editor
  ```
  Ação: Ctrl+V no editor
  ```

- [ ] **PASSO 4**: Executar SQL
  ```
  Ação: Ctrl+Enter ou botão "Run"
  Tempo: ~30 segundos
  ```

- [ ] **PASSO 5**: Verificar Sucesso
  ```sql
  -- Deve mostrar "Success. No rows returned"
  -- Ou mensagens de sucesso para cada statement
  ```

### Fase 3: Verificação ⏳

- [ ] **Verificar RPC Functions**
  ```sql
  SELECT routine_name FROM information_schema.routines
  WHERE routine_name IN ('get_business_reviews', 'can_user_review_business');
  ```
  Resultado esperado: 2 linhas

- [ ] **Verificar Localizações**
  ```sql
  SELECT geographic_path, name FROM locations
  WHERE geographic_path LIKE 'ba%';
  ```
  Resultado esperado: 6 linhas

### Fase 4: Teste da Aplicação ⏳

- [ ] **Recarregar Aplicação**
  ```bash
  # No navegador: F5 ou Ctrl+R
  ```

- [ ] **Abrir Console** (F12)

- [ ] **Navegar para Gastronomia**
  ```
  URLs para testar:
  - /gastronomia
  - /ba/salvador/itaigara
  - /ba/salvador/pelourinho
  ```

- [ ] **Verificar Console Limpo**
  
  ❌ NÃO deve aparecer:
  - [ ] Invalid business ID provided
  - [ ] Invalid menu ID provided
  - [ ] Expected value to be of type number
  - [ ] POST /rpc/get_business_reviews 400
  - [ ] Location not found for path

  ✅ DEVE aparecer apenas:
  - [ ] ✅ Supabase inicializado
  - [ ] 📍 URL: https://...
  - [ ] ✅ TTFB: Xms
  - [ ] 📊 FCP: Xms

### Fase 5: Testes Funcionais ⏳

- [ ] **Teste de IDs Mock**
  ```javascript
  // No console do navegador
  import { isValidId } from '@/shared/validation';
  console.log(isValidId('mock-biz-sushi')); // deve ser true
  ```

- [ ] **Teste de Reviews**
  ```javascript
  // No console do navegador
  const { data, error } = await supabase.rpc('get_business_reviews', {
    p_business_profile_id: 'algum-uuid',
    p_limit: 10
  });
  console.log('Reviews:', data, 'Error:', error);
  ```

- [ ] **Teste de Localizações**
  ```javascript
  // No console do navegador
  const { data } = await supabase
    .from('locations')
    .select('*')
    .eq('geographic_path', 'ba/salvador/itaigara')
    .single();
  console.log('Location:', data);
  ```

- [ ] **Navegação por Território**
  - [ ] /ba/salvador/itaigara
  - [ ] /ba/salvador/pelourinho
  - [ ] /ba/salvador/barra
  - [ ] /ba/salvador/rio-vermelho

- [ ] **Busca de Negócios**
  - [ ] Filtros funcionando
  - [ ] Resultados aparecendo
  - [ ] Console limpo

- [ ] **Detalhes de Negócio**
  - [ ] Página carrega
  - [ ] Mapa renderiza (se houver coordenadas)
  - [ ] Reviews aparecem
  - [ ] Console limpo

### Fase 6: Finalização ⏳

- [ ] **Commit das Alterações**
  ```bash
  git add .
  git commit -m "fix: corrigir erros SSOT no console (IDs mock, coordenadas, reviews, localizações)"
  ```

- [ ] **Push para Repositório**
  ```bash
  git push origin main
  ```

- [ ] **Atualizar Documentação**
  - [ ] Marcar como concluído no README
  - [ ] Atualizar CHANGELOG

## 🎯 Resumo Visual

```
┌─────────────────────────────────────────────────────────────┐
│                    PROGRESSO GERAL                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Fase 1: Código TypeScript        ████████████ 100% ✅     │
│  Fase 2: Aplicar SQL               ░░░░░░░░░░░   0% ⏳     │
│  Fase 3: Verificação               ░░░░░░░░░░░   0% ⏳     │
│  Fase 4: Teste Aplicação           ░░░░░░░░░░░   0% ⏳     │
│  Fase 5: Testes Funcionais         ░░░░░░░░░░░   0% ⏳     │
│  Fase 6: Finalização               ░░░░░░░░░░░   0% ⏳     │
│                                                             │
│  TOTAL:                            ██░░░░░░░░░  17% ⏳     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 📞 Ajuda Rápida

### Problema: SQL Editor não abre
**Solução**: Verifique se está logado no Supabase Dashboard

### Problema: Erro ao executar SQL
**Solução**: 
1. Verifique se copiou o SQL completo
2. Execute statement por statement se necessário
3. Consulte `GUIA_TESTE_CORRECOES.md`

### Problema: Console ainda tem erros
**Solução**:
1. Verifique se SQL foi executado completamente
2. Execute queries de verificação
3. Recarregue a aplicação (Ctrl+Shift+R)

### Problema: Localizações não aparecem
**Solução**:
```sql
-- Verificar se foram inseridas
SELECT COUNT(*) FROM locations WHERE geographic_path LIKE 'ba%';
-- Deve retornar 6

-- Se retornar 0, reaplicar a migration:
-- supabase/migrations/20260413000002_seed_locations.sql
```

## 🎉 Sucesso!

Quando todos os checkboxes estiverem marcados:

```
┌─────────────────────────────────────────────────────────────┐
│                    🎉 PARABÉNS! 🎉                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ✅ Todas as correções aplicadas                           │
│  ✅ Console limpo                                          │
│  ✅ Funcionalidades operacionais                           │
│  ✅ SSOT mantido                                           │
│  ✅ Sem gambiarras                                         │
│                                                             │
│  Pode fazer commit e seguir em frente! 🚀                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

**Última Atualização**: 2026-04-13
**Próxima Ação**: Aplicar SQL no Supabase SQL Editor
