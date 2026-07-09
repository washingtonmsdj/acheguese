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

## Community First
- A entidade central do produto hiperlocal e a Comunidade Local, apoiada pelo
  SSOT territorial.
- Empresas, gastronomia, servicos, eventos, classificados, profissionais,
  vagas e conteudos publicos continuam como entidades independentes.
- Comunidades vinculam, moderam e contextualizam essas entidades por contratos
  canonicos, sem copiar seus dados mestres.
- A decisao completa esta em
  [architecture/COMMUNITY_FIRST_ARCHITECTURE_SSOT.md](./architecture/COMMUNITY_FIRST_ARCHITECTURE_SSOT.md).

## Fronteiras
- `core/*`: contratos, capacidades compartilhadas e servicos canonicos.
- `modules/*`: composicao de telas e casos de uso do dominio, consumindo servicos canonicos.
- `integrations/*`: detalhes de infraestrutura, nunca regra de negocio de dominio.

## Taxonomia oficial
- `business`/`empresas` e o dominio base horizontal para entidades empresariais.
- `business` nao e vertical.
- Verticais empresariais oficiais sao somente as chaves declaradas no contrato `src/core/verticals/config.ts`.
- Estado atual do projeto: `gastronomy` e o unico vertical oficialmente formalizado.
- Modulo existente em `src/modules/*` nao equivale automaticamente a vertical oficial.

## Documentacao Relacionada
- [CURRENT_RULES.md](./CURRENT_RULES.md)
- [DATA_MODELING.md](./DATA_MODELING.md)
- [architecture/COMMUNITY_FIRST_ARCHITECTURE_SSOT.md](./architecture/COMMUNITY_FIRST_ARCHITECTURE_SSOT.md)
- [COMUNICACAO_TERRITORIAL_ARCHITECTURE.md](./COMUNICACAO_TERRITORIAL_ARCHITECTURE.md)
- [MIGRATIONS.md](./MIGRATIONS.md)
