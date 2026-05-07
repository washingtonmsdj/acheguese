# ✅ CHECKLIST DE VALIDAÇÃO - FASE 1 IA TRANSVERSAL

**Data:** 2026-05-03  
**Objetivo:** Validar e aprovar Fase 1 da IA Transversal

---

## 📋 CHECKLIST

### ✅ Etapa 1: Preparação (CONCLUÍDO)

- [x] Código implementado (IntentParser, ActionHandlers, URLs gastronômicas)
- [x] Migration RPC geoespacial aplicada
- [x] Seed de dados aplicado manualmente
- [x] Migration de views públicas criada
- [x] Scripts de validação criados
- [x] Documentação completa

### ⏳ Etapa 2: Aplicar Migration (PENDENTE)

- [ ] Abrir Supabase Dashboard → SQL Editor
- [ ] Copiar conteúdo de `EXECUTAR_NO_SUPABASE_AGORA.sql`
- [ ] Colar no SQL Editor
- [ ] Clicar em "Run"
- [ ] Confirmar sucesso (ver resultados das queries de verificação)

**Arquivo:** `EXECUTAR_NO_SUPABASE_AGORA.sql`

---

### ⏳ Etapa 3: Validação Programática (PENDENTE)

- [ ] Executar: `node scripts/test-queries-final.mjs`
- [ ] Confirmar: ✅ 3 empresas encontradas
- [ ] Confirmar: ✅ 2 profissionais encontrados
- [ ] Confirmar: ✅ 5-6/6 queries bem-sucedidas
- [ ] Registrar resultados

**Critério:** Pelo menos 4/6 queries devem funcionar

---

### ⏳ Etapa 4: Teste Manual em `/buscar` (PENDENTE)

- [ ] Acessar `/buscar` no navegador
- [ ] Testar query 1: "pizzaria barata com delivery"
  - [ ] Registrar intent
  - [ ] Registrar quantidade de resultados
  - [ ] Registrar URLs geradas
- [ ] Testar query 2: "restaurante aberto agora"
  - [ ] Registrar intent
  - [ ] Registrar quantidade de resultados
  - [ ] Registrar URLs geradas
- [ ] Testar query 3: "eletricista perto de mim"
  - [ ] Registrar intent
  - [ ] Registrar quantidade de resultados
  - [ ] Registrar URLs geradas
- [ ] Testar query 4: "encanador urgente"
  - [ ] Registrar intent
  - [ ] Registrar quantidade de resultados
  - [ ] Registrar URLs geradas
- [ ] Testar query 5: "empresa no meu bairro"
  - [ ] Registrar intent
  - [ ] Registrar quantidade de resultados
  - [ ] Registrar URLs geradas
- [ ] Testar query 6: "me conte uma piada"
  - [ ] Confirmar intent: `unknown`
  - [ ] Confirmar: NÃO retorna cards
  - [ ] Confirmar: NÃO vira chat genérico

**Critério:** Pelo menos 4/6 queries devem retornar resultados úteis

---

### ⏳ Etapa 5: Validação de URLs (PENDENTE)

Para cada resultado das queries acima:

- [ ] Clicar na URL gerada
- [ ] Confirmar que a página abre
- [ ] Confirmar que o conteúdo está correto
- [ ] Validar padrão de URL:
  - [ ] Empresa premium → `/p/:slug`
  - [ ] Empresa gastronômica → `/gastronomia/ba/salvador/pituba/:slug`
  - [ ] Empresa comum → `/empresas/ba/salvador/pituba/:slug`
  - [ ] Profissional → `/profissionais/:slug`

**Critério:** Todas as URLs devem abrir e seguir o padrão correto

---

### ⏳ Etapa 6: Gates de Qualidade (PENDENTE)

- [ ] Executar: `npm run lint -- --max-warnings=0`
  - [ ] Confirmar: 0 warnings
- [ ] Executar: `npm run typecheck`
  - [ ] Confirmar: 0 erros
- [ ] Executar: `npm run build`
  - [ ] Confirmar: build bem-sucedido

**Critério:** Todos os gates devem passar

---

### ⏳ Etapa 7: Relatório Final (PENDENTE)

- [ ] Compilar resultados de todas as etapas
- [ ] Registrar queries que funcionaram
- [ ] Registrar queries que falharam (se houver)
- [ ] Registrar URLs testadas
- [ ] Registrar erros encontrados (se houver)
- [ ] Decidir: **APROVADA COMO PRODUTO** ou **REPROVADA**

**Critério de Aprovação:**
- ✅ Migration aplicada
- ✅ 4/6 queries funcionando
- ✅ URLs corretas e funcionais
- ✅ Gates passando
- ✅ Nenhum erro crítico

---

## 📊 PROGRESSO ATUAL

| Etapa | Status | Progresso |
|-------|--------|-----------|
| 1. Preparação | ✅ Concluído | 100% |
| 2. Aplicar Migration | ⏳ Pendente | 0% |
| 3. Validação Programática | ⏳ Pendente | 0% |
| 4. Teste Manual | ⏳ Pendente | 0% |
| 5. Validação URLs | ⏳ Pendente | 0% |
| 6. Gates | ⏳ Pendente | 0% |
| 7. Relatório Final | ⏳ Pendente | 0% |
| **TOTAL** | ⏳ **Em Progresso** | **14%** |

---

## 🚀 PRÓXIMO PASSO

**Executar Etapa 2:** Aplicar migration no Supabase Dashboard

1. Abra: `EXECUTAR_NO_SUPABASE_AGORA.sql`
2. Copie TODO o conteúdo
3. Cole no Supabase Dashboard → SQL Editor
4. Clique em "Run"
5. Confirme sucesso
6. Volte aqui e marque a Etapa 2 como concluída
7. Prossiga para Etapa 3

---

## 📁 ARQUIVOS DE REFERÊNCIA

- `EXECUTAR_NO_SUPABASE_AGORA.sql` - SQL para aplicar no Dashboard
- `scripts/test-queries-final.mjs` - Script de validação
- `INSTRUCOES_APLICAR_MIGRATION.md` - Instruções detalhadas
- `RELATORIO_FINAL_FASE1.md` - Relatório atual
- `APLICAR_VIEWS_PUBLICAS.md` - Documentação técnica

---

**Última atualização:** 2026-05-03  
**Status:** Aguardando aplicação de migration (Etapa 2)
