# Grupos da comunidade
Conceito de 17/09/2026. Página 32. Pranchas geradas com image_gen integrado; aplicação não alterada.

## Entregáveis
- [Mobile: descoberta, entrada, conversa e solicitação](pranchas/097-grupos-mobile.png).
- [Desktop, criação, solicitações e arquivamento](pranchas/098-grupos-desktop.png).
- [Prompts integrais](PROMPTS.md).
- [Registro para implementação](REVISAO.md).

## Base conferida
- src/core/community-groups/pages/GruposPage.tsx: busca, categorias, ordenação, listagem incremental, criação e acesso territorial.
- GrupoDetailPage.tsx: abas chat/membros/info; entrada/saída; funções admin/moderator/member; políticas de publicação e capacidades.
- GrupoDetailChat.tsx: texto, resposta, edição, exclusão, reação e denúncia, condicionadas às permissões.
- src/shared/components/grupos/CreateGroupDialog.tsx: nome, descrição, categoria, privacidade, políticas de entrada/publicação e regras.
- src/core/community-groups/hooks/useGroupQueries.ts, useFavoriteGroups.ts e services/CommunityGroupsService.ts: pontos de integração.
- src/modules/community-groups/README.md: módulo social territorial. Não confundir grupos sociais com agregações geográficas de core/territorial.

Não foi auditada toda a cadeia de servidor. Campos e capacidades declarados não comprovam operações completas. Áudio, imagem, enquete, aprovação, transferência e arquivamento exigem validação específica antes de ativação.

## Arquitetura de navegação
Descobrir, Meus grupos e Favoritos; busca, categoria e ordenação. Detalhe com Conversa, Membros e Sobre. A conversa é bate-papo do grupo existente, não novo feed público de postagens.
No MVP, Complexo como território e seus bairros como contexto interno. Um grupo social pode ter escopo de bairro conforme contrato; não atribuir um location_id fictício ao agregado nem criar quatro comunidades separadas.
Desktop dispõe grupos à esquerda, conversa ao centro e informações à direita. Mobile usa telas sucessivas e compositor com área segura para teclado; preservar posição de leitura e não forçar salto a cada mensagem.

## Descoberta e leitura
Os gates atuais podem bloquear lista/detalhe para quem não pode entrar. A prévia de metadados proposta não está automaticamente liberada ao público: definir audiência e consulta apropriada sem remover gate indiscriminadamente.
Visibilidade do grupo, possibilidade de descoberta, política de entrada, quem escreve e visibilidade dos membros são dimensões distintas. Grupo privado descobrível exibe somente metadados autorizados; grupo não descobrível não aparece sem convite autorizado. Link compartilhado não concede acesso.
Não mostrar mensagens, nomes de membros privados ou contagens sensíveis antes da autorização. “Entrada livre” significa entrada para perfil elegível, não dispensa regras territoriais.

## Participação e identidade
Mostrar perfil antes de entrar e de enviar. Vínculo comunitário não equivale à associação ao grupo. Cada perfil precisa de associação/capacidades próprias. Troca de perfil reconsulta acesso e evita vazamento de mensagens e rascunhos do perfil anterior.
Entrada aberta: servidor confirma associação; só então mostrar sucesso. Com aprovação: servidor confirma solicitação pendente, nunca mensagem “entrou no grupo” antes da aprovação. O handler atual do detalhe usa sucesso genérico de entrada e precisa ser conciliado com o resultado real.
Solicitação tem estados pendente, aprovada, recusada e cancelada somente se contratos implementados. Impedir duplicação; não prometer prazo. Cancelar não exclui conta ou vínculo.
Saída pede confirmação e explica acesso futuro. Último administrador precisa de política de sucessão/transferência ou encerramento antes de sair; não deixar grupo órfão.

## Conversa e capacidades
Texto, resposta contextual, identificação do autor e papel local, horário, edição e exclusão conforme contrato. Reações e denúncias respeitam configuração e acesso. Nome de administrador do grupo não significa autoridade oficial da comunidade.
Compositor desabilitado explica se é falta de associação, política de somente moderadores/admins, suspensão, arquivamento ou erro. Silenciar notificações é diferente de sair e depende de preferência realmente persistida.
Imagens, áudio e enquetes são funcionalidades previstas pela configuração, mas sua interface operacional não foi confirmada nesta revisão. Integrar upload, limites, reprodução acessível, transcrição quando prevista, votação e moderação antes de exibir controles. Quando desativadas, ocultar ações.
Mensagem fixada e marcador de encontro da prancha são proposta de aviso contextual; não assumir fixação implementada. Prever busca no histórico somente com API autorizada e paginação. Não carregar histórico ilimitado.

## Criação
Perfil criador, nome, descrição, categoria, escopo territorial, regras, visibilidade, política de entrada, quem publica, visibilidade de membros e mídia. Revisar antes de confirmar. Nome máximo atual do formulário: 60 caracteres; conferir demais limites no contrato.
Não gerar grupo oficial por nome ou categoria. Evitar escolhas conflitantes de privacidade/entrada; informar efeito de alterações sobre mensagens e membros. Capability de criar grupo é independente de gerenciar qualquer grupo.
Recursos futuros desativados aparecem na documentação, não como botões sem efeito no produto. Modelo de grupo de avisos pode permitir leitura dos membros e escrita só dos responsáveis sem atribuir selo oficial.

## Gestão
Aprovar/recusar solicitações quando implementado, consultar membros autorizados, alterar papel conforme delegação permitida, editar regras e configurações. O detalhe atual combina permissão comunitária de moderar com papel admin/moderator local: reconciliar o design com essa regra; não relaxar autorização pelo visual.
Validar promoção, rebaixamento e remoção no servidor. Administrador não deve conseguir ampliar o próprio escopo territorial. Auditoria e proteção contra retirada do último administrador são requisitos a implementar/verificar.
Arquivamento proposto bloqueia novas mensagens mantendo histórico somente para quem tem acesso. Não equivale a deletar ou tornar público. Reativação depende de autorização e política. Remoção de membro e restrição de conta são operações distintas.
Moderação de mensagem encaminha ao domínio de grupos; não aplicar cegamente comandos de postagem comunitária.

## Estados e critérios
Carregamento; sem grupos; busca sem resultados; falha de consulta; sem vínculo elegível; solicitação pendente; grupo não encontrado/indisponível; grupo restrito; somente leitura; arquivado; envio em curso; falha com texto preservado; perda de conexão. Erro não deve parecer ausência de grupos.
Paginação/filtros precisam ser consistentes no conjunto completo: categorias e contagens calculadas a partir dos grupos carregados não representam necessariamente totais. Não inferir número de membros online.
Testar autorização em leitura e mutação, troca de perfil, clique duplo, solicitação privada, papel de administrador, saída e reentrada, cache após revogação, muitos grupos e mensagens, teclado/zoom/contraste. SSOT Plus Jakarta Sans/petróleo/solar/marfim. Nenhuma imagem certifica AAA.

## Fidelidade das imagens
Pessoas, textos, fotos e números são demonstrativos. Badges “Evolução proposta” são anotações de conceito; não substituem feature flags no produto. Usar marca oficial e rotas reais, ignorando domínios ou símbolos eventualmente inventados pelo gerador. Não produzir estado de aprovação fictício para completar a tela.

Correções visuais para implementação: o cadeado junto de “Entrada livre” na segunda tela mobile deve ser substituído por ícone coerente de entrada aberta; privacidade e política de entrada devem ter rótulos distintos. Preservar navegação global canônica, sem adotar automaticamente os atalhos inferiores desenhados. A categoria “Meio ambiente” que aparece na imagem é sugestão editorial, não item confirmado da taxonomia atual: reutilizar categoria existente ou aprovar sua inclusão no contrato. O clipe no desktop só aparece após suporte autorizado a anexos; não implementá-lo como botão sem funcionamento. Favoritos depende de persistência e identidade corretas. Todos os caminhos de sucesso de entrada, incluindo hook e página, devem distinguir associação efetiva de solicitação pendente e evitar toasts duplicados.

## Complemento de criação e gestão

- [criar-gerenciar-grupo-mobile](pranchas/099-criar-gerenciar-grupo-mobile.png).
- [criar-gerenciar-grupo-desktop](pranchas/100-criar-gerenciar-grupo-desktop.png).
- [Funcionamento complementar](CRIAR-E-GERENCIAR.md).
