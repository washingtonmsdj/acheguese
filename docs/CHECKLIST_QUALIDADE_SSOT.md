# ✅ Checklist de Qualidade SSOT

## 📋 Guia para Manter SSOT no Projeto

Este documento serve como checklist para desenvolvedores garantirem que o princípio SSOT (Single Source of Truth) seja mantido no projeto.

---

## 🎯 O que é SSOT?

**Single Source of Truth (Fonte Única de Verdade)**

Princípio de design que estabelece que cada dado deve ter uma única representação autoritativa no sistema. Qualquer duplicação deve ser eliminada ou justificada.

### Benefícios:
- ✅ Fácil manutenção (alterar em um único lugar)
- ✅ Consistência garantida
- ✅ Menos bugs
- ✅ Código mais limpo
- ✅ Type safety melhorado

---

## 📁 Arquivos SSOT Disponíveis

### Localização: `src/core/business/constants/`

1. **facilities.ts** - Facilidades de empresas
2. **serviceModes.ts** - Modos de atendimento
3. **paymentMethods.ts** - Formas de pagamento
4. **socialPlatforms.ts** - Redes sociais
5. **specialties.ts** - Especialidades por categoria
6. **categories.ts** - Categorias e subcategorias de empresas
7. **weekDays.ts** - Dias da semana
8. **index.ts** - Exports centralizados

---

## ✅ Checklist Antes de Criar Constantes

### 1. Verificar se já existe SSOT

```bash
# Buscar por constantes similares
grep -r "const.*CATEGORIES" src/
grep -r "const.*PAYMENT" src/
grep -r "const.*FACILITY" src/
grep -r "const.*MODES" src/
grep -r "const.*DAYS" src/
```

### 2. Perguntas a fazer:

- [ ] Esta constante será usada em mais de um lugar?
- [ ] Esta constante representa dados de domínio (não UI)?
- [ ] Já existe uma constante SSOT similar?
- [ ] Esta constante pode ser reutilizada no futuro?

**Se SIM para qualquer pergunta:** Use ou crie SSOT!

### 3. Onde criar SSOT?

**Dados de negócio (empresas, produtos, etc.):**
- `src/core/business/constants/`

**Dados de domínio específico:**
- `src/modules/[modulo]/constants/`

**Dados compartilhados globalmente:**
- `src/shared/constants/`

---

## 🚫 O que NÃO fazer

### ❌ Duplicar constantes

```typescript
// ❌ ERRADO - Duplicação
// Arquivo A
const CATEGORIES = ["restaurante", "padaria", ...];

// Arquivo B
const CATEGORIES = ["restaurante", "padaria", ...];
```

```typescript
// ✅ CORRETO - SSOT
// constants/categories.ts
export const BUSINESS_CATEGORIES = ["restaurante", "padaria", ...];

// Arquivo A
import { BUSINESS_CATEGORIES } from '@/core/business/constants';

// Arquivo B
import { BUSINESS_CATEGORIES } from '@/core/business/constants';
```

### ❌ Definir localmente dados globais

```typescript
// ❌ ERRADO - Definição local de dado global
function MyComponent() {
  const paymentMethods = ["PIX", "Cartão", "Dinheiro"];
  // ...
}
```

```typescript
// ✅ CORRETO - Importar SSOT
import { PAYMENT_METHODS } from '@/core/business/constants';

function MyComponent() {
  // Usar PAYMENT_METHODS
}
```

### ❌ Criar variações de nomes

```typescript
// ❌ ERRADO - Nomes inconsistentes
const FORMAS_PAGAMENTO = [...]; // Arquivo A
const formasPagamento = [...];  // Arquivo B
const PAYMENT_METHODS = [...];  // Arquivo C
```

```typescript
// ✅ CORRETO - Nome único e consistente
// constants/paymentMethods.ts
export const PAYMENT_METHODS = [...];
```

---

## ✅ O que FAZER

### ✅ Criar arquivo SSOT bem estruturado

```typescript
/**
 * SSOT: [Nome do Domínio]
 * 
 * Descrição do propósito deste arquivo.
 * 
 * REGRA SSOT:
 * - Todas as definições de [domínio] devem estar aqui
 * - Nunca duplicar em componentes ou páginas
 * - Sempre importar deste módulo
 */

// ============================================================================
// CONSTANTES PRINCIPAIS
// ============================================================================

export const MY_CONSTANTS = [...] as const;

export type MyType = typeof MY_CONSTANTS[number];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function getById(id: string): MyType | undefined {
  return MY_CONSTANTS.find(c => c.id === id);
}

// Mais helpers...
```

### ✅ Criar helpers úteis

```typescript
// Helpers comuns:
- getById() - Buscar por ID
- getLabel() - Obter label
- getIcon() - Obter ícone
- getColor() - Obter cor
- isValid() - Validar
- asOptions() - Converter para options de select
```

### ✅ Exportar tudo no index.ts

```typescript
// constants/index.ts
export * from './categories';
export * from './paymentMethods';
export * from './facilities';
// ...
```

### ✅ Usar Type Safety

```typescript
// ✅ CORRETO - Type safety
export const CATEGORIES = ["a", "b", "c"] as const;
export type Category = typeof CATEGORIES[number];

// Uso:
function myFunction(cat: Category) {
  // TypeScript garante que cat é "a" | "b" | "c"
}
```

---

## 🔍 Como Auditar SSOT

### 1. Buscar duplicações

```bash
# Categorias
grep -r "const.*CATEGORIES" src/ --include="*.tsx" --include="*.ts"

# Formas de pagamento
grep -r "const.*PAYMENT\|const.*PAGAMENTO" src/ --include="*.tsx" --include="*.ts"

# Facilidades
grep -r "const.*FACILITY\|const.*FACILIDADES" src/ --include="*.tsx" --include="*.ts"

# Modos de atendimento
grep -r "const.*MODOS\|const.*SERVICE.*MODE" src/ --include="*.tsx" --include="*.ts"

# Dias da semana
grep -r "const.*DAY\|const.*DIAS\|const.*WEEK" src/ --include="*.tsx" --include="*.ts"
```

### 2. Verificar imports

```bash
# Ver quem importa de SSOT
grep -r "from '@/core/business/constants'" src/

# Ver quem NÃO importa (possível duplicação)
grep -r "const CATEGORIES" src/ | grep -v "constants/"
```

### 3. Checklist de auditoria

- [ ] Buscar por padrões de duplicação
- [ ] Verificar arquivos antigos
- [ ] Verificar novos módulos
- [ ] Validar que imports estão corretos
- [ ] Verificar se há definições locais de dados globais
- [ ] Documentar exceções justificadas

---

## 📝 Exceções Válidas ao SSOT

### Quando é OK ter definições locais?

1. **Contexto muito específico**
   - Exemplo: Payment options de checkout com labels customizados
   - Justificativa: Contexto de negócio diferente

2. **Dados temporários/mock**
   - Exemplo: Dados de teste em páginas de desenvolvimento
   - Justificativa: Não são dados de produção

3. **Configuração de UI específica**
   - Exemplo: Cores de tema específicas de um componente
   - Justificativa: Não é dado de domínio

### Como documentar exceções:

```typescript
/**
 * EXCEÇÃO SSOT: Contexto específico de checkout
 * 
 * Estas payment options são específicas para o fluxo de checkout
 * de gastronomia e têm labels customizados que não se aplicam
 * ao cadastro geral de empresas.
 * 
 * SSOT relacionado: src/core/business/constants/paymentMethods.ts
 */
const PAYMENT_OPTIONS = [
  { value: "pix", label: "PIX direto ao merchant", ... },
  // ...
];
```

---

## 🎯 Processo de Code Review

### Checklist para Reviewer:

- [ ] Verificar se há constantes duplicadas
- [ ] Verificar se SSOT está sendo usado corretamente
- [ ] Verificar se novos dados deveriam estar em SSOT
- [ ] Verificar se helpers estão sendo usados
- [ ] Verificar se há type safety
- [ ] Verificar se exceções estão documentadas

### Perguntas para fazer:

1. "Esta constante já existe em SSOT?"
2. "Esta constante será usada em outros lugares?"
3. "Por que não usar o SSOT existente?"
4. "Esta exceção está documentada?"

---

## 🚀 Migração de Código Legado

### Passo a passo:

1. **Identificar duplicação**
   ```bash
   grep -r "const CATEGORIES" src/
   ```

2. **Verificar se SSOT existe**
   - Checar `src/core/business/constants/`
   - Se não existe, criar

3. **Criar SSOT se necessário**
   - Seguir template acima
   - Adicionar helpers
   - Exportar no index.ts

4. **Refatorar arquivos**
   - Remover definição local
   - Importar SSOT
   - Usar helpers

5. **Testar**
   - Verificar se tudo funciona
   - Rodar testes
   - Verificar tipos

6. **Documentar**
   - Atualizar documentação
   - Adicionar comentários
   - Registrar mudança

---

## 📊 Métricas de Qualidade SSOT

### Como medir:

```bash
# Contar arquivos SSOT
ls -1 src/core/business/constants/*.ts | wc -l

# Contar duplicações (deve ser 0)
grep -r "const CATEGORIES" src/ --include="*.tsx" | grep -v "constants/" | wc -l

# Contar imports de SSOT (deve ser alto)
grep -r "from '@/core/business/constants'" src/ | wc -l
```

### Metas:

- ✅ **0 duplicações** de constantes de domínio
- ✅ **100% de imports** usando SSOT
- ✅ **Todas as exceções** documentadas
- ✅ **Todos os arquivos SSOT** com helpers

---

## 🎓 Treinamento

### Para novos desenvolvedores:

1. Ler este checklist
2. Revisar arquivos em `src/core/business/constants/`
3. Entender o padrão de helpers
4. Praticar com exemplos
5. Fazer code review focado em SSOT

### Recursos:

- `docs/RESUMO_FINAL_SSOT.md` - Resumo da auditoria
- `docs/VIOLACOES_SSOT_ENCONTRADAS.md` - Exemplos de violações
- `docs/AUDITORIA_SSOT_FINAL.md` - Relatório completo
- `src/core/business/constants/` - Exemplos de SSOT

---

## 📞 Dúvidas?

### Quando em dúvida:

1. **Pergunte:** "Esta constante será usada em mais de um lugar?"
2. **Busque:** Existe SSOT similar?
3. **Documente:** Se for exceção, documente o porquê
4. **Revise:** Peça code review focado em SSOT

### Regra de ouro:

> **"Se você está copiando e colando uma constante, provavelmente deveria estar em SSOT!"**

---

**Última atualização:** 2026-04-18  
**Versão:** 1.0  
**Mantido por:** Equipe de Desenvolvimento
