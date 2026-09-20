# Revisão — Minhas publicações

Status: implementado em modo de conceito, com rota de desenvolvimento isolada.

Referências visuais:

- `pranchas/095-minhas-publicacoes-mobile.png`
- `pranchas/096-minhas-publicacoes-desktop.png`

## Decisões de implementação

| Requisito | Implementação | Contrato preservado |
|---|---|---|
| Gestão privada por perfil | `MinhasPublicacoesConceptMockPage` com seletor de perfil e comunidade | A superfície real de conta continua protegida quando a flag não está presente |
| Publicações | Lista publicada com pergunta, enquete e aviso, situação, comunidade, interações e ação contextual | Dados reais, paginação e mutações não são simulados como persistência |
| Rascunho local | Estado `view=drafts`, com “Salvo neste dispositivo”, retomada, descarte e aviso de imagens | Um rascunho por perfil e ausência de imagens seguem a regra documentada |
| Moderação | Estado `view=moderation`, motivo, orientação, encaminhamento para Serviços e recurso condicionado | Não autoaprova, não oculta/edita conteúdo e não concede permissão |
| Outros módulos | Estado `view=other` e painel desktop para Classificados, Serviços, Vagas e Eventos | Cada ação aponta para o módulo responsável; a publicação comunitária não duplica a origem |
| Estados operacionais | `empty`, `error` e `delete` com mensagens e ações distintas | Exclusão é apenas demonstrativa no mock |
| Responsividade | Desktop em rail + topbar + tabela/painel; mobile em fluxo Conta + cartões compactos | Nenhum overflow horizontal; shell global não duplica navegação |

## Rota e escopo

- Preview: `/conta/publicacoes?concept-mock=1`.
- A flag só é reconhecida em `import.meta.env.DEV`.
- Sem a flag, `/conta/publicacoes` usa o fallback protegido da conta.
- O mock não substitui `useUserPosts`, `UserPostsGrid`, snapshot de rascunho, autorização de perfil ou contratos de filtros/paginação em produção.

## Validação

- Navegador interno mantido aberto em mobile `389 × 867` e desktop `1707 × 960` durante a comparação lado a lado.
- Publicadas, rascunho local, moderação, outros módulos, vazio, erro e confirmação de exclusão foram conferidos.
- Checagem estrutural confirmou `body.scrollWidth` dentro do viewport e ausência de overflow horizontal nos containers de tabela/filtros.
- Logs finais do navegador ficaram sem erros.
- ESLint direcionado e `git diff --check` passaram.
- O typecheck global permanece condicionado a uma exclusão pré-existente fora deste conceito: `src/core/business/services/business.slug-queries.ts` está ausente no working tree.
