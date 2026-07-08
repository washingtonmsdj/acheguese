# Evolucao De Nichos Gastronomicos

Este guia cobre apenas a camada de dominio que permanece no runtime: registry, presets, servicos de configuracao e versionamento. UI generica de nichos foi removida ate existir consumidor real.

## Principios

- Nichos nao devem duplicar carrinho, checkout, pedidos ou entrega.
- Pedidos precisam salvar snapshot suficiente para continuar legiveis apos mudancas no catalogo.
- Telas administrativas devem depender de capabilities, nao de strings espalhadas por componente.
- Novas capabilities entram como opt-in e nao devem quebrar empresas existentes.

## Campos De Perfil

- `primary_niche_key`: chave do nicho.
- `niche_config_version`: versao da configuracao.
- `support_level`: nivel de suporte (`full_enabled`, `basic_enabled`, `beta_enabled`).
- `operational_mode`: modo operacional.
- `enabled_capabilities`: capabilities ativas.
- `missing_capabilities`: capabilities disponiveis, mas nao configuradas.
- `needs_niche_upgrade`: sinaliza upgrade pendente.

## Servicos Mantidos

- `NicheConfigService`: leitura de configuracao, capabilities e informacoes de dashboard.
- `NicheVersioningService`: upgrade e evolucao de capabilities.
- `AdminSectionVisibilityService`: decisao de visibilidade por capability.

## Regras Para Novos Nichos

1. Criar preset em `niches/presets`.
2. Registrar no `registry.ts`.
3. Adicionar tipos/capabilities em `types.ts`.
4. Integrar UI somente quando houver consumidor real em pagina/componente.
5. Adicionar testes de dominio e, se houver UI, E2E do fluxo comprador/lojista.
