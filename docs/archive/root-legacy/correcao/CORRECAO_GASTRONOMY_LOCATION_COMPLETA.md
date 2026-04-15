# ✅ Correção de location_id para Empresas de Gastronomia

## Problema Identificado

As empresas de gastronomia estavam com `location_id` apontando para nível de cidade (3 segmentos no `geographic_path`) ao invés de nível de bairro/distrito (4 segmentos), causando erro no `BusinessUrlService`:

```
geographic_path inválido (sem bairro): "/br/ba/salvador"
Empresas devem ter location_id apontando para bairro/district.
```

## Causa Raiz

O `BusinessUrlService` exige que todas as empresas tenham `geographic_path` com 4 segmentos:
- Segmento 1: país (br)
- Segmento 2: estado (ba)
- Segmento 3: cidade (salvador)
- Segmento 4: bairro (barra, rio-vermelho, etc.)

Isso é necessário para gerar URLs canônicas no formato:
```
/empresas/:uf/:cidade/:bairro/:slug
```

## Solução Aplicada

### Script Criado: `fix_gastronomy_remote.ts`

Script TypeScript que conecta ao Supabase remoto e:

1. **Lista todos os bairros disponíveis** em Salvador (50 bairros encontrados)
2. **Atualiza business_data** com location_id correto para cada empresa
3. **Valida as correções** verificando que todos têm 4 segmentos
4. **Testa o formato de URLs** canônicas geradas

### Empresas Corrigidas

| Empresa | Bairro Anterior | Bairro Correto | Status |
|---------|----------------|----------------|--------|
| Restaurante Barra Mar | Salvador (cidade) | Barra | ✅ Corrigido |
| Bar do Rio | Salvador (cidade) | Rio Vermelho | ✅ Corrigido |
| Casa da Moqueca | Salvador (cidade) | Centro | ✅ Corrigido |
| Pizzaria Bella Napoli | Salvador (cidade) | Itaigara | ✅ Corrigido |
| Sushi House Pituba | Salvador (cidade) | Pituba | ✅ Corrigido |

### Observações

1. **Pelourinho não existe como bairro**: A Casa da Moqueca foi mapeada para "Centro" (que é o bairro correto onde fica o Pelourinho)
2. **Erro em addresses**: A tabela `addresses` não tem coluna `neighborhood`, então não foi possível atualizar os endereços. Isso não afeta o funcionamento do BusinessUrlService, que usa apenas `business_data.location_id`.

## Validação Final

Todas as 5 empresas de gastronomia agora têm:

✅ `geographic_path` com 4 segmentos (país/estado/cidade/bairro)
✅ URLs canônicas corretas:
- `/empresas/ba/salvador/barra/restaurante-barra-mar`
- `/empresas/ba/salvador/rio-vermelho/bar-do-rio`
- `/empresas/ba/salvador/centro/casa-da-moqueca`
- `/empresas/ba/salvador/itaigara/pizzaria-bella-napoli`
- `/empresas/ba/salvador/pituba/sushi-house-pituba`

## Resultado

🎉 **SUCESSO!** O `BusinessUrlService` agora funciona corretamente para todas as empresas de gastronomia.

## Arquivos Criados

1. `fix_gastronomy_locations.sql` - SQL manual para referência
2. `fix_gastronomy_remote.ts` - Script TypeScript executado com sucesso
3. Este documento de resumo

## Como Executar Novamente (se necessário)

```bash
npx tsx fix_gastronomy_remote.ts
```

O script é idempotente e pode ser executado múltiplas vezes sem problemas.
