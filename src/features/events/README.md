# Eventos

Modulo publico e operacional de eventos.

## Escopo

- Listagem, calendario, mapa e favoritos de eventos.
- Detalhe publico do evento.
- Dashboard, formulario, analytics, ingressos e check-in do organizador.
- Componentes compartilhados para cards, hero, agenda, descricao, tickets e CTA.

## Padrao

- Rotas publicas canonicas usam `/eventos/:state/:city`.
- Detalhes usam o sufixo estatico `/evento/:eventId` para nao colidir com bairro ou grupo territorial.
- Links devem ser gerados por `eventPublicRoutes` e pelos hooks centrais de URLs territoriais.
- Componentes nao devem carregar nomes de versao.
- Documentacao de migracao antiga nao deve ficar junto do codigo do modulo.
