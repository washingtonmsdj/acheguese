# Guia para conferir e aplicar os conceitos

## Comece aqui
1. Leia README.md e abra index.html para localizar a página.
2. Leia o README e os documentos da página. Compare referências atuais, complementos e histórico. Não misture layouts incompatíveis.
3. Confira o código no checkout e registre branch/commit e data em REVISAO.md.
4. Classifique cada requisito: já atende; ajuste necessário; melhoria futura; incompatível/obsoleto.
5. Implemente somente mudanças justificadas, preservando código de outros trabalhos, dados e funcionalidades.
6. Valide comportamento e aparência; registre evidências, pendências e flags.

## Autoridade e conflitos
Instruções atuais do usuário e regras funcionais verificadas prevalecem sobre o desenho. Referência visual não prova suporte técnico nem substitui controle de acesso. Versão mais recente não é automaticamente superior em todos os detalhes. Use as notas por página. Textos decorativos e slogans gerados não são requisitos oficiais.

O catálogo preserva 90 imagens localizadas na pasta de geração desta conversa e adiciona duas novas em Meus vínculos. Não afirma recuperar anexos externos que nunca foram salvos nessa pasta. Documentos antigos encontrados foram copiados integralmente; notas de páginas sem documento foram reconstruídas e precisam de auditoria no código. Não foram refeitos os conceitos anteriores.

## Identidade visual
Consumir src/index.css, tailwind.config.ts e src/styles/theme.ts, conciliando o tema de acessibilidade. Plus Jakarta Sans; referências petróleo #123E3D, solar #F3CB4C, marfim #FAFBF7 e texto #203534. Confirmar equivalência HSL/HEX. Preservar cores semânticas e categorias. Não copiar cores de pixels, fontes simuladas ou estilos legados.

## Território e participação
MVP no Complexo do Nordeste de Amaralina, Salvador. Nordeste de Amaralina, Santa Cruz, Vale das Pedrinhas e Chapada são bairros internos, não quatro lançamentos independentes. Exploração não altera residência. Cadastro de conta não aprova vínculo. Perfil, vínculo, função, representação e feature flag são independentes.
Conteúdo público pode ser explorado conforme audiência. Escrita/voto/moderação dependem da capacidade específica e do servidor. Não impor indiscriminadamente uma regra única de moradia: reconciliar propostas com CommunityAccessPolicy.ts. Trabalho/estudo são tipos futuros com regras próprias; não conferem selo de morador.

## Publicação e módulos
Publicar pode funcionar como entrada para módulos canônicos. Classificado, serviço, vaga e evento têm registro próprio. Compartilhamento no feed referencia o original, sem duplicação. Aviso de morador não é comunicado oficial; representação exige autorização. Relato atualizado pelo autor não é confirmação independente. Limites de texto, anexos e permissões vêm do contrato, não de contadores desenhados.

## Entregas
Separar equipe externa manual sem rastreamento, entregador cadastrado vinculado à loja e rede Achegue-se. Modalidade e pagamentos devem ser explícitos. Nenhum desenho cria automaticamente operação logística, repasse, garantia ou isenção de responsabilidade. Mapa mostra somente rastreamento autorizado de pedidos relacionados. Não inventar frota disponível.
Comprovante pode exigir nome, código ou evidência conforme cenário; foto não é padrão obrigatório. Não expor fotos de pessoas, fachada residencial ou documentos sem necessidade. Confirmar entrega é transição validada, não mero clique visual.

## Estados, privacidade e disponibilidade
Prever carregando, vazio, erro, sem permissão, funcionalidade desativada, envio pendente e sucesso confirmado. Não usar mocks como fallback real. Não confundir falha com lista vazia. Documentos privados exigem autoridade de upload, acesso, retenção e auditoria; o upload de comprovação residencial está atualmente desativado no componente consultado.
Feature flag oculta a função ao desativar, mas não substitui autorização. Funcionalidade futura pode ser planejada e implementada sem ativar em produção.

## Validação
Conferir mobile e desktop, teclado, foco, zoom, texto ampliado, contraste e portais. Não declarar AAA pela aparência. Testar transições e persistência relevantes, não somente screenshot. Não executar ações reais de pagamento, envio externo ou publicação sem autorização correspondente.

## Comando para o próximo chat
> Use docs/04-design/catalogo-conceitos/README.md e GUIA-PARA-IMPLEMENTAR.md como índice das propostas. Trabalhe uma página por vez. Leia seu README, pranchas de referência, documentos e histórico quando necessário. Audite o código atual e registre diferenças em REVISAO.md. Preserve o que já atende; implemente ajustes justificados usando a SSOT e os componentes existentes. Diferencie melhorias futuras e flags de funcionalidades já operacionais. Valide responsividade, acessibilidade e fluxo funcional. Não aplique cegamente desenhos, contagens, mapas ou slogans. Não apague trabalho de outros chats. Ao terminar cada página, registre arquivos alterados, verificações e pendências antes de seguir.

## Manutenção
Novas pranchas recebem nome descritivo, documento funcional e entrada no manifest.json. Não sobrescrever imagens anteriores. A galeria e o manifesto são entregáveis estáticos; a origem usa um identificador relativo do arquivo gerado, e o SHA-256 permite conferir a cópia. Acrescente novas referências de forma incremental.
