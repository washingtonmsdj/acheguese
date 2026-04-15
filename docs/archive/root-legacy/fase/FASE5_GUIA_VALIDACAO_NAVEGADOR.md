# 📋 FASE 5 - Validação no Navegador (Automatizada + Manual)

**Data:** 2026-04-05  
**Status:** ⚠️ EM EXECUÇÃO  
**Objetivo:** Validar tourist_points no navegador com dados reais

---

## 1. ESTRATÉGIA DE VALIDAÇÃO

### 1.1 Testes Automatizados (Playwright)

**Escopo:**
- ✅ Navegação entre páginas
- ✅ Verificação de URLs
- ✅ Verificação de textos renderizados
- ✅ Verificação de elementos visíveis
- ✅ Console sem erros críticos
- ✅ Casos negativos (404, slug inexistente)

### 1.2 Validação Manual

**Escopo:**
- ⚠️ Inspeção visual de layout
- ⚠️ Verificação de mapa renderizado
- ⚠️ Experiência de usuário
- ⚠️ Screenshots para documentação

---

## 2. VALORES ESPERADOS (SEED)

### 2.1 Farol da Barra

```
ID: [gerado dinamicamente]
location_id: 5c91b9e1-17bf-4707-9ba7-0dd82ada7eb3
name: Farol da Barra
slug: farol-da-barra
short_description: Cartão postal de Salvador com vista panorâmica do mar
category: historico
price_type: pago
price_text: R$ 15,00 (inteira) / R$ 7,50 (meia)
visiting_hours: Ter-Dom: 08:30-18:30
is_featured: true
state: ba
city: salvador

location.name: Barra
location.geographic_path: /br/ba/salvador/barra
```

### 2.2 Pelourinho

```
ID: [gerado dinamicamente]
location_id: 40000000-0000-0000-0000-000000000003
name: Pelourinho
slug: pelourinho
short_description: Centro histórico de Salvador, Patrimônio Mundial da UNESCO
category: cultural
price_type: gratuito
visiting_hours: 24 horas (área externa)
is_featured: true
state: ba
city: salvador

location.name: Pelourinho
location.geographic_path: /br/ba/salvador/pelourinho
```

### 2.3 Shopping da Bahia

```
ID: [gerado dinamicamente]
location_id: [Pituba - resolvido dinamicamente]
name: Shopping da Bahia
slug: shopping-da-bahia
short_description: Maior shopping center de Salvador
category: entretenimento
price_type: gratuito
visiting_hours: Seg-Sáb: 09:00-22:00, Dom: 12:00-21:00
is_featured: false
state: ba
city: salvador

location.name: Pituba
location.geographic_path: /br/ba/salvador/pituba
```

---

## 3. REGRAS DE FAIL FAST

### 3.1 Erros Críticos (Interrompem Fase 5)

**Se qualquer um ocorrer, PARAR imediatamente:**

1. **Erro 500 ao carregar listagem**
   - Indica problema no backend
   - Não há sentido continuar

2. **Erro JavaScript no console ao carregar detail page**
   - Indica problema de renderização
   - Pode comprometer todas as validações

3. **URL não segue padrão `/ba/salvador/:slug`**
   - Indica que SSOT não está sendo usado
   - Problema fundamental

4. **Bairro renderizado vem de campo legado `neighborhood`**
   - Indica que location.name não está sendo usado
   - Problema fundamental do SSOT

5. **Nenhum ponto turístico exibido na listagem**
   - Indica que dados não foram criados
   - Não há o que validar

### 3.2 Avisos (Não interrompem, mas devem ser documentados)

- ⚠️ Fotos da comunidade usando mock
- ⚠️ Warnings de fallback legado no console
- ⚠️ Mapa não renderizado (pode ser problema de API key)

---

## 4. TESTES AUTOMATIZADOS (PLAYWRIGHT)

### 4.1 Teste 1: Listagem de Pontos Turísticos

**URL:** `http://localhost:5173/pontos-turisticos/ba/salvador`

**Validações:**
```typescript
// Página carrega sem erro 500
expect(response.status()).toBe(200);

// Título da página
expect(page.locator('h1')).toContainText('Pontos Turísticos');

// Pelo menos 3 cards visíveis
const cards = page.locator('[data-testid="tourist-point-card"]');
expect(await cards.count()).toBeGreaterThanOrEqual(3);

// Farol da Barra visível
expect(page.locator('text=Farol da Barra')).toBeVisible();
expect(page.locator('text=Barra')).toBeVisible(); // location.name

// Pelourinho visível
expect(page.locator('text=Pelourinho')).toBeVisible();

// Shopping da Bahia visível
expect(page.locator('text=Shopping da Bahia')).toBeVisible();
expect(page.locator('text=Pituba')).toBeVisible(); // location.name

// Console sem erros críticos
const errors = [];
page.on('console', msg => {
  if (msg.type() === 'error') errors.push(msg.text());
});
expect(errors).toHaveLength(0);
```

**Fail Fast:**
- Se status !== 200 → PARAR
- Se nenhum card visível → PARAR

---

### 4.2 Teste 2: Detail Page - Farol da Barra (Navegação)

**Ação:** Clicar no card "Farol da Barra"

**Validações:**
```typescript
// Clicar no card
await page.locator('text=Farol da Barra').first().click();

// URL correta
expect(page.url()).toContain('/pontos-turisticos/ba/salvador/farol-da-barra');

// Título renderizado
expect(page.locator('h1')).toContainText('Farol da Barra');

// Bairro renderizado (de location.name)
expect(page.locator('text=Barra')).toBeVisible();

// Breadcrumb renderizado
expect(page.locator('text=Pontos turísticos de')).toBeVisible();
expect(page.locator('text=Salvador')).toBeVisible();

// Descrição renderizada
expect(page.locator('text=O Farol da Barra é um dos pontos turísticos')).toBeVisible();

// Horário renderizado
expect(page.locator('text=Ter-Dom: 08:30-18:30')).toBeVisible();

// Preço renderizado
expect(page.locator('text=R$ 15,00')).toBeVisible();

// Badge "Destaque" visível (is_featured = true)
expect(page.locator('text=Destaque')).toBeVisible();

// Console sem erros críticos
expect(errors).toHaveLength(0);
```

**Fail Fast:**
- Se URL não contém `/ba/salvador/farol-da-barra` → PARAR
- Se erro JavaScript no console → PARAR
- Se bairro não é "Barra" → PARAR (indica uso de campo legado)

---

### 4.3 Teste 3: Detail Page - Acesso Direto por URL

**URL:** `http://localhost:5173/pontos-turisticos/ba/salvador/pelourinho`

**Validações:**
```typescript
// Navegar diretamente pela URL
await page.goto('http://localhost:5173/pontos-turisticos/ba/salvador/pelourinho');

// Página carrega
expect(page.locator('h1')).toContainText('Pelourinho');

// Bairro renderizado (de location.name)
expect(page.locator('text=Pelourinho')).toBeVisible();

// Breadcrumb renderizado
expect(page.locator('text=Pontos turísticos de Salvador')).toBeVisible();

// Descrição renderizada
expect(page.locator('text=O Pelourinho é o coração histórico')).toBeVisible();

// Badge "Gratuito" visível
expect(page.locator('text=Gratuito')).toBeVisible();

// Badge "Destaque" visível
expect(page.locator('text=Destaque')).toBeVisible();
```

**Fail Fast:**
- Se página não carrega → PARAR
- Se bairro não é "Pelourinho" → PARAR

---

### 4.4 Teste 4: Reload da Detail Page

**Ação:** Recarregar página do Farol da Barra

**Validações:**
```typescript
// Navegar para Farol da Barra
await page.goto('http://localhost:5173/pontos-turisticos/ba/salvador/farol-da-barra');

// Recarregar página
await page.reload();

// Página ainda carrega corretamente
expect(page.locator('h1')).toContainText('Farol da Barra');
expect(page.locator('text=Barra')).toBeVisible();

// URL permanece correta
expect(page.url()).toContain('/pontos-turisticos/ba/salvador/farol-da-barra');
```

---

### 4.5 Teste 5: Caso Negativo - Slug Inexistente

**URL:** `http://localhost:5173/pontos-turisticos/ba/salvador/ponto-inexistente-xyz`

**Validações:**
```typescript
// Navegar para slug inexistente
await page.goto('http://localhost:5173/pontos-turisticos/ba/salvador/ponto-inexistente-xyz');

// Deve exibir mensagem de erro ou 404
expect(page.locator('text=não encontrado')).toBeVisible();
// OU
expect(page.locator('text=não existe')).toBeVisible();
```

---

### 4.6 Teste 6: Caso Negativo - Contexto Territorial Errado

**URL:** `http://localhost:5173/pontos-turisticos/ba/feira-de-santana/farol-da-barra`

**Validações:**
```typescript
// Navegar para Farol da Barra em cidade errada
await page.goto('http://localhost:5173/pontos-turisticos/ba/feira-de-santana/farol-da-barra');

// Deve exibir mensagem de erro ou 404
// Farol da Barra está em Salvador, não em Feira de Santana
expect(page.locator('text=não encontrado')).toBeVisible();
// OU
expect(page.locator('text=não existe')).toBeVisible();
```

**Objetivo:** Validar que contexto territorial é respeitado

---

### 4.7 Teste 7: Navegação End-to-End

**Fluxo:**
```typescript
// 1. Acessar listagem
await page.goto('http://localhost:5173/pontos-turisticos/ba/salvador');
expect(page.locator('text=Farol da Barra')).toBeVisible();

// 2. Clicar no Farol da Barra
await page.locator('text=Farol da Barra').first().click();
expect(page.url()).toContain('/farol-da-barra');
expect(page.locator('h1')).toContainText('Farol da Barra');

// 3. Voltar para listagem (breadcrumb)
await page.locator('text=Pontos turísticos de').click();
expect(page.url()).toContain('/pontos-turisticos/ba/salvador');
expect(page.locator('text=Farol da Barra')).toBeVisible();

// 4. Clicar no Pelourinho
await page.locator('text=Pelourinho').first().click();
expect(page.url()).toContain('/pelourinho');
expect(page.locator('h1')).toContainText('Pelourinho');

// 5. Voltar para listagem
await page.locator('text=Pontos turísticos de').click();
expect(page.url()).toContain('/pontos-turisticos/ba/salvador');

// 6. Clicar no Shopping da Bahia
await page.locator('text=Shopping da Bahia').first().click();
expect(page.url()).toContain('/shopping-da-bahia');
expect(page.locator('h1')).toContainText('Shopping da Bahia');
```

---

### 4.8 Teste 8: Console Limpo

**Validação:**
```typescript
const errors = [];
const warnings = [];

page.on('console', msg => {
  if (msg.type() === 'error') errors.push(msg.text());
  if (msg.type() === 'warning') warnings.push(msg.text());
});

// Navegar por todas as páginas
await page.goto('http://localhost:5173/pontos-turisticos/ba/salvador');
await page.locator('text=Farol da Barra').first().click();
await page.locator('text=Pontos turísticos de').click();
await page.locator('text=Pelourinho').first().click();

// Sem erros críticos
expect(errors).toHaveLength(0);

// Warnings esperados (não bloqueiam)
// - "Using mock data" (getCommunityPhotos)
// - "Cidade não resolvida, usando fallback legado" (cidades inexistentes)
```

---

## 5. VALIDAÇÃO MANUAL

### 5.1 Mapa Renderizado

**Localização:** Detail page → Seção "Como chegar"

**Checklist:**
- [ ] Mapa visível
- [ ] Marcador no mapa
- [ ] Mapa interativo (zoom, pan)

**⚠️ NOTA:** Coordenadas não foram definidas no seed, então mapa pode não renderizar ou usar coordenadas padrão.

---

### 5.2 Layout Visual

**Checklist:**
- [ ] Cards de pontos turísticos bem formatados
- [ ] Imagens carregam (se houver)
- [ ] Badges visíveis e legíveis
- [ ] Breadcrumb bem posicionado
- [ ] Descrição legível

---

### 5.3 Fotos da Comunidade

**Checklist:**
- [ ] Seção "Fotos da Comunidade" visível
- [ ] Exibe 6 fotos (mock)
- [ ] Console mostra "Using mock data"

---

## 6. CRITÉRIOS DE APROVAÇÃO

### 6.1 Obrigatórios (Fail Fast)

**Para aprovar a Fase 5, TODOS devem ser ✅:**

- [ ] Listagem carrega sem erro 500
- [ ] Pelo menos 3 pontos turísticos visíveis
- [ ] URL segue padrão `/ba/salvador/:slug`
- [ ] Bairro renderizado vem de location.name (não campo legado)
- [ ] Breadcrumb renderizado corretamente
- [ ] Detail page carrega por navegação
- [ ] Detail page carrega por URL direta
- [ ] Detail page carrega após reload
- [ ] Slug inexistente retorna erro/404
- [ ] Contexto territorial errado retorna erro/404
- [ ] Navegação end-to-end funciona
- [ ] Console sem erros JavaScript críticos

### 6.2 Conhecidos e Aceitos (Não bloqueiam)

- ⚠️ Fotos da comunidade usam mock
- ⚠️ Warnings de fallback legado no console
- ⚠️ Mapa pode não renderizar (sem coordenadas no seed)
- ⚠️ Campos legados ainda presentes no banco

---

## 7. EXECUÇÃO

### 7.1 Pré-requisitos

```bash
# Instalar Playwright
npm install -D @playwright/test

# Instalar browsers
npx playwright install

# Subir ambiente local
npm run dev
```

### 7.2 Executar Testes

```bash
# Executar testes automatizados
npx playwright test tests/e2e/tourist-points.spec.ts

# Executar com UI (debug)
npx playwright test tests/e2e/tourist-points.spec.ts --ui

# Executar com headed mode (ver navegador)
npx playwright test tests/e2e/tourist-points.spec.ts --headed
```

---

## 8. TEMPLATE DE EVIDÊNCIA

### 8.1 Estrutura do Documento

Criar arquivo: `EVIDENCIA_FASE5_NAVEGADOR.md`

```markdown
# EVIDÊNCIA - Fase 5: Validação no Navegador

## 1. AMBIENTE
- Data: [DATA]
- Hora: [HORA]
- Navegador: Chromium (Playwright)
- URL Base: http://localhost:5173

## 2. TESTES AUTOMATIZADOS

### Resultado Geral
- Total: 8 testes
- Passando: [X]/8
- Falhando: [Y]/8
- Exit Code: [0 ou 1]

### Teste 1: Listagem
Status: [✅ ou ❌]
Erro: [se houver]

### Teste 2: Detail Page - Navegação
Status: [✅ ou ❌]
Erro: [se houver]

### Teste 3: Detail Page - URL Direta
Status: [✅ ou ❌]
Erro: [se houver]

### Teste 4: Reload
Status: [✅ ou ❌]
Erro: [se houver]

### Teste 5: Slug Inexistente
Status: [✅ ou ❌]
Erro: [se houver]

### Teste 6: Contexto Territorial Errado
Status: [✅ ou ❌]
Erro: [se houver]

### Teste 7: Navegação End-to-End
Status: [✅ ou ❌]
Erro: [se houver]

### Teste 8: Console Limpo
Status: [✅ ou ❌]
Warnings: [listar]

## 3. VALIDAÇÃO MANUAL

### Mapa
- [ ] Renderizado
- [ ] Marcador visível
- [ ] Interativo

### Layout
- [ ] Cards bem formatados
- [ ] Badges visíveis
- [ ] Breadcrumb bem posicionado

### Fotos da Comunidade
- [ ] Seção visível
- [ ] 6 fotos (mock)

## 4. SCREENSHOTS

[Anexar screenshots dos testes]

## 5. CONCLUSÃO

- [ ] Todos os critérios obrigatórios atendidos
- [ ] Fase 5 aprovada
```

---

**Documento:** FASE5_GUIA_VALIDACAO_NAVEGADOR.md  
**Versão:** 2.0  
**Data:** 2026-04-05  
**Status:** ⚠️ PRONTO PARA EXECUÇÃO
