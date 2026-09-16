# LGPD Export Matrix — Achegue-se

**Status:** CANÔNICO / IMPLEMENTAÇÃO PENDENTE  
**Versão:** v1  
**Arquivo machine-readable:** `LGPD_EXPORT_MATRIX.json`  
**Escopo:** exportação self-service do titular / Art. 18 LGPD

## Regra principal

A exportação do titular deve ser construída por **whitelist explícita de campos**. `select('*')`, joins amplos por `service_role` e exportação de registros compartilhados sem redaction são proibidos.

O fato de uma tabela estar relacionada ao usuário não torna todo o registro automaticamente exportável. A implementação deve distinguir:

1. dados diretamente do titular;
2. dados pertencentes a perfis do titular;
3. registros relacionais compartilhados com terceiros;
4. dados operacionais, de moderação e segurança que precisam de resumo/redaction;
5. secrets/tokens/credenciais que nunca entram no arquivo.

## Contrato de implementação

O handler `user-export-data` só poderá ser liberado quando:

- todas as seções `include`/`includePolicy` da matriz tiverem query explícita;
- nenhuma query necessária falhar silenciosamente;
- qualquer falha de seção obrigatória abortar o export inteiro (`fail-closed`);
- nenhum `select('*')` permanecer;
- campos de terceiros forem removidos ou substituídos por uma representação neutra;
- nenhum provider token, refresh token, push credential ou session token for serializado;
- nenhuma nota interna de moderação, reviewer/admin id ou heurística de segurança for exportada em bruto;
- o JSON final trouxer `format_version`, `generated_at`, cobertura e seção de redactions aplicadas;
- testes estáticos e integração provarem que o source não voltou a usar o schema legado.

## Decisões por domínio

### Conta e Auth

Exportar apenas estado do próprio usuário: identificador, email, telefone, confirmações, datas da conta, último login e `user_metadata` sanitizado. Não exportar `app_metadata`, tokens, provider payloads brutos ou segredos de MFA.

### Perfis e relações

`profiles`, `personal_social_profiles`, `profile_members`, `user_active_profiles`, `user_roles`, `user_residences` e preferências entram apenas quando ligados ao `user_id` do titular ou a perfis que pertencem ao titular. IDs de admins/inviters/reviewers devem ser removidos.

`profile_username_history` e `profile_slug_history` também estão classificados como dados do próprio titular quando o `profile_id` pertence a ele. O payload pode incluir somente o valor anterior, o novo valor e `changed_at`; `changed_by` e `reason` permanecem fora porque podem identificar atores administrativos ou carregar justificativa interna.

### Negócios, profissionais e motoristas

O modelo atual é profile-based. A exportação não pode usar os contratos legados `businesses.owner_id`, `professional_data.user_id`, `driver_profiles.user_id` como fonte de ownership genérica. A seleção deve partir dos `profile.id` pertencentes ao titular e dos campos `owner_user_id` onde existirem explicitamente. Para profissionais, cobertura territorial deve vir exclusivamente de `public.service_areas` ligada por `entity_type='service_provider'` e `entity_id=professional_data.id`; os campos `professional_data.service_areas` e `service_radius_km` são legado e não entram no novo payload.

`business_claims` foi classificada separadamente como solicitação do titular: somente linhas em que `claimer_id` é o usuário autenticado. Podem entrar negócio alvo, status, notas submetidas pelo próprio titular e datas. `documents`, `reviewed_by` e `review_notes` não entram no self-service por conterem evidência sensível ou informação interna de revisão.

### Conteúdo

Exportar apenas conteúdo criado pelo titular: posts, comments, community posts/questions/answers, classificados, **classified comments**, eventos, vagas, oportunidades e publicações de comunicação. Campos de moderação e `removed_by` ficam de fora.

### Participação e ações

A matriz também classifica ações próprias que não são conteúdo autoral: `classified_likes`, `question_answer_likes` e `event_participants`, além das relações comunitárias já mapeadas. Somente a linha pertencente ao usuário/perfil do titular pode entrar.

Credenciais operacionais não fazem parte da portabilidade. Em especial, `event_participants.checkin_code` permanece excluído mesmo quando a participação pertence ao titular.

### Mensagens

Exportar **somente mensagens enviadas por perfis do titular**. É proibido usar `service_role` para retornar conversa/thread inteira, pois isso incluiria mensagens de terceiros.

### Mobilidade e pedidos

Corridas, entregas e pedidos são registros compartilhados. Podem entrar no export quando um perfil do titular participa, mas IDs das contrapartes, dados do destinatário, proof-of-delivery, provider references e metadados operacionais devem ser removidos.

### Billing

Exportar plano, status, valores, moeda e períodos. IDs Stripe, snapshots internos e metadata ficam fora.

### Reports e moderação

O titular pode receber os dados que ele próprio enviou em reports: motivo, descrição, evidências, status e datas. Notas internas, moderation history, reviewer/admin IDs e dados da pessoa reportada ficam fora.

### Analytics e IA

Eventos/uso ligados ao `user_id` podem ser exportados por campos explícitos. Metadata/properties arbitrários não devem ser repassados em bloco. Prompts e resultados gerados pelo próprio usuário podem entrar; custos internos, request IDs e raciocínio de moderação interno ficam fora.

### PII access log

Fornecer resumo de acesso relativo ao titular (`table_name`, `field_name`, operação, motivo/categoria, data, source e retention). IDs de funcionários/admins, IPs, session IDs e amostras internas devem ser removidos.

### Media/Storage

Exportar metadata funcional do arquivo (tipo, tamanho, dimensões, estado e datas). Não exportar `object_path`, `storage_reference`, hashes internos ou URL interna. O binário/documento, quando aplicável, exige uma etapa de export controlada separada.

### Emergency contacts

Nome, telefone e email pertencem a terceiros. O export do titular pode informar que existe um contato, relacionamento e estado, mas não deve replicar os dados pessoais do terceiro.

### Pedidos DPO/LGPD

`public.privacy_subject_requests` e `public.privacy_subject_request_events` estão **classificadas, mas excluídas do export self-service nesta versão**. O ledger aceita pedidos públicos sem sessão, portanto `user_id` pode ser `NULL`; `requester_email` nunca pode ser usado para inferir que um pedido público pertence ao usuário autenticado.

Uma futura inclusão só pode usar uma query explícita limitada a `user_id = authenticated_subject_id`, com campos deliberadamente aprovados e testes próprios. Pedidos públicos não vinculados continuam acessíveis pelo fluxo controlado do DPO, e não por correlação automática no exportador. O histórico de ciclo do caso permanece interno enquanto esse contrato não for desenhado separadamente.

### Push e sessões

`push_subscriptions.endpoint`, `p256dh`, `auth` e quaisquer tokens são secrets. Nunca exportar. `public.user_sessions` também fica fora: não é a autoridade real de sessão e contém campos sensíveis de rede/token.

### Logs internos

`application_logs`, `function_audit`, audit logs privados, rate-limit tables e equivalentes não entram em bloco. Fatos que dizem respeito ao titular devem ser expostos por seções resumidas e deliberadas, nunca por dump de log.

## Fontes classificadas mas ainda não implementadas no handler

A auditoria de completude de 2026-09-16 confirmou fontes pessoais ativas que agora já constam da matriz, mas **ainda não têm query no `user-export-data`**:

- `public.profile_username_history`;
- `public.profile_slug_history`;
- `public.business_claims`;
- `public.classified_comments`;
- `public.classified_likes`;
- `public.question_answer_likes`;
- `public.event_participants`.

Essa lista é deliberadamente um bloqueio de rollout, não autorização de deploy. Enquanto qualquer fonte aprovada da matriz não estiver implementada com ownership e whitelist explícitos, `LGPD_EXPORT_MATRIX_IMPLEMENTATION_COMPLETE` deve permanecer `false`.

## Campos legados proibidos no novo handler

A reescrita não pode voltar a depender de:

- `businesses.owner_id`;
- `ride_requests.passenger_id`;
- `events.organizer_id`;
- `professional_data.user_id` como ownership principal;
- `driver_profiles.user_id` como ownership genérico sem confirmar o `profile_id`;
- `conversation_participants` para dump de conversa;
- `public.user_sessions` como autoridade de sessão.

## Critério para considerar a matriz implementada

A matriz só deixa o status `IMPLEMENTAÇÃO PENDENTE` quando o source de `user-export-data`:

1. cobre as seções aprovadas;
2. contém selects explícitos;
3. aplica redaction nas relações compartilhadas;
4. falha fechado em erro de query obrigatória;
5. registra audit trail sem inserir secrets no log;
6. passa testes com titular sem dados, titular com múltiplos perfis e titular com registros compartilhados;
7. é validado em ambiente não-prod antes de qualquer rollout.
