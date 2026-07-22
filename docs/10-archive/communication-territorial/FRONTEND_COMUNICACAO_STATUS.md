# Frontend de Comunicacao Territorial - Status

Status atualizado em 2026-05-15.

## Estado Atual

O frontend base do MVP existe e esta funcional para:

- descoberta publica inicial;
- hubs por cidade e territorio;
- pagina publica do canal;
- solicitacao de canal;
- central de publicacao;
- admin de aprovacao e territorios.

Ainda nao esta completa a experiencia final de produto, porque falta a distribuicao das publicacoes dos canais para a comunidade territorial.

## Paginas Implementadas

Publicas:

- `/comunicacao`
- `/comunicacao/solicitar`
- `/comunicacao/:state/:city`
- `/comunicacao/:state/:city/:channelSlug`

Operacionais:

- `/central/comunicacao`
- `/admin/comunicacao`

Componentes:

- `ChannelCard`
- `PublicationCard`
- `CommunicationPageShell`

## Ajuste de Produto Necessario

`/comunicacao` deve parecer um ecossistema territorial de comunicacao, nao um diretorio comum.

Proxima experiencia esperada:

- listagem de canais/agentes por territorio;
- publicacoes recentes com origem clara;
- filtros por tipo de canal e tipo de conteudo;
- destaque para canais verificados;
- link para comunidade relacionada;
- aba `Comunicacao` dentro da comunidade.

## Aba Comunicacao na Comunidade

A comunidade deve consumir publicacoes distribuidas, nao duplicar dados.

Comportamento:

- `article`: abre canonical em `/comunicacao/...`;
- `update`: expande ou abre detalhe leve dentro da comunidade;
- ambos mostram canal, selo/verificacao, tipo, territorio e data.

## Pendencias Frontend

- [ ] Adicionar seletor `content_format` na `/central/comunicacao`.
- [ ] Criar card comunitario para publicacao de comunicacao.
- [ ] Criar aba `Comunicacao` na experiencia territorial de `/comunidade`.
- [ ] Implementar filtros por `publication_type`.
- [ ] Implementar comportamento de clique por `content_format`.
- [ ] Melhorar `/comunicacao` com conteudo real, nao apenas texto institucional.
- [ ] Tornar `ChannelCard` clicavel para a rota canonica resolvida.
- [ ] Exibir destino/contexto de distribuicao quando aplicavel.

## Validacao

Comandos relevantes:

```bash
npm run validate:architecture:communication
npm run test:e2e:communication-territorial
```

O E2E atual cobre estabilidade das rotas existentes. A proxima fase precisa adicionar E2E da aba `Comunicacao` na comunidade.
