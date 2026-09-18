# Minhas publicações
Conceito de 17/09/2026. Página 31. Imagens geradas com image_gen integrado; não são telas implementadas.

## Pranchas e documentação
- [Mobile: publicadas, rascunho, moderação e módulos](pranchas/095-minhas-publicacoes-mobile.png).
- [Desktop e estados](pranchas/096-minhas-publicacoes-desktop.png).
- [Prompts integrais](PROMPTS.md).
- [Revisão de implementação](REVISAO.md).

## Base conferida
src/modules/profile/hooks/useUserPosts.ts consulta publicações por perfil via PostsFacade, com páginas de 20 itens e erro explícito. Filtro por tipo e ordenação são aplicados em cada página carregada; isso NÃO garante classificação global por popularidade nem resultados completos de filtros. Busca, filtros territoriais e totais globais da nova central precisam de contratos próprios.
src/modules/profile/components/UserPostsGrid.tsx é ponto de partida visual existente.
src/core/community-feed/drafts/postDraft.ts guarda snapshot textual criptografado no dispositivo, chave por perfil, sem imagens. O contrato atual comporta um rascunho por perfil, não uma coleção sincronizada.
src/core/posts/hooks/usePostActions.ts centraliza ações existentes; conferir campos editáveis e efeitos da exclusão nos serviços antes de aplicar o conceito.

## Escopo e identidade
Entrada pela conta/perfil e retorno após publicar. Perfil ativo sempre explícito; alternar perfil não transfere autoria. Buscar e gerenciar somente conteúdo acessível à pessoa autenticada por vínculo com aquele perfil e papel autorizado. Controle de servidor obrigatório, não apenas esconder botões.
No MVP, comunidade é o Complexo do Nordeste de Amaralina; bairros são filtros internos. Não inventar outras cidades ativas. No futuro, listar apenas territórios realmente disponíveis ao perfil.

## Publicadas
Texto resumido, tipo, bairro, data, estado editorial e métricas reais. Estado de enquete encerrada é diferente de moderação. Publicação pode continuar visível quando a votação termina. Aviso atualizado deve refletir evento persistido, não alteração cosmética.
Abrir leva ao detalhe canônico; retorno preserva filtros e posição. Menu inclui editar/excluir somente se suportados e autorizados. Edição de texto não implica suporte à alteração de enquete, anexos, destino ou tipo. Não permitir editar publicação ocultada para contornar decisão de moderação.
Busca, filtros, ordenação e paginação devem ser consistentes no conjunto completo, não apenas nos itens já carregados. Não inferir total de uma página de resultados.

## Rascunho
Mostrar explicitamente “neste dispositivo”. Retomar preserva identidade de origem; revalida destino e permissões antes de publicar. Imagens precisam ser adicionadas novamente. Salvo só aparece após persistência confirmada; falha de armazenamento oferece orientação sem fingir sucesso.
Descartar exige confirmação e remove somente o rascunho selecionado desse perfil. Criação de novo rascunho não sobrescreve silenciosamente o anterior. Auditar campos não presentes no snapshot, inclusive configurações completas da enquete.
Múltiplos rascunhos, sincronização entre dispositivos e anexos persistentes são evoluções futuras, não prometidas na prancha.

## Moderação
Consulta privada do autor/gestor autorizado exige endpoint que exponha somente dados comunicáveis. A consulta pública de perfil pode filtrar conteúdo ocultado/removido; não assumir que useUserPosts serve para esta aba.
Mostrar ocultada/removida e decisão com explicação apropriada, sem revelar denunciante, notas internas ou provas privadas. Solicitar revisão é proposta, condicionada à implementação e flag; quando desativado, esconder a ação. Não prometer reversão ou prazo.
Estados do autor não precisam copiar nomes técnicos da fila administrativa. “Em análise” só aparece quando existe análise registrada e não é sinônimo de todo conteúdo recém-publicado.

## Avisos, relatos e módulos
Atualização de situação requer contrato e histórico, com origem do autor; não converte relato em comunicado oficial. Problema persistente pode ter registro próprio e encaminhamento ao módulo responsável.
Classificados, serviços, vagas e eventos permanecem nos módulos canônicos. O painel oferece atalhos conforme capacidades do perfil. Compartilhamento na comunidade referencia o original. Excluir compartilhamento não exclui automaticamente anúncio original, e encerrar anúncio deve atualizar sua disponibilidade nos cartões.

## Exclusão e estados
Confirmar alvo e efeitos reais. Não prometer restauração nem cascata de exclusão de comentários sem contrato. Bloquear dupla execução, revalidar autorização no servidor e reconciliar após falha de rede. Se resultado for incerto, consultar antes de repetir.
Estados: carregando, nenhum conteúdo, filtro sem resultado, erro com retry, sem permissão, conteúdo removido/indisponível, rascunho ilegível, envio em curso e operação concluída. Erro nunca se apresenta como ausência de publicações.
Itens removidos ou restritos só mostram o conteúdo permitido pela política; evitar cache de outro perfil ao alternar identidade.

## Critérios para aplicar
SSOT de tipografia/cores, mobile first, teclado/foco/zoom/contraste. Não declarar AAA pela prancha. Testar muitos itens, paginação com filtros, rascunho por perfil, troca de conta/dispositivo, confirmação de exclusão e falhas. Contagens, textos e horários são demonstrativos, não seeds de produção.
O mockup pode mostrar todos os atalhos para documentar escopo; no produto, ocultar módulos desativados ou sem permissão. Nova publicação pode exigir vínculo confirmado; preservar leitura e oferecer orientação específica quando bloqueada.

## Ajustes de fidelidade para implementação
No desktop, substituir o símbolo territorial inventado pela marca oficial achegue-se.; domínio da barra do navegador e slogan decorativo não são definições oficiais. A coluna que lista Santa Cruz/Chapada/Vale das Pedrinhas deve se chamar Bairro; comunidade é o Complexo. A confirmação de exclusão deve explicar consequências concretas validadas no contrato, em vez da frase genérica ilustrada. Badge “Quando habilitado” identifica proposta na prancha, não deve substituir o comportamento real de ocultar a ação desativada.
