# EDUCATION NICHES IMPLEMENTATION GUIDE (SSOT)

## 1) Objetivo

Este guia define o modelo canonico de nichos do modulo `education`, alinhado ao estado real do repositorio.

Objetivo dos nichos:
- especializar UX e regras por tipo de instituicao;
- habilitar recursos por nicho e por plano;
- manter um unico core `education` sem duplicar modulo.

---

## 2) Status atual (snapshot 2026-04-26)

Implementado hoje:
- `types.ts` com contratos de nicho;
- `registry.ts` como SSOT de nichos/capabilities/secoes;
- `EducationNicheConfigService`;
- `useEducationNiche`;
- suite de testes de nichos em `niches/__tests__`.

Nicho keys existentes:
- `regular_school`
- `daycare`
- `language_school`
- `prep_course`
- `technical_school`
- `tutoring_center`
- `music_school`
- `sports_school`

Support levels existentes no codigo:
- `full_enabled`
- `basic_enabled`
- `beta`
- `planned`

Nota importante:
- Este projeto NAO usa `beta_enabled`, `hidden` ou `coming_soon` em `types.ts`.

---

## 3) Estrutura SSOT (estado real)

```txt
src/modules/business/education/niches/
  index.ts
  types.ts
  registry.ts
  services/
    EducationNicheConfigService.ts
  hooks/
    useEducationNiche.ts
  __tests__/
    EducationNicheConfigService.test.ts
    entitlements.test.ts
    index.test.ts
    registry.test.ts
    useEducationNiche.test.tsx
```

---

## 4) Contratos canonicos (types.ts)

Tipos principais:
- `EducationNicheStatus`
- `EducationNicheCapability`
- `EducationAdminSection`
- `EducationNicheConfig`
- `EducationNicheRegistry`
- `EducationNicheValidationResult`
- `EducationNicheVersion`
- `EducationNicheEntitlements`

Capacidades atuais no contrato:
- `basic_programs_catalog`
- `lead_capture`
- `lead_pipeline`
- `events_public`
- `trial_class_booking`
- `whatsapp_cta`
- `document_upload_pre_enrollment`
- `guardian_portal_basic`
- `schedule_public`
- `attendance_tracking`
- `gradebook`
- `transport_tracking`
- `payment_installments`

---

## 5) Registry (fonte unica de verdade)

`registry.ts` e o SSOT para:
- lista de nichos;
- capabilities habilitadas e faltantes;
- secoes admin visiveis;
- support level e metadados de exibicao;
- entitlements por nicho;
- versao por nicho;
- default settings por nicho.

Helpers canonicos:
- `getNicheByKey`
- `getAllNiches`
- `listNiches`
- `getSelectableNiches`
- `getPublicNiches`
- `getAdminNiches`
- `nicheExists`
- `hasCapability`
- `shouldShowAdminSection`
- `getNicheOrDefault`
- guards de limite/entitlement (`canCreateProgram`, `canCreateEvent`, `canReceiveLead`, etc.)

---

## 6) Service e Hook

`EducationNicheConfigService`:
- le configuracao por nicho;
- valida capability e secao admin;
- valida payload por nicho (base);
- calcula capabilities efetivas do nicho;
- define se nicho esta habilitado para uso.

`useEducationNiche` expoe:
- `config`
- `hasCapability`
- `adminSections`
- `shouldShowSection`
- `validateForNiche`
- `isEnabled`, `isPublic`, `isBeta`, `canUseNow`

---

## 7) Entitlements: regra obrigatoria

Regra de negocio que deve permanecer:
- capability final = intersecao entre `capability do nicho` e `entitlement do plano`.

Status hoje:
- o registry ja tem limites/entitlements por nicho;
- a integracao fina com billing por capability deve continuar no service/hook (nao em componente).

---

## 8) Proximo passo (sim, este e o proximo)

Se o objetivo agora e maturidade de nichos, este guia e o proximo passo correto.

Prioridade recomendada:
1. Integrar gating completo `nicho + billing` em pontos criticos (admin/public).
2. Adicionar guard visual padrao de secao admin por capability/plano.
3. Criar banner de upgrade padrao quando bloqueio for por plano.
4. Evitar proliferacao de regras ad-hoc fora de `registry/service/hook`.

---

## 9) Gap atual vs roadmap (opcional, nao bloqueante)

Ainda nao padronizado neste modulo:
- `components/EducationNicheSelector.tsx`
- `components/EducationNicheCapabilitiesList.tsx`
- camada formal `versioning/*` (service/hook/guard/banner dedicados)

Diretriz:
- implementar apenas quando houver uso real imediato;
- manter SSOT no `registry` e no `service`.

---

## 10) Anti-patterns (bloqueio de PR)

- `if (nicheKey === 'x')` espalhado em componentes.
- capability hardcoded fora de `types/registry/service`.
- misturar regra de nicho com regra de billing direto na UI.
- criar submodulo completo por nicho em vez de usar capabilities.

---

## 11) Checklist de execucao (atualizado)

Concluido:
- [x] `types.ts`
- [x] `registry.ts`
- [x] `EducationNicheConfigService`
- [x] `useEducationNiche`
- [x] testes de nichos

Proximo incremento:
- [ ] guard visual admin por capability/plano
- [ ] banner de upgrade padrao
- [ ] hardening da integracao com billing por capability
- [ ] validacao final (`check:ssot`, `validate:migrations`, build/typecheck quando for janela de teste)

---

## 12) Prompt pronto para outra IA (incremental)

```txt
Implemente o proximo incremento de nichos em:
src/modules/business/education/niches

Siga estritamente:
docs/EDUCATION_NICHES_IMPLEMENTATION_GUIDE.md
docs/EDUCATION_MODULE_IMPLEMENTATION_CHECKLIST_SSOT.md

Regras:
1) SSOT no registry/service/hook; sem hardcode em componente.
2) Capability final = nicho + entitlement do plano.
3) Criar guard visual para secoes admin bloqueadas.
4) Criar banner de upgrade para bloqueio de plano.
5) Nao criar estrutura paralela/legada.
6) Entregar com checklist de riscos residuais.
```

