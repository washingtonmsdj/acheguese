# Componentes de perfil

Componentes React usados nas telas privadas e publicas de perfil.

## Escopo ativo

- Hub da conta: cabecalho, navegacao lateral, cards de saude, proximas acoes e abas de conteudo.
- Secoes da conta: resumo, dados pessoais, empresas, mobilidade, delivery, planos, notificacoes, preferencias e seguranca.
- Cards operacionais: metricas, notificacoes, seguranca e snapshots de mobilidade.
- Listas ligadas ao perfil: favoritos, posts, mencoes, classificados e servicos.
- Identidade publica: nome de usuario e fluxo de confirmacao antes de salvar alteracoes sensiveis.

## Padrao

- Componentes focam em UI e recebem dados por props.
- Regras de negocio ficam nos hooks e servicos canonicos de perfil.
- Tipos compartilhados devem vir de `core/profiles` ou dos contratos do modulo de perfil.
- Nao recriar componentes para o mesmo papel: reaproveite `core/profiles` para identidade/privacidade e `modules/profile` para a experiencia de conta.

## Referencias

- Core canonico: `src/core/profiles`
- Types do modulo: `src/modules/profile/types`
- Hooks do modulo: `src/modules/profile/hooks`
