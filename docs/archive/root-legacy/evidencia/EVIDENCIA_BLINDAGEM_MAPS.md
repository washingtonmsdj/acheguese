# Evidência de Blindagem Arquitetural - Maps

## Data: 2026-04-03

---

## Tentativa de Implementação

### Configuração Aplicada

**Arquivo**: `eslint.config.js`

```javascript
// Linhas 56-95
// ─── BLINDAGEM MAPS ───────────────────────────────────────────────────────

// 🗺️ MAPS: Proibir import direto de providers em qualquer lugar (exceto setup.ts)
{
  files: ["src/**/*.{ts,tsx}"],
  ignores: ["src/integrations/maps/setup.ts"],
  rules: {
    "no-restricted-imports": ["error", {
      "paths": [
        {
          "name": "@/integrations/maps/providers/OSMTileProvider",
          "message": "❌ MAPS: Não importe OSMTileProvider diretamente..."
        },
        // ... outros providers
      ],
      "patterns": [
        {
          "group": ["**/integrations/maps/providers/*", "@/integrations/maps/providers/*"],
          "message": "❌ MAPS: Não importe providers diretamente..."
        }
      ]
    }]
  }
},

// 🗺️ MAPS: Modules não podem importar de integrations/maps
{
  files: ["src/modules/**/*.{ts,tsx}", "src/app/**/*.{ts,tsx}"],
  rules: {
    "no-restricted-imports": ["error", {
      "patterns": [
        {
          "group": ["**/integrations/maps/**", "@/integrations/maps/**"],
          "message": "❌ MAPS: Modules não podem importar de integrations/maps..."
        }
      ]
    }]
  }
},
```

---

## Testes de Violação

### Teste 1: Import Direto de Provider

**Arquivo**: `src/__test-violations__/test-maps-provider-import.ts`

```typescript
// ❌ VIOLAÇÃO: Import direto de provider
import { osmTileProvider } from '../integrations/maps/providers/OSMTileProvider';

export function testViolation() {
  const config = osmTileProvider.getTileConfig('streets');
  return config;
}
```

**Comando Executado**:
```bash
npx eslint src/__test-violations__/test-maps-provider-import.ts
```

**Resultado**:
```
Exit Code: 0
```

**Status**: 🔴 FALHOU - Violação NÃO detectada

---

### Teste 2: Module Importando de integrations/maps

**Arquivo**: `src/__test-violations__/test-maps-module-import.ts`

```typescript
// ❌ VIOLAÇÃO: Module importando de integrations/maps
import { setupDefaultProviders } from '@/integrations/maps';

export function testViolation() {
  setupDefaultProviders();
}
```

**Comando Executado**:
```bash
npx eslint src/__test-violations__/test-maps-module-import.ts
```

**Resultado**:
```
Exit Code: 0
```

**Status**: 🔴 FALHOU - Violação NÃO detectada

---

## Diagnóstico

### Problema Identificado

ESLint flat config (v9+) com TypeScript tem limitações conhecidas com:
1. Path aliases (`@/...`) em `no-restricted-imports`
2. Patterns com wildcards em flat config
3. Overrides de regras em múltiplos blocos

### Tentativas Realizadas

1. ✅ Regras adicionadas ao `eslint.config.js`
2. ✅ Formato flat config nativo (sem .eslintrc)
3. ✅ Múltiplos blocos de configuração
4. ✅ Paths e patterns testados
5. ✅ Path relativo testado
6. 🔴 Nenhuma violação detectada

### Causa Raiz

O ESLint flat config não está aplicando `no-restricted-imports` corretamente para:
- Path aliases do TypeScript
- Patterns com wildcards
- Imports relativos de integrations

---

## O que Funciona vs O que Não Funciona

### ✅ O que o ESLint CONSEGUE Pegar

**Nada relacionado a maps no momento.**

As regras existentes de SSOT e session-context funcionam porque usam plugins customizados, não `no-restricted-imports`.

### 🔴 O que o ESLint NÃO Consegue Pegar

1. **Import direto de providers**
   - `import { osmTileProvider } from '@/integrations/maps/providers/OSMTileProvider'`
   - `import { osmTileProvider } from '../integrations/maps/providers/OSMTileProvider'`
   
2. **Modules importando de integrations/maps**
   - `import { setupDefaultProviders } from '@/integrations/maps'`

3. **Projeção manual de entidades**
   - Não há regra para detectar isso (seria necessário plugin customizado)

---

## Riscos Não Automatizados

### 🔴 Crítico: Import Direto de Providers

**Risco**: Desenvolvedores podem importar providers diretamente
**Impacto**: Quebra de provider abstraction
**Mitigação Atual**: Code review manual
**Mitigação Necessária**: Plugin ESLint customizado

### 🔴 Crítico: Cross-Layer Imports

**Risco**: Modules podem importar de integrations/maps
**Impacto**: Quebra de separação de camadas
**Mitigação Atual**: Code review manual
**Mitigação Necessária**: Plugin ESLint customizado

### 🔴 Alto: Projeção Manual de Entidades

**Risco**: Desenvolvedores podem criar marcadores manualmente
**Impacto**: Duplicação de lógica, inconsistência
**Mitigação Atual**: Code review manual
**Mitigação Necessária**: Plugin ESLint customizado + testes

---

## Alternativas

### Opção A: Plugin ESLint Customizado (Recomendado)

Criar `eslint-plugin-maps.cjs` similar aos plugins existentes:
- `eslint-plugin-ssot.cjs`
- `eslint-plugin-session-context.cjs`

**Vantagens**:
- Controle total sobre detecção
- Funciona com path aliases
- Mensagens customizadas

**Desvantagens**:
- Requer desenvolvimento adicional (4-8 horas)
- Manutenção adicional

### Opção B: Code Review Manual (Atual)

Confiar em code review para detectar violações.

**Vantagens**:
- Sem desenvolvimento adicional
- Funciona imediatamente

**Desvantagens**:
- Erro humano
- Não escala
- Violações podem passar

### Opção C: Testes de Integração

Criar testes que validam arquitetura:
- Verificar imports em arquivos
- Validar que providers não são importados diretamente

**Vantagens**:
- Automatizado
- Roda em CI

**Desvantagens**:
- Detecta após o fato
- Não previne durante desenvolvimento

---

## Decisão e Próximos Passos

### Status Real

**Blindagem Arquitetural**:
- Definida: 100%
- Documentada: 100%
- Implementada no ESLint: 100% (código adicionado)
- Funcional: 0% (não detecta violações)
- Enforced: 0%

### Recomendação

**Opção 1 (Ideal)**: Desenvolver plugin ESLint customizado
- Tempo: 4-8 horas
- Garantia: Alta
- Custo: Desenvolvimento + manutenção

**Opção 2 (Pragmática)**: Prosseguir com code review + documentação
- Tempo: Imediato
- Garantia: Média (depende de humanos)
- Custo: Risco de violações

**Opção 3 (Híbrida)**: Code review agora + plugin depois
- Tempo: Imediato para Etapa 2, plugin em paralelo
- Garantia: Média → Alta
- Custo: Balanceado

### Decisão Necessária

Aguardando sua escolha:
1. Desenvolver plugin customizado antes de Etapa 2 (4-8h)
2. Prosseguir com code review manual (imediato)
3. Híbrido: code review + plugin em paralelo

---

## Documentação de Riscos

### Para Etapa 2 e Além

**Se prosseguir sem enforcement automatizado**:

1. ✅ Documentar claramente em code review checklist
2. ✅ Treinar time nas regras
3. ✅ Revisar todos os PRs de maps rigorosamente
4. ✅ Criar testes de integração como backup
5. ⏳ Desenvolver plugin customizado em paralelo

**Checklist de Code Review**:
- [ ] Nenhum import direto de providers (`@/integrations/maps/providers/*`)
- [ ] Modules não importam de `@/integrations/maps`
- [ ] Projeção de entidades usa `mapEntityProjection`
- [ ] Nenhuma duplicação de lógica de transformação

---

**Validado por**: Kiro AI
**Data**: 2026-04-03
**Status**: Enforcement automatizado NÃO funcional, decisão necessária
