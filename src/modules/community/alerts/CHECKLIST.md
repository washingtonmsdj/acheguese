# Checklist de Aceitação — Community Alerts V1

## Critérios obrigatórios

- [x] Alerta não é tratado como post comum — entidade própria, tabela própria, service próprio
- [x] Sem categoria livre — 8 categorias fechadas com CHECK constraint no banco
- [x] Integração com SSOT territorial — `location_id` como fonte de verdade
- [x] Privacidade mantida — coordenadas são centroide do território, não do usuário
- [x] Expiração automática — expires_at calculado na RPC, job fn_expire_community_alerts() atualiza status
- [x] Validação backend — RPC SECURITY DEFINER valida elegibilidade, termos proibidos, rate limit, dedup
- [x] Bloqueio de termos proibidos — tabela alert_blocked_terms consultada na RPC (server-side)
- [x] Report de abuso — community_alert_reports com UNIQUE por usuário/alerta, trigger atualiza report_count
- [x] Estados/status do alerta — ativo | encerrado | expirado | removido (sem "atualizado" como status)
- [x] Feature flag — VITE_FEATURE_COMMUNITY_ALERTS controla visibilidade da seção inteira
- [x] SSOT real — nenhum componente/hook acessa banco diretamente; toda lógica em services

## Segurança

- [x] INSERT direto bloqueado por RLS (policy WITH CHECK false)
- [x] author_profile_id derivado pela RPC, nunca enviado pelo cliente
- [x] author_user_id nunca exposto na view pública
- [x] trust_snapshot tipado e imutável após criação
- [x] under_review sticky — só moderador limpa via reviewed_cleared
- [x] Remoção automática por reports: NUNCA — apenas moderador humano remove

## Arquitetura

- [x] Módulo único em src/modules/community/alerts/ — sem dual SSOT
- [x] Hierarquia: SQL → RPC → Service → Hook → Component
- [x] Tipos centralizados em domain/types.ts
- [x] Config centralizada em config/alertConfig.ts
- [x] Schemas Zod em schemas/alertSchema.ts
- [x] Barrel export em index.ts (apenas API pública)

## Banco de dados

- [x] 4 tabelas: community_alerts, community_alert_reports, community_alert_audit, alert_notification_queue
- [x] 1 tabela de config: alert_blocked_terms
- [x] Integração territorial: location_id (FK para locations), latitude/longitude (centroide)
- [x] Índices territoriais: idx_ca_location_status, idx_ca_location_dedup, idx_ca_location_spatial
- [x] Índices para feed, rate limit, expiração, reports, audit, fila
- [x] Constraints de consistência lógica (chk_happening_risky, chk_min_informative)
- [x] Trigger de report_count com under_review sticky
- [x] Trigger de updated_at automático
- [x] RPC create_community_alert com SECURITY DEFINER (valida location_id, deriva centroide)
- [x] RLS em todas as tabelas
- [x] View community_alerts_public sem campos sensíveis

## UX

- [x] Modal multi-etapas (5 etapas estruturadas)
- [x] Checkboxes de confirmação obrigatórios
- [x] Contador de caracteres na descrição
- [x] Validação de consistência lógica (is_happening_now + still_risky)
- [x] Card visual próprio com badge de categoria, status, countdown de expiração
- [x] Badge "relato indireto" quando seen_personally = false
- [x] Aviso "situação pode ter se encerrado" quando still_risky = false
- [x] Dialog de report com motivos estruturados
- [x] Seção colapsável no feed, separada dos posts comuns

## Notificações

- [x] Assíncronas via alert_notification_queue (não travam criação)
- [x] Retry com attempt_count, processing_started_at (lock otimista), last_error
- [x] Distribuição por bairro + cidade no V1
- [x] Arquitetura pronta para expansão (raio geográfico, bairros adjacentes)

## Pendente para produção

- [ ] Configurar pg_cron para fn_expire_community_alerts() (a cada 5 min)
- [ ] Configurar worker/Edge Function para alert_notification_queue
- [ ] Ativar VITE_FEATURE_COMMUNITY_ALERTS="true" no ambiente desejado
- [ ] Popular alert_blocked_terms com termos adicionais conforme necessário
- [ ] Revisar e ajustar seed de termos proibidos (006_seed_blocked_terms.sql)
- [ ] Testar RLS com usuário sem role de moderador
- [ ] Testar RPC com conta nova (< 7 dias) e sem telefone verificado
