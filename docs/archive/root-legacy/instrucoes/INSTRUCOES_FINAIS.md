# 🎯 Instruções Finais - Territory Management

## Situação Atual

✅ Código corrigido e funcionando
⚠️ Banco de dados com duplicados (viola SSOT)

## Solução: 2 Passos Simples

### Passo 1: Corrigir Duplicados (OBRIGATÓRIO)

Execute no Supabase SQL Editor:

**Arquivo**: `EXECUTAR_CORRECAO_SSOT.sql`

Este script:
- ✅ Identifica duplicados automaticamente
- ✅ Define registros canônicos (SSOT)
- ✅ Migra todas as dependências
- ✅ Remove duplicados com segurança
- ✅ Adiciona constraints de unicidade
- ✅ Garante integridade referencial

**Tempo**: ~30 segundos

### Passo 2: Ativar Territórios no Seletor

Após corrigir duplicados, execute:

**Arquivo**: `ativar-salvador-complexo.sql`

```sql
-- Ativar Salvador
UPDATE locations 
SET metadata = COALESCE(metadata, '{}'::jsonb) || '{"is_selector_active": true}'::jsonb
WHERE geographic_path = '/br/ba/salvador'
  AND status = 'active';

-- Ativar Complexo do Nordeste de Amaralina
UPDATE territorial_groups 
SET metadata = COALESCE(metadata, '{}'::jsonb) || '{"is_selector_active": true}'::jsonb
WHERE slug = 'complexo-do-nordeste-de-amaralina'
  AND status = 'active';
```

**Tempo**: ~5 segundos

## Verificação

Após executar os scripts:

1. Recarregue `/admin/territory-management`
2. ✅ Aviso vermelho de duplicados deve desaparecer
3. ✅ Hierarquia deve estar correta
4. ✅ Salvador e Complexo devem aparecer com toggle ativo

## Por que isso aconteceu?

Duplicados foram criados provavelmente por:
- Inserções manuais no banco
- Scripts de seed executados múltiplas vezes
- Falta de constraints de unicidade

## Como prevenir?

Os constraints adicionados pelo script garantem:
```sql
-- Nunca mais haverá duplicados
ALTER TABLE locations ADD CONSTRAINT locations_slug_unique UNIQUE (slug);
ALTER TABLE locations ADD CONSTRAINT locations_geographic_path_unique UNIQUE (geographic_path);
```

## Arquivos Importantes

### Para Executar
1. ✅ `EXECUTAR_CORRECAO_SSOT.sql` - Execute primeiro
2. ✅ `ativar-salvador-complexo.sql` - Execute depois

### Para Referência
- `CORRECAO_DEFINITIVA_SSOT.sql` - Versão detalhada com explicações
- `test-territory-management.sql` - Queries de diagnóstico
- `corrigir-duplicados-seguro.sql` - Versão manual passo a passo

### Documentação
- `RESUMO_FINAL_TERRITORY_MANAGEMENT.md` - Resumo das correções de código
- `CORRECOES_TERRITORY_MANAGEMENT.md` - Guia de correções aplicadas

## Resultado Final

Após executar tudo:

✅ SSOT garantido (um slug = um território)
✅ Hierarquia correta (Brasil → Bahia → Salvador)
✅ Grupos territoriais funcionando
✅ Constraints de unicidade ativos
✅ Salvador e Complexo no seletor principal
✅ Sistema pronto para produção

## Suporte

Se algo der errado:
1. Verifique os logs do script (RAISE NOTICE)
2. Execute as queries de verificação no final
3. Use `test-territory-management.sql` para diagnóstico

---

**Tempo total**: ~1 minuto
**Complexidade**: Baixa (apenas executar 2 scripts SQL)
**Risco**: Mínimo (script com verificações de segurança)
