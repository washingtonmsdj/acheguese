# Design Document — Validação Zod em Formulários Frontend (`zod-form-validation`)

## Overview

Este design cobre a migração dos formulários críticos do frontend para `react-hook-form` com `zodResolver`, conectando os schemas Zod já existentes em `src/shared/validation/schemas/` e `src/shared/schemas/business/` aos componentes de formulário. O objetivo é substituir validação manual dispersa (guards `if (!field.trim())`, chamadas diretas a `validateAuthPassword`, toasts de erro de campo) por feedback estruturado por campo via `FieldError` inline.

**Escopo em três camadas:**
1. **Crítico (auth):** `LoginPage`, `ResetPasswordPage`, `ChangePasswordForm` / `PerfilContaPage`
2. **Alto (business):** `EmpresaEditSheet`
3. **Médio (conteúdo):** `NovoAchadoPerdidoPage`, `DPOContactPage`, `AdminTouristPointFormPage`

**Dependências já presentes no projeto:**
- `zod` — schemas já definidos
- `react-hook-form` — já usado em `AdminTouristPointFormPage`
- `@hookform/resolvers` — verificar presença; instalar se ausente

---

## Architecture

### Fluxo de dados unificado

```
Schema Zod (SSOT)
      │
      ▼
zodResolver(schema)
      │
      ▼
useForm({ resolver, mode })
      │
      ├── register / Controller ──► <Input> / <Select> / <Textarea>
      │
      ├── watch('field') ──────────► PasswordStrengthIndicator (tempo real)
      │
      ├── handleSubmit(onValid) ───► serviço de auth / persistência
      │                              (só chamado se schema válido)
      │
      └── formState.errors ────────► <InlineFieldError> abaixo de cada campo
```

### Regra de separação toast / inline

| Origem do erro | Exibição |
|---|---|
| Validação de campo (Zod) | `InlineFieldError` abaixo do campo |
| Erro de servidor / auth | `Toast` (comportamento atual preservado) |

### Modos de validação por formulário

| Formulário | `mode` | Justificativa |
|---|---|---|
| `LoginPage` | `onBlur` | Não interromper digitação; validar ao sair do campo |
| `ResetPasswordPage` | `onBlur` + `onChange` para `newPassword` | `onBlur` geral; `onChange` para atualizar `PasswordStrengthIndicator` em tempo real |
| `ChangePasswordForm` | `onBlur` + `onChange` para `newPassword` | Mesmo padrão do Reset |
| `EmpresaEditSheet` | `onBlur` | Formulário longo; não validar enquanto digita |
| `NovoAchadoPerdidoPage` | `onSubmit` | Formulário de criação; validar apenas na submissão |
| `DPOContactPage` | `onSubmit` | Formulário de contato; validar apenas na submissão |
| `AdminTouristPointFormPage` | `onBlur` | Já usa RHF; adicionar zodResolver sem mudar mode |

---

## Components and Interfaces

### Componente utilitário: `InlineFieldError`

**Localização:** `src/shared/components/ui/InlineFieldError.tsx` (novo arquivo)

```tsx
interface InlineFieldErrorProps {
  message?: string;
}

export function InlineFieldError({ message }: InlineFieldErrorProps): JSX.Element | null
```

Renderiza `<p className="text-destructive text-xs mt-1">{message}</p>` quando `message` está definido, `null` caso contrário. Alternativa: usar `<FormMessage>` do shadcn/ui Form — decisão de implementação abaixo.

**Decisão:** Criar `InlineFieldError` como wrapper fino em vez de adotar o sistema `<Form>` completo do shadcn/ui, pois os formulários existentes não usam `<FormField>` / `<FormItem>` e a migração completa para o sistema shadcn/ui Form está fora do escopo desta M2. O componente pode ser substituído por `<FormMessage>` em uma refatoração futura.

---

### Camada 1 — Auth

#### `LoginIdentifierSchema` (novo schema)

**Localização:** `src/shared/validation/schemas/user.schema.ts` (adição ao arquivo existente)

```ts
export const LoginIdentifierSchema = z.object({
  identifier: z
    .string({ required_error: validationMessages.required })
    .min(1, validationMessages.required),
  password: z
    .string({ required_error: validationMessages.required })
    .min(1, validationMessages.required),
});

export type LoginIdentifierInput = z.infer<typeof LoginIdentifierSchema>;
```

**Decisão de design:** O schema não valida formato de email nem formato de username — apenas que o campo não está vazio. A lógica de detecção de tipo (`parseAuthIdentifier`) permanece no componente para fins de UX (ícone `AtSign` vs `Mail`) e para decidir qual função de auth chamar (`signIn` vs `signInWithUsername`). Validar o formato no schema seria redundante e quebraria o caso de username sem `@`.

#### `LoginPage` (modificação)

**Localização:** `src/app/pages/LoginPage.tsx`

Assinatura do hook de formulário:
```ts
const {
  register,
  handleSubmit,
  watch,
  formState: { errors, isSubmitting },
} = useForm<LoginIdentifierInput>({
  resolver: zodResolver(LoginIdentifierSchema),
  mode: 'onBlur',
});
```

Mudanças estruturais:
- Remover `useState` para `identifier` e `password`
- Remover guard manual `if (!parsedIdentifier || !password)` no `handleLogin`
- `parsedIdentifier` passa a ser derivado de `watch('identifier')` em vez de `useState`
- `handleLogin` torna-se `onValid(data: LoginIdentifierInput)` passado ao `handleSubmit`
- `pendingAction` permanece como `useState` (controla loading de Google e recovery, não apenas login)
- Campos recebem `{...register('identifier')}` e `{...register('password')}`
- Adicionar `<InlineFieldError message={errors.identifier?.message} />` e `<InlineFieldError message={errors.password?.message} />`

#### `ResetPasswordPage` (modificação)

**Localização:** `src/app/pages/ResetPasswordPage.tsx`

Assinatura do hook de formulário:
```ts
const {
  register,
  handleSubmit,
  watch,
  formState: { errors, isSubmitting },
} = useForm<ResetPasswordInput>({
  resolver: zodResolver(ResetPasswordSchema),
  mode: 'onBlur',
});

const newPasswordValue = watch('newPassword');
```

Mudanças estruturais:
- Remover `useState` para `password` e `confirmPassword`
- `passwordRequirements` passa a ser derivado de `watch('newPassword')` em vez de `useState`
- Remover chamada a `validateAuthPassword` no `handleSubmit`
- Remover guard de `password !== confirmPassword` (delegado ao schema via `.refine`)
- `handleSubmit` recebe `onValid(data: ResetPasswordInput)` — só chama `updatePassword` se schema válido
- `recoveryState` permanece como `useState` (lógica de verificação de link, não de formulário)
- Adicionar `<InlineFieldError>` abaixo de `newPassword` e `confirmNewPassword`
- O campo `token` do `ResetPasswordSchema` existente não é usado no formulário visual (o token vem da URL via Supabase session); usar `ResetPasswordSchema` sem o campo `token` ou criar variante — ver decisão abaixo

**Decisão:** O `ResetPasswordSchema` existente inclui campo `token`. Na `ResetPasswordPage`, o token não é digitado pelo usuário — vem da sessão Supabase após o redirect. Criar um schema derivado `ResetPasswordFormSchema` que omite `token`:

```ts
export const ResetPasswordFormSchema = ResetPasswordSchema.omit({ token: true });
export type ResetPasswordFormInput = z.infer<typeof ResetPasswordFormSchema>;
```

#### `ChangePasswordForm` (modificação)

**Localização:** `src/modules/profile/components/ChangePasswordForm.tsx`

O componente atual recebe `newPassword`, `confirmPassword`, `showPassword`, `loading` como props controladas pelo pai (`PerfilContaPage`). Com RHF, o estado do formulário passa a ser interno ao componente.

Nova assinatura do componente:
```tsx
interface ChangePasswordFormProps {
  onSave: (data: UpdatePasswordInput) => Promise<void>;
  onCancel: () => void;
}

export function ChangePasswordForm({ onSave, onCancel }: ChangePasswordFormProps): JSX.Element
```

Hook interno:
```ts
const {
  register,
  handleSubmit,
  watch,
  reset,
  formState: { errors, isSubmitting },
} = useForm<UpdatePasswordInput>({
  resolver: zodResolver(UpdatePasswordSchema),
  mode: 'onBlur',
});

const newPasswordValue = watch('newPassword');
```

Mudanças em `PerfilContaPage`:
- Remover `useState` para `newPassword`, `confirmPassword`, `showPassword`
- Remover chamada a `validateAuthPassword` no handler de save
- Passar apenas `onSave` e `onCancel` ao `ChangePasswordForm`
- `onSave` recebe `UpdatePasswordInput` já validado e chama `updatePassword`

---

### Camada 2 — Business

#### `EmpresaEditSheet` (modificação)

**Localização:** `src/modules/business/components/EmpresaEditSheet.tsx`

O componente atual usa `useState<BizEditData>` para todo o estado do formulário. Com RHF, o estado migra para `useForm`.

**Decisão de schema:** O `updateBusinessSchema` (de `businessSchemas.ts`) é o schema canônico para atualização. O `BizEditData` local tem campos legados (`logo`, `capa`, `schedule`, `ano_fundacao`) que não existem no schema canônico. A migração deve:
1. Usar `updateBusinessSchema` para os campos cobertos por ele
2. Manter `useState` apenas para campos fora do schema (`schedule`, `schedule_fechamento`, `logo`, `capa`, `modos_atendimento`, `especialidades`, `formas_pagamento`, `facilidades`) — ou estender o schema

**Decisão:** Para esta M2, usar `updateBusinessSchema.partial()` como resolver e manter `useState` para campos não cobertos pelo schema canônico. Isso evita uma refatoração de schema fora do escopo. Os campos validados pelo zodResolver são: `name`, `description`, `category`, `phone`, `whatsapp`, `email`, `website`.

Hook de formulário:
```ts
const {
  register,
  handleSubmit,
  formState: { errors, isSubmitting },
  reset,
} = useForm({
  resolver: zodResolver(updateBusinessSchema),
  mode: 'onBlur',
  defaultValues: biz ? mapBizEditDataToSchema(biz) : undefined,
});
```

Mudanças estruturais:
- Remover guard `if (!form.name.trim())` e demais validações inline no `handleSave`
- `handleSave` torna-se `onValid(data)` passado ao `handleSubmit`
- Campos `name`, `description`, `category`, `phone`, `whatsapp`, `email`, `website` recebem `{...register(...)}`
- Adicionar `<InlineFieldError>` abaixo de cada campo validado
- Campos fora do schema (`schedule`, `modos_atendimento`, etc.) permanecem com `useState` local

---

### Camada 3 — Conteúdo

#### `NovoAchadoPerdidoSchema` (novo schema)

**Localização:** `src/shared/validation/schemas/lostfound.schema.ts` (novo arquivo)

```ts
export const NovoAchadoPerdidoSchema = z.object({
  tipo: z.enum(['perdido', 'encontrado'], {
    required_error: 'Selecione o tipo de ocorrência',
  }),
  category: z.string().min(1, 'Selecione uma categoria'),
  titulo: z
    .string()
    .min(3, 'Título deve ter no mínimo 3 caracteres')
    .max(150, 'Título deve ter no máximo 150 caracteres'),
  description: z.string().max(1000).optional(),
  neighborhood: z.string().optional(),
  localizacaoAprox: z.string().max(200).optional(),
  dateOcorrido: z.date(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
});

export type NovoAchadoPerdidoInput = z.infer<typeof NovoAchadoPerdidoSchema>;
```

#### `NovoAchadoPerdidoPage` (modificação)

Substituir `useState` do `form` por `useForm<NovoAchadoPerdidoInput>` com `zodResolver`. Campos `tipo` e `category` (botões de seleção) usam `Controller` do RHF. Campos de texto usam `register`. Remover guard manual de validação no `handleSubmit`.

#### `DPOContactSchema` (novo schema)

**Localização:** `src/shared/validation/schemas/dpo.schema.ts` (novo arquivo)

```ts
export const DPOContactSchema = z.object({
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  email: z
    .string({ required_error: validationMessages.required })
    .email(validationMessages.string.email),
  requestType: z.enum([...DPO_REQUEST_TYPES], {
    required_error: 'Selecione o tipo de solicitação',
  }),
  subject: z.string().min(5, 'Assunto deve ter no mínimo 5 caracteres'),
  message: z
    .string()
    .min(20, 'Mensagem deve ter no mínimo 20 caracteres')
    .max(5000),
});

export type DPOContactInput = z.infer<typeof DPOContactSchema>;
```

#### `DPOContactPage` (modificação)

Substituir `useState<ContactFormData>` por `useForm<DPOContactInput>` com `zodResolver`. O campo `requestType` (Select) usa `Controller`. Remover validação manual `if (!data.requestType)` no `mutationFn`.

#### `AdminTouristPointFormPage` (modificação)

Já usa `useForm`. Adicionar `zodResolver` ao `useForm` existente. Criar schema:

**Localização:** `src/modules/guide/schemas/touristPoint.schema.ts` (novo arquivo)

```ts
export const TouristPointFormSchema = z.object({
  location_id: z.string().uuid('UUID inválido'),
  title: z.string().min(3, 'Título deve ter no mínimo 3 caracteres').max(200),
  slug: z.string().regex(slugRegex).optional(),
  summary: z.string().min(10, 'Resumo deve ter no mínimo 10 caracteres').max(300),
  description: z.string().min(20, 'Descrição deve ter no mínimo 20 caracteres'),
  address_text: z.string().max(300).optional(),
  price_type: z.enum(['free', 'paid', 'donation']),
  price_text: z.string().max(100).optional(),
  opening_hours: z.string().max(200).optional(),
  accessibility_notes: z.string().max(500).optional(),
  official_url: z.string().url('URL inválida').optional().or(z.literal('')),
  is_featured: z.boolean(),
  status: z.enum(['draft', 'published', 'archived']),
});

export type TouristPointFormInput = z.infer<typeof TouristPointFormSchema>;
```

Substituir `FormValues` local pelo tipo inferido do schema. Adicionar `resolver: zodResolver(TouristPointFormSchema)` ao `useForm` existente. Os erros já são exibidos com `<p className="text-xs text-destructive mt-1">` — padrão compatível com `InlineFieldError`.

---

## Data Models

### Tipos inferidos dos schemas (resumo)

```ts
// Existentes (sem alteração)
type UpdatePasswordInput = z.infer<typeof UpdatePasswordSchema>;
// { currentPassword: string; newPassword: string; confirmNewPassword: string }

type UpdateBusinessInput = z.infer<typeof updateBusinessSchema>;
// Partial de todos os campos de baseBusinessObjectSchema

// Novos
type LoginIdentifierInput = z.infer<typeof LoginIdentifierSchema>;
// { identifier: string; password: string }

type ResetPasswordFormInput = z.infer<typeof ResetPasswordFormSchema>;
// { newPassword: string; confirmNewPassword: string }

type NovoAchadoPerdidoInput = z.infer<typeof NovoAchadoPerdidoSchema>;
type DPOContactInput = z.infer<typeof DPOContactSchema>;
type TouristPointFormInput = z.infer<typeof TouristPointFormSchema>;
```

### Mapeamento de estado legado → RHF

| Componente | Estado removido | Substituído por |
|---|---|---|
| `LoginPage` | `useState(identifier)`, `useState(password)` | `register('identifier')`, `register('password')` |
| `ResetPasswordPage` | `useState(password)`, `useState(confirmPassword)` | `register('newPassword')`, `register('confirmNewPassword')` |
| `ChangePasswordForm` | props `newPassword`, `confirmPassword`, `showPassword`, `loading` | `register(...)`, `watch(...)`, `formState.isSubmitting` internos |
| `PerfilContaPage` | `useState(newPassword)`, `useState(confirmPassword)` | removidos (estado interno ao `ChangePasswordForm`) |
| `EmpresaEditSheet` | `useState<BizEditData>` (campos cobertos pelo schema) | `register(...)` para campos validados |
| `NovoAchadoPerdidoPage` | `useState(form)` | `useForm<NovoAchadoPerdidoInput>` |
| `DPOContactPage` | `useState<ContactFormData>` | `useForm<DPOContactInput>` |

---

## Correctness Properties

*Uma propriedade é uma característica ou comportamento que deve ser verdadeiro em todas as execuções válidas do sistema — essencialmente, uma declaração formal sobre o que o sistema deve fazer. Propriedades servem como ponte entre especificações legíveis por humanos e garantias de correção verificáveis por máquina.*

A biblioteca de property-based testing escolhida é **`fast-check`** (TypeScript-first, amplamente adotada no ecossistema React/Vite). Cada teste de propriedade deve rodar com mínimo de 100 iterações.

---

### Property 1: LoginIdentifierSchema aceita qualquer identificador não-vazio

*Para qualquer* string não-vazia como `identifier` e qualquer string não-vazia como `password`, o `LoginIdentifierSchema.safeParse()` deve retornar `success: true`.

**Validates: Requirements 1.1, 1.2, 1.3**

---

### Property 2: LoginIdentifierSchema rejeita campos vazios com mensagem correta

*Para qualquer* objeto onde `identifier` ou `password` é string vazia, o `LoginIdentifierSchema.safeParse()` deve retornar `success: false` com `FieldError` no path correspondente contendo a mensagem `"Este campo é obrigatório"`.

**Validates: Requirements 1.4, 1.5**

---

### Property 3: Formulário de login não navega nem chama serviço com inputs inválidos

*Para qualquer* combinação de `identifier` vazio ou `password` vazio submetida ao `LoginForm`, o formulário não deve chamar `signIn` nem `signInWithUsername` nem navegar para outra rota.

**Validates: Requirements 2.2, 8.7**

---

### Property 4: PasswordStrengthIndicator reflete estado real da senha em tempo real

*Para qualquer* string de senha digitada no campo `newPassword`, o `PasswordStrengthIndicator` deve exibir exatamente os requisitos satisfeitos retornados por `getAuthPasswordRequirementStatus(watch('newPassword'))`.

**Validates: Requirements 3.2**

---

### Property 5: Schema de senha rejeita confirmações divergentes

*Para qualquer* par `(newPassword, confirmNewPassword)` onde `confirmNewPassword !== newPassword`, o schema de reset/troca de senha deve retornar `success: false` com erro no path `confirmNewPassword`.

**Validates: Requirements 3.4, 4.4**

---

### Property 6: updateBusinessSchema rejeita formatos inválidos de contato

*Para qualquer* string que não satisfaz o formato de email (sem `@` ou sem domínio), o `updateBusinessSchema.safeParse()` deve retornar `success: false` com erro no path `email`. Analogamente para `phone` (strings não numéricas de comprimento incorreto) e `website` (strings sem protocolo `http(s)://`).

**Validates: Requirements 5.3, 5.4, 5.5**

---

### Property 7: Schemas de conteúdo rejeitam campos obrigatórios vazios

*Para qualquer* objeto onde um campo obrigatório (`tipo`, `category`, `titulo` em `NovoAchadoPerdidoSchema`; `name`, `email`, `requestType`, `subject`, `message` em `DPOContactSchema`) está ausente ou vazio, o respectivo schema deve retornar `success: false` com erro no path do campo ausente.

**Validates: Requirements 6.4**

---

### Property 8: DPOContactSchema rejeita emails em formato inválido

*Para qualquer* string que não satisfaz o formato de email RFC, o `DPOContactSchema.safeParse({ ..., email: invalidEmail })` deve retornar `success: false` com erro no path `email` contendo a mensagem `"E-mail inválido"`.

**Validates: Requirements 6.5**

---

## Error Handling

### Hierarquia de erros

```
Erro de validação de campo (Zod)
  └── Exibido como InlineFieldError abaixo do campo
  └── NÃO chama serviço de auth/persistência
  └── NÃO exibe Toast

Erro de servidor / autenticação
  └── Capturado no catch do onValid handler
  └── Exibido como Toast (comportamento atual preservado)
  └── NÃO exibe InlineFieldError (erro não é de campo específico)
```

### Casos de erro por componente

**LoginPage:**
- Campos inválidos → `InlineFieldError` (novo)
- `signIn` / `signInWithUsername` lança → Toast com `getAuthErrorMessage` (preservado)
- `resetPasswordByIdentifier` lança → Toast genérico anti-enumeração (preservado)

**ResetPasswordPage:**
- Campos inválidos → `InlineFieldError` (novo)
- `recoveryState !== 'ready'` → botão desabilitado (preservado)
- `updatePassword` lança → Toast com `getAuthErrorMessage` (preservado)

**ChangePasswordForm:**
- Campos inválidos → `InlineFieldError` (novo)
- `updatePassword` lança → Toast no `PerfilContaPage` (preservado)

**EmpresaEditSheet:**
- Campos inválidos → `InlineFieldError` (novo)
- `adminBusinessService` / `profileService` lança → `toast.error` (preservado)

**NovoAchadoPerdidoPage / DPOContactPage:**
- Campos inválidos → `InlineFieldError` (novo)
- Serviço lança → Toast (preservado)

### `validateAuthPassword` — deprecação

Após a migração das três páginas de auth, adicionar `@deprecated` ao `validateAuthPassword` em `passwordPolicy.ts`:

```ts
/**
 * @deprecated Use strongPasswordValidator (Zod) via UpdatePasswordSchema,
 * ResetPasswordFormSchema ou LoginIdentifierSchema.
 * Mantido apenas para compatibilidade com PasswordStrengthIndicator.
 */
export function validateAuthPassword(password: string): string | null { ... }
```

A função `getAuthPasswordRequirementStatus` permanece ativa — é usada pelo `PasswordStrengthIndicator` para exibição visual dos requisitos.

---

## Testing Strategy

### Abordagem dual

**Testes de unidade (exemplo-based):**
- Comportamentos específicos: ícone `AtSign` vs `Mail` no `LoginPage`
- Fluxo de `recoveryState` no `ResetPasswordPage`
- Reset de campos após submissão bem-sucedida no `ChangePasswordForm`
- Integração com `signIn` / `signInWithUsername` (mocks)

**Testes de propriedade (property-based com `fast-check`):**
- Cada propriedade listada na seção Correctness Properties
- Mínimo 100 iterações por propriedade
- Schemas Zod são funções puras — ideais para PBT sem mocks
- Para propriedades de componente (Property 3, 4), usar `@testing-library/react` + `fast-check`

### Configuração de tags

Cada teste de propriedade deve incluir comentário de rastreabilidade:

```ts
// Feature: zod-form-validation, Property 1: LoginIdentifierSchema aceita qualquer identificador não-vazio
it.prop([fc.string({ minLength: 1 }), fc.string({ minLength: 1 })])(
  'aceita identifier e password não-vazios',
  (identifier, password) => {
    const result = LoginIdentifierSchema.safeParse({ identifier, password });
    expect(result.success).toBe(true);
  }
);
```

### Localização dos testes

| Arquivo de teste | Cobre |
|---|---|
| `src/shared/validation/schemas/__tests__/user.schema.test.ts` | Properties 1, 2, 5 |
| `src/shared/schemas/business/__tests__/businessSchemas.test.ts` | Property 6 |
| `src/shared/validation/schemas/__tests__/lostfound.schema.test.ts` | Property 7 |
| `src/shared/validation/schemas/__tests__/dpo.schema.test.ts` | Properties 7, 8 |
| `src/app/pages/__tests__/LoginPage.test.tsx` | Property 3 |
| `src/app/pages/__tests__/ResetPasswordPage.test.tsx` | Property 4 |

### Testes de integração (não PBT)

- Fluxo completo de login com Google (mock `signInWithGoogle`)
- Fluxo de recuperação de senha (mock `resetPasswordByIdentifier`)
- Redirecionamento pós-login para `redirectTo`
- Estados visuais `'checking'` / `'ready'` / `'invalid'` do `ResetPasswordPage`

---

## Arquivos a criar / modificar

### Criar

| Arquivo | Conteúdo |
|---|---|
| `src/shared/components/ui/InlineFieldError.tsx` | Componente de erro inline |
| `src/shared/validation/schemas/lostfound.schema.ts` | `NovoAchadoPerdidoSchema` |
| `src/shared/validation/schemas/dpo.schema.ts` | `DPOContactSchema` |
| `src/modules/guide/schemas/touristPoint.schema.ts` | `TouristPointFormSchema` |

### Modificar

| Arquivo | Mudança |
|---|---|
| `src/shared/validation/schemas/user.schema.ts` | Adicionar `LoginIdentifierSchema`, `LoginIdentifierInput`, `ResetPasswordFormSchema`, `ResetPasswordFormInput` |
| `src/app/pages/LoginPage.tsx` | Migrar para RHF + zodResolver; remover useState de campos |
| `src/app/pages/ResetPasswordPage.tsx` | Migrar para RHF + zodResolver; remover useState de campos; remover `validateAuthPassword` |
| `src/modules/profile/components/ChangePasswordForm.tsx` | Tornar estado interno; nova assinatura de props |
| `src/modules/profile/pages/PerfilContaPage.tsx` | Remover useState de senha; adaptar para nova interface do ChangePasswordForm |
| `src/modules/business/components/EmpresaEditSheet.tsx` | Adicionar zodResolver para campos cobertos pelo schema |
| `src/modules/community/pages/NovoAchadoPerdidoPage.tsx` | Migrar para RHF + zodResolver |
| `src/pages/DPOContactPage.tsx` | Migrar para RHF + zodResolver |
| `src/modules/guide/pages/AdminTouristPointFormPage.tsx` | Adicionar zodResolver ao useForm existente |
| `src/core/auth/utils/passwordPolicy.ts` | Marcar `validateAuthPassword` como `@deprecated` |
