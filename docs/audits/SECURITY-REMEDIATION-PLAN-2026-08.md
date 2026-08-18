# Plano de Remediação e Melhoria de Segurança — 2026-08

Status: ATIVO  
Início: 2026-08-18  
Fonte: auditoria registrada em [`MASTER_REPORT.md`](./MASTER_REPORT.md)  
Execução: acompanhar em [`SECURITY-IMPLEMENTATION-CHECKLIST.md`](./SECURITY-IMPLEMENTATION-CHECKLIST.md)

## 1. Objetivo

Converter os achados da auditoria em trabalho implementável, verificável e reversível, sem reabrir boundaries arquiteturais congelados e sem introduzir um segundo SSOT para segurança.

## 2. Princípios obrigatórios

1. **Fail closed** para autorização, storage sensível e funções privilegiadas.
2. **Sem correção só documental**: cada controle técnico deve produzir evidência executável quando possível.
3. **Sem quebra silenciosa de contrato**: mudanças em RLS/RPC/Storage exigem teste de acesso positivo e negativo.
4. **Service role nunca no browser**.
5. **Webhooks públicos usam autenticidade do provedor**, não JWT artificial.
6. **Mudanças de banco via migration versionada**, nunca ajuste manual sem representação no repositório.
7. **Um SSOT por regra**: documentação explica; scripts/tests/policies provam.
8. **Sem mass refactor durante hardening**: reduzir blast radius.

## 3. Priorização

### P0 — Bloqueadores de incidente

Nenhum incidente crítico confirmado no snapshot de 2026-08-18. Se qualquer evidência sensível já tiver sido gravada em bucket público, credencial real for encontrada no histórico ou bypass de RLS/admin for reproduzido, o item correspondente sobe imediatamente para P0 e exige rotação/containment antes de feature work.

### P1 — Executar primeiro

#### SEC-001 — Tornar `safety-evidence` privado

**Objetivo:** impedir acesso público a evidências de safety/moderação.

Implementação:

- [ ] Confirmar novamente que não existem objetos públicos dependentes de URL estável.
- [ ] Criar migration/configuração reproduzível para `public = false`.
- [ ] Definir policies explícitas de `storage.objects` para upload/leitura somente por atores autorizados.
- [ ] Não usar signed URL como substituto de policy de ownership/authority.
- [ ] Gerar signed URLs curtas apenas no fluxo autorizado que realmente precisa entregar o arquivo.
- [ ] Cobrir acesso anônimo, usuário não relacionado, autor/relator autorizado e admin/moderação.

Critérios de aceite:

- acesso direto anônimo retorna negação;
- usuário A não lê evidência de usuário B sem autoridade;
- fluxo autorizado continua funcionando;
- nenhuma service-role key é exposta ao cliente;
- teste/probe automatizado entra no repositório.

Rollback: reverter migration somente se o fluxo operacional falhar e houver contenção alternativa documentada. Nunca manter público como workaround permanente.

#### SEC-002 — Ativar proteção contra senhas comprometidas

Implementação:

- [ ] Ativar leaked-password protection no Supabase Auth.
- [ ] Executar `npm run security:auth:hibp` e atualizar o probe se necessário.
- [ ] Validar signup/change-password/reset-password.
- [ ] Garantir mensagem segura e compreensível ao usuário, sem revelar dados de terceiros.

Critérios de aceite:

- configuração remota confirmada;
- senha conhecida como comprometida é rejeitada no fluxo coberto;
- senhas válidas continuam aceitas;
- CI/probe detecta regressão futura.

#### SEC-003 — Fixar `search_path` em funções privilegiadas relevantes

Implementação:

- [ ] Exportar lista atual do advisor para baseline.
- [ ] Classificar funções por privilégio: `SECURITY DEFINER`, mutação sensível, leitura pública, helper interno.
- [ ] Priorizar funções `SECURITY DEFINER` e funções que tocam billing/admin/moderação/messaging/private data.
- [ ] Definir `SET search_path` mínimo e qualificar objetos críticos quando apropriado.
- [ ] Não aplicar alteração mecânica em massa sem testes de contrato.

Critérios de aceite:

- warnings críticos eliminados ou aceitos com justificativa explícita;
- autorização positiva/negativa permanece igual;
- migration remote drift = zero;
- `npm run validate:migrations` e `npm run validate:migrations:remote` passam.

#### SEC-004 — Revisar views privilegiadas

Implementação:

- [ ] Enumerar views apontadas pelo advisor.
- [ ] Para cada uma, declarar necessidade de owner authority ou migrar para invoker semantics.
- [ ] Verificar se a view consegue revelar colunas que a tabela base/RLS não deveria revelar.
- [ ] Adicionar probe de usuário A vs usuário B para qualquer view com dados privados.

Critério de aceite: nenhuma view privilegiada permanece sem justificativa e teste correspondente.

### P2 — Hardening de superfície

#### SEC-005 — Limites de buckets

- [ ] Definir `file_size_limit` coerente por bucket.
- [ ] Definir MIME allowlist por tipo de mídia.
- [ ] Validar extensão, MIME real e processamento server-side quando aplicável.
- [ ] Cobrir `ai-images`, `tryon-images` e demais buckets sem limites explícitos.
- [ ] Não aceitar SVG/HTML em superfícies que possam executar conteúdo ativo sem sanitização/isolamento.

Critérios de aceite: upload fora de tamanho/MIME falha antes de persistência e os fluxos válidos não quebram.

#### SEC-006 — Fechar escrita anônima de analytics/views

- [ ] Identificar tabelas/policies com `WITH CHECK (true)` ou equivalente para `anon`.
- [ ] Distinguir telemetria legitimamente anônima de dados de negócio.
- [ ] Preferir RPC/Edge Function estreita com payload mínimo.
- [ ] Aplicar rate limit, deduplicação/idempotência e normalização server-side.
- [ ] Impedir que o cliente escolha campos de autoridade, user_id, owner_id ou métricas agregadas.

Critérios de aceite: abuso trivial não consegue inflar métricas sem limite nem inserir colunas arbitrárias.

#### SEC-007 — Remover ambientes efetivos do versionamento

- [ ] Inventariar `.env*` versionados.
- [ ] Classificar valores como públicos/client-safe vs segredos.
- [ ] Se qualquer segredo real ou antigo for encontrado, rotacionar antes da limpeza.
- [ ] Manter apenas `.env.example`/templates sem valores sensíveis.
- [ ] Adicionar validação CI contra novos arquivos de ambiente proibidos.
- [ ] Preservar `VITE_*` públicos somente quando forem realmente destinados ao browser.

Critério de aceite: nenhum segredo/ambiente efetivo é requisito do checkout e o deploy continua reproduzível por secrets/configuration do provedor.

### P3 — Escala, manutenção e prova contínua

#### SEC-008 — Otimizar RLS e policies sobrepostas

- [ ] Capturar baseline do advisor antes da mudança.
- [ ] Corrigir padrões de avaliação repetida de `auth.*()`/initplan onde recomendado.
- [ ] Consolidar policies permissivas redundantes sem alterar semântica.
- [ ] Medir queries críticas com `EXPLAIN (ANALYZE, BUFFERS)` em ambiente seguro/staging.
- [ ] Priorizar feed, search, dashboards, messaging e listas administrativas.

Critérios de aceite: redução mensurável de warnings/custo sem expansão do conjunto de linhas visíveis.

#### SEC-009 — Eliminar sincronização manual de security config

- [ ] Identificar valores duplicados entre `src/config/security.config.ts`, Edge `_shared/security.ts`, Vercel/CSP e scripts.
- [ ] Escolher representação canônica declarativa ou validador de equivalência.
- [ ] Falhar CI quando houver drift material.
- [ ] Não compartilhar código Node/browser diretamente com Deno se isso aumentar acoplamento/runtime incompatível; gerar/validar é preferível.

Critério de aceite: drift é detectável automaticamente antes do deploy.

#### WEB-001 — Auditoria pública e SEO operacional

- [ ] Testar homepage e rotas críticas em desktop/mobile.
- [ ] Validar console errors, requests falhando, CSP e Turnstile.
- [ ] Validar `robots.txt`, sitemap, canonical, OpenGraph e indexabilidade.
- [ ] Rodar fluxos anônimo/autenticado essenciais com Playwright.
- [ ] Registrar evidência de produção sem incluir PII/secrets.

Critério de aceite: smoke público reproduzível e sem erro crítico de console/rede nos fluxos de lançamento.

## 4. Testes ofensivos obrigatórios após P1

Criar/expandir probes para:

- usuário A lendo/mutando usuário B;
- business A acessando business B;
- usuário comum chamando RPC/admin view;
- usuário inativo/banido;
- anônimo tentando acessar dados privados;
- membro removido tentando acessar thread/mensagem;
- acesso direto a attachments/evidence;
- spoofing de owner/user/business IDs em payloads;
- replay de webhook;
- webhook com assinatura inválida;
- request oversized/content-type inválido;
- signed URL expirada/reutilizada além da janela esperada.

## 5. Definition of Done para cada item

Um item só pode ser marcado como concluído quando possuir:

- mudança técnica versionada quando aplicável;
- teste/probe positivo e negativo;
- evidência de validação local/CI/remota;
- rollback ou estratégia de recuperação definida para mudanças de infra;
- atualização do checklist;
- atualização de documentação canônica se a regra mudou;
- nenhum novo warning de severidade maior introduzido.

## 6. Sequência recomendada de PRs

1. **PR A — documentação e baseline**: este plano, índice, checklist e matriz.
2. **PR B — storage safety + bucket limits**: SEC-001 e parte de SEC-005.
3. **PR C — auth compromised passwords**: SEC-002 + probe.
4. **PR D — privileged DB hardening**: SEC-003 + SEC-004 em lotes pequenos.
5. **PR E — anonymous analytics boundary**: SEC-006.
6. **PR F — environment/secrets hygiene**: SEC-007.
7. **PR G — RLS performance**: SEC-008, guiado por medições.
8. **PR H — security-config drift automation**: SEC-009.
9. **PR I — public production/SEO verification**: WEB-001 e automação de smoke.

Evitar juntar todos os hardenings em uma migration/PR gigante. Segurança deve ser revisável e reversível.

## 7. Gate de release durante o plano

Antes de produção, executar pelo menos:

```bash
npm run security:validate
npm audit --audit-level=high
npm run validate:migrations
npm run validate:migrations:remote
npm run validate:security-authority
npm run validate:ssot
npm run validate:hardcodes
npm run validate:architecture:incremental
npm run validate:docs-structure
node scripts/verify-deploy-ready.mjs
```

Para alterações específicas, executar também os probes do domínio afetado (`security:profiles:pii-probe`, `security:entities:private-data-probe`, `security:messaging:authz-probe`, `security:moderation:authz-probe`, etc.).

## 8. Regra para novas descobertas

Novo achado deve receber ID, severidade, classe, evidência, owner, critério de aceite e teste de regressão. Não adicionar itens vagos como “melhorar segurança” ao checklist.
