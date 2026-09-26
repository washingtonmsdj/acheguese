# Achegue-se — Execução main-only e prontidão MVP

**Status:** ATIVO — SSOT OPERACIONAL  
**Atualizado:** 2026-09-26  
**Linha de integração:** `main`

Este documento contém somente o estado operacional vigente, a ordem de execução e o Definition of Done do MVP. Histórico de PRs, SHAs e investigações encerradas pertence a `docs/08-roadmap/checkpoints/`, `docs/10-archive/` ou ao histórico do Git.

## Escopo do primeiro release

### Domínio de produto ativo

- **Business / Empresas**.

### Capabilities horizontais ativas

- Mapa;
- Perto de mim;
- Busca;
- Mensagens, com provider Business no MVP;
- Notificações;
- Auth;
- Perfis / Conta;
- Território;
- Localização;
- Central.

Community, Gastronomia, Serviços/Profissionais, Classificados, Pontos Turísticos, Educação, Vagas, Eventos, Comunicação territorial, Mobilidade, Cupons, Gamificação, Analytics público, Safety familiar, Billing e demais domínios permanecem **paused**.

Código pós-MVP pode permanecer versionado quando possui owner claro e fronteira limpa. Estar versionado não autoriza rota funcional, navegação, prefetch, query, provider, layer de Mapa ou CTA ativo.

## Autoridades de lifecycle

- `src/app/config/productModuleRegistry.ts`: domínios de produto;
- `src/app/config/platformCapabilityRegistry.ts`: capabilities horizontais;
- `src/app/config/lifecycleRegistry.ts`: avaliação de dependências;
- scopes de providers na camada `app/config`: composição entre capability e domínios ativos.

Regra permanente: **vertical de produto não é capability horizontal**. Pausar uma vertical remove seus providers; não transfere ownership e não pausa automaticamente Mapa, Nearby, Search, Messaging ou Notifications.

## Regras de implementação

- durante a fase final de certificação do MVP, alterações operacionais são aplicadas diretamente em `main`; não criar branch ou PR intermediário sem exigência explícita de proteção da plataforma;
- corrigir causa raiz; não introduzir paliativo;
- não criar redirect/alias/fallback para preservar arquitetura antiga;
- não manter duas autoridades para a mesma responsabilidade;
- não consultar módulo pausado apenas para montar UI escondida;
- não importar implementação interna entre módulos;
- não mover lifecycle para `core` ou `modules`; a composição pertence à camada `app`;
- preservar código pós-MVP somente quando ele estiver isolado do runtime ativo;
- remover código órfão, facade sem caller, barrel artificial e documento supersedido assim que o censo provar que não existe dependência viva;
- migrations históricas permanecem imutáveis quando necessárias ao ledger/proveniência;
- merge/commit não equivale a produção validada.

## Estado técnico do núcleo

O corte estrutural do MVP está consolidado:

- Business é o único domínio público ativo;
- Map, Nearby, Search e Messaging usam providers lifecycle-scoped;
- Notifications mantém histórico horizontal e governa ações pela policy de lifecycle;
- rotas e prefetch ativos não montam módulos pausados;
- a Central/Conta não anuncia verticais pausadas;
- `CentralRoutes` compõe o lifecycle de Billing e das verticais Business; `CriarEmpresaPage` recebe `enabledVerticalKeys` e não consulta `launchScope`;
- componentes Business/Profile ativos recebem escopo de lifecycle pela camada `app`, em vez de importar `app/config` para decidir produto;
- Busca assistida autoriza intents explicitamente na camada `app`;
- URLs sem owner ativo chegam ao 404 canônico, sem redirect de compatibilidade;
- o deploy automático exact-main de Edge Functions está operacional e volta a ser tratado como gate normal da certificação do candidato.

### Frontend Finish do MVP

A convergência visual das superfícies ativas está em fase final:

- catálogo de Empresas alinhado à identidade petróleo/teal;
- detalhe público com shell responsivo alinhado ao catálogo;
- Central da empresa com visão geral, dados e configurações repaginados;
- Perto de mim repaginado e sem o hero legado;
- Busca com copy pública humanizada;
- criação e edição de empresa alinhadas em três etapas: Identidade → Contato e local → Apresentação;
- horário noturno que atravessa meia-noite já é tratado no helper do catálogo;
- ainda deve ser removido o cálculo duplicado de aberto/fechado que permanece no container do detalhe público, fazendo-o consumir o SSOT de Business Hours.

### Higiene documental/repositório

A documentação viva está sendo reduzida ao que representa o produto atual:

- `docs/README.md` é o único índice canônico;
- `docs/08-roadmap/README.md` separa execução atual de planos futuros;
- handoff CP-016 concluído foi movido para `docs/10-archive/`;
- `RECOVERY-ROADMAP.md` supersedido saiu da árvore viva;
- sprints antigas de Feed/Post saíram de `docs/05-ux/` porque Community está pausado;
- histórico permanece em `10-archive/` ou no Git, sem competir com SSOT vivo.

Qualquer regressão nessas regras deve falhar nos gates arquiteturais/documentais correspondentes.

## Blocker externo atual

### #305 — Supabase data plane / sessão autenticada

O projeto pode aparecer `ACTIVE_HEALTHY` no control plane e ainda assim o data plane falhar. As revalidações continuam reproduzindo `Connection terminated due to connection timeout` até em consulta SQL mínima, enquanto o smoke autenticado falha no bootstrap de sessão com `auth_upstream_unavailable`.

O painel da organização também mostrou a cota gratuita de egress excedida no período. Isso é consistente com o blocker observado, mas a certificação só considera o problema resolvido quando o data plane e o fluxo autenticado real voltarem a responder.

Não corrigir isso no frontend com:

- retry ilimitado;
- timeout artificialmente maior;
- fallback de login;
- bypass de OIDC;
- troca de RLS sem evidência;
- fixture alternativa para mascarar indisponibilidade.

A sequência de prova quando o upstream voltar é:

1. SQL mínimo;
2. advisors/health aplicáveis;
3. login real da fixture;
4. Conta;
5. Business;
6. Mensagens;
7. smoke autenticado exact-SHA.

## Ordem de execução até MVP READY

1. **Fechar Frontend Finish e higiene final**
   - remover a duplicação de status aberto/fechado no detalhe público;
   - terminar revisão visual das superfícies ativas sem reabrir módulo pausado;
   - remover código/documento comprovadamente obsoleto;
   - manter histórico somente em checkpoints/archive/Git;
   - não apagar base pós-MVP com owner legítimo.

2. **Fechar o blocker de infraestrutura restante**
   - resolver #305 sem compensações no frontend, Auth, RLS ou timeouts.

3. **Certificar um único candidato**
   - obter o SHA diretamente do Git no momento da execução;
   - security;
   - SSOT/arquitetura;
   - lint;
   - typecheck;
   - testes;
   - build;
   - E2E público;
   - E2E autenticado;
   - deploy do mesmo SHA;
   - smoke do mesmo SHA.

4. **Promover**
   - somente depois de todas as provas do mesmo candidato;
   - regressão crítica reabre o gate;
   - módulos pós-MVP continuam paused após o primeiro release.

## Definition of Done — MVP READY

O MVP só recebe **READY** quando o mesmo candidato comprovar:

- Business funcional com dados reais e rotas canônicas;
- Mapa funcional com provider Business;
- Perto de mim funcional, com localização/distância truthful;
- Busca funcional, incluindo Busca assistida no escopo autorizado;
- Mensagens Business funcionais com sessão real;
- Notificações funcionais sem reabrir vertical pausada;
- Conta/Auth funcionais com sessão real;
- zero dependência ativa em módulo pausado;
- zero redirect/alias/fallback legado usado como mecanismo de lifecycle;
- security/lint/typecheck/test/build executados de verdade;
- deploy e smoke do mesmo SHA;
- nenhum erro crítico recorrente.

## Onde fica o histórico

- decisões vigentes: `docs/DECISIONS.md`;
- arquitetura vigente: `docs/03-architecture/`;
- estado funcional: `docs/FEATURE-MAP.md` e `docs/SCREEN-MAP.md`;
- estado dos roadmaps: `docs/08-roadmap/README.md`;
- evidências datadas: `docs/08-roadmap/checkpoints/`;
- material superado: `docs/10-archive/`;
- sequência completa de mudanças: histórico do Git.

Documento operacional vivo não deve virar diário de PRs nem fixar SHA como “main atual”, porque isso se torna obsoleto no merge seguinte.
