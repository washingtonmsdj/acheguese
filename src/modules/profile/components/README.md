# Componentes de perfil

Componentes React usados nas telas de perfil do usuario.

## Escopo

- Sidebar e resumo do perfil.
- Cards de reputacao, gamificacao, verificacao e engajamento civico.
- Listas de empresas, favoritos, classificados, posts e mencoes.
- Formularios de privacidade, notificacoes, senha e gestao de dados.

## Padrao

- Componentes focam em UI e recebem dados por props.
- Regras de negocio ficam nos hooks e servicos do dominio.
- Tipos compartilhados devem vir dos contratos do modulo de perfil.
- Evite criar aliases de versao ou componentes duplicados para o mesmo papel.

## Referencias

- Types: `src/modules/profile/types`
- Hooks: `src/modules/profile/hooks`
