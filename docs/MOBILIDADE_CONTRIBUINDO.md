# MOBILIDADE (MOTOBOY) - GUIA DE CONTRIBUIÇÃO

**Objetivo**: Orientar desenvolvedores que vão contribuir com o módulo  
**Público**: Desenvolvedores

---

## 🎯 Princípios

### 1. SSOT (Single Source of Truth)
- **ride_requests** é a fonte única para corridas/entregas
- **ride_reports** é a fonte única para reports
- Nunca criar fontes alternativas de dados

### 2. Autorização Centralizada
- Sempre usar **MotoboyAuthorizationService** para validar permissões
- Nunca validar permissões apenas no frontend
- Backend é a fonte de verdade

### 3. Tipagem Forte
- **Zero @ts-nocheck** permitido
- Sempre tipar parâmetros e retornos
- Usar tipos do `RideReportsService` e `MotoboyAuthorizationService`

### 4. Auditoria
- Usar `logger` em pontos críticos
- Sempre logar tentativas de autorização
- Logar erros com contexto

### 5. Estados Tratados
- Sempre tratar: loading, erro, vazio
- Feedback ao usuário via toasts
- Invalidar cache após mutações

---

## 📁 Estrutura de Arquivos

```
src/modules/mobility/
├── services/
│   ├── MotoboyAuthorizationService.ts  # Autorização
│   ├── RideReportsService.ts           # Reports
│   └── MobilityService.ts              # Core
├── hooks/
│   ├── useDelivery.ts                  # Entregas
│   ├── useRideReports.ts               # Reports
│   └── useMobilidade.ts                # Core
├── components/
│   ├── RequestMotoboyButton.tsx        # CTA
│   ├── RideHistoryUnified.tsx          # Histórico
│   ├── CreateReportModal.tsx           # Reports
│   └── index.ts                        # Exports
├── constants/
│   ├── queryKeys.ts                    # React Query keys
│   └── index.ts                        # Constantes
└── core/
    └── RideOperationalService.ts       # Operações

src/modules/admin/pages/
├── AdminMotoboyOperations.tsx          # Console entregas
└── AdminReportsPassageirosV2.tsx       # Console reports

supabase/migrations/
├── 20260417100000_fix_vagas_urgencia_highlight.sql
├── 20260417100001_backfill_vagas_highlight_type_from_destaque.sql
└── 20260419000000_create_ride_reports.sql

docs/
├── MOBILIDADE_*.md                     # Documentação
└── architecture/ADR-001*.md            # Decisões
```

---

## 🔧 Como Adicionar Funcionalidades

### Adicionar Novo Tipo de Report

1. **Atualizar Service**
```typescript
// src/modules/mobility/services/RideReportsService.ts
export type ReportType =
  | "safety_concern"
  | "driver_behavior"
  | "novo_tipo"; // Adicionar aqui
```

2. **Atualizar Labels**
```typescript
// src/modules/admin/pages/AdminReportsPassageirosV2.tsx
const REPORT_TYPE_LABELS: Record<string, string> = {
  // ...
  novo_tipo: "Novo Tipo",
};
```

3. **Atualizar Modal**
```typescript
// src/modules/mobility/components/CreateReportModal.tsx
const REPORT_TYPES: Array<{ value: ReportType; label: string; icon: any }> = [
  // ...
  { value: "novo_tipo", label: "Novo Tipo", icon: AlertCircle },
];
```

### Adicionar Nova Validação de Permissão

1. **Atualizar MotoboyAuthorizationService**
```typescript
// src/modules/mobility/services/MotoboyAuthorizationService.ts
static async authorize(input: AuthorizationInput): Promise<AuthorizationResult> {
  // Adicionar nova validação aqui
  
  // Exemplo: Validar horário de operação
  const currentHour = new Date().getHours();
  if (currentHour < 6 || currentHour > 22) {
    return {
      authorized: false,
      reason: "OUTSIDE_OPERATING_HOURS",
      message: "Serviço disponível apenas entre 6h e 22h",
    };
  }
  
  // ...
}
```

2. **Documentar no ADR**
```markdown
# docs/architecture/ADR-002-horario-operacao.md
# Adicionar decisão arquitetural
```

### Adicionar Nova Métrica no Admin

1. **Atualizar Query**
```typescript
// src/modules/admin/pages/AdminMotoboyOperations.tsx
const { data: stats } = useQuery({
  queryKey: ["admin-motoboy-stats"],
  queryFn: async () => {
    // Adicionar nova métrica
    const novaMetrica = await calcularNovaMetrica();
    return { ...statsExistentes, novaMetrica };
  },
});
```

2. **Adicionar Card**
```tsx
<Card>
  <CardContent className="pt-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-muted-foreground">Nova Métrica</p>
        <p className="text-2xl font-bold">{stats.novaMetrica}</p>
      </div>
      <Icon className="h-8 w-8 text-primary" />
    </div>
  </CardContent>
</Card>
```

---

## 🧪 Testes

### Antes de Commitar

1. **Verificar TypeScript**
```bash
npx tsc --noEmit
```

2. **Verificar Linting**
```bash
npm run lint
```

3. **Testar Manualmente**
- Criar entrega
- Criar report
- Verificar admin

### Escrever Testes (Futuro - Fase 6)

```typescript
// __tests__/MotoboyAuthorizationService.test.ts
describe('MotoboyAuthorizationService', () => {
  it('deve autorizar business com plano válido', async () => {
    const result = await MotoboyAuthorizationService.authorize({
      requestingUserId: 'user-id',
      sourceType: 'business',
      sourceId: 'business-id',
      pickupLocationId: 'location-id',
      planTier: 'premium',
    });
    
    expect(result.authorized).toBe(true);
  });
  
  it('deve negar business sem plano', async () => {
    const result = await MotoboyAuthorizationService.authorize({
      requestingUserId: 'user-id',
      sourceType: 'business',
      sourceId: 'business-id',
      pickupLocationId: 'location-id',
      planTier: 'basico',
    });
    
    expect(result.authorized).toBe(false);
    expect(result.reason).toBe('MISSING_ENTITLEMENT');
  });
});
```

---

## 📝 Documentação

### Ao Adicionar Funcionalidade

1. **Atualizar CHANGELOG**
```markdown
# docs/MOBILIDADE_CHANGELOG.md
## [1.1.0] - YYYY-MM-DD
### Adicionado
- Nova funcionalidade X
```

2. **Atualizar Guia Rápido**
```markdown
# docs/MOBILIDADE_GUIA_RAPIDO.md
### Nova Funcionalidade
[Adicionar exemplo de uso]
```

3. **Atualizar Progresso**
```markdown
# docs/MOBILIDADE_IMPLEMENTACAO_PROGRESSO.md
### TX.Y - Nova Funcionalidade ✅
- Implementação completa
```

### JSDoc nos Componentes

```typescript
/**
 * NovoComponente - Descrição breve
 * 
 * Funcionalidades:
 * - Item 1
 * - Item 2
 * 
 * @example
 * ```tsx
 * <NovoComponente prop1="valor" />
 * ```
 */
export function NovoComponente({ prop1 }: Props) {
  // ...
}
```

---

## 🚫 O Que NÃO Fazer

### ❌ Gambiarras
```typescript
// ❌ ERRADO
// @ts-nocheck
function minhaFuncao(data: any) {
  // ...
}

// ✅ CORRETO
function minhaFuncao(data: CreateReportInput): Promise<Result> {
  // ...
}
```

### ❌ Validação Apenas no Frontend
```typescript
// ❌ ERRADO
if (user.planTier === 'premium') {
  await createDelivery();
}

// ✅ CORRETO
// Deixar MotoboyAuthorizationService validar no backend
await createDelivery(); // Service valida automaticamente
```

### ❌ Múltiplas Fontes de Verdade
```typescript
// ❌ ERRADO
await supabase.from('delivery_requests').insert(...);
await supabase.from('ride_requests').insert(...);

// ✅ CORRETO
await RideOperationalService.createDelivery(...); // SSOT
```

### ❌ Sem Tratamento de Erro
```typescript
// ❌ ERRADO
const data = await fetchData();
return data;

// ✅ CORRETO
try {
  const data = await fetchData();
  return data;
} catch (error) {
  logger.error('fetchData', error);
  toast.error('Erro ao buscar dados');
  return null;
}
```

---

## 🔄 Fluxo de Contribuição

### 1. Criar Branch
```bash
git checkout -b feature/nova-funcionalidade
```

### 2. Implementar
- Seguir princípios acima
- Adicionar JSDoc
- Tratar estados

### 3. Testar
```bash
npx tsc --noEmit
npm run lint
# Testar manualmente
```

### 4. Documentar
- Atualizar CHANGELOG
- Atualizar guias relevantes
- Adicionar exemplos

### 5. Commit
```bash
git add .
git commit -m "feat: adicionar nova funcionalidade X"
```

### 6. Pull Request
- Descrever mudanças
- Listar arquivos modificados
- Adicionar screenshots (se UI)

---

## 📞 Suporte

### Dúvidas Técnicas
- Consultar `MOBILIDADE_GUIA_RAPIDO.md`
- Consultar `MOBILIDADE_IMPLEMENTACAO_PROGRESSO.md`
- Consultar código-fonte (JSDoc completo)

### Dúvidas Arquiteturais
- Consultar `ADR-001`
- Consultar `MOBILIDADE_RESUMO_EXECUTIVO.md`

---

## ✅ Checklist de Contribuição

Antes de submeter PR:

- [ ] Código segue princípios SSOT
- [ ] Autorização centralizada (se aplicável)
- [ ] Tipagem forte (zero @ts-nocheck)
- [ ] Auditoria via logger
- [ ] Estados tratados (loading, erro, vazio)
- [ ] JSDoc adicionado
- [ ] TypeScript sem erros
- [ ] Linting passou
- [ ] Testado manualmente
- [ ] CHANGELOG atualizado
- [ ] Documentação atualizada
- [ ] Exemplos adicionados

---

**Última atualização**: 2026-04-19  
**Versão**: 1.0  
**Manutenção**: Atualizar conforme novos padrões forem estabelecidos
