# Guia de Início Rápido - Eliminação de Hardcodes

**Tempo estimado:** 30 minutos  
**Objetivo:** Começar a eliminar hardcodes hoje mesmo

---

## 🚀 Passo 1: Entender o Problema (5 min)

### O que são hardcodes indevidos?

**❌ ERRADO:**
```typescript
// Preço hardcoded
const price = 49.90;

// Coordenada hardcoded
const center = { lat: -12.9714, lng: -38.5103 };

// Mock em produção
import { MOCK_VAGAS } from './mock-vagas';
```

**✅ CORRETO:**
```typescript
// Preço do banco
const { data: plan } = useBillingPlan('pro');
const price = plan.priceValue;

// Coordenada do banco
const { data: location } = useLocation(locationId);
const center = { lat: location.latitude, lng: location.longitude };

// Dados reais
const { data: vagas } = useVagas();
```

### Por que isso importa?

- ❌ **Hardcode:** Impossível mudar sem deploy
- ✅ **SSOT:** Muda no banco, reflete instantaneamente

---

## 🔍 Passo 2: Validar Situação Atual (5 min)

```bash
# Executar validação
npm run validate:hardcodes
```

**Saída esperada:**
```
🔍 RELATÓRIO DE VALIDAÇÃO SSOT - HARDCODES
═══════════════════════════════════════════

📊 RESUMO:
   🔴 Críticas: 160
   🟡 Altas: 80
   🟢 Médias: 22
   📝 Total: 262

📋 POR TIPO:
   Status hardcoded: 80
   Coordenada hardcoded: 60
   Preço hardcoded: 45
   UUID hardcoded: 30
   Limite operacional hardcoded: 25
   Import de mock em runtime: 15
   ...
```

**Ação:** Anote os números para acompanhar progresso

---

## 📚 Passo 3: Ler Documentação Essencial (10 min)

### Leitura Obrigatória (10 min)

1. **[RESUMO_EXECUTIVO_AUDITORIA.md](./RESUMO_EXECUTIVO_AUDITORIA.md)** (5 min)
   - Seção: "Top 6 Violações Críticas"
   - Seção: "Plano de Ação"

2. **[EXEMPLOS_CODIGO_CORRETO.md](./EXEMPLOS_CODIGO_CORRETO.md)** (5 min)
   - Seção: "1. Preços e Valores Monetários"
   - Seção: "5. Mocks e Fixtures"

### Leitura Complementar (depois)

- [PLANO_MIGRACAO_HARDCODES.md](./PLANO_MIGRACAO_HARDCODES.md) - Quando for implementar
- [RELATORIO_HARDCODES_ENCONTRADOS.md](./RELATORIO_HARDCODES_ENCONTRADOS.md) - Para detalhes

---

## 🛠️ Passo 4: Primeira Correção (10 min)

### Exemplo Prático: Remover Mock de Produção

**Antes (❌ ERRADO):**
```typescript
// src/modules/vagas/hooks/useVagas.ts
import { MOCK_VAGAS } from "../data/mock-vagas";

export function useVagas() {
  const [vagas] = useState(MOCK_VAGAS);
  return { vagas };
}
```

**Depois (✅ CORRETO):**

#### 1. Criar Service (2 min)
```bash
npm run generate:service VagasService
```

#### 2. Implementar Query (3 min)
```typescript
// src/modules/vagas/services/VagasService.ts
static async getVagas(): Promise<Vaga[]> {
  const { data, error } = await supabase
    .from('vagas')
    .select('*')
    .eq('status', 'ativa');
  
  if (error) throw error;
  return data;
}
```

#### 3. Atualizar Hook (2 min)
```typescript
// src/modules/vagas/hooks/useVagas.ts
import { useQuery } from '@tanstack/react-query';
import { VagasService } from '../services/VagasService';

export function useVagas() {
  return useQuery({
    queryKey: ['vagas'],
    queryFn: () => VagasService.getVagas(),
  });
}
```

#### 4. Mover Mock (1 min)
```bash
# Mover para fixtures
mv src/modules/vagas/data/mock-vagas.ts tests/fixtures/vagas.fixtures.ts
```

#### 5. Validar (2 min)
```bash
npm run validate:hardcodes
npm test src/modules/vagas
```

**Resultado:** 1 violação crítica eliminada! 🎉

---

## ✅ Checklist de Início

### Hoje (30 min)
- [ ] Executei `npm run validate:hardcodes`
- [ ] Li o Resumo Executivo
- [ ] Li os Exemplos de Código
- [ ] Fiz minha primeira correção
- [ ] Validei a correção

### Esta Semana
- [ ] Revisei o Plano de Migração
- [ ] Escolhi uma violação crítica para corrigir
- [ ] Implementei a correção
- [ ] Criei testes
- [ ] Fiz commit e push

### Próximas 4 Semanas
- [ ] Executei Fase 1 (Crítico)
- [ ] Executei Fase 2 (Alta)
- [ ] Executei Fase 3 (Média)
- [ ] Executei Fase 4 (Prevenção)

---

## 🎯 Metas Diárias

### Meta Mínima (30 min/dia)
- Corrigir **1 violação crítica** por dia
- Validar com `npm run validate:hardcodes`
- Fazer commit

### Meta Ideal (1h/dia)
- Corrigir **2-3 violações críticas** por dia
- Adicionar testes
- Atualizar checklist

### Meta Ambiciosa (2h/dia)
- Corrigir **5+ violações** por dia
- Implementar service completo
- Documentar aprendizados

---

## 📊 Acompanhar Progresso

### Dashboard Simples

```bash
# Criar arquivo de progresso
cat > progress.sh << 'EOF'
#!/bin/bash
echo "=== PROGRESSO SSOT ==="
echo "Data: $(date +%Y-%m-%d)"
echo ""
echo "Hardcodes restantes:"
npm run validate:hardcodes 2>&1 | grep "Total:"
echo ""
echo "Testes passando:"
npm test 2>&1 | grep "Tests:"
EOF

chmod +x progress.sh
./progress.sh
```

### Gráfico de Progresso

```
Semana 1: [████████░░] 80% (160 → 32 críticas)
Semana 2: [██████████] 100% (32 → 0 críticas)
Semana 3: [██████░░░░] 60% (80 → 32 altas)
Semana 4: [████░░░░░░] 40% (prevenção)
```

---

## 💡 Dicas para Sucesso

### 1. Comece Pequeno
- Não tente corrigir tudo de uma vez
- Foque em 1 violação por vez
- Valide após cada correção

### 2. Use os Geradores
```bash
# Gerar migration
npm run generate:migration create_pricing_rules

# Gerar service
npm run generate:service PricingService
```

### 3. Teste Sempre
```bash
# Após cada correção
npm test

# Validar hardcodes
npm run validate:hardcodes
```

### 4. Commit Frequente
```bash
# Commits pequenos e frequentes
git add .
git commit -m "fix: remover mock de vagas"
git push
```

### 5. Peça Ajuda
- Canal: `#tech-architecture`
- Consulte documentação
- Revise exemplos

---

## 🚨 Erros Comuns

### Erro 1: Esquecer de Remover Import
```typescript
// ❌ ERRADO: Ainda importa o mock
import { MOCK_VAGAS } from './mock-vagas';
const { data: vagas } = useVagas(); // Não usa o mock, mas import ainda existe
```

**Solução:** Remova o import completamente

### Erro 2: Não Mover Mock para Fixtures
```typescript
// ❌ ERRADO: Mock ainda em src/
src/modules/vagas/data/mock-vagas.ts
```

**Solução:** Mova para `tests/fixtures/`

### Erro 3: Não Validar
```bash
# ❌ ERRADO: Fazer correção e não validar
git commit -m "fix: algo"
```

**Solução:** Sempre valide antes de commitar
```bash
npm run validate:hardcodes
npm test
git commit -m "fix: algo"
```

---

## 📞 Precisa de Ajuda?

### Documentação
- [README.md](./README.md) - Índice completo
- [EXEMPLOS_CODIGO_CORRETO.md](./EXEMPLOS_CODIGO_CORRETO.md) - Exemplos práticos
- [PLANO_MIGRACAO_HARDCODES.md](./PLANO_MIGRACAO_HARDCODES.md) - Guia detalhado

### Suporte
- Canal: `#tech-architecture`
- Email: architecture@empresa.com
- Issues: GitHub com tag `hardcode-audit`

### Scripts Úteis
```bash
# Validar hardcodes
npm run validate:hardcodes

# Gerar migration
npm run generate:migration <nome>

# Gerar service
npm run generate:service <nome>

# Executar testes
npm test

# Ver progresso
./progress.sh
```

---

## 🎉 Próximos Passos

Após completar este guia:

1. ✅ Escolha uma violação crítica do relatório
2. ✅ Siga o [Plano de Migração](./PLANO_MIGRACAO_HARDCODES.md)
3. ✅ Use o [Checklist de Execução](./CHECKLIST_EXECUCAO.md)
4. ✅ Acompanhe progresso diariamente

**Lembre-se:** Cada hardcode eliminado é uma vitória! 🎯

---

**Última Atualização:** 2026-04-16  
**Tempo de Leitura:** 10 minutos  
**Tempo de Prática:** 20 minutos  
**Total:** 30 minutos para começar!
