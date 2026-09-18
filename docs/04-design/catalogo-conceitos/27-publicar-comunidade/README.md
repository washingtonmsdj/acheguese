# Publicar na comunidade

## Escopo

Publicação, perfis, território, enquete, alertas e comunicados. Serviços/classificados/vagas encaminham ao módulo próprio. Versões 79–82 são histórico anterior à consolidação de permissões.

## Referências visuais

- [079-publicar-mobile-inicial](historico/079-publicar-mobile-inicial.png) — Histórico — não aplicar automaticamente.
- [080-publicar-tipos-estados](historico/080-publicar-tipos-estados.png) — Histórico — não aplicar automaticamente.
- [081-publicar-desktop-inicial](historico/081-publicar-desktop-inicial.png) — Histórico — não aplicar automaticamente.
- [082-publicar-desktop-revisao](historico/082-publicar-desktop-revisao.png) — Histórico — não aplicar automaticamente.
- [086-publicar-consolidado-mobile](pranchas/086-publicar-consolidado-mobile.png) — Referência para revisão.
- [087-alertas-problemas-comunicados](pranchas/087-alertas-problemas-comunicados.png) — Referência para revisão.
- [088-publicar-consolidado-desktop](pranchas/088-publicar-consolidado-desktop.png) — Referência para revisão.

## Conferência no projeto

Pontos de partida identificados (revalidar no checkout atual):

- `src/core/community-feed/components/CreatePostModal.tsx`.

## Aplicação e critérios de aceite

- Compare código e referência: já atende / precisa ajustar / melhoria futura / não aplicável, sempre com evidência de arquivo e comportamento.
- Preserve regras existentes, permissões e flags. Funcionalidade desenhada e desativada exige implementação completa antes de ativação.
- Consuma a SSOT de cores/fontes e componentes compartilhados. Não replique estilos hardcoded da imagem.
- Substitua nomes, valores, contagens e mapas ilustrativos por dados reais; sem conteúdo fictício em produção.
- Valide leitura e ações em mobile/desktop, teclado, contraste, carregamento, vazio, erro e falta de permissão.
- Registre decisão, alterações e verificações no REVISAO.md desta pasta. Não marque concluído pela semelhança visual.

## Pendências

Conferir detalhes menores na imagem original em resolução completa. Textos gerados, contadores, porcentagens e slogans podem conter inconsistências; o contrato funcional prevalece. Confira GUIA-PARA-IMPLEMENTAR.md para decisões transversais.
