# Agenda e eventos da comunidade
Página 33, conceito de 17/09/2026. Pranchas geradas via image_gen integrado. Aplicação não alterada.

## Entregáveis
- [Mobile: agenda, detalhe, confirmação e participação](pranchas/103-agenda-eventos-mobile.png).
- [Desktop e estados](pranchas/102-agenda-eventos-desktop.png).
- [Prompts](PROMPTS.md).
- [Revisão](REVISAO.md).

## Base conferida
src/modules/community-events/pages/EventsListPage.tsx e EventsListPage.model.ts: filtros por categoria/data/tipo/preço/busca e ordenação.
EventsCalendarPage.tsx, EventsMapPage.tsx e EventsFavoritesPage.tsx: superfícies existentes, identificadas no inventário; não auditadas integralmente.
EventDetailPage.tsx integra hero, ingressos/inscrições, descrição, programação, galeria, FAQ, relacionados, avaliações, compartilhamento, favoritos e check-in, além de consulta de participação por perfil. A existência de componentes não certifica todas as operações.
Owners EventRuntimeService, EventReadService, EventMutationService e EventEngagementService devem ser preservados. Formulário, painel e analytics do organizador existem como páginas próprias; não duplicar administração no fluxo do participante.

## Descoberta
Lista/calendário/mapa representam os mesmos eventos e filtros. Buscar título, filtrar categoria, data, formato, preço e bairro conforme contratos; normalizar datas no fuso do evento. O filtro atual é aplicado em memória: conferir abrangência, paginação e totais antes de mostrar resultados como exaustivos.
Mapa é opcional; eventos online não recebem coordenadas fictícias. Resultados sem localização podem permanecer na lista com orientação. Favorito é diferente de inscrição ou interesse. A aba Participações proposta precisa de consulta por identidade, não derivação de favoritos.
MVP no Complexo, com bairros internos. Não exibir regiões ainda não lançadas como disponíveis.

## Detalhe
Título, imagem autorizada, organizador identificado, período com fuso quando relevante, formato, local, descrição, programação, acessibilidade informada, orientações, galeria, FAQ e relacionados. Avaliações pós-evento dependem da elegibilidade e dados reais; não atribuir nota a evento sem avaliações.
Separar dados informados pelo organizador de verificações independentes. Não declarar acessibilidade física sem evidência; quando não informada, dizer isso e oferecer contato apropriado.
Endereço e link online respeitam a audiência e regras do evento. Não revelar endereço privado ou link restrito para visitante sem permissão. Como chegar abre destino real com segurança. Compartilhar não amplia acesso.
Requisitos etários, capacidade e políticas devem vir do evento. Não inventar valores, desconto, contagem de vagas ou organizador oficial.

## Participação
Três cenários distintos: entrada livre sem inscrição; inscrição necessária gratuita; ingresso pago ou direcionamento externo conforme contrato real. Prancha usa inscrição gratuita de uma pessoa.
Antes de confirmar, mostrar perfil, evento, data e condições aplicáveis. Autorização de participar em evento não deve ser automaticamente igual à de publicar na comunidade: verificar audiência/restrições específicas.
Confirmação só após servidor persistir participação. Validar capacidade e duplicidade atomicamente; erro de rede com resultado incerto pede reconciliação antes de reenviar. Cancelamento pede confirmação e atualiza vaga quando previsto.
Adicionar à agenda é proposta de exportação/integração a validar; não equivale a receber notificação. Alterações de data/local precisam aparecer no detalhe e na participação; comunicação automática exige integração.
Participações por perfil não devem vazar ao alternar identidade. Grupo organizador e perfil participante têm permissões distintas.

## Ingressos, check-in e etapas futuras
Não implementar cobrança apenas porque existe componente de tickets. Conferir pagamento, confirmação, preço, estoque e provedor. Link externo precisa indicar saída e destino validado. Não prometer reembolso automático em cancelamento.

No handler consultado, selecionar um ticket chama joinEvent(event.id, activeProfile.id), sem transmitir ticketId nessa chamada, e a mensagem de sucesso varia conforme gratuidade. Portanto, a interface atual não comprova reserva por lote/tipo nem processamento financeiro. Auditar e completar o contrato antes de apresentar compra ou estoque específico como garantido.
Check-in é diferente de inscrição; usa autorização e prova validadas no servidor, com prevenção de repetição. QR/credencial somente quando houver contrato seguro; a prancha não inventa código utilizável.
Lista de espera é melhoria proposta: requer posição/política de convocação, capacidade e prazo; esconder ação quando desativada. Transferência de ingresso e inscrições múltiplas não são presumidas.
Avaliação, denúncia e contato com organizador precisam de fluxos próprios já existentes ou integração explícita.

## Estados
Carregando, vazio, sem resultados, erro, evento indisponível, cancelado, adiado, encerrado, vagas esgotadas, inscrições ainda não abertas/encerradas, sem permissão, participação já confirmada, envio pendente e erro incerto. Cancelamento e adiamento não são a mesma situação. Não usar resultado vazio como fallback de erro.
No evento encerrado, substituir Participar por ações pertinentes como informações/avaliação, se elegível. Evento gratuito esgotado não vira pago para liberar vaga. Contagens sempre de dados reais.

## Criação e gestão
Criar evento é atalho ao formulário canônico e requer capacidade apropriada. Gestão de inscrições, programação, aprovação editorial, cancelamento, check-in e estatísticas pertence ao painel do organizador. Publicação na comunidade referencia o evento original, sem duplicar data/local.
Uma futura prancha de organização deve complementar estas, preservando campos existentes: não remover SEO, extras ou capacidades por ausência no mockup do participante.

## Validação e fidelidade
Dados fictícios. 19/09/2026 às 15h é exemplo, não evento real. SSOT Plus Jakarta Sans/petróleo/solar/marfim. Reutilizar navegação e marca oficiais; domínios desenhados não definem configuração.
Testar múltiplos perfis, última vaga concorrente, inscrição repetida, cancelamento, evento alterado, fuso, erro de mapa e teclado/zoom/contraste. Não declarar AAA pela aparência.
Campos e ações desenhados novos exigem integração; botões jamais simulam sucesso. A confirmação deve explicar a natureza da participação sem sugerir ingresso garantido quando for apenas manifestação de interesse.

Correções de fidelidade: a frase “Em breve será possível entrar na lista de espera” desenhada no desktop não representa compromisso de lançamento e deve ser removida. Ocultar a opção quando não implementada. Usar marca, navegação e domínio reais, sem slogans decorativos gerados. Não deixar aceitação de orientações pré-marcada: o estado marcado da imagem apenas ilustra uma interação já realizada; disponibilizar as orientações para leitura.

A versão mobile 101 foi substituída pela 103 para corrigir contraste do fundo. Original preservado em historico/.
