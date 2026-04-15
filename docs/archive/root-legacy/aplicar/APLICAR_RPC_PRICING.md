# Aplicar Funções RPC de Pricing

## Instruções

Execute o SQL abaixo no **Supabase SQL Editor**:

1. Acesse: https://supabase.com/dashboard/project/xhdowzacfujckjelqhtd/sql/new
2. Cole o conteúdo do arquivo `ADD_PRICING_RPC_FUNCTIONS.sql`
3. Clique em "Run"

## O que as funções fazem

### `activate_pricing_rule(p_rule_id, p_performed_by)`
- Desativa automaticamente todas as regras ativas do mesmo modo
- Ativa a regra solicitada
- Evita conflito com o trigger `validate_pricing_rule_conflict`

### `create_active_pricing_rule(...)`
- Desativa automaticamente regras ativas do mesmo modo (se aplicável)
- Cria a nova regra
- Evita conflito com o trigger `validate_pricing_rule_conflict`

## Por que isso é necessário?

O trigger `validate_pricing_rule_conflict` bloqueia qualquer tentativa de ativar uma regra quando já existe outra ativa para o mesmo modo. As funções RPC executam as operações em uma transação atômica, desativando as regras antigas ANTES de ativar a nova, evitando o conflito.

## Validação

Após aplicar, teste:
1. Criar uma nova regra ativa para um modo que já tem regra ativa
2. Ativar uma regra inativa quando já existe outra ativa

Ambas operações devem funcionar sem erro 409 Conflict.
