# Detalhe da publicação e conversa da comunidade

Conceito de 16/09/2026. Imagens propostas; nenhuma funcionalidade da aplicação foi alterada.

## Entregáveis

- `concepts/detalhe-publicacao/01-mobile-desktop.png`: fluxo principal.
- `concepts/detalhe-publicacao/02-estados.png`: participação e variações.
- `concepts/detalhe-publicacao/prompts.md`: prompts integrais, ferramenta integrada de geração de imagens.

## Base conferida

`src/core/community-feed/components/PostDetailModal.tsx` integra autor, território, texto, imagens, tags, enquete, métricas e comentários. O detalhe existente é modal. A página desktop e sua URL compartilhável precisam de integração de rotas.

`components/comments/PostCommentsPanel.tsx` integra perfil ativo, respostas, curtidas, exclusão e denúncia. Preserva texto quando o envio não retorna comentário criado. `CommentItem.tsx` contém respostas e ações condicionais. `PollCard.tsx` diferencia votação, voto realizado e encerramento. Há estilos locais antigos a migrar para a SSOT.

## Fluxo e melhorias propostas

Abrir a publicação conserva contexto, filtros e posição do feed para o retorno. Exibir autor, perfil, bairro, data, tipo, texto integral, tags e imagens quando presentes. Publicação textual não exige foto. Link compartilhado preserva audiência e permissões.

Mobile: tela cheia, rolagem principal única e compositor inferior que respeita teclado e área segura. Desktop: leitura central e contexto lateral. Não reduzir fontes para acomodar todo o histórico. Conversa pública usa comentários encadeados, sem balões de mensagem privada.

Mostrar identidade antes de responder. Troca de perfil revalida permissões, preserva texto e nunca envia automaticamente. Resposta direcionada identifica destinatário e permite cancelar o direcionamento.

Propostas: limite de indentação, respostas recolhíveis, paginação por cursor, total independente dos itens carregados e ordenação explícita. O hook consultado não oferece paginação ou seletor de ordenação. Não exibir ranking de relevância sem política implementada.

## Permissões

Leitura depende da audiência. Visitante acessa somente conteúdo público e recebe convite para entrar quando necessário. Pessoa autenticada sem vínculo recebe orientação para confirmar vínculo nas ações que o exigem. Solicitação pendente mostra acompanhamento, sem nova solicitação.

Validar no servidor perfil ativo, vínculo, comunidade, capacidade, moderação e feature flag. Escolher bairro não comprova residência. Perfil comercial não herda automaticamente permissões pessoais. Conciliar esta proposta com as políticas atuais; não assumir que todo o controle já está implementado. Curtir, votar, comentar, denunciar e compartilhar têm permissões próprias, não deduzidas somente de `canComment`.

## Tipos

- Enquete: prazo, opções e resultados; encerrada não aceita votos. Exemplo: 40 votos, 20/12/8, correspondendo a 50%/30%/20%. Validar voto no servidor.
- Aviso/relato: fonte, bairro, data, situação e atualização. Normalização informada pelo autor não equivale a confirmação oficial. Linha do tempo e ciclo de atualização são propostas a integrar.
- Comunicado oficial: somente representação autorizada de organização; não atribuir selo oficial a morador.
- Problema persistente: referência ao registro de acompanhamento. Encerrar comentários não significa resolver o problema.
- Serviço, classificado, vaga ou evento: referência ao módulo canônico, sem duplicar anúncio. O cartão de serviço dentro do comentário é proposta, requer resolução segura do link e verificação de acesso/disponibilidade.
- Imagens: visualizador acessível e descrição alternativa quando disponível. Não expor endereço residencial ou telefone privado por padrão.

## Estados e ações

Prever carregamento, conversa vazia, erro com nova tentativa, conteúdo removido, acesso restrito e comentários encerrados. Falha de consulta não deve aparecer como ausência de comentários. Não revelar conteúdo protegido em mensagens de erro.

Envio pendente evita duplicação. Falha mantém texto e destinatário. Sucesso somente após confirmação. Idempotência e reconciliação após reconexão são propostas de integração. Se a conversa fechar durante a escrita, preservar texto e explicar a mudança.

Excluir exige permissão e confirmação. Denúncia pede motivo e confirma recebimento, sem prometer remoção. Moderação exige autorização própria. Edição só deve expor campos efetivamente suportados.

## Identidade e validação

Consumir SSOT: Plus Jakarta Sans, petróleo, solar, marfim e cores semânticas. Validar contraste, foco, teclado, rótulos, anúncios de estado e movimento reduzido. Imagens não comprovam conformidade AAA.

Frases decorativas geradas na prancha não constituem slogans oficiais nem requisitos de interface. Pessoas, contagens e horários são demonstrativos. Funcionalidades futuras devem ter contratos e permissões antes de serem ativadas por flags.

## Ajustes de fidelidade para implementação

A segunda prancha gerou contagens diferentes entre cabeçalho e conversa: usar a mesma contagem canônica e indicar separadamente quantos itens estão carregados. O contador de caracteres desenhado não é uma regra definida; utilizar o limite validado pelo contrato. Ícones de anexar imagem nos comentários são proposta, não capacidade confirmada nesta análise; só exibir após suporte completo e autorizado a anexos. Manter identificação do perfil ativo em todos os compositores, inclusive enquete e aviso, como no fluxo principal.
