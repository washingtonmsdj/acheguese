# Hub Components - Componentes Modulares do Perfil

Componentes reutilizáveis que sustentam o hub de conta/perfil atual.

## Componentes ativos

### ProfileHeaderCompact
Cabeçalho compacto do hub com identidade resumida e ações compatíveis com o fluxo atual da conta.

### SectionFrame
Container compartilhado para seções do hub com título, descrição e ação opcional.

### EmptyPanel
Estado vazio compartilhado usado por seções ativas do hub.

O hub canônico não mantém mais sidebar interna, tabs privadas de conteúdo, painéis de saúde/recomendação ou widgets duplicados de posts, favoritos, classificados e serviços. Essas responsabilidades foram aposentadas ou permanecem nos respectivos owners de domínio.

**Owner atual:** `ContaHubLayout` + componentes compartilhados acima.
