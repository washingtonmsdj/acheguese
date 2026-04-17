# 📦 Migrations Arquivadas

> **ATENÇÃO**: Este diretório contém migrations **ARQUIVADAS**.
>
> As migrations aqui são mantidas para histórico e referência.
> As migrations ativas estão em `supabase/migrations/`.
>
> Ver `supabase/MIGRATIONS_ARCHIVE_GUIDE.md` para política de arquivamento.

---

## Geographic Foundation Migrations (Março 2026)

Migrations da fundação geográfica do sistema.

## Ordem de Execução

1. `20260324000001_create_locations_table.sql` - Tabela locations + função update_updated_at
2. `20260324000002_create_locations_triggers.sql` - Triggers de validação e path automático
3. `20260324000003_create_service_areas_table.sql` - Tabela service_areas
4. `20260324000004_create_module_rollouts_table.sql` - Tabela module_rollouts
5. `20260324000005_seed_initial_locations.sql` - Seeds iniciais (Brasil > Bahia > Salvador > 8 bairros)

## Estrutura Criada

### locations
- Hierarquia geográfica: country → state → city → district
- Path canônico: `/br/ba/salvador/pituba`
- Slug scoped por parent (índices únicos parciais)
- Coordenadas canônicas opcionais
- Triggers: validação hierarquia, prevenção ciclos, path automático

### service_areas
- Ownership: entity_type + entity_id
- Coverage types: district, city, radius
- Radius: 1-100 km (validado)
- Primary única por entidade (índice único parcial)

### module_rollouts
- Módulos: community, business, services, mobility, classifieds, ads
- Rollout único por module_key + location_id
- Config JSONB flexível
- Auditoria: created_by, updated_by

## Seeds Iniciais

```
/br                                          (Brasil)
/br/ba                                       (Bahia)
/br/ba/salvador                              (Salvador)
/br/ba/salvador/amaralina                    (Amaralina)
/br/ba/salvador/chapada-do-rio-vermelho      (Chapada do Rio Vermelho)
/br/ba/salvador/itaigara                     (Itaigara)
/br/ba/salvador/nordeste-de-amaralina        (Nordeste de Amaralina)
/br/ba/salvador/pituba                       (Pituba)
/br/ba/salvador/rio-vermelho                 (Rio Vermelho)
/br/ba/salvador/santa-cruz                   (Santa Cruz)
/br/ba/salvador/vale-das-pedrinhas           (Vale das Pedrinhas)
```

## Correções Aplicadas

1. **Slug único scoped**: Índices únicos parciais separados para parent_id NULL e NOT NULL
2. **Primary coverage única**: Índice único parcial `WHERE is_primary = true`
3. **Path automático**: Trigger como único ponto de verdade (não duplicado)
4. **Função update_updated_at**: Criada na primeira migration

## Próximos Passos

- Etapa 5: Implementação de services
- Etapa 6: Integração com módulos de domínio
- RLS policies (futuro)
- Migração de dados legados (futuro)
