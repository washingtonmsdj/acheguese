# Achegue-se — Execução main-only e prontidão MVP

**Status:** ATIVO — SSOT OPERACIONAL  
**Atualizado:** 2026-10-05  
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

- corrigir causa raiz; não introduzir paliativo;
- não criar redirect/alias/fallback para preservar arquitetura antiga;
- não manter duas autoridades para a mesma responsabilidade;
- não consultar módulo pausado apenas para montar UI escondida;
- não importar implementação interna entre módulos;
- não mover lifecycle para `core` ou `modules`; a composição pertence à camada `app`;
- preservar código pós-MVP somente quando isolado do runtime ativo;
- remover código órfão/documento supersedido somente com prova de não uso;
- migrations históricas permanecem imutáveis quando necessárias ao ledger/proveniência;
- merge/commit não equivale a produção validada.

## Estado técnico do núcleo

O corte estrutural do MVP está consolidado:

- Business é o único domínio público ativo;
- Map, Nearby, Search e Messaging usam providers lifecycle-scoped;
- Notifications mantém ownership horizontal e governa ações pela policy de lifecycle;
- rotas e prefetch ativos não montam módulos pausados;
- Central/Conta não anunciam verticais pausadas;
- Business/Profile ativos recebem lifecycle pela camada `app`;
- Busca assistida autoriza intents explicitamente na camada `app`;
- URLs sem owner ativo chegam ao 404 canônico, sem redirect de compatibilidade.

### Frontend Finish do MVP

A convergência visual das superfícies ativas está em fase final:

- catálogo de Empresas alinhado à identidade petróleo/teal;
- detalhe público com shell responsivo alinhado ao catálogo;
- Central da empresa repaginada;
- Perto de mim repaginado;
- Busca com copy pública humanizada;
- criação e edição de empresa alinhadas em Identidade → Contato e local → Apresentação;
- horário noturno tratado no owner canônico de Business Hours.

O restante é acabamento e consistência visual, não abertura de nova feature.

## Estado da certificação externa

### Supabase / #305 — encerrado

#305 foi concluído após smoke autenticado real em produção. O incidente final de autorização foi um embed direto da tabela privada `profiles` dentro de uma leitura de Business; a correção passou a usar o boundary canônico de Profile e não abriu grants/RLS.

### Release/Vercel / #445 — aberto

#445 permanece o blocker atual de certificação.

O mecanismo de release já distingue corretamente:

- `exact`: o source SHA corresponde ao runtime implantado e o status do provider é exigido;
- `equivalent`: o source SHA difere apenas por mudanças fora do deploy tree, mas o fingerprint deploy-relevant é idêntico ao runtime Production comprovado.

Em `equivalent`, o status Vercel do commit não-deploy é corretamente ignorado; não existe bypass de identidade. A última execução comprovou release identity válida, broker OIDC funcional e Conta autenticada em mobile/tablet/desktop.

O smoke ainda não chegou ao fim porque o Business lifecycle iniciou um novo processo Playwright sem as variáveis públicas `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY`, apesar de o job já possuir os equivalentes `E2E_SUPABASE_*`. Essa é uma falha do harness de certificação, não do runtime Production nem do data plane.

A correção aceitável é manter runtime e harness apontando para o mesmo endpoint/key públicos; é proibido adicionar service-role key, relaxar release identity, alterar Auth/RLS ou criar commit artificial de runtime.

#445 só fecha quando o push da `main` comprovar, na mesma cadeia de release:

1. identidade `exact` ou `equivalent` válida;
2. broker autenticado;
3. Conta;
4. Business lifecycle;
5. Business Messaging;
6. aggregate `All Tests Passed`.

## Ordem de execução até MVP READY

1. **Fechar #445**
   - corrigir o env público do smoke autenticado;
   - executar Conta + Business + Business Messaging;
   - manter identidade de release e boundaries de segurança intactos.

2. **Fechar Frontend Finish e higiene final**
   - concluir revisão responsiva/visual das superfícies ativas;
   - remover somente código/documentação comprovadamente obsoletos;
   - preservar base pós-MVP com owner legítimo.

3. **Continuar hardening apenas por evidência**
   - priorizar superfícies ativas do MVP;
   - não alterar grants/RLS apenas para silenciar Advisor;
   - manter LGPD avançado fail-closed até certificação própria.

4. **Promover**
   - somente depois de todas as provas aplicáveis ao mesmo conteúdo de runtime;
   - regressão crítica reabre o gate;
   - módulos pós-MVP continuam paused após o primeiro release.

## Definition of Done — MVP READY

O MVP só recebe **READY** quando comprovar:

- Business funcional com dados reais e rotas canônicas;
- Mapa funcional com provider Business;
- Perto de mim funcional;
- Busca funcional;
- Mensagens Business funcionais com sessão real;
- Notificações funcionais sem reabrir vertical pausada;
- Conta/Auth funcionais com sessão real;
- zero dependência ativa em módulo pausado;
- zero redirect/alias/fallback legado usado como lifecycle;
- security/lint/typecheck/test/build executados de verdade;
- release identity válida e smoke autenticado completo;
- deployment `READY` quando houver delta deploy-relevant;
- nenhum erro crítico recorrente.

## Onde fica o histórico

- decisões vigentes: `docs/DECISIONS.md`;
- arquitetura vigente: `docs/03-architecture/`;
- estado funcional: `docs/FEATURE-MAP.md` e `docs/SCREEN-MAP.md`;
- estado dos roadmaps: `docs/08-roadmap/README.md`;
- evidências datadas: `docs/08-roadmap/checkpoints/`;
- material superado: `docs/10-archive/`;
- sequência completa de mudanças: histórico do Git.

Documento operacional vivo não deve virar diário de PRs nem fixar SHA como “main atual”.
