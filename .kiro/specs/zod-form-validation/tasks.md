# Implementation Tasks — Validação Zod em Formulários Frontend

## Overview

Conectar schemas Zod existentes aos formulários críticos via `react-hook-form` + `zodResolver`. Três camadas de prioridade: auth (crítico), business (alto), conteúdo (médio).

**Pré-condições verificadas:**
- `@hookform/resolvers ^3.10.0` ✅ instalado
- `react-hook-form ^7.71.2` ✅ instalado
- `zod ^3.25.76` ✅ instalado
- `fast-check ^4.6.0` ✅ instalado (para testes de propriedade)

---

## Tasks

- [x] 1. Criar componente `InlineFieldError` e adaptar schemas de auth
  - [x] 1.1 Criar `src/shared/components/ui/InlineFieldError.tsx` — componente `<p className="text-destructive text-xs mt-1">` que renderiza `null` quando `message` é undefined
  - [x] 1.2 Adicionar `LoginIdentifierSchema` e `LoginIdentifierInput` em `src/shared/validation/schemas/user.schema.ts` — campo `identifier: z.string().min(1)` + campo `password: z.string().min(1)` (sem validação de formato de email — aceita email ou username)
  - [x] 1.3 Adicionar `ResetPasswordFormSchema` e `ResetPasswordFormInput` em `src/shared/validation/schemas/user.schema.ts` — derivado de `ResetPasswordSchema.omit({ token: true })`
  - [x] 1.4 Exportar os novos tipos e schemas do arquivo `user.schema.ts`

- [x] 2. Migrar `LoginPage` para react-hook-form + zodResolver
  - [x] 2.1 Substituir `useState(identifier)` e `useState(password)` por `useForm<LoginIdentifierInput>({ resolver: zodResolver(LoginIdentifierSchema), mode: 'onBlur' })`
  - [x] 2.2 Derivar `parsedIdentifier` de `watch('identifier')` em vez de `useState`
  - [x] 2.3 Converter `handleLogin` para `onValid(data: LoginIdentifierInput)` passado ao `handleSubmit` — remover guard manual `if (!parsedIdentifier || !password)`
  - [x] 2.4 Adicionar `{...register('identifier')}` e `{...register('password')}` nos campos `<Input>`
  - [x] 2.5 Adicionar `<InlineFieldError message={errors.identifier?.message} />` abaixo do campo identifier e `<InlineFieldError message={errors.password?.message} />` abaixo do campo password
  - [x] 2.6 Manter `pendingAction` como `useState` (controla loading de Google e recovery além do login)
  - [x] 2.7 Verificar que `handleForgotPassword` e `handleGoogleLogin` continuam funcionando sem alterações

- [x] 3. Migrar `ResetPasswordPage` para react-hook-form + zodResolver
  - [x] 3.1 Substituir `useState(password)` e `useState(confirmPassword)` por `useForm<ResetPasswordFormInput>({ resolver: zodResolver(ResetPasswordFormSchema), mode: 'onBlur' })`
  - [x] 3.2 Derivar `passwordRequirements` de `watch('newPassword')` via `getAuthPasswordRequirementStatus(watch('newPassword') ?? '')`
  - [x] 3.3 Converter `handleSubmit` para `onValid(data: ResetPasswordFormInput)` — remover chamadas a `validateAuthPassword` e guard `password !== confirmPassword`
  - [x] 3.4 Adicionar `{...register('newPassword')}` e `{...register('confirmNewPassword')}` nos campos `<Input>`
  - [x] 3.5 Adicionar `<InlineFieldError>` abaixo de `newPassword` e `confirmNewPassword`
  - [x] 3.6 Manter `recoveryState` como `useState` e preservar lógica de verificação de link
  - [x] 3.7 Manter `showPassword` como `useState` (controla visibilidade, não é estado de formulário)

- [x] 4. Migrar `ChangePasswordForm` para estado interno com react-hook-form
  - [x] 4.1 Alterar assinatura de props para `{ onSave: (data: UpdatePasswordInput) => Promise<void>; onCancel: () => void }` — remover props `newPassword`, `confirmPassword`, `showPassword`, `loading`, `onNewPasswordChange`, `onConfirmPasswordChange`, `onToggleShow`
  - [x] 4.2 Adicionar `useForm<UpdatePasswordInput>({ resolver: zodResolver(UpdatePasswordSchema), mode: 'onBlur' })` internamente ao componente
  - [x] 4.3 Derivar `passwordStrength` e `passwordRequirements` de `watch('newPassword')` em vez de props
  - [x] 4.4 Manter `showPassword` como `useState` interno ao componente
  - [x] 4.5 Converter botão "Alterar Senha" para `type="submit"` com `handleSubmit(onSave)` — remover chamada direta a `onSave()` no `onClick`
  - [x] 4.6 Adicionar `<InlineFieldError>` abaixo de cada campo (`currentPassword`, `newPassword`, `confirmNewPassword`)
  - [x] 4.7 Chamar `reset()` após submissão bem-sucedida
  - [x] 4.8 Atualizar `PerfilContaPage` para remover `useState` de `newPassword` e `confirmPassword` e adaptar para nova interface do `ChangePasswordForm`

- [-] 5. Migrar `EmpresaEditSheet` para react-hook-form + zodResolver (campos cobertos pelo schema)
  - [-] 5.1 Verificar existência de `src/modules/business/components/EmpresaEditSheet.tsx` — se não existir, usar `EditarEmpresaPage.tsx`
  - [ ] 5.2 Adicionar `useForm({ resolver: zodResolver(updateBusinessSchema), mode: 'onBlur', defaultValues: mapBizToSchema(biz) })` ao componente
  - [ ] 5.3 Aplicar `{...register(...)}` nos campos: `name`, `description`, `category`, `phone`, `whatsapp`, `email`, `website`
  - [ ] 5.4 Adicionar `<InlineFieldError>` abaixo de cada campo validado
  - [ ] 5.5 Remover guard manual `if (!form.name.trim())` e demais validações inline no `handleSave`
  - [ ] 5.6 Converter `handleSave` para `onValid(data)` passado ao `handleSubmit`
  - [ ] 5.7 Manter `useState` para campos fora do schema (`schedule`, `modos_atendimento`, `especialidades`, `formas_pagamento`, `facilidades`, `logo`, `capa`)

- [ ] 6. Migrar formulários de conteúdo para react-hook-form + zodResolver
  - [ ] 6.1 Criar `src/shared/validation/schemas/lostfound.schema.ts` com `NovoAchadoPerdidoSchema` (campos: `tipo`, `category`, `titulo`, `description`, `neighborhood`, `localizacaoAprox`, `dateOcorrido`, `latitude`, `longitude`)
  - [ ] 6.2 Migrar `NovoAchadoPerdidoPage` — substituir `useState(form)` por `useForm<NovoAchadoPerdidoInput>` com `zodResolver`; campos `tipo` e `category` (botões de seleção) usam `Controller`; remover guard manual no `handleSubmit`
  - [ ] 6.3 Criar `src/shared/validation/schemas/dpo.schema.ts` com `DPOContactSchema` (campos: `name`, `email`, `requestType`, `subject`, `message`)
  - [ ] 6.4 Migrar `DPOContactPage` — substituir `useState<ContactFormData>` por `useForm<DPOContactInput>` com `zodResolver`; campo `requestType` (Select) usa `Controller`; remover guard `if (!data.requestType)` no `mutationFn`
  - [ ] 6.5 Criar `src/modules/guide/schemas/touristPoint.schema.ts` com `TouristPointFormSchema`
  - [ ] 6.6 Adicionar `resolver: zodResolver(TouristPointFormSchema)` ao `useForm` existente em `AdminTouristPointFormPage` — substituir `FormValues` local pelo tipo inferido do schema

- [ ] 7. Deprecar `validateAuthPassword` e executar typecheck
  - [ ] 7.1 Adicionar `@deprecated` com comentário em `validateAuthPassword` em `src/core/auth/utils/passwordPolicy.ts` — indicar `strongPasswordValidator` como substituto
  - [ ] 7.2 Executar `npx tsc --noEmit` e corrigir erros de tipo introduzidos pelas migrações
  - [ ] 7.3 Verificar que nenhum dos formulários migrados chama `validateAuthPassword` diretamente no handler de submissão

- [ ] 8. Escrever testes de propriedade (PBT) com fast-check
  - [ ] 8.1 Criar `src/shared/validation/schemas/__tests__/user.schema.test.ts` com Property 1 (`LoginIdentifierSchema` aceita qualquer identifier não-vazio), Property 2 (rejeita campos vazios com mensagem correta), Property 5 (schema de senha rejeita confirmações divergentes)
  - [ ] 8.2 Criar `src/shared/schemas/business/__tests__/businessSchemas.test.ts` com Property 6 (`updateBusinessSchema` rejeita formatos inválidos de email, phone, website)
  - [ ] 8.3 Criar `src/shared/validation/schemas/__tests__/lostfound.schema.test.ts` com Property 7 (schema rejeita campos obrigatórios vazios)
  - [ ] 8.4 Criar `src/shared/validation/schemas/__tests__/dpo.schema.test.ts` com Properties 7 e 8 (campos obrigatórios + email inválido)
  - [ ] 8.5 Executar `npm test` e verificar que todos os testes de propriedade passam
