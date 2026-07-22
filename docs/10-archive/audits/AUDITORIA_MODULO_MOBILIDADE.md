# Auditoria do Modulo Mobilidade

Data: 2026-05-06
Escopo: passageiro, motorista, motoboy, central, tracking, seguranca, ofertas, entregas, planos e sincronizacao de rotas.

## Prompt profissional executado

```text
Atue como auditor senior de produto, arquitetura, operacao e UX mobile para um modulo de mobilidade hiperlocal brasileiro. Audite passageiro, motorista e motoboy ponta a ponta. Verifique se as telas estao completas, se os fluxos estao sincronizados entre Central, Perfil e Mobilidade, se existe duplicidade de rota, se tracking, ofertas, aceite, cancelamento, ganhos, planos, entregas, emergencia, reputacao, notificacoes e historico estao prontos para producao. Classifique tudo por P0/P1/P2/P3, indique evidencias no codigo e gere definicao objetiva de pronto.
```

## Veredito

O modulo de mobilidade e grande e tem base real de produto, mas ainda nao deve ser considerado completo/profissional sem fechamento operacional. Passageiro, motorista e motoboy existem, porem ha tres problemas centrais:

- P0: rotas e hubs estao desincronizados entre `Central`, `Perfil` e `Mobilidade`.
- P0: tracking/operacao em tempo real ainda tem pontos nao implementados ou `noop`.
- P1: motoboy e motorista compartilham partes do fluxo, mas a experiencia final ainda nao esta suficientemente separada por necessidade operacional.

## Passageiro

Estado atual: existe uma tela forte em `src/modules/mobility/pages/PassageiroPage.tsx`, com viagem ativa, historico, seguranca, criacao de corrida, avaliacao, cancelamento, confirmacao de conclusao, tracking map e botao de emergencia.

Checklist:

- [ ] P0: validar ponta a ponta criar corrida, buscar motorista, aceitar oferta, acompanhar, concluir, avaliar e reabrir historico.
- [ ] P0: separar claramente corrida e entrega. A acao rapida de entrega abre o mesmo modal de corrida e o proprio codigo indica que o tipo delivery ainda deveria ser predefinido.
- [ ] P0: garantir que todos os estados ativos sejam canonicos; hoje ha casts como `r.status as any`.
- [ ] P1: trocar dependencia visual/nomeada de componente de motorista em fluxo de passageiro, como dialog de cancelamento vindo de area de driver.
- [ ] P1: confirmar que emergencia usa contatos reais, localizacao atual e trilha auditavel.
- [ ] P1: confirmar que cancelamento captura motivo, taxa, janela de cancelamento e notificacao ao motorista.
- [ ] P2: melhorar resumo pos-corrida com recibo, avaliacao, reportar problema e chamar novamente.

Definicao de pronto:

- Passageiro consegue solicitar corrida ou entrega sem ambiguidade.
- Status visual bate com status persistido.
- Cancelamento, emergencia, avaliacao e historico funcionam em mobile sem depender de reload.
- Notificacoes chegam para passageiro e motorista/motoboy no momento correto.

## Motorista

Estado atual: existe `src/modules/mobility/pages/MotoristaPageV2.tsx` com dashboard robusto: corridas, ganhos, planos, alertas, configuracoes, cards de oferta, corridas ativas, dialogos de completar/cancelar/avaliar e notificacoes.

Gaps:

- [ ] P0: resolver `toggleTracking: () => undefined` em `src/modules/mobility/hooks/useDriverDashboardBase.ts`. Se o motorista ve controle de tracking, ele precisa alterar estado real.
- [ ] P0: concluir tracking operacional. `src/core/tracking/services/TrackingService.ts` ainda indica historico nao implementado.
- [ ] P0: concluir notificacoes realtime/push em `src/modules/mobility/core/RideOperationalService.ts`.
- [ ] P0: revisar cancelamento para preservar motivo, regras e auditoria. O hook chama cancelamento com o id da corrida, mas a interface operacional precisa de motivo e impacto.
- [ ] P1: diferenciar melhor motorista de passageiro, entrega e admin no nivel de permissao e UX.
- [ ] P1: padronizar ganhos: receita bruta, taxa da plataforma, liquido, periodo, saque e contestacao.
- [ ] P1: adicionar checklist de compliance do motorista: documentos, veiculo, area, disponibilidade, aceite de termos e treinamento.
- [ ] P2: ranking operacional por bairro: tempo de resposta, cancelamento, avaliacao, recorrencia e confiabilidade.

Definicao de pronto:

- Motorista entra/sai de disponibilidade e tracking de forma real.
- Recebe ofertas em tempo real.
- Aceita, inicia, conclui e cancela com auditoria.
- Ve ganhos e historico consistentes.
- Central, perfil e dashboard apontam para a mesma fonte de verdade.

## Motoboy

Estado atual: existe `src/modules/mobility/pages/MotoboyPage.tsx`, com entregas ativas, entregas disponiveis, ganhos, planos, alertas, configuracoes, acoes de entrega e cards de oferta.

Gaps:

- [ ] P0: corrigir sincronizacao da Central Motoboy. `src/modules/central/pages/CentralMotoboyPage.tsx` exibe central, mas os atalhos navegam para caminhos de perfil/mobilidade.
- [ ] P0: validar criacao de entregas com endereco completo. `src/modules/mobility/MOTOBOY.md` ainda cita `AddressSelector` como placeholder no modal de entrega.
- [ ] P0: remover fallbacks legados em autorizacao/fonte de motoboy quando o modelo canonico estiver pronto.
- [ ] P1: separar UX de entrega de UX de corrida: coleta, retirada, comprovante, foto, PIN, tentativa, prioridade, peso/volume, pagamento e contato do estabelecimento.
- [ ] P1: integrar gastronomia com motoboy: pedido aceito pelo restaurante deve gerar fluxo operacional de entrega com status e SLA.
- [ ] P1: criar tela de incidentes de entrega: cliente ausente, endereco errado, restaurante atrasado, item danificado, pagamento divergente.
- [ ] P2: criar lote/rota otimizada para multiplas entregas quando houver densidade.

Definicao de pronto:

- Motoboy tem onboarding proprio.
- Central Motoboy, pagina Motoboy e identidade de motorista usam o mesmo estado.
- Entrega tem status proprio, comprovante e SLA.
- Restaurante, cliente e motoboy enxergam a mesma linha do tempo.

## Central, Perfil e Rotas

Problema principal: existem rotas de Central e rotas antigas/de perfil para motorista/motoboy. A navegacao central ja tem configuracao para `/central/motorista/*` e `/central/motoboy/*`, mas as paginas hub usam atalhos para `appUrls.profile.mobilidade.*`.

Checklist:

- [ ] P0: decidir fonte canonica: Central deve ser o cockpit operacional; Perfil deve ser identidade/configuracao; Mobilidade publica deve ser aquisicao/landing.
- [ ] P0: corrigir `CentralMotoristaPage` para apontar para rotas canonicas da Central.
- [ ] P0: corrigir `CentralMotoboyPage` para apontar para rotas canonicas da Central.
- [ ] P1: criar redirecionamentos seguros para rotas antigas.
- [ ] P1: registrar eventos de navegacao para detectar usuarios caindo em fluxo legado.

## Arquitetura e Codigo

Evidencias encontradas:

- `src/core/mobility/services/mobility.mutations.ts`: `updateDriverLocation` marcado como nao implementado.
- `src/modules/mobility/services/mobility.mutations.ts`: atualizacao de localizacao direta marcada como implementacao futura.
- `src/core/tracking/services/TrackingService.ts`: historico de tracking ainda nao implementado.
- `src/modules/mobility/core/RideOperationalService.ts`: TODO para realtime/push notifications.
- `src/modules/mobility/hooks/useDriverDashboardBase.ts`: `toggleTracking` esta como `noop`.
- `src/modules/mobility/services/OperationalVerificationService.ts`: verificacao operacional depende de tabela futura.
- `src/modules/mobility/components/NeighborRankingPanel.tsx`: ranking ainda pede hook real de Supabase.
- `src/modules/mobility/services/MobilityOfferService.ts`: TODOs em tentativa, prioridade e extracao inteligente de bairro.

## Prioridade Final

- P0: sincronizar rotas Central/Perfil/Mobilidade.
- P0: fechar tracking real e push/realtime operacional.
- P0: validar fluxo E2E passageiro, motorista e motoboy.
- P1: separar entrega de corrida como produto proprio.
- P1: integrar gastronomia -> pedido -> motoboy -> cliente.
- P2: otimizar ranking, ganhos e operacao multi-entrega.
