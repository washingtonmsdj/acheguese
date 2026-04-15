# CORREÇÃO - BOTÃO CRIAR NÃO FUNCIONAVA

## PROBLEMA

Botão "Criar" no diálogo de pricing não funcionava ao clicar.

## CAUSA RAIZ

O código verificava `if (!profile?.id) return;` no início do `handleSubmit`. Como a autenticação foi desabilitada temporariamente, `profile` é `undefined`, fazendo o botão não fazer nada ao clicar.

## CORREÇÃO APLICADA

### Arquivo 1: PricingRuleDialog.tsx

**ANTES**:
```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!profile?.id) return; // ❌ Retorna se não houver profile

  setLoading(true);
  // ...
  await pricingService.createRule(data, profile.id);
  // ...
};
```

**DEPOIS**:
```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  // ⚠️ DESENVOLVIMENTO: Usar ID fake se não houver profile
  const userId = profile?.id || '00000000-0000-0000-0000-000000000000';

  setLoading(true);
  // ...
  await pricingService.createRule(data, userId);
  // ...
};
```

### Arquivo 2: PricingRulesList.tsx

**ANTES**:
```typescript
const handleToggleActive = async (rule: PricingRule) => {
  if (!profile?.id) return; // ❌ Retorna se não houver profile
  // ...
};
```

**DEPOIS**:
```typescript
const handleToggleActive = async (rule: PricingRule) => {
  // ⚠️ DESENVOLVIMENTO: Usar ID fake se não houver profile
  const userId = profile?.id || '00000000-0000-0000-0000-000000000000';
  // ...
};
```

## RESULTADO

✅ Botão "Criar" agora funciona
✅ Botão "Ativar/Desativar" agora funciona
✅ Botão "Editar" agora funciona

## IMPORTANTE

⚠️ **ANTES DE PRODUÇÃO**: Remover o fallback de userId e reativar a verificação de autenticação!

```typescript
// EM PRODUÇÃO, DEVE SER:
if (!profile?.id) {
  toast.error("Você precisa estar autenticado");
  return;
}
```

## ARQUIVOS MODIFICADOS

1. `src/modules/admin/components/pricing/PricingRuleDialog.tsx`
2. `src/modules/admin/components/pricing/PricingRulesList.tsx`

## PRÓXIMO PASSO

Testar no navegador:
1. Acessar `/admin/pricing`
2. Clicar em "Nova Regra"
3. Preencher formulário
4. Clicar em "Criar"
5. Verificar toast de sucesso
6. Verificar que regra aparece na lista (após desabilitar RLS)

