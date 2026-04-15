# 📊 EVIDÊNCIA - Fase 5: Validação no Navegador

**Data:** 2026-04-05  
**Status:** ⚠️ REQUER EXECUÇÃO MANUAL  
**Objetivo:** Validar tourist_points no navegador com dados reais

---

## ⚠️ IMPORTANTE

Os testes E2E com Playwright foram implementados mas requerem que o servidor de desenvolvimento esteja rodando manualmente.

**Motivo:** O ambiente atual não permite iniciar o servidor automaticamente via Playwright config.

---

## 1. PRÉ-REQUISITOS

### 1.1 Subir Servidor de Desenvolvimento

**Terminal 1:**
```bash
npm run dev
```

**Aguardar até ver:**
```
VITE v5.x.x  ready in XXX ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

### 1.2 Verificar Dados no Banco

**Confirmar que tourist_points foram criados:**
```bash
npx supabase db query --linked -f - <<'EOF'
SELECT name, slug, location_id
FROM tourist_points
WHERE slug IN ('farol-da-barra', 'pelourinho', 'shopping-da-bahia');
EOF
```

**Resultado esperado:**
```
┌───────────────────┬───────────────────┬──────────────────────────────────────┐
│       name        │       slug        │             location_id              │
├───────────────────┼───────────────────┼──────────────────────────────────────┤
│ Farol da Barra    │ farol-da-barra    │ 5c91b9e1-17bf-4707-9ba7-0dd82ada7eb3 │
│ Pelourinho        │ pelourinho        │ 40000000-0000-0000-0000-000000000003 │
│ Shopping da Bahia │ shopping-da-bahia │ [Pituba ID]                          │
└───────────────────┴───────────────────┴──────────────────────────────────────┘
```

---

## 2. EXECUÇÃO DOS TESTES E2E

### 2.1 ERRO: Servidor Não Está Rodando

**Resultado da execução:**
```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5173
```

**Causa:** O servidor de desenvolvimento não está rodando.

**Solução:** Subir o servidor manualmente antes de executar os testes.

---

### 2.2 Executar Testes Automatizados

**⚠️ IMPORTANTE: Servidor DEVE estar rodando antes de executar os testes.**

**Terminal 1 - Subir servidor:**
```bash
npm run dev
```

**Aguardar até ver:**
```
VITE v5.x.x  ready in XXX ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

**Terminal 2 - Executar testes:**
```bash
npx playwright test tests/e2e/tourist-points.spec.ts --reporter=list
```

### 2.2 Executar com UI (Debug)

```bash
npx playwright test tests/e2e/tourist-points.spec.ts --ui
```

### 2.3 Executar com Headed Mode (Ver Navegador)

```bash
npx playwright test tests/e2e/tourist-points.spec.ts --headed
```

---

## 3. TESTES IMPLEMENTADOS

### 3.1 Lista de Testes

1. **Listagem de Pontos Turísticos**
   - Verifica que página carrega sem erro 500
   - Verifica que 3 pontos estão visíveis
   - Verifica bairros (Barra, Pituba)

2. **Detail Page - Farol da Barra (Navegação)**
   - Clica no card e navega
   - Verifica URL: `/ba/salvador/farol-da-barra`
   - Verifica bairro "Barra" (de location.name)
   - Verifica breadcrumb
   - Verifica descrição, horário, preço
   - Verifica badge "Destaque"

3. **Detail Page - Pelourinho (URL Direta)**
   - Navega diretamente pela URL
   - Verifica bairro "Pelourinho" (de location.name)
   - Verifica breadcrumb
   - Verifica badges "Gratuito" e "Destaque"

4. **Detail Page - Reload**
   - Recarrega página do Farol da Barra
   - Verifica que ainda carrega corretamente

5. **Caso Negativo - Slug Inexistente**
   - Navega para `/ba/salvador/ponto-inexistente-xyz`
   - Verifica mensagem de erro

6. **Caso Negativo - Contexto Territorial Errado**
   - Navega para `/ba/feira-de-santana/farol-da-barra`
   - Verifica mensagem de erro (Farol está em Salvador, não Feira)

7. **Navegação End-to-End**
   - Listagem → Farol → Voltar → Pelourinho → Voltar → Shopping
   - Verifica URLs e conteúdo em cada etapa

8. **Console Limpo**
   - Navega por todas as páginas
   - Verifica que não há erros JavaScript críticos

---

## 4. RESULTADO ESPERADO

### 4.1 Saída Esperada

```
Running 8 tests using 1 worker

  ✓  1. Listagem de Pontos Turísticos (5s)
  ✓  2. Detail Page - Farol da Barra (Navegação) (3s)
  ✓  3. Detail Page - Pelourinho (URL Direta) (2s)
  ✓  4. Detail Page - Reload (2s)
  ✓  5. Caso Negativo - Slug Inexistente (2s)
  ✓  6. Caso Negativo - Contexto Territorial Errado (2s)
  ✓  7. Navegação End-to-End (8s)
  ✓  8. Console Limpo (Sem Erros Críticos) (6s)

  8 passed (30s)
```

### 4.2 Critérios de Aprovação

**Para aprovar a Fase 5, TODOS os 8 testes devem passar (✓).**

**Se qualquer teste falhar:**
- Verificar erro no relatório
- Verificar se é erro crítico (Fail Fast)
- Corrigir problema antes de prosseguir

---

## 5. FAIL FAST - ERROS CRÍTICOS

### 5.1 Erros que Interrompem a Fase 5

**Se qualquer um ocorrer, PARAR e corrigir:**

1. **Teste 1 falha:** Listagem não carrega ou erro 500
   - Indica problema no backend
   - Não há sentido continuar

2. **Teste 2 falha:** URL não segue padrão `/ba/salvador/:slug`
   - Indica que SSOT não está sendo usado
   - Problema fundamental

3. **Teste 2 falha:** Bairro não é "Barra"
   - Indica que location.name não está sendo usado
   - Problema fundamental do SSOT

4. **Teste 8 falha:** Erros JavaScript no console
   - Indica problema de renderização
   - Pode comprometer todas as validações

---

## 6. VALIDAÇÃO MANUAL COMPLEMENTAR

### 6.1 Mapa Renderizado

**Após testes automatizados passarem:**

1. Abrir navegador manualmente
2. Navegar para: `http://localhost:5173/pontos-turisticos/ba/salvador/farol-da-barra`
3. Rolar até seção "Como chegar" ou "Localização"
4. Verificar:
   - [ ] Mapa visível
   - [ ] Marcador no mapa
   - [ ] Mapa interativo (zoom, pan)

**⚠️ NOTA:** Coordenadas não foram definidas no seed, então mapa pode não renderizar.

### 6.2 Layout Visual

**Verificar:**
- [ ] Cards de pontos turísticos bem formatados
- [ ] Badges visíveis e legíveis
- [ ] Breadcrumb bem posicionado
- [ ] Descrição legível
- [ ] Sem quebras de layout

### 6.3 Fotos da Comunidade

**Verificar:**
- [ ] Seção "Fotos da Comunidade" visível
- [ ] Exibe 6 fotos (mock)
- [ ] Console mostra "Using mock data"

---

## 7. LIMITAÇÕES E DEPENDÊNCIAS CONHECIDAS

### 7.1 Fallback Legado Ainda Ativo

**Comportamento esperado:**
- ⚠️ Warnings no console para cidades inexistentes
- ⚠️ Fallback usado apenas quando resolução territorial falha

**Exemplo de warning esperado:**
```
⚠️ [WARN] TerritorialResolver: Cidade não encontrada | {"state":"BA","city":"Feira de Santana"}
⚠️ [WARN] TouristPointService.getBySlug: Cidade não resolvida, usando fallback legado
```

**Status:** Comportamento correto. Fallback será removido na Fase 7.

### 7.2 Mock Data em getCommunityPhotos

**Comportamento esperado:**
- ⚠️ Fotos da comunidade usam mock (6 fotos genéricas)
- ⚠️ Console mostra "Using mock data"

**Motivo:** Tabela `posts` vazia ou sem posts com location_id

**Status:** Comportamento correto.

### 7.3 Campos Legados Remanescentes

**Ainda presentes no banco:**
- `state` (string) - usado como fallback
- `city` (string) - usado como fallback
- `neighborhood` (string) - não usado mais
- `address` (string) - usado como fallback

**Status:** Mantidos para compatibilidade durante migração.

---

## 8. PRÓXIMOS PASSOS APÓS FASE 5

### 8.1 Se Todos os Testes Passarem

**Prosseguir para:**
- Fase 6: Backfill de registros sem location_id
- Fase 7: Remoção de fallback legado
- Fase 8: Validação final e conclusão do piloto

### 8.2 Se Algum Teste Falhar

**Corrigir problemas identificados:**
- Ajustar componentes que não usam SSOT
- Corrigir queries que não fazem join
- Corrigir renderização de dados legados
- Re-executar testes até todos passarem

---

## 9. ARQUIVOS CRIADOS

### 9.1 Testes
- `tests/e2e/tourist-points.spec.ts` - 8 testes E2E

### 9.2 Configuração
- `playwright.config.ts` - Configuração do Playwright

### 9.3 Documentação
- `FASE5_GUIA_VALIDACAO_NAVEGADOR.md` - Guia de validação
- `EVIDENCIA_FASE5_NAVEGADOR.md` - Este arquivo

---

## 10. CONCLUSÃO

**Status:** ⚠️ PARCIALMENTE APROVADA (2/8 testes passando)

**Resultado da Execução:**
- 8 testes executados
- 2 testes passando (25%)
- 6 testes falhando (75%)

**Testes Passando:**
- ✅ Teste 5: Caso Negativo - Slug Inexistente
- ✅ Teste 6: Caso Negativo - Contexto Territorial Errado

**Testes Falhando:**
- ❌ Teste 1: Listagem (Shopping da Bahia não encontrado)
- ❌ Teste 2: Detail Page - Navegação (Bairro "Barra" hidden)
- ❌ Teste 3: Detail Page - URL Direta (Pelourinho não carrega)
- ❌ Teste 4: Reload (Bairro "Barra" hidden)
- ❌ Teste 7: Navegação End-to-End (Breadcrumb ambíguo)
- ❌ Teste 8: Console Limpo (Timeout)

**Validações Bem-Sucedidas:**
- ✅ URLs seguem padrão `/ba/salvador/:slug`
- ✅ Contexto territorial é respeitado (Farol em Feira retorna 404)
- ✅ Slug inexistente retorna mensagem de erro
- ✅ Servidor responde corretamente

**Problemas Identificados:**
1. Shopping da Bahia não aparece na listagem (possível problema de dados)
2. Bairro "Barra" está hidden (elemento existe mas não visível)
3. Pelourinho não carrega por URL direta (possível problema de rota)
4. Breadcrumb tem múltiplos elementos (ambiguidade de seletor)

**Próxima Ação:**
- Investigar por que Shopping da Bahia não aparece
- Investigar por que Pelourinho não carrega
- Ajustar seletores para elementos hidden
- Re-executar testes após correções

**Critério de Aprovação:** 8/8 testes passando

---

**Documento:** EVIDENCIA_FASE5_NAVEGADOR.md  
**Versão:** 1.2  
**Data:** 2026-04-05  
**Status:** ⚠️ PARCIALMENTE APROVADA - REQUER CORREÇÕES
