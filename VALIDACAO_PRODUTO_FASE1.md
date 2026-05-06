# 📋 VALIDAÇÃO DE PRODUTO - FASE 1 IA TRANSVERSAL

**Data:** 2026-05-03  
**Objetivo:** Provar que `/buscar` retorna resultados reais úteis para o usuário

---

## 🎯 Objetivo

A validação técnica passou, mas precisamos validar com **dados reais** que:
1. `/buscar` retorna resultados úteis
2. URLs gastronômicas funcionam corretamente
3. Busca geoespacial prioriza território
4. Intents são classificadas corretamente

---

## 📊 Status da Nomenclatura de Intents

### ✅ Decisão Final: PADRONIZADA

A nomenclatura já está correta no código:

| Intent | Uso | Handler |
|--------|-----|---------|
| `business_search` | Busca de empresas/negócios | SearchBusinessesActionHandler |
| `service_search` | Busca de profissionais/serviços | SearchProfessionalsActionHandler |
| `unknown` | Query não relacionada a busca | Resposta genérica |

**Motivo:** A página `/buscar` não deve virar chat genérico nesta fase. Intent `unknown` retorna mensagem amigável direcionando para busca.

**Arquivos validados:**
- ✅ `src/core/ai/domain/types.ts` - Schema com `business_search`, `service_search`, `unknown`
- ✅ `src/core/ai/intent/IntentParser.ts` - Usa `unknown` para fallback
- ✅ Nenhuma referência a `search_businesses`, `search_professionals` ou `general_conversation`

---

## 🌱 Passo 1: Aplicar Seed de Dados

### Dados a Criar

Todos na **Pituba** (`384add59-4e53-489d-a7b5-97dea2b3f442`):

1. ✅ **Mercadinho da Pituba** - Empresa comum
   - Slug: `mercadinho-pituba-test`
   - Categoria: Comércio
   - Premium: Não
   - URL esperada: `/empresas/ba/salvador/pituba/mercadinho-pituba-test`

2. ✅ **Consultoria Premium Salvador** - Empresa premium
   - Slug: `consultoria-premium-test`
   - Categoria: Serviços
   - Premium: Sim
   - URL esperada: `/p/consultoria-premium-test`

3. ✅ **Pizzaria Bella Napoli** - Empresa gastronômica
   - Slug: `pizzaria-bella-test`
   - Categoria: Gastronomia
   - Premium: Não
   - Perfil gastronômico: Ativo e principal
   - Delivery: Sim
   - URL esperada: `/gastronomia/ba/salvador/pituba/pizzaria-bella-test`

4. ✅ **João Silva - Eletricista** - Profissional
   - Slug: `eletricista-joao-test`
   - Categoria: Eletricista
   - URL esperada: `/profissionais/eletricista-joao-test`

5. ✅ **Carlos Santos - Encanador** - Profissional
   - Slug: `encanador-carlos-test`
   - Categoria: Encanador
   - URL esperada: `/profissionais/encanador-carlos-test`

### Como Aplicar

**Opção 1: SQL Editor no Supabase Dashboard (RECOMENDADO)**

1. Acesse https://supabase.com/dashboard
2. Selecione o projeto
3. Vá em **SQL Editor**
4. Copie e execute o conteúdo de `scripts/seed-ai-phase1-sql.sql`
5. Verifique os resultados das queries de verificação

**Opção 2: Script Node.js (se schema cache estiver atualizado)**

```bash
node scripts/seed-ai-phase1-test-data.mjs
```

---

## 🧪 Passo 2: Testar as 6 Queries Obrigatórias

### Como Testar

1. Acesse `/buscar` no navegador
2. Certifique-se de estar autenticado
3. Certifique-se de ter location_id da Pituba no contexto
4. Digite cada query abaixo
5. Registre os resultados

### Queries e Resultados Esperados

#### 1. "pizzaria barata com delivery"

**Esperado:**
- Intent: `business_search`
- Handler: SearchBusinessesActionHandler
- Filtros: `category: "pizzaria"`, `delivery: true`, `priceHint: "cheap"`
- Geoespacial: ✅ (se tiver coordenadas)
- Resultados: 1+ (incluindo Pizzaria Bella Napoli)
- URL: `/gastronomia/ba/salvador/pituba/pizzaria-bella-test`

**Registrar:**
- [ ] Intent gerada
- [ ] Handler acionado
- [ ] Usou geoespacial ou fallback
- [ ] Quantidade de resultados
- [ ] Títulos retornados
- [ ] URLs geradas
- [ ] URL abriu corretamente

---

#### 2. "restaurante aberto agora"

**Esperado:**
- Intent: `business_search`
- Handler: SearchBusinessesActionHandler
- Filtros: `category: "restaurante"`, `tags: ["aberto"]`
- Geoespacial: ✅ (se tiver coordenadas)
- Resultados: 0-1 (pode não ter restaurante aberto)
- URL: Gastronômica se tiver perfil ativo

**Registrar:**
- [ ] Intent gerada
- [ ] Handler acionado
- [ ] Usou geoespacial ou fallback
- [ ] Quantidade de resultados
- [ ] Títulos retornados
- [ ] URLs geradas
- [ ] URL abriu corretamente

---

#### 3. "eletricista perto de mim"

**Esperado:**
- Intent: `service_search`
- Handler: SearchProfessionalsActionHandler
- Filtros: `category: "eletricista"`
- Geoespacial: ✅ (se tiver coordenadas)
- Resultados: 1+ (incluindo João Silva)
- URL: `/profissionais/eletricista-joao-test`

**Registrar:**
- [ ] Intent gerada
- [ ] Handler acionado
- [ ] Usou geoespacial ou fallback
- [ ] Quantidade de resultados
- [ ] Títulos retornados
- [ ] URLs geradas
- [ ] URL abriu corretamente

---

#### 4. "encanador urgente"

**Esperado:**
- Intent: `service_search`
- Handler: SearchProfessionalsActionHandler
- Filtros: `category: "encanador"`, `urgent: true`
- Geoespacial: ✅ (se tiver coordenadas)
- Resultados: 1+ (incluindo Carlos Santos)
- URL: `/profissionais/encanador-carlos-test`

**Registrar:**
- [ ] Intent gerada
- [ ] Handler acionado
- [ ] Usou geoespacial ou fallback
- [ ] Quantidade de resultados
- [ ] Títulos retornados
- [ ] URLs geradas
- [ ] URL abriu corretamente

---

#### 5. "empresa no meu bairro"

**Esperado:**
- Intent: `business_search`
- Handler: SearchBusinessesActionHandler
- Filtros: Nenhum específico (busca geral)
- Geoespacial: ✅ (se tiver coordenadas)
- Resultados: 3+ (todas as empresas de teste)
- URLs: 
  - Premium: `/p/consultoria-premium-test`
  - Gastronômica: `/gastronomia/ba/salvador/pituba/pizzaria-bella-test`
  - Comum: `/empresas/ba/salvador/pituba/mercadinho-pituba-test`

**Registrar:**
- [ ] Intent gerada
- [ ] Handler acionado
- [ ] Usou geoespacial ou fallback
- [ ] Quantidade de resultados
- [ ] Títulos retornados
- [ ] URLs geradas (validar as 3 regras)
- [ ] URLs abriram corretamente

---

#### 6. "me conte uma piada"

**Esperado:**
- Intent: `unknown`
- Handler: Nenhum (resposta genérica)
- Mensagem: Algo como "Desculpe, não entendi. Tente buscar por empresas ou profissionais."
- Resultados: 0

**Registrar:**
- [ ] Intent gerada
- [ ] Mensagem retornada
- [ ] Nenhum resultado mostrado

---

## 🔍 Passo 3: Validar URLs Gastronômicas

### Regras a Confirmar

| Tipo | Condição | URL Esperada |
|------|----------|--------------|
| **Premium** | `is_premium = true` | `/p/:slug` |
| **Gastronômica** | Perfil gastronômico ativo e principal | `/gastronomia/:state/:city/:neighborhood/:slug` |
| **Comum** | Nenhuma das anteriores | `/empresas/:state/:city/:neighborhood/:slug` |

### Testes

1. **Consultoria Premium Salvador**
   - [ ] URL gerada: `/p/consultoria-premium-test`
   - [ ] URL abre corretamente
   - [ ] Página mostra dados da empresa

2. **Pizzaria Bella Napoli**
   - [ ] URL gerada: `/gastronomia/ba/salvador/pituba/pizzaria-bella-test`
   - [ ] URL abre corretamente
   - [ ] Página mostra perfil gastronômico
   - [ ] Mostra delivery disponível

3. **Mercadinho da Pituba**
   - [ ] URL gerada: `/empresas/ba/salvador/pituba/mercadinho-pituba-test`
   - [ ] URL abre corretamente
   - [ ] Página mostra dados da empresa

---

## ✅ Passo 4: Gates Finais

### Executar

```bash
npm run lint -- --max-warnings=0
npm run typecheck
npm run build
```

### Resultados Esperados

- [ ] ✅ Lint: 0 warnings
- [ ] ✅ Typecheck: 0 erros
- [ ] ✅ Build: Compilação completa

---

## 📊 Passo 5: Relatório Final

### Template de Relatório

```markdown
# RELATÓRIO DE VALIDAÇÃO DE PRODUTO - FASE 1

## Dados Criados
- [x] 3 empresas (comum, premium, gastronômica)
- [x] 1 perfil gastronômico ativo
- [x] 2 profissionais (eletricista, encanador)

## Resultados das Queries

### 1. "pizzaria barata com delivery"
- Intent: [REGISTRAR]
- Handler: [REGISTRAR]
- Geoespacial: [SIM/NÃO]
- Resultados: [QUANTIDADE]
- Títulos: [LISTAR]
- URLs: [LISTAR]
- Status: [✅/❌]

[... repetir para todas as 6 queries ...]

## URLs Gastronômicas
- Premium: [✅/❌] `/p/consultoria-premium-test`
- Gastronômica: [✅/❌] `/gastronomia/ba/salvador/pituba/pizzaria-bella-test`
- Comum: [✅/❌] `/empresas/ba/salvador/pituba/mercadinho-pituba-test`

## Gates
- Lint: [✅/❌]
- Typecheck: [✅/❌]
- Build: [✅/❌]

## Conclusão
- Aprovada tecnicamente: [✅/❌]
- Aprovada para produto: [✅/❌]
- Motivo: [EXPLICAR]
```

---

## 🎯 Critérios de Aprovação

### Aprovada para Produto ✅

Todos os seguintes devem ser verdadeiros:

- [x] Seed aplicado com sucesso
- [ ] 6 queries testadas
- [ ] Pelo menos 4/6 queries retornaram resultados úteis
- [ ] URLs gastronômicas seguem as 3 regras
- [ ] URLs abrem corretamente
- [ ] Intent `unknown` não tenta buscar
- [ ] Gates passando (lint, typecheck, build)

### Reprovada ❌

Se qualquer um for verdadeiro:

- [ ] Seed falhou
- [ ] Menos de 4/6 queries funcionaram
- [ ] URLs gastronômicas incorretas
- [ ] URLs não abrem
- [ ] Erros SQL em produção
- [ ] Gates falhando

---

## 📁 Arquivos Relacionados

- `scripts/seed-ai-phase1-sql.sql` - Seed SQL para aplicar no Dashboard
- `scripts/seed-ai-phase1-test-data.mjs` - Seed Node.js (alternativo)
- `src/core/ai/domain/types.ts` - Schema de intents
- `src/core/ai/actions/SearchBusinessesActionHandler.ts` - Handler de empresas
- `src/core/ai/actions/SearchProfessionalsActionHandler.ts` - Handler de profissionais

---

**Próximo passo:** Aplicar seed e testar as 6 queries em `/buscar`
