# EDUCATION NICHES IMPLEMENTATION GUIDE (SSOT)

## 1) Objetivo

Este guia define como implementar **nichos de Education** no mesmo padrão arquitetural dos nichos de Gastronomia, sem duplicar módulo e mantendo SSOT.

Objetivo dos nichos:
- especializar UX e regras por tipo de escola/curso;
- habilitar recursos por nicho e por plano;
- manter um único core `education`.

---

## 2) Escopo dos nichos no MVP

## 2.1 Nichos iniciais (MVP)
- `regular_school`
- `daycare`
- `language_school`
- `prep_course`
- `technical_school`
- `tutoring_center`
- `music_school`
- `sports_school`

## 2.2 Status de suporte
Usar o mesmo conceito de status da Gastronomia:
- `full_enabled`
- `basic_enabled`
- `beta_enabled`
- `hidden`
- `coming_soon`

Recomendação inicial:
- `basic_enabled`: `regular_school`, `daycare`, `language_school`, `prep_course`
- `beta_enabled`: `technical_school`, `tutoring_center`, `music_school`, `sports_school`

---

## 3) Estrutura de pastas

```txt
src/modules/business/education/niches/
  index.ts
  README.md
  types.ts
  registry.ts
  presets/
    base.ts
    regularSchool.ts
    daycare.ts
    languageSchool.ts
    prepCourse.ts
    technicalSchool.ts
    tutoringCenter.ts
    musicSchool.ts
    sportsSchool.ts
  services/
    EducationNicheConfigService.ts
  hooks/
    useEducationNiche.ts
  components/
    EducationNicheSelector.tsx
    EducationNicheCapabilitiesList.tsx
  versioning/
    EducationNicheVersioningService.ts
    hooks/
      useEducationNicheVersioning.ts
    components/
      EducationAdminSectionGuard.tsx
      EducationNicheUpgradeBanner.tsx
```

---

## 4) Contratos canônicos (types.ts)

## 4.1 Tipos principais
- `EducationNicheStatus`
- `EducationNicheCapability`
- `EducationAdminSection`
- `EducationNicheConfig`
- `EducationNicheRegistry`
- `EducationNicheValidationResult`

## 4.2 Capacidades sugeridas
- `basic_programs_catalog`
- `lead_capture`
- `lead_pipeline`
- `events_public`
- `trial_class_booking`
- `whatsapp_cta`
- `document_upload_pre_enrollment`
- `guardian_portal_basic`
- `schedule_public`
- `attendance_tracking` (futuro)
- `gradebook` (futuro)
- `transport_tracking` (futuro)
- `payment_installments` (futuro)

## 4.3 Seções admin sugeridas
- `basic_profile`
- `programs`
- `leads`
- `events`
- `analytics`
- `documents`
- `guardians`
- `attendance` (futuro)
- `grades` (futuro)
- `transport` (futuro)

---

## 5) Registro de nichos (registry.ts)

`registry.ts` é a única fonte de verdade para:
- lista de nichos;
- capacidades habilitadas;
- seções admin visíveis;
- status/ordem de exibição;
- mapeamentos de fallback.

Helpers obrigatórios (mesmo padrão da Gastronomia):
- `getNicheByKey`
- `getAllNiches`
- `listNiches(filters)`
- `getSelectableNiches`
- `getPublicNiches`
- `getAdminNiches`
- `nicheExists`
- `hasCapability`
- `shouldShowAdminSection`
- `getNicheOrDefault`

---

## 6) Service de nichos

Criar `EducationNicheConfigService` com responsabilidades:
- leitura de config de nicho;
- validação de capabilities;
- validação de visibilidade de seções admin;
- validação de dados por nicho;
- resolução de fallback de nicho.

Regras:
- sem acesso direto a UI;
- sem dependência de componente;
- sem regra duplicada fora do service/registry.

---

## 7) Hook de nichos

`useEducationNiche` deve expor:
- `config`
- `hasCapability(capability)`
- `adminSections`
- `shouldShowSection(section)`
- `validateForNiche(payload)`
- `isEnabled`, `isPublic`, `isBeta`, `canUseNow`

Uso esperado:
- telas admin ocultam seções por nicho;
- telas públicas variam blocos por capability.

---

## 8) Versionamento de nichos

Criar `EducationNicheVersioningService` para evolução de recursos por nicho sem quebra.

Objetivo:
- permitir rollout gradual de capacidades;
- controlar upgrades de plano/nicho;
- exibir banner de upgrade quando necessário.

Mínimo:
- matriz de capabilities por `supportLevel`;
- função para calcular capabilities efetivas por `niche + entitlements`;
- histórico de alterações de versão (changelog simples).

---

## 9) Entitlements + nichos (regras)

Capability final de uma escola = interseção entre:
1. capabilities do nicho;
2. entitlements do plano.

Regra obrigatória:
- capability só pode ser usada se **nicho permitir** e **plano permitir**.

Exemplo:
- nicho permite `document_upload_pre_enrollment`, mas plano não -> recurso bloqueado + banner de upgrade.

---

## 10) Mapeamento de UX por nicho

## 10.1 Padrão público
- `profile_basic` (sem premium)
- `landing_premium` (com premium)

## 10.2 Variações por nicho (exemplos)
- `daycare`: destaque para rotina, segurança, período integral.
- `language_school`: destaque para níveis, metodologia, certificação.
- `prep_course`: destaque para resultado, calendário de turma, simulados.
- `sports_school`: destaque para modalidade, idade, agenda de treinos.

Importante:
- variar conteúdo/blocos por capabilities;
- manter layout base consistente para evitar fragmentação.

---

## 11) Modelo de dados (suporte a nicho)

Adicionar em `education_profiles`:
- `niche_key text not null default 'regular_school'`
- `support_level text not null default 'basic_enabled'`
- `niche_config_overrides jsonb not null default '{}'::jsonb`

Regras:
- `niche_key` deve existir no registry;
- `support_level` validado por constraint;
- overrides só para ajustes leves, nunca para burlar registry.

---

## 12) Rollout sugerido

1. Implementar nichos básicos com capabilities comerciais.
2. Ligar apenas `regular_school` em produção inicial.
3. Liberar outros nichos por feature flag.
4. Coletar métricas de adoção por nicho.
5. Expandir para nichos beta com base em tração.

---

## 13) Testes obrigatórios

## 13.1 Unitários
- `registry`: listagem, filtros, fallback.
- `hasCapability` e `shouldShowAdminSection`.
- validação de payload por nicho.

## 13.2 Integração
- render condicional de seções admin por nicho.
- bloqueio de capability por plano.
- fallback de nicho inexistente para padrão.

## 13.3 Não-regressão
- mudar nicho não quebra rotas públicas.
- mudar plano reflete capabilities sem quebrar dados.

---

## 14) Anti-padrões proibidos

- `if (nicheKey === 'x')` espalhado em componentes.
- capabilities hardcoded fora de `types/registry/service`.
- criar “submódulo completo por nicho” em vez de usar capabilities.
- misturar regra de nicho com regra de billing no componente.

---

## 15) Checklist de implementação

- [ ] criar `types.ts` de nichos education.
- [ ] criar presets de nicho com factory `base.ts`.
- [ ] criar `registry.ts` com helpers.
- [ ] criar `EducationNicheConfigService`.
- [ ] criar `useEducationNiche`.
- [ ] criar componentes `Selector` e `CapabilitiesList`.
- [ ] criar versioning service + guard + upgrade banner.
- [ ] integrar `niche_key` em setup/admin/profile público.
- [ ] adicionar testes unitários e integração.
- [ ] validar `typecheck`, `lint`, `validate:ssot`, `check:ssot`, `build`.

---

## 16) Prompt pronto para outra IA

```txt
Implemente o sistema de nichos em src/modules/business/education/niches
seguindo estritamente:
docs/EDUCATION_NICHES_IMPLEMENTATION_GUIDE.md
e
docs/EDUCATION_MODULE_IMPLEMENTATION_CHECKLIST_SSOT.md

Regras:
1) SSOT rigoroso (registry unico de nichos).
2) Sem hardcode de capabilities em componentes.
3) Capability final = nicho + entitlement do plano.
4) Criar service, hook, versioning e guards de admin.
5) Cobrir com testes.
6) Nao finalizar ate validadores passarem.
```

