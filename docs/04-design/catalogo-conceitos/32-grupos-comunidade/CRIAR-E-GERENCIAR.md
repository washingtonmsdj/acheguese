# Complemento — Criar e gerenciar grupo
Proposta de 17/09/2026. Complementa README.md; não altera contratos ou funcionalidades automaticamente.

## Prancha
[Criação e gestão mobile](pranchas/099-criar-gerenciar-grupo-mobile.png).

[Revisão de criação e solicitações no desktop](pranchas/100-criar-gerenciar-grupo-desktop.png).

## Criação em etapas
1. Identidade: perfil criador, nome, descrição, categoria canônica e destino territorial válido.
2. Regras: descoberta, entrada, publicação, acesso à lista de membros e mídia.
3. Revisão: resumo completo, perfil autor, território e efeito das políticas. Botão Criar só após confirmação; erro conserva dados. A prancha detalha as duas primeiras etapas; a revisão deve ser implementada como resumo, não pular direto ao sucesso.

Nome máximo de 60 caracteres é baseado no formulário existente. Não inventar outros limites. Na criação atual já existem vários campos de política, mas etapas visuais são proposta de organização.
“Somente por convite” é evolução e não pode ser deduzida apenas de is_private. Requer emissão, validade, revogação, destinatário quando aplicável e conferência de elegibilidade no servidor. Link compartilhado comum nunca vira convite autorizado.

## Solicitações
A lista deve ser consultada apenas por responsável autorizado ao grupo. Mostrar dados públicos mínimos do perfil, data e estado; não exibir evidência residencial, endereço ou motivo interno de restrição.
Aprovar confirma associação como membro, sem promover papel. Revalidar elegibilidade na decisão, inclusive se houve mudança desde a solicitação. Recusa registra resultado comunicável e não bane automaticamente. Tratar solicitação cancelada ou decidida simultaneamente por outra pessoa.
Não prometer aprovação/recusa operacional antes de verificar toda a integração.

## Papéis e transferência
Separar administrador, moderador e membro, com matriz de capacidades explícita. Reutilizar restrições existentes de papel local e acesso comunitário. Ninguém se autopromove ou concede permissões superiores às suas.
O caso desenhado é da última administradora. Sua saída depende da política de sucessão ou encerramento. Transferência proposta exige responsável elegível, confirmação/aceite conforme política, registro de auditoria e operação atômica para não deixar o grupo órfão. Não executar saída enquanto transferência estiver pendente.
Quem pode alterar funções, remover pessoas, editar políticas ou arquivar deve ser decidido no contrato, não por visibilidade de botão. Moderador local não ganha moderação global.

## Configurações e impactos
Alterar quem escreve não muda automaticamente quem lê. Mudança de descoberta/privacidade precisa explicar os efeitos e preservar conteúdo privado; não tornar mensagens antigas públicas por acidente.
Arquivamento, reativação e eventual exclusão são operações distintas. Confirmar consequências, preservar histórico conforme política e impedir publicações após arquivamento. Estados de erro e operação pendente devem ser recuperáveis.

## Recursos previstos além da prancha
Configuração de imagens, áudio, enquetes, reações e denúncias deve consumir capacidades existentes, com controles habilitados somente após integração. Regras completas e configurações ficam acessíveis por rolagem; não comprimir o formulário para caber numa tela.
Configurar notificações pessoais é diferente de alterar regras do grupo. No desktop, usar a mesma navegação de gestão com formulário central e resumo de consequências lateral; não copiar quatro telas mobile lado a lado como interface real.

## Verificação antes de aplicar
Consultar os pontos de código do README principal. Validar acesso direto à rota, dupla aprovação, convite revogado, participante inelegível, última administração, transferência simultânea e edição de política durante conversa. Aplicar SSOT, foco/teclado, erros associados aos campos, texto ampliado e contraste medido.

## Ajustes de fidelidade
O contador de regras desenhado é ilustrativo e não define limite: utilizar contagem real e contrato validado. Textos como “Disponível após integração” pertencem à anotação de conceito; na aplicação, ocultar o fluxo desativado. Território único do MVP não deve sugerir outras cidades ativas. O cenário com três membros na gestão é alternativo ao exemplo com 24 membros nas pranchas anteriores, não representa contagem real de um mesmo grupo.
