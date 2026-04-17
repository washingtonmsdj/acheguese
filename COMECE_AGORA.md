# 🚀 COMECE AGORA - Eliminação de Hardcodes

**Tempo:** 30 minutos para primeira correção  
**Data:** 2026-04-16

---

## ✅ Situação Atual

```
✅ Auditoria completa realizada
✅ 419 violações identificadas
✅ Documentação completa criada
✅ Scripts de automação prontos
✅ Plano de 4 fases definido

🔴 PENDENTE: Iniciar execução
```

---

## 🎯 Primeira Correção (30 minutos)

### Escolha: Remover Import de Mock Mais Simples

Vamos começar com a correção mais rápida e de maior impacto: **remover imports de mocks em runtime**.

---

## 📋 Passo a Passo

### 1. Identificar Imports de Mock (5 min)

```bash
# Buscar todos os imports de mock
npm run validate:hardcodes | grep "Import de mock"
```

**Resultado esperado:** 12 violações

**Exemplo de violação:**
```typescript
// ❌ ERRADO
import { MOCK_VAGAS } from "../data/mock-vagas";
```

---

### 2. Escolher Arquivo Mais Simples (2 min)

Vamos começar com o mais simples. Procure por:
- Arquivo com menos dependências
- Mock com poucos dados
- Componente isolado

**Sugestão:** Comece por um dos seguintes:
1. `src/modules/vagas/hooks/useVagas.ts`
2. `src/modules/jobs/services/JobService.ts`
3. `src/modules/guide/pages/TouristPointsPage.tsx`

---

### 3. Criar Service Real (10 min)

#### Opção A: Usar Gerador (Recomendado)

```bash
# Gerar service automaticamente
npm run generate:service VagasService

# Isso cria:
# - src/core/vagas/services/VagasService.ts
# - src/core/vagas/hooks/useVagas.ts
# - src/core/vagas/__tests__/VagasService.test.ts
```

#### Opção B: Criar Manualmente

```typescript
// src/modules/vagas/services/VagasService.ts
import { supabase } from '@/integrations/supabase/client';

export class VagasService {
  static async getVagas() {
    const { data, error } = await supabase
      .from('vagas')
      .select('*')
      .eq('status', 'ativa')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }
}
```

---

### 4. Atualizar Hook (5 min)

```typescript
// src/modules/vagas/hooks/useVagas.ts

// ❌ ANTES
import { MOCK_VAGAS } from "../data/mock-vagas";

export function useVagas() {
  const [vagas] = useState(MOCK_VAGAS);
  return { vagas };
}

// ✅ DEPOIS
import { useQuery } from '@tanstack/react-query';
import { VagasService } from '../services/VagasService';

export function useVagas() {
  return useQuery({
    queryKey: ['vagas'],
    queryFn: () => VagasService.getVagas(),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}
```

---

### 5. Mover Mock para Fixtures (3 min)

```bash
# Criar diretório de fixtures se não existir
mkdir -p tests/fixtures

# Mover mock
mv src/modules/vagas/data/mock-vagas.ts tests/fixtures/vagas.fixtures.ts
```

**Atualizar imports em testes:**
```typescript
// ✅ Apenas em testes
import { MOCK_VAGAS } from '@/tests/fixtures/vagas.fixtures';
```

---

### 6. Validar (5 min)

```bash
# 1. Validar que não há mais imports de mock
npm run validate:hardcodes | grep "mock-vagas"
# Deve retornar vazio

# 2. Executar testes
npm test src/modules/vagas

# 3. Verificar no navegador
npm run dev
# Navegar para página de vagas e verificar funcionamento
```

---

### 7. Commit (2 min)

```bash
git add .
git commit -m "fix(vagas): remover mock de runtime e implementar service real

- Remove import de MOCK_VAGAS do hook useVagas
- Implementa VagasService com query real do Supabase
- Move mock para tests/fixtures/vagas.fixtures.ts
- Adiciona cache de 5 minutos via React Query

Refs: #hardcode-audit
Violações eliminadas: 1 crítica"

git push
```

---

## 🎉 Resultado

```
✅ 1 violação crítica eliminada
✅ Service real implementado
✅ Mock isolado em fixtures
✅ Testes passando
✅ Commit feito

Progresso: [█░░░░░░░░░] 0.24% (1/419)
```

---

## 📊 Próximas 5 Correções Rápidas

Após a primeira, continue com estas (ordem de facilidade):

### 2. Jobs Service (30 min)
```bash
npm run generate:service JobService
# Seguir mesmo processo de Vagas
```

### 3. Tourist Points Mock Fallback (20 min)
```typescript
// src/modules/guide/pages/TouristPointsPage.tsx
// Remover: const useMocks = realPoints.length === 0;
// Adicionar: Empty state quando não houver dados
```

### 4. UUID Fallback em PricingRuleDialog (10 min)
```typescript
// ❌ ANTES
const userId = profile?.id || '00000000-0000-0000-0000-000000000000';

// ✅ DEPOIS
if (!profile?.id) {
  return <div>Carregando perfil...</div>;
}
const userId = profile.id;
```

### 5. UUID Fallback em PricingRulesList (10 min)
```typescript
// Mesmo padrão do item 4
```

### 6. Status Hardcoded em useAdminUserDetail (15 min)
```typescript
// Criar enum no banco ou buscar de tabela de status
```

---

## 📈 Meta Diária

### Mínimo (30 min/dia)
- ✅ 1 violação crítica por dia
- ✅ Validar com script
- ✅ Commit

### Ideal (1h/dia)
- ✅ 2-3 violações por dia
- ✅ Adicionar testes
- ✅ Atualizar checklist

### Ambicioso (2h/dia)
- ✅ 5+ violações por dia
- ✅ Service completo
- ✅ Documentar aprendizados

---

## 🛠️ Comandos Úteis

```bash
# Validar hardcodes
npm run validate:hardcodes

# Validar arquivo específico
npm run validate:hardcodes | grep "nome-do-arquivo"

# Gerar service
npm run generate:service NomeService

# Gerar migration
npm run generate:migration nome_migration

# Executar testes
npm test

# Executar testes de um módulo
npm test src/modules/vagas

# Ver progresso
npm run validate:hardcodes | grep "RESUMO" -A 10
```

---

## 📚 Documentação de Apoio

### Leitura Rápida (10 min)
1. [GUIA_INICIO_RAPIDO.md](./docs/audits/GUIA_INICIO_RAPIDO.md)
2. [EXEMPLOS_CODIGO_CORRETO.md](./docs/audits/EXEMPLOS_CODIGO_CORRETO.md) - Seção 5

### Leitura Completa (30 min)
1. [RESUMO_EXECUTIVO_AUDITORIA.md](./docs/audits/RESUMO_EXECUTIVO_AUDITORIA.md)
2. [PLANO_MIGRACAO_HARDCODES.md](./docs/audits/PLANO_MIGRACAO_HARDCODES.md) - Fase 1

### Referência
1. [README.md](./docs/audits/README.md) - Índice completo
2. [CHECKLIST_EXECUCAO.md](./docs/audits/CHECKLIST_EXECUCAO.md) - Acompanhamento

---

## 🚨 Erros Comuns

### Erro 1: Esquecer de Remover Import
```typescript
// ❌ ERRADO: Import ainda existe
import { MOCK_VAGAS } from './mock-vagas';
const { data: vagas } = useVagas(); // Não usa, mas import existe
```
**Solução:** Delete a linha de import completamente

### Erro 2: Não Mover Mock
```bash
# ❌ ERRADO: Mock ainda em src/
src/modules/vagas/data/mock-vagas.ts
```
**Solução:** `mv src/modules/vagas/data/mock-vagas.ts tests/fixtures/`

### Erro 3: Não Validar
```bash
# ❌ ERRADO: Commit sem validar
git commit -m "fix: algo"
```
**Solução:** Sempre valide antes
```bash
npm run validate:hardcodes
npm test
git commit -m "fix: algo"
```

---

## 💡 Dicas de Produtividade

### 1. Use Aliases
```bash
# Adicione ao seu .bashrc ou .zshrc
alias vh="npm run validate:hardcodes"
alias gs="npm run generate:service"
alias gm="npm run generate:migration"
```

### 2. Crie Script de Progresso
```bash
# progress.sh
echo "=== PROGRESSO SSOT ==="
echo "Data: $(date +%Y-%m-%d)"
npm run validate:hardcodes 2>&1 | grep "RESUMO" -A 10
```

### 3. Trabalhe em Lotes
- Manhã: 2-3 correções simples (imports de mock)
- Tarde: 1 correção complexa (service completo)
- Fim do dia: Validar e commitar tudo

---

## 🎯 Checklist de Hoje

- [ ] Executei `npm run validate:hardcodes`
- [ ] Li este documento
- [ ] Fiz minha primeira correção (import de mock)
- [ ] Validei a correção
- [ ] Fiz commit e push
- [ ] Atualizei progresso no checklist

---

## 📞 Precisa de Ajuda?

### Documentação
- [Guia de Início Rápido](./docs/audits/GUIA_INICIO_RAPIDO.md)
- [Exemplos de Código](./docs/audits/EXEMPLOS_CODIGO_CORRETO.md)
- [Troubleshooting](./docs/audits/TROUBLESHOOTING.md)

### Suporte
- Canal: `#tech-architecture`
- Email: architecture@empresa.com
- Issues: GitHub com tag `hardcode-audit`

---

## 🚀 Vamos Começar!

```bash
# 1. Validar situação atual
npm run validate:hardcodes

# 2. Gerar primeiro service
npm run generate:service VagasService

# 3. Implementar correção
# (seguir passos acima)

# 4. Validar
npm run validate:hardcodes
npm test

# 5. Commit
git add .
git commit -m "fix: primeira correção de hardcode"
git push

# 6. Comemorar! 🎉
```

---

**Tempo Total:** 30 minutos  
**Impacto:** 1 violação crítica eliminada  
**Próximo Passo:** Repetir para próximas 5 correções rápidas

**Lembre-se:** Cada hardcode eliminado é uma vitória! 🎯

---

**Última Atualização:** 2026-04-16  
**Status:** ✅ Pronto para Execução
