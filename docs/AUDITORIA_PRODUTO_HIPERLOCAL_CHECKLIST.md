# Auditoria de Produto Hiperlocal: Checklist por Modulo e Pagina

Data: 2026-05-06
Projeto: Achegue-se

## Prompt/comando executado

```text
Atue como auditor senior de produto, arquitetura e growth para um super-app hiperlocal brasileiro. Analise o repositorio inteiro, modulo por modulo e pagina por pagina, comparando o produto com Nextdoor, BuddyBoss, Facebook Groups/Marketplace, Meetup/Eventbrite, OLX/Craigslist e plataformas locais de negocios/servicos. Nao copie cegamente recursos: recomende apenas o que faz sentido para um produto hiperlocal de bairro no Brasil. Entregue checklist priorizado por funcionalidade, gaps, riscos tecnicos, oportunidades de monetizacao, moderacao, confianca, seguranca, mobile, SEO, dados, operacao e crescimento. Marque P0/P1/P2/P3, diga o que existe, o que falta e o que deve ser feito.
```

Comandos locais usados:

```powershell
rg --files src
npm run validate:architecture:community
npm run validate:taxonomy
npm run typecheck
rg -n "mock|Mock|TODO|FIXME|deprecated|legacy|as any|confirm\(" src/core src/modules
```

Tambem consultei fontes atuais sobre Nextdoor, BuddyBoss, Facebook Marketplace e Eventbrite/Meetup para atualizar o benchmark de produto.

## Diagnostico curto

O Achegue-se ja esta mais proximo de um "Nextdoor transacional brasileiro" do que de uma comunidade generica tipo BuddyBoss. O diferencial correto nao e virar uma rede social ampla; e virar o sistema operacional do bairro: comunidade + negocios + servicos + classificados + mobilidade + alertas + mapa + reputacao.

O maior gap nao e quantidade de modulos. O maior gap e costura: identidade verificada, confianca, distribuicao social, moderacao, notificacoes, ranking local, funis de conversao e governanca de dados.

## Validacoes executadas

- P0 tecnico: `npm run typecheck` passou.
- P0 arquitetura: `npm run validate:architecture:community` falhou.
- P0 arquitetura: `src/core/community/services/LostFoundRuntimeService.ts` importa agregador legado `@/modules/community`.
- P0 arquitetura: `src/app/routes/prefetch.ts` importa `@/core/community/*` fora dos dominios permitidos.
- P0 taxonomia: `npm run validate:taxonomy` falhou.
- P0 taxonomia: `src/modules/ai` e `src/modules/central` estao fora do SSOT permitido.
- P0 taxonomia: pastas legadas ainda existem em `src/core/landing`, `src/core/supabase`, `src/core/classifieds`, `src/core/mobility`.
- P1 qualidade: ha muitos `as any`, mocks, caminhos legados e `confirm()` nativo em fluxos de producao.

## Norte de produto recomendado

Prioridade estrategica: nao copiar o Nextdoor inteiro. O Achegue-se deve pegar do Nextdoor o hiperlocal, a confianca, os alertas, recomendacoes e marketplace social. Deve evitar o feed barulhento e a dependencia de conteudo opinativo. Deve pegar do BuddyBoss grupos/perfis/mensagens, mas nao LMS/forum pesado como eixo principal. Deve pegar do Facebook Marketplace a liquidez local, mas nao a bagunca de baixa confianca. Deve pegar do Meetup/Eventbrite recorrencia, RSVP e descoberta de eventos, mas sem virar plataforma nacional de ingressos no curto prazo.

## Prioridades

- P0: bloqueia confianca, seguranca, arquitetura, operacao ou lancamento.
- P1: aumenta retencao, conversao ou qualidade central do produto.
- P2: melhora experiencia, monetizacao ou escala.
- P3: refinamento, crescimento, automacao ou nice-to-have.

## Checklist transversal

- [ ] P0: corrigir falhas de arquitetura/taxonomia apontadas pelos scripts.
- [ ] P0: definir SSOT definitivo para comunidade: remover duplicidade entre `src/core/community`, `src/modules/community` e modulos fatiados `community-*`.
- [ ] P0: trocar `window.confirm()` por dialogs do design system em delecoes e acoes destrutivas.
- [ ] P0: revisar mocks em paginas publicas/monetizaveis, principalmente educacao, empresas, comunidade e mobilidade.
- [ ] P0: criar matriz de permissoes por perfil: morador, comerciante, profissional, motorista, motoboy, admin, moderador local.
- [ ] P1: criar reputacao unificada por pessoa/negocio/anuncio/servico/entrega.
- [ ] P1: criar notificacoes transversais por evento: comentario, mensagem, pedido, alerta, problema apoiado, proposta, venda, avaliacao.
- [ ] P1: criar feed unificado "Meu Bairro" com ranking por relevancia local, nao so cronologico.
- [ ] P1: criar trilhas de onboarding por persona: morador, comercio, prestador, vendedor, motorista/motoboy.
- [ ] P1: criar instrumentacao de funil por modulo: visita, clique, contato, conversa, conversao, avaliacao.
- [ ] P2: criar sistema de digest diario/semanal por bairro.
- [ ] P2: criar PWA/mobile polish: push, instalacao, offline basico, deep links.
- [ ] P2: criar governanca de conteudo gerado por usuario: fila, SLA, reincidencia, appeal, audit log.
- [ ] P3: criar recomendacoes por IA com contexto do bairro, apos haver dados reais suficientes.

## Comunidade / Feed

- Ja existe: feed, posts, comentarios, curtidas, salvar, compartilhar, filtros, tags, modais, ranking, widgets, alertas e problemas integrados.
- [ ] P0: garantir que todo post tenha `location_id`, escopo territorial e politica de visibilidade.
- [ ] P0: finalizar comentarios no modal onde ainda ha TODO de envio.
- [ ] P1: feed "Tudo do bairro" com posts + alertas + problemas + eventos + classificados + recomendacoes + empresas ativas.
- [ ] P1: ranking de relevancia: proximidade, reputacao, urgencia, recencia, relacao com interesses e atividade do usuario.
- [ ] P1: tipos claros de publicacao: pergunta, indicacao, aviso, problema, evento, venda, servico, alerta.
- [ ] P1: edicao inline de comentario e historico de edicao real.
- [ ] P1: seguir post/topico/bairro/grupo e receber notificacao.
- [ ] P2: enquetes com votacao auditavel e anti-abuso.
- [ ] P2: controle anti-ruido: ocultar tema, silenciar pessoa, silenciar categoria.
- [ ] P3: resumos semanais "o que aconteceu no bairro".

## Marketplace social/local / Classificados

- Ja existe: classificados, detalhe, novo/editar, vendedor, chat, rota canonica, categorias, jobs dentro de classifieds.
- [ ] P0: transformar classificado em entidade social: comentarios publicos, perguntas, salvar, compartilhar no feed e report.
- [ ] P0: reputacao de comprador/vendedor e historico de transacoes.
- [ ] P0: status do anuncio: ativo, reservado, vendido, pausado, expirado, removido.
- [ ] P1: publicar no marketplace e opcionalmente distribuir no feed/grupos do bairro.
- [ ] P1: "vizinhos em comum", bairro verificado, tempo de comunidade e taxa de resposta no perfil do vendedor.
- [ ] P1: checkout leve de seguranca: local de encontro sugerido, alertas anti-golpe, nao expor telefone por padrao.
- [ ] P1: perguntas publicas no anuncio e chat privado para negociar.
- [ ] P1: algoritmo local primeiro: bairro, cidade, adjacencias, depois expansao.
- [ ] P1: denuncias especificas: golpe, item proibido, preco enganoso, duplicado, vendedor suspeito.
- [ ] P2: ofertas/contraofertas, reserva com prazo e "interessados".
- [ ] P2: categorias locais melhores: moveis, eletronicos, infantil, imoveis/quartos, doacao, emprestimo/troca.
- [ ] P2: cross-post em grupos relevantes sem duplicar anuncio.
- [ ] P2: boost pago local por bairro/categoria com limites anti-spam.
- [ ] P3: selo "vendido pelo Achegue-se" com avaliacao pos-negocio.

## Empresas

- Ja existe: landing, detalhe, cadastro/edicao, dashboard, analytics, planos, link premium, catalogo, cupons, promocoes, reivindicacao/admin.
- [ ] P0: consolidar rotas legadas `businesss`, `empresa/:id`, canonicas territoriais e premium.
- [ ] P0: garantir reivindicacao/verificacao de empresa antes de recursos sensiveis.
- [ ] P1: pagina de empresa com prova social do bairro: recomendacoes, vizinhos que favoritaram, posts recentes, cupons ativos.
- [ ] P1: botao unico de conversao: chamar, WhatsApp, rota, pedido, agendar, mensagem.
- [ ] P1: negocios devem poder publicar no feed do bairro com limite e rotulo comercial.
- [ ] P1: "Faves do bairro": ranking anual/mensal por categoria, inspirado em Nextdoor Faves.
- [ ] P2: painel de leads por origem: busca, mapa, feed, recomendacao, cupom, marketplace.
- [ ] P2: reputacao separada de dono, empresa e filial.
- [ ] P2: campanhas locais: raio, bairro, categoria, horario.
- [ ] P3: paginas premium com templates por vertical.

## Servicos / Profissionais

- Ja existe: listagem, detalhe, cadastro/edicao, reviews, area de atendimento, profissionais publicos.
- [ ] P0: verificar prestador com identidade, telefone e area de atendimento real.
- [ ] P1: fluxo "pedir orcamento" com contexto do bairro e categoria.
- [ ] P1: recomendacao da comunidade conectada ao perfil do profissional.
- [ ] P1: agenda/disponibilidade basica ou ao menos SLA de resposta.
- [ ] P1: avaliacoes pos-servico com prova de contratacao.
- [ ] P2: pacotes/precos de referencia e perguntas frequentes por categoria.
- [ ] P2: seguro/selo de confianca para categorias sensiveis.
- [ ] P3: matching automatico por problema: "preciso de eletricista hoje".

## Recomendacoes

- Ja existe: perguntas, respostas, detalhe, nova recomendacao e mencoes a negocios/profissionais.
- [ ] P0: vincular recomendacao a entidade real quando houver empresa/profissional cadastrado.
- [ ] P1: melhor resposta, resposta verificada, reputacao de quem recomendou.
- [ ] P1: transformar recomendacao em sinal de ranking para empresas/servicos.
- [ ] P1: busca "quem recomenda X no meu bairro?".
- [ ] P2: deduplicar perguntas repetidas por categoria/bairro.
- [ ] P2: resumo por IA apenas com fontes e links para respostas originais.

## Alertas / Seguranca

- Ja existe: alertas comunitarios com categorias, rate limit, deduplicacao territorial, expiracao, report, RLS/RPC documentado.
- [ ] P0: garantir que alertas usam centroide/territorio e nunca localizacao exata do morador.
- [ ] P0: revisar feature flag `VITE_FEATURE_COMMUNITY_ALERTS` e estado real de producao.
- [ ] P1: push notification por gravidade, bairro e raio.
- [ ] P1: confirmacao/encerramento por multiplos moradores com reputacao.
- [ ] P1: integracao futura com orgaos publicos/verificados sem abrir publicacao livre.
- [ ] P1: tela de moderacao de alertas com SLA e trilha de auditoria.
- [ ] P2: weather/emergency alerts oficiais quando houver fonte confiavel.
- [ ] P3: painel historico de seguranca por bairro com privacidade.

## Problemas urbanos / Zeladoria

- Ja existe: modulo `issues`, criar problema, apoiar, feed e servico.
- [ ] P0: status operacional: aberto, em analise, encaminhado, resolvido, rejeitado.
- [ ] P1: apoiar problema, seguir problema, comentar atualizacao e anexar foto.
- [ ] P1: agrupamento por tipo/local para evitar duplicatas.
- [ ] P1: painel publico do bairro: problemas mais apoiados e resolvidos.
- [ ] P2: exportar/encaminhar para prefeitura/orgaos quando houver canal.
- [ ] P2: reputacao civica para usuarios que reportam com qualidade.

## Grupos

- Ja existe: grupos, membros, chat de grupo, roles admin/moderador/membro, policies, mocks.
- [ ] P0: remover dependencia de grupos mock em experiencia real.
- [ ] P0: corrigir envio mock de imagem/audio no detalhe de grupo.
- [ ] P1: tipos de grupo: condominio/rua, compra e venda, pais, pets, seguranca, empreendedores, eventos.
- [ ] P1: regras por grupo, aprovacao de entrada, convites, denuncias e moderacao.
- [ ] P1: feed de grupo e chat de grupo devem ter escopos claros.
- [ ] P2: diretoria/moderadores locais com ferramentas de gestao.
- [ ] P3: grupos recomendados por bairro/interesse.

## Eventos

- Ja existe: listagem e detalhe em comunidade, runtime service e rotas territoriais.
- [ ] P1: RSVP/interesse/participar com lista social controlada por privacidade.
- [ ] P1: recorrencia, local, capacidade, lembretes e compartilhamento no feed.
- [ ] P1: organizador verificado para eventos comerciais/publicos.
- [ ] P2: eventos pagos ou reserva via parceiro, apenas quando o basico estiver solido.
- [ ] P2: calendario do bairro e digest de fim de semana.

## Achados e perdidos

- Ja existe: paginas de lista, novo e detalhe; servico runtime; mapa mini.
- [ ] P0: privacidade de contato: nao expor telefone diretamente; usar chat/proxy.
- [ ] P1: fluxo de resolucao: encontrado, devolvido, encerrado.
- [ ] P1: correspondencia automatica entre perdido/encontrado por tipo, data, bairro e descricao.
- [ ] P2: alertas no feed/grupos de pets/condominio.
- [ ] P3: cartaz compartilhavel/QR.

## Gastronomia / Delivery

- Ja existe: landing, detalhe, premium, favoritos, setup, dashboard, cardapio, horarios, area de entrega, pedidos, entregas, analytics, promocoes.
- [ ] P0: substituir `confirm()` nativo em delecoes de cardapio, area e excecoes.
- [ ] P0: validar fluxo completo pedido -> pagamento/contexto -> entrega -> prova -> avaliacao.
- [ ] P1: integrar restaurantes ao feed local com promocao/novidade limitada.
- [ ] P1: "favoritos do bairro" e recomendacoes de vizinhos por categoria.
- [ ] P1: taxa/area de entrega baseada em territorio e motoboy local.
- [ ] P2: cupons segmentados por bairro/horario.
- [ ] P2: reputacao separada de comida, entrega e atendimento.
- [ ] P3: combos e recorrencia para marmitas/almoco.

## Mobilidade / Motoboy

- Ja existe: passageiro, motorista, motoboy, historico, tracking, emergency contacts, central, disponibilidade, corridas, entregas, ganhos, moderacao/admin.
- [ ] P0: resolver TODOs de notificacao realtime/push em corridas e entregas.
- [ ] P0: revisar permissoes e verificacao operacional antes de aceitar corrida/entrega.
- [ ] P0: reduzir uso de `as any` em adaptadores e servicos canonicos.
- [ ] P1: matching local por bairro, reputacao, disponibilidade, distancia e capacidade.
- [ ] P1: SOS/compartilhar rota integrado ao core safety.
- [ ] P1: precificacao transparente e comprovante.
- [ ] P1: disputas, cancelamentos e SLA para motorista/motoboy.
- [ ] P2: ranking de motoristas/motoboys do bairro.
- [ ] P2: integrar delivery de gastronomia com motoboys locais.

## Vagas

- Ja existe: publicar, listagem publica, detalhe, permissao de publicacao; candidatura ainda TODO.
- [ ] P0: implementar candidaturas ou deixar claro que o CTA e externo/WhatsApp.
- [ ] P1: perfil do candidato com privacidade e curriculo local.
- [ ] P1: empresas verificadas para publicar vagas.
- [ ] P1: vagas no feed do bairro com limites anti-spam.
- [ ] P2: matching por localizacao, disponibilidade, experiencia e categoria.
- [ ] P2: status da vaga e encerramento automatico.

## Educacao

- Ja existe: explorer, detail, dashboard, setup, leads, events, programs, analytics, plans e nichos.
- [ ] P0: substituir dados mockados de explorer/detail por dados reais ou marcar ambiente demo explicitamente.
- [ ] P0: `confirm()` nativo em delecao de programas/eventos.
- [ ] P1: funil de lead completo: origem, contato, status, conversao.
- [ ] P1: escolas/cursos como empresas verticais com recomendacoes do bairro.
- [ ] P2: eventos educacionais com RSVP e campanha local.
- [ ] P2: analytics real; hoje ha TODOs para performance/error rate e integracoes.

## Mapa / Perto de mim

- Ja existe: MapLibre, camadas, roteamento, alertas/entidades, perto de mim, geocoding.
- [ ] P0: confirmar que nenhuma camada expoe localizacao sensivel de usuario.
- [ ] P1: mapa unificado com filtros: empresas, servicos, classificados, eventos, alertas, problemas, turismo.
- [ ] P1: "abrir rota" consistente em empresas, gastronomia, turismo e eventos.
- [ ] P2: clustering, cache por territorio e fallback offline.
- [ ] P2: admin de camadas e qualidade de geocoding.

## Guia / Turismo

- Ja existe: pontos turisticos, detalhe, admin, rotas territoriais.
- [ ] P1: integrar turismo ao contexto local: eventos proximos, gastronomia perto, rota e favoritos.
- [ ] P1: SEO por cidade/bairro/ponto.
- [ ] P2: roteiros locais e colecoes.
- [ ] P3: conteudo editorial/UGC com moderacao.

## Busca / IA

- Ja existe: busca, AI search, parser de intents, handlers para negocios/servicos, provider OpenAI/mock.
- [ ] P0: evitar chat generico para intents nao suportados em contexto transacional.
- [ ] P1: busca global com resultados por modulo e territorio.
- [ ] P1: ranking local: "perto, confiavel, aberto agora, recomendado".
- [ ] P1: IA deve citar entidades reais e abrir a pagina correta.
- [ ] P2: perguntas de bairro com resumo baseado em posts/recomendacoes.
- [ ] P3: assistente para publicar anuncio/post com validacoes.

## Mensagens / Chat

- Ja existe: conversations/messages, chat de classificado, inbox, realtime subscription e report.
- [ ] P0: unificar mensagens de classificados, grupos, mobilidade, empresas e servicos em uma inbox clara.
- [ ] P0: bloquear spam, links suspeitos e abuso.
- [ ] P1: contexto da conversa fixo: anuncio, pedido, servico, corrida, grupo.
- [ ] P1: status de leitura, anexos, respostas rapidas e templates.
- [ ] P2: escalacao para disputa/suporte.
- [ ] P3: digest de conversas pendentes.

## Perfil / Identidade / Familia

- Ja existe: perfil hub, configuracoes, identidades, familia, verificacao de residencia, dados por persona, historico, reputacao/gamificacao.
- [ ] P0: identidade canonica unica: usuario pode ter personas, mas reputacao/risco precisam de raiz comum.
- [ ] P0: verificacao de bairro/endereco sem expor endereco completo.
- [ ] P1: perfil publico com privacidade granular.
- [ ] P1: central de reputacao: morador, comprador, vendedor, prestador, motorista, negocio.
- [ ] P1: onboarding de confianca: telefone, email, bairro, documento quando necessario.
- [ ] P2: familia/domicilio para permissao de comunidade/alertas.
- [ ] P3: portabilidade de dados LGPD na UI.

## Admin / Moderacao / Operacao

- Ja existe: muitos servicos admin, dashboards, identidade, motoristas, empresas, planos, alertas, issues, mensagens, mapa, roles.
- [ ] P0: consolidar paginas admin importadas mas possivelmente ausentes/legadas.
- [ ] P0: fila unica de moderacao: posts, comentarios, mensagens, anuncios, alertas, problemas, negocios, profissionais.
- [ ] P0: audit log para acoes administrativas sensiveis.
- [ ] P1: painel operacional por bairro: usuarios ativos, posts, alertas, vendas, problemas, negocios.
- [ ] P1: SLAs e estados de revisao.
- [ ] P1: ferramentas anti-fraude para marketplace/mobilidade.
- [ ] P2: playbooks de moderacao por categoria.
- [ ] P3: score de saude do bairro.

## Billing / Monetizacao

- Ja existe: billing, planos, entitlements, pricing, checkout, assinatura, planos de empresa/gastronomia/educacao, ads/promocoes.
- [ ] P0: uma matriz de entitlement unica para todos os modulos monetizados.
- [ ] P1: monetizacao recomendada: planos para empresas/prestadores, boosts locais, cupons, paginas premium, leads qualificados.
- [ ] P1: nao monetizar alertas, problemas civicos ou recursos essenciais de seguranca.
- [ ] P2: marketplace boost com limite por bairro e categoria.
- [ ] P2: relatorio de ROI local para comerciantes.
- [ ] P3: patrocinio de bairro/agenda/eventos com rotulo claro.

## Notificacoes

- Ja existe: paginas, preferencias, email logs, centro de notificacoes, Firebase dependency.
- [ ] P0: definir matriz de notificacao por evento e canal.
- [ ] P1: push para alertas, mensagens, corrida/entrega, comentario seguido, interessado em classificado.
- [ ] P1: preferencias por modulo, bairro e gravidade.
- [ ] P2: digest do bairro.
- [ ] P2: quiet hours e anti-spam.

## SEO / Rotas / Descoberta

- Ja existe: rotas canonicas territoriais, SEO components, sitemap util, redirects legados.
- [ ] P0: eliminar rota com typo `businesss` ou manter redirect canonico controlado.
- [ ] P0: sitemap dinamico ainda tem TODO para URLs do banco.
- [ ] P1: canonicals por empresas, servicos, gastronomia, classificados, educacao, turismo.
- [ ] P1: schema.org para LocalBusiness, Product/Offer, Event, JobPosting, Place, FAQ.
- [ ] P2: paginas territoriais com conteudo real, nao apenas listagem vazia.

## Performance / Qualidade tecnica

- [ ] P0: reduzir `as any` em fronteiras Supabase mais criticas.
- [ ] P0: remover mocks de producao em fluxos publicos.
- [ ] P1: testes e2e para jornada central: cadastro -> bairro -> feed -> classificado -> chat -> avaliacao.
- [ ] P1: testes e2e para empresa -> cadastro -> dashboard -> cupom/promocao -> analytics.
- [ ] P1: testes e2e para gastronomia -> cardapio -> pedido -> entrega.
- [ ] P1: testes e2e para alerta/problema com moderacao.
- [ ] P2: bundle/performance budget por rota lazy.
- [ ] P2: monitoramento Sentry/analytics por modulo.

## Roadmap recomendado

### 0-2 semanas: estabilizacao

- Corrigir validacoes de arquitetura/taxonomia.
- Remover mocks visiveis em fluxos reais ou proteger como demo.
- Definir entidade de reputacao unificada.
- Desenhar matriz de notificacoes e permissoes.
- Substituir `confirm()` nativo nos fluxos de negocio.

### 3-6 semanas: marketplace social local MVP

- Socializar classificado: feed, comentarios, perguntas, salvar, report.
- Perfil do vendedor com bairro verificado, reputacao e taxa de resposta.
- Status do anuncio e avaliacao pos-negocio.
- Chat com contexto e protecoes anti-golpe.
- Distribuicao no feed/grupos com limite anti-spam.

### 7-12 semanas: bairro como produto

- Feed unificado do bairro com ranking.
- Faves/recomendados do bairro para empresas/servicos.
- Push/digest.
- Painel admin por bairro.
- Busca global territorial com ranking local.

### Depois: escala

- Automacao de moderacao.
- Campanhas locais e boosts.
- IA com contexto do bairro e citacoes.
- App/PWA mais forte.
- Integracoes externas com orgaos publicos/parceiros.

## Pente fino adicional: mobilidade, profissionais, gastronomia e docs

Data: 2026-05-06

Foram criados anexos de auditoria para responder ponto a ponto se as telas e modulos estao completos, sincronizados e profissionais:

- `docs/ACAO_EXECUTAVEL_AUDITORIA_HIPERLOCAL.md`
- `docs/audits/AUDITORIA_MODULO_MOBILIDADE.md`
- `docs/audits/AUDITORIA_MODULO_PROFISSIONAIS.md`
- `docs/audits/AUDITORIA_MODULO_GASTRONOMIA_NICHOS.md`
- `docs/audits/AUDITORIA_DOCS_OBSOLETOS.md`

### Vereditos objetivos

- Mobilidade: existe produto forte, mas ainda nao esta fechado para producao operacional. Passageiro, motorista e motoboy existem, porem tracking, realtime/push, cancelamento auditavel, rotas canonicas e integracao delivery ainda precisam fechamento.
- Tela do passageiro: avancada, mas precisa separar corrida de entrega e validar E2E de criar, acompanhar, cancelar, concluir, avaliar e acionar emergencia.
- Tela do motorista: robusta em `MotoristaPageV2`, mas ainda tem `toggleTracking` como `noop`, TODOs de realtime/push e rota Central/Perfil desincronizada.
- Tela do motoboy: existe, mas precisa integracao real com gastronomia/pedido/entrega, enderecos completos, comprovantes, incidentes e Central apontando para rotas canonicas.
- Central Motorista/Motoboy: visualmente existe, mas os atalhos ainda navegam para caminhos de perfil/mobilidade, contrariando a ideia de Central como cockpit operacional.
- Profissionais/servicos: cadastro, edicao e paginas publicas existem, mas a Central Profissional ainda e placeholder. Falta lead, orcamento, agenda, reputacao operacional e notificacoes.
- Gastronomia: modulo rico, mas nao fechado. Pizza e o nicho mais avancado; sushi, acai, pastel, churrascaria e bares estao em nivel beta/complexo; nichos basicos funcionam mais como classificacao/preset.
- Gastronomia + motoboy: precisa ser tratado como fluxo unico de operacao: pedido aceito -> preparo -> despacho -> motoboy -> entrega -> avaliacao.
- Docs: ha documentos que parecem afirmar completude total, mas conflitam com TODOs, legados, `confirm()`, `as any` e validacoes falhando. Documentos historicos precisam ser marcados ou arquivados.

### Modulos incompletos ou com risco alto

- [ ] P0: Central Profissional, por ainda ser placeholder.
- [ ] P0: sincronizacao Central/Perfil/Mobilidade para motorista e motoboy.
- [ ] P0: tracking real e historico de localizacao em mobilidade.
- [ ] P0: realtime/push operacional em corridas e entregas.
- [ ] P0: fluxo delivery integrado entre gastronomia e motoboy.
- [ ] P0: governanca de docs vivos versus docs historicos/obsoletos.
- [ ] P1: maturidade dos nichos gastronomicos beta.
- [ ] P1: agenda, orcamento e reputacao de profissionais.
- [ ] P1: substituicao de `confirm()` nativo em acoes destrutivas.
- [ ] P1: reducao de casts `as any` em fronteiras operacionais criticas.

### Ordem recomendada de execucao

1. Corrigir rotas canonicas e sincronizacao da Central.
2. Fechar tracking, realtime/push e auditoria de cancelamento da mobilidade.
3. Integrar gastronomia com motoboy em um fluxo E2E.
4. Substituir placeholder da Central Profissional por cockpit minimo de leads/orcamentos.
5. Limpar docs obsoletos e criar `docs/STATUS_ATUAL.md`.
6. Depois disso, evoluir nichos, marketplace social e monetizacao.

## Decisao principal

O melhor para o projeto e priorizar marketplace social/local e confianca hiperlocal antes de adicionar novos modulos. O produto ja tem muitos blocos; agora precisa transformar blocos em rede: cada anuncio, empresa, servico, alerta, evento e recomendacao deve nascer dentro do bairro, carregar reputacao e circular no feed certo.
