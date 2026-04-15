# Arquitetura do Projeto

## Objetivo
Garantir separacao clara de responsabilidades com SSOT por dominio, fluxo previsivel de dados e baixo acoplamento entre modulos.

## Estrutura
```text
src/
├── app/            # Shell da aplicacao (layout, rotas, bootstrap)
├── shared/         # Primitivos reutilizaveis (UI, hooks, utils)
├── core/           # Capacidades transversais e contratos canonicos
├── modules/        # Dominios de produto (feature-first)
└── integrations/   # Adaptadores externos (Supabase, mapas, etc.)
```

## Regra de Fluxo
Para dados de negocio, o fluxo oficial deve ser:

```text
Database -> Service -> Hook -> Component
```

- `Service`: dono de regra de negocio e acesso a dados.
- `Hook`: estado, orquestracao de chamadas e cache de UI.
- `Component/Page`: apenas apresentacao e interacao.

## SSOT por Dominio
- Cada dominio deve ter um owner canonico para tabelas e regras.
- Adaptadores/facades sao permitidos apenas para compatibilidade de import.
- Nao manter implementacoes paralelas para o mesmo contrato.

## Fronteiras
- `core/*`: contratos, capacidades compartilhadas e servicos canonicos.
- `modules/*`: composicao de telas e casos de uso do dominio, consumindo servicos canonicos.
- `integrations/*`: detalhes de infraestrutura, nunca regra de negocio de dominio.

## Documentacao Relacionada
- [CURRENT_RULES.md](./CURRENT_RULES.md)
- [DATA_MODELING.md](./DATA_MODELING.md)
- [MIGRATIONS.md](./MIGRATIONS.md)
- [ARCHIVE_INDEX.md](./ARCHIVE_INDEX.md)
