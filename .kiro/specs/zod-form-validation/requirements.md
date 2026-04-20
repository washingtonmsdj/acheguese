# Requirements Document

## Introduction

Conectar os 14 schemas Zod já definidos em `src/shared/validation/schemas/` e `src/shared/schemas/business/` aos formulários críticos do frontend, substituindo validação manual dispersa por `react-hook-form` com `zodResolver`. O objetivo é feedback de erro estruturado por campo, eliminação de utils de validação duplicadas e manutenção integral dos fluxos de UX existentes.

Escopo priorizado em três camadas:
1. **Crítico (auth):** LoginPage, ResetPasswordPage, PerfilContaPage (change password)
2. **Alto (business):** EmpresaEditSheet
3. **Médio (conteúdo):** NovoAchadoPerdidoPage, DPOContactPage, AdminTouristPointFormPage

---

## Glossary

- **Form**: Componente React que coleta dados do usuário via campos de entrada.
- **zodResolver**: Adaptador do pacote `@hookform/resolvers/zod` que conecta um schema Zod ao `react-hook-form`.
- **RHF**: `react-hook-form` — biblioteca de gerenciamento de estado de formulários.
- **FieldError**: Objeto de erro por campo retornado pelo RHF após validação Zod, contendo `message` string.
- **LoginForm**: Formulário de autenticação em `src/app/pages/LoginPage.tsx`.
- **ResetPasswordForm**: Formulário de redefinição de senha em `src/app/pages/ResetPasswordPage.tsx`.
- **ChangePasswordForm**: Formulário de troca de senha em `src/modules/profile/components/ChangePasswordForm.tsx`, usado por `PerfilContaPage`.
- **EmpresaEditSheet**: Componente de edição de empresa em `src/modules/business/components/EmpresaEditSheet.tsx`.
- **LoginUserSchema**: Schema Zod existente em `src/shared/validation/schemas/user.schema.ts` para login por email + password.
- **LoginIdentifierSchema**: Novo schema derivado de `LoginUserSchema` que aceita email OU username no campo `identifier`, alinhado com `parseAuthIdentifier`.
- **ResetPasswordSchema**: Schema Zod existente em `src/shared/validation/schemas/user.schema.ts` para redefinição de senha (newPassword + confirmNewPassword + token).
- **UpdatePasswordSchema**: Schema Zod existente em `src/shared/validation/schemas/user.schema.ts` para troca de senha (currentPassword + newPassword + confirmNewPassword).
- **updateBusinessSchema**: Schema Zod existente em `src/shared/schemas/business/businessSchemas.ts` para atualização de empresa.
- **strongPasswordValidator**: Validador Zod reutilizável em `src/shared/validation/validators/custom.validators.ts`.
- **passwordPolicy**: Módulo `src/core/auth/utils/passwordPolicy.ts` com `validateAuthPassword` e `getAuthPasswordRequirementStatus`.
- **PasswordStrengthIndicator**: Componente visual que exibe os requisitos de senha em tempo real, já presente em `ResetPasswordPage`.
- **InlineFieldError**: Mensagem de erro exibida imediatamente abaixo do campo que a originou, sem toast.
- **Toast**: Notificação global temporária via `useToast` / `sonner`, usada para erros de submissão e confirmações de sucesso.

---

## Requirements

### Requirement 1: Adaptar LoginUserSchema para aceitar email ou username

**User Story:** Como desenvolvedor, quero um schema Zod que valide o campo unificado `identifier` do LoginForm (email ou @username), para que a lógica de `parseAuthIdentifier` seja refletida na camada de validação sem duplicação.

#### Acceptance Criteria

1. THE `LoginIdentifierSchema` SHALL ser definido em `src/shared/validation/schemas/user.schema.ts` com campo `identifier` do tipo `string` com mínimo de 1 caractere e campo `password` do tipo `string` com mínimo de 1 caractere.
2. WHEN o campo `identifier` contiver `@` seguido de caracteres sem segundo `@`, THE `LoginIdentifierSchema` SHALL aceitar o valor como username válido.
3. WHEN o campo `identifier` contiver `@` em posição não inicial e domínio válido, THE `LoginIdentifierSchema` SHALL aceitar o valor como email válido.
4. WHEN o campo `identifier` estiver vazio, THE `LoginIdentifierSchema` SHALL produzir `FieldError` com mensagem `"Este campo é obrigatório"` no path `identifier`.
5. WHEN o campo `password` estiver vazio, THE `LoginIdentifierSchema` SHALL produzir `FieldError` com mensagem `"Este campo é obrigatório"` no path `password`.
6. THE `LoginIdentifierSchema` SHALL exportar o tipo inferido `LoginIdentifierInput` via `z.infer`.

---

### Requirement 2: Conectar LoginForm ao LoginIdentifierSchema via react-hook-form

**User Story:** Como usuário, quero ver erros de validação diretamente nos campos do formulário de login, para que eu saiba exatamente o que corrigir sem depender de toasts genéricos.

#### Acceptance Criteria

1. THE `LoginForm` SHALL usar `useForm` do RHF com `zodResolver(LoginIdentifierSchema)` como resolver.
2. WHEN o usuário submete o formulário com campos inválidos, THE `LoginForm` SHALL exibir `InlineFieldError` abaixo de cada campo com erro, sem navegar ou chamar `signIn`.
3. WHEN o campo `identifier` contém valor inválido após submissão, THE `LoginForm` SHALL exibir a mensagem de erro do `LoginIdentifierSchema` abaixo do campo `identifier`.
4. WHEN o campo `password` está vazio após submissão, THE `LoginForm` SHALL exibir a mensagem de erro abaixo do campo `password`.
5. WHILE o formulário está sendo submetido (`pendingAction === 'login'`), THE `LoginForm` SHALL manter os campos desabilitados e o botão de submit com estado de loading.
6. WHEN a submissão falha por erro de autenticação retornado pelo servidor, THE `LoginForm` SHALL exibir Toast com a mensagem de erro de autenticação (comportamento atual preservado).
7. THE `LoginForm` SHALL preservar o comportamento de detecção de tipo de identificador (ícone `AtSign` vs `Mail`) independente da validação Zod.
8. THE `LoginForm` SHALL preservar o fluxo de recuperação de senha (`handleForgotPassword`) sem alterações de UX.

---

### Requirement 3: Conectar ResetPasswordForm ao ResetPasswordSchema via react-hook-form

**User Story:** Como usuário que recebeu um link de recuperação, quero ver erros de validação por campo ao redefinir minha senha, para que eu entenda os requisitos sem precisar submeter o formulário múltiplas vezes.

#### Acceptance Criteria

1. THE `ResetPasswordForm` SHALL usar `useForm` do RHF com `zodResolver(ResetPasswordSchema)` como resolver.
2. WHEN o usuário digita no campo `newPassword`, THE `ResetPasswordForm` SHALL continuar exibindo o `PasswordStrengthIndicator` com status de cada requisito em tempo real (comportamento atual preservado via `watch` do RHF).
3. WHEN o usuário submete com `newPassword` inválida, THE `ResetPasswordForm` SHALL exibir `InlineFieldError` abaixo do campo `newPassword` com a mensagem do `strongPasswordValidator`.
4. WHEN o usuário submete com `confirmNewPassword` diferente de `newPassword`, THE `ResetPasswordForm` SHALL exibir `InlineFieldError` abaixo do campo `confirmNewPassword` com mensagem `"Senhas não coincidem"`.
5. WHEN o `recoveryState` não é `'ready'`, THE `ResetPasswordForm` SHALL manter o botão de submit desabilitado (comportamento atual preservado).
6. WHEN a submissão é bem-sucedida, THE `ResetPasswordForm` SHALL exibir Toast de sucesso e redirecionar para `/` após 2 segundos (comportamento atual preservado).
7. IF a submissão falha por erro do servidor, THEN THE `ResetPasswordForm` SHALL exibir Toast com a mensagem de erro (comportamento atual preservado).
8. THE `ResetPasswordForm` SHALL remover as chamadas diretas a `validateAuthPassword` e `getAuthPasswordRequirementStatus` do fluxo de submissão, delegando a validação ao zodResolver.

---

### Requirement 4: Conectar ChangePasswordForm ao UpdatePasswordSchema via react-hook-form

**User Story:** Como usuário autenticado, quero ver erros de validação por campo ao trocar minha senha na página de conta, para que eu receba feedback imediato sem depender de toasts de erro.

#### Acceptance Criteria

1. THE `ChangePasswordForm` SHALL usar `useForm` do RHF com `zodResolver(UpdatePasswordSchema)` como resolver.
2. WHEN o usuário submete com `currentPassword` vazio, THE `ChangePasswordForm` SHALL exibir `InlineFieldError` abaixo do campo `currentPassword` com mensagem `"Este campo é obrigatório"`.
3. WHEN o usuário submete com `newPassword` que não atende aos requisitos de força, THE `ChangePasswordForm` SHALL exibir `InlineFieldError` abaixo do campo `newPassword` com a mensagem do `strongPasswordValidator`.
4. WHEN o usuário submete com `confirmNewPassword` diferente de `newPassword`, THE `ChangePasswordForm` SHALL exibir `InlineFieldError` abaixo do campo `confirmNewPassword` com mensagem `"Senhas não coincidem"`.
5. WHEN a submissão é bem-sucedida, THE `ChangePasswordForm` SHALL limpar todos os campos do formulário via `reset()` do RHF (comportamento atual preservado).
6. IF a submissão falha por erro do servidor, THEN THE `ChangePasswordForm` SHALL exibir Toast com a mensagem de erro (comportamento atual preservado).
7. THE `ChangePasswordForm` SHALL remover a chamada direta a `validateAuthPassword` do fluxo de submissão, delegando a validação ao zodResolver.
8. THE `PerfilContaPage` SHALL remover os estados `useState` de `newPassword` e `confirmPassword`, delegando o estado do formulário ao RHF interno do `ChangePasswordForm`.

---

### Requirement 5: Conectar EmpresaEditSheet ao updateBusinessSchema via react-hook-form

**User Story:** Como proprietário de empresa, quero ver erros de validação por campo ao editar os dados da minha empresa, para que eu saiba exatamente quais campos precisam de correção antes de salvar.

#### Acceptance Criteria

1. THE `EmpresaEditSheet` SHALL usar `useForm` do RHF com `zodResolver(updateBusinessSchema)` como resolver.
2. WHEN o usuário submete com o campo `name` vazio, THE `EmpresaEditSheet` SHALL exibir `InlineFieldError` abaixo do campo `name` com mensagem `"Nome deve ter no mínimo 3 caracteres"`.
3. WHEN o usuário submete com `email` em formato inválido, THE `EmpresaEditSheet` SHALL exibir `InlineFieldError` abaixo do campo `email` com mensagem `"Email inválido"`.
4. WHEN o usuário submete com `phone` em formato inválido, THE `EmpresaEditSheet` SHALL exibir `InlineFieldError` abaixo do campo `phone` com mensagem `"Telefone inválido"`.
5. WHEN o usuário submete com `website` em formato inválido, THE `EmpresaEditSheet` SHALL exibir `InlineFieldError` abaixo do campo `website` com mensagem `"URL inválida"`.
6. WHEN o usuário submete com `description` com menos de 10 caracteres, THE `EmpresaEditSheet` SHALL exibir `InlineFieldError` abaixo do campo `description` com mensagem `"Descrição deve ter no mínimo 10 caracteres"`.
7. WHEN todos os campos obrigatórios são válidos, THE `EmpresaEditSheet` SHALL chamar o serviço de persistência com o payload validado pelo schema.
8. THE `EmpresaEditSheet` SHALL remover a validação manual `if (!form.name.trim())` e demais guards de validação inline, delegando ao zodResolver.
9. WHEN a submissão é bem-sucedida, THE `EmpresaEditSheet` SHALL exibir Toast de sucesso e fechar o sheet (comportamento atual preservado).
10. IF a submissão falha por erro do servidor, THEN THE `EmpresaEditSheet` SHALL exibir Toast com a mensagem de erro (comportamento atual preservado).

---

### Requirement 6: Conectar formulários de conteúdo a schemas Zod

**User Story:** Como desenvolvedor, quero que os formulários de conteúdo (achados e perdidos, contato DPO, ponto turístico) usem zodResolver, para que a validação seja consistente com o restante da aplicação.

#### Acceptance Criteria

1. THE `NovoAchadoPerdidoPage` SHALL usar `useForm` do RHF com `zodResolver` conectado a um schema Zod definido para o formulário de achados e perdidos.
2. THE `DPOContactPage` SHALL usar `useForm` do RHF com `zodResolver` conectado a um schema Zod definido para o formulário de contato DPO.
3. THE `AdminTouristPointFormPage` SHALL adicionar `zodResolver` ao `useForm` já existente, conectado ao schema Zod correspondente ao formulário de ponto turístico.
4. WHEN qualquer campo obrigatório desses formulários estiver vazio na submissão, THE respectivo Form SHALL exibir `InlineFieldError` abaixo do campo com mensagem descritiva.
5. IF um campo de email nesses formulários contiver formato inválido, THEN THE respectivo Form SHALL exibir `InlineFieldError` com mensagem `"E-mail inválido"`.

---

### Requirement 7: Padrão de exibição de erros por campo

**User Story:** Como usuário, quero que os erros de validação apareçam imediatamente abaixo do campo que os originou, para que eu identifique e corrija problemas sem precisar interpretar mensagens genéricas.

#### Acceptance Criteria

1. THE `InlineFieldError` SHALL ser exibido imediatamente abaixo do campo de entrada correspondente, sem deslocar outros elementos da página de forma abrupta.
2. WHEN um campo com erro é corrigido pelo usuário, THE `InlineFieldError` desse campo SHALL desaparecer sem necessidade de nova submissão (validação `onChange` ou `onBlur`).
3. THE `InlineFieldError` SHALL usar a classe visual `text-destructive text-xs` (padrão shadcn/ui) para manter consistência com o design system existente.
4. THE sistema de validação SHALL exibir `InlineFieldError` por campo E Toast apenas para erros de servidor, nunca Toast para erros de validação de campo já cobertos pelo `InlineFieldError`.
5. WHERE o formulário contém `PasswordStrengthIndicator`, THE indicador SHALL continuar sendo exibido em tempo real via `watch` do RHF, complementando (não substituindo) o `InlineFieldError` do campo de senha.

---

### Requirement 8: Preservação dos fluxos de autenticação existentes

**User Story:** Como usuário, quero que os fluxos de login, recuperação e troca de senha continuem funcionando exatamente como antes, para que a migração para Zod não introduza regressões.

#### Acceptance Criteria

1. THE `LoginForm` SHALL preservar o suporte a login por email E por username no mesmo campo `identifier`, sem campos separados.
2. THE `LoginForm` SHALL preservar o fluxo de login com Google (`signInWithGoogle`) sem alterações.
3. THE `LoginForm` SHALL preservar o redirecionamento pós-login para `redirectTo` (parâmetro de query string).
4. THE `ResetPasswordForm` SHALL preservar a verificação de `recoveryState` antes de permitir submissão.
5. THE `ResetPasswordForm` SHALL preservar os estados visuais `'checking'`, `'ready'` e `'invalid'` do link de recuperação.
6. THE `ChangePasswordForm` SHALL preservar o botão de cancelamento que limpa os campos.
7. WHEN a validação Zod rejeita um campo, THE formulário SHALL NÃO chamar nenhuma função de serviço de autenticação ou persistência.

---

### Requirement 9: Remoção de utils de validação duplicadas

**User Story:** Como desenvolvedor, quero remover as chamadas diretas a `validateAuthPassword` dos formulários migrados, para que a validação de senha tenha uma única fonte de verdade no `strongPasswordValidator` do schema Zod.

#### Acceptance Criteria

1. WHEN `LoginForm`, `ResetPasswordForm` e `ChangePasswordForm` forem migrados, THE `validateAuthPassword` SHALL não ser chamada diretamente no handler de submissão desses componentes.
2. THE `strongPasswordValidator` em `src/shared/validation/validators/custom.validators.ts` SHALL ser a única implementação de regras de força de senha usada pelos schemas de auth.
3. THE `passwordPolicy.ts` SHALL permanecer disponível para uso pelo `PasswordStrengthIndicator` (função `getAuthPasswordRequirementStatus`), mas não para validação de submissão.
4. WHEN todos os formulários críticos forem migrados, THE `validateAuthPassword` SHALL ser marcada como `@deprecated` com comentário indicando o schema substituto.

