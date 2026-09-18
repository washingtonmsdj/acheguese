# Revisão principal: pranchas 116 e 117

A 116 é a referência principal de composição mobile/desktop; a 117 complementa avisos e estados. Ambas substituem a 115. Mantêm a identidade petróleo, solar e Plus Jakarta Sans.

- Publicações substitui o rótulo ambíguo Conversas na aba do feed. Conversas na navegação continua sendo mensagens privadas.
- Removido o botão extra de publicação acima das abas. Compositor contextual e ação global abrem o mesmo fluxo.
- Busca disponível no mobile. Prévia de resposta é proposta: exibir apenas conteúdo autorizado, sem inferir resposta oficial ou melhor resposta.
- Avisos não dominam o feed. Comunicados de organização exigem representação autorizada, não significam comunicado de órgão público.
- A prancha 117 ilustra cenários, não uma nova navegação global: manter o shell aprovado na 116. Visitante e vínculo pendente usam as decisões efetivas da política, sem supor que login concede publicação automaticamente.
- Vazio e erro da quarta tela são estados alternativos; nunca exibir ambos simultaneamente. A anotação “Para perfil autorizado” não é texto de produto: renderizar a ação somente quando permitida.
- A imagem 116 omite o nome do perfil no compositor mobile: mostrá-lo ao abrir a publicação e permitir conferir a identidade antes de enviar. Dados ilustrativos e ícones não substituem contratos reais.
- Se não houver avisos, grupos ou eventos relevantes, omitir módulos vazios da lateral. Salvos, vínculos e regras permanecem acessíveis no mobile por menu contextual/Conta, sem ocupar a primeira dobra.

As regras funcionais anteriores abaixo continuam válidas quando não contrariadas por esta revisão.

# Referência atualizada do feed

A nova prancha 115 substitui a 002 como referência principal. A 002 permanece preservada para histórico; não aplicar sua fonte, azul elétrico ou composição antiga.

Identidade: Plus Jakarta Sans, petróleo #123E3D, solar #F3CB4C, marfim #FAFBF7 e texto #203534, consumidos pelos tokens globais existentes. A imagem é aproximação visual; a implementação deve usar a fonte real e contraste medido.

## Papel desta página

Conversas sobre a vida local: perguntas, histórias, relatos, enquetes e avisos com autoria clara. Grupos e agenda são entradas para seus fluxos próprios. Não transformar o feed em vitrine de produtos ou repetir a home geral. Classificados, serviços, vagas e eventos são publicados no módulo canônico; o feed pode compartilhar referências autorizadas.

## Regras

- Identificar perfil autor e território antes da publicação. Usar decisões por ação de `src/core/community-experience/access/CommunityAccessPolicy.ts`, sem conceder escrita irrestrita nem inventar bloqueio universal por residência.
- O cartão de vínculo demonstra participação ativa, não residência verificada. Adaptá-lo aos estados visitante, pendente, bloqueado ou sem vínculo e à ação retornada pela política. Não usar selo residencial para mera participação.
- “Aviso de morador” não é comunicado oficial. Sem vínculo de residência que suporte o rótulo, usar “Relato da comunidade”. Representação oficial exige autorização específica.
- O exemplo de iluminação é um relato de problema: integrar o módulo de problemas quando aplicável, evitando duplicar registros. “Ainda sem confirmação” só pode aparecer com estado real correspondente; não inventar verificação.
- Ordenação e filtros devem agir no conjunto correto antes da paginação; contagens reais, sem conteúdo demonstrativo como fallback.
- Preservar as funções existentes de responder, reagir, salvar, denunciar, editar/excluir quando autorizado, enquete, mídia e moderação, mesmo que nem todas apareçam na primeira dobra da prancha.
- Recursos propostos ou desativados exigem implementação, autorização e ativação. Ocultar quando indisponíveis.

## Ajustes de implementação que prevalecem sobre a imagem

No mobile, evitar três entradas redundantes para publicação: manter o botão global inferior e o compositor contextual; o botão amarelo extra sob o título pode ser removido. Disponibilizar busca na comunidade também no mobile, via ícone acessível ou campo expansível. “Conversas” na aba é feed público; “Conversas” na navegação é mensagens privadas: preferir **Publicações** como nome da aba para não confundir os canais. Nenhuma moldura de dispositivo ou slogan da prancha integra o produto.

## Evidência consultada e validação

`src/core/community-feed/pages/ComunidadePage.tsx` e hooks relacionados são pontos de integração identificados; a política de acesso acima foi lida. Conciliar com pastas 27-publicar-comunidade, 28-meus-vinculos, 29-detalhe-publicacao e 30-moderacao-comunidade. Esta revisão não certifica implementação completa dos fluxos.

Testar carregamento, vazio, falha, visitante, vínculo pendente, permissões por ação, teclado, foco, zoom e telas pequenas. A documentação prevalece sobre textos ilustrativos. Nenhum código da aplicação foi alterado nesta entrega.
