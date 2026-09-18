# Central de moderação da comunidade

Conceito de 17/09/2026. Página 30 do catálogo. Pranchas geradas por image_gen integrado; nenhuma função da aplicação foi alterada.

## Pranchas
- [Mobile — fila, análise e decisão](pranchas/093-moderacao-mobile.png).
- [Desktop — análise e estados](pranchas/094-moderacao-desktop.png).
- [Prompts integrais](PROMPTS.md).
- [Registro de revisão](REVISAO.md).

## Código conferido e limites da análise
- src/core/community/moderation/CommunityContentModerationQueue.tsx: fila de conteúdo e decisões.
- src/core/community/moderation/CommunityContentModerationService.ts: contratos de post/comment, decisão dismiss/hide/remove e resultado alreadyReviewed.
- src/core/community/moderation/types.ts e reportStatus.ts: denúncias, filtros, estatísticas, histórico e estados.
- src/core/moderation/reportReasons.ts: motivos canônicos.
- src/modules/admin/components/moderation/FederatedModerationQueue.tsx: triagem unificada, com decisões no domínio responsável.

Tipos declarados não comprovam implementação completa. Não foi auditado nesta entrega o backend nem o escopo efetivo de cada moderador. Design territorial, atribuição de caso, comunicação e contestação precisam ser conciliados com os contratos e a autorização do servidor.

## Funcionamento
Acesso exclusivo a pessoa autorizada para o território/domínio. O escopo fica visível no cabeçalho. Perfil comercial, residência confirmada ou vínculo comunitário não concedem moderação. Não permitir autoatribuição de papel.

Fila: pendentes, em análise e histórico; filtros por tipo, motivo e período, busca por identificador e paginação. Estados e métricas são do servidor, sem somar contagens de subconjuntos carregados. “Em análise” não implica que exista hoje mecanismo de reserva/atribuição do caso: implementar e validar antes de oferecer.

Agrupar denúncias do mesmo conteúdo, mantendo seus registros e razões. Volume não comprova infração nem determina penalidade. Evitar evidenciar reputação ou número de denúncias antigas como prova automática contra o autor.

Análise: conteúdo, contexto da publicação ou comentário, motivos e histórico pertinente. Minimizar identificação de denunciantes; não expor dados a autor denunciado. Conteúdo sensível pode exigir prévia protegida. Toda visualização administrativa requer autorização; fila territorial não abre acesso geral a mensagens privadas.

## Decisões
- Manter conteúdo: traduz a intenção de dismiss, descartando denúncias sem remover o conteúdo. Conferir mapeamento real no retorno da API; não renomear estados persistidos arbitrariamente.
- Ocultar: ação existente no contrato. Explicar efeito real e possibilidade de restauração somente quando suportada; não prometer restauração automática ou prazo temporário.
- Remover: ação distinta e destrutiva, com confirmação explícita do alvo e efeito. Não pressupor exclusão física do registro.
- Justificativa já é obrigatória no serviço consultado, entre 3 e 1.000 caracteres. Definir separadamente qual parte pode ser comunicada ao usuário. Nota interna separada é evolução: não misturar texto interno com mensagem ao usuário.

Antes de confirmar, mostrar alvo, ação, consequência e justificativa. Bloquear duplo envio. Sucesso apenas após resposta confirmada. Caso já analisado deve atualizar resultado sem sobrescrever silenciosamente; alreadyReviewed é sinal existente a conciliar. Para conteúdo alterado durante revisão, propor controle de versão e nova leitura antes de decidir.

Restrições de perfil, advertência e suspensão são ações separadas, com escopo, duração, competência e confirmação próprios. Não inferir suporte operacional porque os tipos incluem ban/warn/suspend. Não incluir banimento automático como efeito de remover uma postagem.

## Comunicação e contestação — evolução proposta
Decisão registrada não significa notificação enviada. Registrar separadamente comunicação pendente, enviada ou falha, com tentativa idempotente quando houver integração. O exemplo mobile mostra pendente; não é um envio real.

Comunicar ao autor a regra aplicada, efeito e justificativa adequada, sem revelar denunciante ou nota interna. Ao denunciante, informar encerramento sem divulgar dados privados ou sanções não comunicáveis.

Contestação depende de política, autorização e contrato próprios. Guardar decisão original, motivo de revisão e nova decisão. Definir tratamento de conflito de interesse e revisão por outra pessoa quando aplicável. Não inventar prazo ou prometer deferimento. Quando desativada, não exibir botão sem funcionamento.

## Domínios e histórico
Triagem federada encaminha classificados, vagas, avaliações, corridas, grupos, mensagens, alertas, problemas e perfis de empresas ao domínio responsável, conforme os caminhos realmente disponíveis. Não aplicar genericamente a decisão comunitária em outro domínio.

Histórico de auditoria: ator autorizado, alvo, comunidade, ação, justificativa, data e resultado. Registrar alterações sem reescrever silenciosamente a decisão anterior. Acesso a evidências, exportação e retenção exigem políticas específicas, não presumidas pelo desenho.

## Estados essenciais
Carregando; nenhuma pendência; filtro sem resultados; erro de consulta com nova tentativa; conteúdo indisponível; sem permissão; caso alterado/decidido por outra pessoa; envio incerto; decisão confirmada; comunicação pendente/falha. Erro não deve parecer fila vazia. Não expor conteúdo no estado sem permissão.

## Aplicação e validação
Usar SSOT existente, Plus Jakarta Sans e cores semânticas. Solar destaca, vermelho reservado a ação destrutiva; não depender somente de cor. Validar teclado, foco no modal, leitura mobile, zoom e contraste. Não declarar AAA pela imagem.

Casos de teste: moderador de outro território negado no servidor; permissões distintas por domínio; dupla decisão; tentativa repetida após falha; comentário sem publicação disponível; diferenças entre ocultar/remover/manter; justificativa interna não comunicada. Pranchas têm nomes e números fictícios. Identificadores DEN são rótulos propostos, não esquema de dados obrigatório. Nenhuma decisão real foi executada.

Correções de fidelidade: os contadores com máximo de 500 desenhados nas pranchas são ilustrativos e incorretos para o contrato atual; usar contagem real e máximo de 1.000. A comunicação só aparece como pendente quando existir efetivamente uma tarefa de envio registrada; caso contrário, indicar que não foi enviada, sem prometer processamento. A navegação administrativa deve ficar restrita ao contexto autorizado e não substituir a navegação de todos os moradores.
