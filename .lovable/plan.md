
# Plano: Padronização SSOT de Login e Cadastro

## Objetivo
Alinhar `/cadastro`, `/login`, `/esqueci-senha` e `/reset-password` ao mesmo padrão canônico já usado no Login: `react-hook-form` + Zod (`@/shared/validation`), `useAuth`/`AuthService` como boundary, componentes compartilhados e mensagens de erro unificadas.

## Escopo

### 1. Schemas canônicos (`src/shared/validation/schemas/user.schema.ts`)
- Estender com `RegisterAccountStepSchema`, `RegisterLocationStepSchema`, `RegisterConfirmationStepSchema` e `RegisterFullSchema` (união dos 3 steps + `termsAccepted`, `termsVersion`).
- Reutilizar `strongPasswordValidator`, `usernameValidator`, `isValidEmail`.
- Exportar tipos `RegisterAccountStepInput`, etc.

### 2. Componente compartilhado `PasswordInput`
- Criar `src/app/components/auth/PasswordInput.tsx`:
  - Toggle mostrar/ocultar.
  - Indicador de força (usa `getPasswordStrength`).
  - Checklist de requisitos (`getPasswordRequirementStatus`).
  - Aviso de senha comprometida (async, via `checkPasswordCompromise`).
- Usado por Cadastro (senha + confirmar) e Reset Password.

### 3. Refatorar `useCadastro` → `useCadastroForm`
- Substituir estado manual por `useForm` com `zodResolver(RegisterFullSchema)` e `mode: "onBlur"`.
- Steps controlados via `trigger([...campos])` em vez de `validateStep` manual.
- Manter `selectState/selectCity/selectNeighborhood` como helpers que chamam `setValue` + `trigger`.
- `handleSubmit` continua usando `AuthService.signUp` com `termsAcceptance` versionado.

### 4. `CadastroPage.tsx`
- Trocar inputs controlados por `<FormField>` do shadcn (Form, FormControl, FormMessage).
- Usar `PasswordInput` nos campos de senha.
- Remover validações inline duplicadas — depende de `FormMessage`.
- Manter layout responsivo (mobile/desktop) e o wizard 3 steps existente.

### 5. `LoginPage.tsx` — pequenos ajustes
- Já usa `LoginIdentifierSchema` + `useAuth`. Adicionar:
  - `PasswordInput` (sem checklist, só toggle) para unificar UX.
  - Padronizar mapping de erro via `getAuthErrorMessage`.

### 6. `EsqueciSenhaPage` / `ResetPasswordPage`
- Garantir `react-hook-form` + `ForgotPasswordSchema` / `ResetPasswordFormSchema`.
- Reset usa `PasswordInput` completo.

### 7. Testes
- Atualizar `useCadastro.spec.tsx` para o novo hook (`useCadastroForm`) preservando cenários:
  - Termos obrigatórios no step 2.
  - `AuthService.signUp` recebe `termsAcceptance` versionado.
- Novo `PasswordInput.spec.tsx` cobrindo toggle, força e requisitos.
- Smoke test em `LoginPage` garantindo submit chama `useAuth.signIn`.

### 8. Cleanup
- Remover funções `validateStep` manuais e mensagens duplicadas.
- Documentar padrão em `docs/ARCHITECTURE.md` (seção Auth Forms).

## Fora de escopo
- Mudanças em `AuthService`, `SessionService` ou schema de banco.
- Novos providers OAuth.
- Mudanças visuais além das necessárias para o `PasswordInput`.

## Definição de pronto
- `tsgo` verde nos arquivos alterados.
- Testes atualizados passando (`useCadastro.spec`, `PasswordInput.spec`, `LoginPage.spec` se existir).
- Cadastro completo end-to-end funcional em mobile e desktop.
- Nenhuma validação manual de campo restante em `useCadastroForm` — tudo via Zod.

## Detalhes técnicos

```text
src/
├─ shared/validation/schemas/user.schema.ts   (+ Register*StepSchema)
├─ app/components/auth/
│   └─ PasswordInput.tsx                      (novo)
├─ app/features/onboarding/
│   ├─ hooks/useCadastroForm.ts               (substitui useCadastro)
│   ├─ hooks/useCadastroForm.spec.tsx
│   └─ pages/CadastroPage.tsx                 (usa Form/FormField)
└─ app/pages/
    ├─ LoginPage.tsx                          (PasswordInput)
    ├─ EsqueciSenhaPage.tsx                   (RHF + schema)
    └─ ResetPasswordPage.tsx                  (PasswordInput)
```

Ordem de execução: schemas → PasswordInput → useCadastroForm → CadastroPage → Login/Reset → testes.
