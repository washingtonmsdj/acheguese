# Criar e gerenciar eventos
Página 34, conceito de 17/09/2026. Pranchas via image_gen integrado; nenhuma alteração funcional.

## Arquivos
- [Mobile](pranchas/104-organizar-eventos-mobile.png).
- [Desktop e decisões](pranchas/105-organizar-eventos-desktop.png).
- [Prompts](PROMPTS.md).
- [Revisão](REVISAO.md).

## Base inspecionada
EventsOrganizerForm.model.ts: título, subtítulo, descrições, categoria, tags, início/fim/duração/fuso, formato físico/online/híbrido, endereço e plataforma/link online, instruções de local, gratuidade/preço/capacidade/lista de espera, requisitos, o que levar, idade, vestuário, acessibilidade, capa/banner/vídeo/galeria, programação, FAQ, SEO, recursos extras e contatos.
EventsOrganizerDashboard.model.ts: estados publicado/rascunho/cancelado/finalizado/em_andamento; estatísticas de eventos, participantes, visualizações e receita calculada; participantes com joinedAt e checkedInAt.
EventsOrganizerDashboardSections.tsx: filtros, lista, métricas e estados. Página de analytics existente deve ser preservada e auditada separadamente.
Existência de campo não comprova integração ponta a ponta. Conferir os serviços canônicos em core/community-events antes de implementar.

## Fluxo
Selecionar perfil organizador autorizado. Meus eventos filtra por estado e pesquisa. “Encerrados” é agrupamento visual proposto: distinguir finalizados de cancelados, não criar status persistido arbitrariamente.
Criação em etapas: informações, local/formato, participação e revisão. Seções adicionais por expansão, sem remover campos menos frequentes do contrato existente. Rascunho só aparece salvo após confirmação da persistência; não assumir autosave.
MVP Complexo com bairros internos e location_id válido. Endereço físico, link online e comunidade de distribuição são campos diferentes. Híbrido exige ambos, quando aplicável. Evitar publicar endereço privado ou link reservado antes da autorização.

## Campos a preservar
Título/subtítulo/textos/tags e categoria canônica. Datas completas, duração/fuso consistente e validação de término posterior ao início. Capa/banner/galeria com legendas e direitos de uso; vídeo validado. Programação com horários, título, descrição, responsável e local. FAQ editável.
Requisitos, idade, vestuário e o que levar opcionais conforme necessidade; acessibilidade informada não é certificação. Recursos extras: certificado, gravação, networking, alimentação, estacionamento e acessibilidade, somente se efetivamente oferecidos. Contatos públicos explicitamente escolhidos pelo organizador. SEO não deve publicar dado privado.
Exigência de inscrição distinta de gratuidade. Lista de espera existe como campo no modelo, mas convocação/posição não foram certificadas nesta análise; mantê-la desativada até operação completa.

## Revisão e publicação
Resumo completo de organizador, território, data, formato, acesso, preço e capacidade. Prévia usa dados do formulário sem criar evento público. Publicar só após confirmação do servidor e política editorial existente; não presumir aprovação imediata ou obrigatória sem contrato.
Erros de upload/persistência preservam texto e informam o que não foi salvo. Repetição da submissão não deve duplicar evento. Edição concorrente exige revalidação.
Publicação no feed referencia evento canônico. Botão Criar evento não cria postagem independente com dados duplicados.

## Inscrições e check-in
Tabela só para equipe autorizada ao evento, com dados mínimos. Busca, filtros e paginação sobre conjunto completo. Contagens separadas de vagas totais, inscrições válidas e entradas registradas; não contar canceladas como ocupantes sem regra.
Confirmar inscrição, processar pagamento e registrar entrada são operações distintas. Check-in requer identidade/credencial e autorização verificadas pelo servidor; não usar simples mudança visual de status. Prevenir entrada duplicada e apresentar registro existente. Não gerar QR ou certificado meramente decorativo.
Delegação de equipe de recepção, exportação de participantes e scanner são extensões que exigem autorização própria; não expor documentos ou contatos a todos os gestores indiscriminadamente.

## Financeiro
O helper consultado calcula totalRevenue por quantity_sold * price. Isso é cálculo derivado, não comprovação de liquidação, recebível ou saldo disponível. Se usado, nomear como estimativa com base clara. Não oferecer retirada ou reembolso sem integração financeira real.
O fluxo anterior de seleção de ticket chama joinEvent sem ticketId naquele handler; auditar reserva por lote/tipo, capacidade e pagamento antes de prometer venda operacional. A prancha usa evento gratuito. “Pago” é cenário futuro/configurável conforme integração, não autorização para cobrar agora.

## Mudanças e cancelamento
Alterar data/local: revisar diferenças, motivo comunicável e impacto em inscrições/links/calendário. Registrar histórico. Disponibilidade e comunicação têm estados distintos; não informar que todos foram avisados sem entrega confirmada.
Cancelar evento: confirmar alvo e consequências, motivo e orientações a participantes. Não confundir cancelamento com exclusão nem apagar registros para encobrir mudança. Reembolso, quando aplicável, depende de fluxo financeiro próprio; não prometer automático.
Evento encerrado preserva histórico e oferece relatórios/avaliações/certificados somente quando realmente implementados e elegíveis.

## Estados e validação
Carregando, nenhum evento, filtro vazio, erro, sem autorização, formulário inválido, upload falho, rascunho salvo/não salvo, publicação pendente/confirmada, concorrência, capacidade esgotada, cancelado, finalizado, check-in já realizado e conexão perdida.
Testar troca de perfil, acesso de outra equipe, inscrição concorrente na última vaga, tentativa duplicada de check-in, datas/fusos e falha de notificação. Aplicar SSOT e verificar teclado, foco, contraste, mobile e desktop; imagens não certificam AAA.

## Fidelidade
As pranchas apresentam momentos diferentes (preparação e dia do evento); métricas são demonstrativas. Badges técnicos sobre disponibilidade são notas de conceito, não texto permanente do produto. Usar domínio e navegação reais. Não extrair requisitos de slogans ou ícones inventados pelo gerador.

Ajustes para implementação: 5 MB desenhado no upload é exemplo, não limite validado; usar política real. Capacidade 30 é total, não vagas restantes. Os painéis inferiores do desktop são estados alternativos, não ações simultâneas de um evento já publicado. “Publicado” pode coexistir no desenho com check-in por simplificação: reconciliar estado em_andamento conforme contrato. Manter perfil organizador explícito no desktop, além da pessoa logada. Nomear o fuso internamente com identificador IANA validado; GMT-3 é apenas rótulo de apresentação.
