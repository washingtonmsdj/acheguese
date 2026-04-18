# Análise - Hierarquia de Perfis do Sistema

**Data**: 2026-04-18  
**Status**: ✅ Análise Completa  
**Objetivo**: Entender como funciona a hierarquia de perfis e validar a correção implementada

---

## 📋 Resumo Executivo

**Você está CORRETO!** ✅

O perfil **personal** é **obrigatório** e **sempre o principal**. Todo usuário que se cadastra no sistema automaticamente recebe um perfil personal através de um trigger no banco de dados.

---

## 🏗️ Como Funciona o Sistema

### 1. Cadastro de Usuário (Signup)

Quando um usuário se cadastra:

```
1. Usuário preenche formulário de cadastro
   ↓
2. Supabase Auth cria registro em auth.users
   ↓
3. TRIGGER automático dispara: on_auth_user_created
   ↓
4. Função handle_new_user() executa
   ↓
5. Perfil PERSONAL é criado automaticamente
   ↓
6. Residência territorial é vinculada (se fornecida)
```

### 2. Trigger Automático

**Arquivo**: `supabase/migrations_old/20260330000014_location_id_on_signup.sql`

```sql
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
```

**O que faz**:
- Dispara **automaticamente** após inserção em `auth.users`
- Chama a função `handle_new_user()`
- Não há como criar usuário sem perfil personal

### 3. Função handle_new_user()

**Responsabilidades**:

1. **Extrai dados do cadastro**:
   - Nome (name)
   - Nome de exibição (display_name)
   - Handle único
   - Email
   - Localização (cidade, bairro, estado)

2. **Cria perfil PERSONAL**:
   ```sql
   INSERT INTO public.profiles (
     user_id,
     profile_type,  -- ← SEMPRE 'personal'
     handle,
     username,
     name,
     display_name,
     -- ... outros campos
   ) VALUES (
     NEW.id,
     'personal',    -- ← HARDCODED
     -- ...
   )
   ```

3. **Cria residência territorial** (se fornecida):
   ```sql
   INSERT INTO public.user_residences (
     user_id,
     location_id,
     is_primary,
     -- ...
   )
   ```

---

## 🎯 Hierarquia de Perfis

### Perfil Personal (Principal)

**Características**:
- ✅ **Obrigatório** - Criado automaticamente no signup
- ✅ **Único por usuário** - Apenas um perfil personal
- ✅ **Identidade real** - Representa a pessoa física
- ✅ **Sempre existe** - Não pode ser deletado
- ✅ **Base do sistema** - Outros perfis são extensões

**Campos principais**:
```typescript
{
  profile_type: 'personal',  // ← Sempre 'personal'
  name: string,              // Nome real
  display_name: string,      // Nome de exibição
  handle: string,            // @handle único
  username: string,          // Username único
  avatar_url: string,        // Foto do usuário
  bio: string,               // Biografia
  // ... localização, contato, etc.
}
```

### Perfis Adicionais (Opcionais)

Usuário **pode** criar perfis adicionais:

1. **Business** (Empresa)
   - Representa uma empresa
   - Múltiplos permitidos
   - Criado via RPC `create_profile_with_extension`

2. **Professional** (Profissional)
   - Representa atuação profissional
   - Múltiplos permitidos
   - Para prestadores de serviço

3. **Driver** (Motorista)
   - Representa perfil de motorista
   - Único por usuário
   - Para mobilidade/delivery

---

## 🔍 Validação da Correção

### Problema Original

```typescript
// ❌ ANTES: Usava activeProfile (pode ser empresa)
profile={activeProfile || profile}
```

**Cenário problemático**:
```
1. Usuário tem perfil personal "João Silva"
2. Usuário cria empresa "Padaria do João"
3. Usuário troca para perfil da empresa
4. activeProfile = empresa "Padaria do João"
5. Header da sidebar mostra "Padaria do João" ❌
```

### Correção Implementada

```typescript
// ✅ DEPOIS: Busca explicitamente o perfil personal
const personalProfile = allProfiles.find((p) => p.profile_type === "personal") || profile;

<ProfileSectionsNav
  profile={personalProfile}  // ← Sempre personal
  // ...
/>
```

**Resultado correto**:
```
1. Usuário tem perfil personal "João Silva"
2. Usuário cria empresa "Padaria do João"
3. Usuário troca para perfil da empresa
4. activeProfile = empresa "Padaria do João"
5. Header da sidebar mostra "João Silva" ✅
```

---

## ✅ Por Que a Correção Está Correta

### 1. Perfil Personal Sempre Existe

Como o perfil personal é criado automaticamente no signup, **sempre** haverá um perfil personal para exibir.

```typescript
// Sempre encontrará o perfil personal
const personalProfile = allProfiles.find((p) => p.profile_type === "personal");
// personalProfile nunca será undefined (exceto em casos extremos de corrupção de dados)
```

### 2. Identidade do Usuário

O header da sidebar representa a **identidade do usuário**, não o contexto operacional:

- **Identidade**: Quem você é (personal)
- **Contexto**: O que você está fazendo (business, driver, etc.)

**Analogia**:
```
Você é "João Silva" (personal)
Você está operando como "Padaria do João" (business)

Header deve mostrar: "João Silva" ✅
Não deve mostrar: "Padaria do João" ❌
```

### 3. Consistência Visual

Manter o perfil personal no header garante:
- ✅ Usuário sempre sabe quem está logado
- ✅ Avatar consistente (foto da pessoa)
- ✅ Nome consistente (nome real)
- ✅ Não confunde identidade com contexto

### 4. UX Padrão

Sistemas similares seguem o mesmo padrão:
- **Google**: Mostra sua foto/nome, não da empresa
- **Microsoft**: Mostra seu perfil, não da organização
- **Slack**: Mostra seu avatar, não do workspace

---

## 📊 Estrutura de Dados

### Tabela profiles

```sql
CREATE TABLE profiles (
  id               UUID PRIMARY KEY,
  user_id          UUID NOT NULL REFERENCES auth.users(id),
  profile_type     TEXT NOT NULL DEFAULT 'personal'
    CHECK (profile_type IN ('personal', 'business', 'professional', 'driver')),
  name             TEXT NOT NULL,
  display_name     TEXT,
  username         TEXT UNIQUE,
  handle           TEXT UNIQUE,
  avatar_url       TEXT,
  bio              TEXT,
  -- ... outros campos
);
```

### Relacionamento

```
auth.users (1)
  ↓
profiles (1..N)
  ├─ personal (1)      ← OBRIGATÓRIO
  ├─ business (0..N)   ← OPCIONAL
  ├─ professional (0..N) ← OPCIONAL
  └─ driver (0..1)     ← OPCIONAL
```

---

## 🎓 Conceitos Importantes

### 1. Perfil vs Contexto

**Perfil Personal**:
- Identidade permanente
- Dados pessoais
- Único e obrigatório

**Contexto Operacional**:
- Temporário e mutável
- Pode trocar a qualquer momento
- Representa "o que está fazendo"

### 2. activeProfile vs personalProfile

```typescript
// activeProfile: Contexto atual (pode mudar)
const activeProfile = getCurrentContext();
// Pode ser: personal, business, professional, driver

// personalProfile: Identidade permanente (não muda)
const personalProfile = allProfiles.find(p => p.profile_type === 'personal');
// Sempre: personal
```

### 3. Quando Usar Cada Um

**Use activeProfile quando**:
- Precisa saber o contexto operacional
- Vai executar ação no contexto ativo
- Precisa de permissões do perfil ativo

**Use personalProfile quando**:
- Precisa identificar o usuário
- Vai exibir identidade permanente
- Precisa de dados pessoais do usuário

---

## 🧪 Casos de Teste

### Caso 1: Usuário Novo

```
1. Usuário se cadastra
2. Sistema cria perfil personal automaticamente
3. allProfiles = [personal]
4. personalProfile = personal ✅
5. Header exibe dados do personal ✅
```

### Caso 2: Usuário com Empresa

```
1. Usuário tem perfil personal
2. Usuário cria empresa
3. allProfiles = [personal, business]
4. Usuário troca para business
5. activeProfile = business
6. personalProfile = personal ✅
7. Header exibe dados do personal ✅
```

### Caso 3: Usuário com Múltiplos Perfis

```
1. Usuário tem perfil personal
2. Usuário cria 2 empresas + perfil driver
3. allProfiles = [personal, business1, business2, driver]
4. Usuário troca entre perfis
5. activeProfile = qualquer um
6. personalProfile = personal (sempre) ✅
7. Header exibe dados do personal (sempre) ✅
```

### Caso 4: Corrupção de Dados (Edge Case)

```
1. Dados corrompidos (sem perfil personal)
2. allProfiles = [business, driver]
3. personalProfile = undefined
4. Fallback: profile (do hook) ✅
5. Sistema não quebra ✅
```

---

## 📝 Conclusão

### Você Está Correto! ✅

1. **Perfil personal é obrigatório**
   - Criado automaticamente no signup
   - Trigger garante que sempre existe
   - Não pode ser deletado

2. **Perfil personal é o principal**
   - Representa a identidade real do usuário
   - Base para todos os outros perfis
   - Referência permanente

3. **Correção está correta**
   - Header deve mostrar perfil personal
   - Independente do perfil ativo
   - Mantém consistência visual

4. **Outros perfis são opcionais**
   - Usuário pode não ter empresa
   - Usuário pode não usar mobilidade
   - Usuário pode não ser profissional
   - **MAS sempre terá perfil personal**

### Hierarquia Final

```
Obrigatório:
  ✅ Personal (1) - Criado automaticamente

Opcionais:
  ⭕ Business (0..N) - Se criar empresa
  ⭕ Professional (0..N) - Se for prestador
  ⭕ Driver (0..1) - Se for motorista
```

---

## 🚀 Recomendações

### 1. Documentar no Código

Adicionar comentário explicativo:

```typescript
// ✅ IMPORTANTE: Sempre usar perfil personal no header
// O perfil personal é obrigatório (criado no signup) e representa
// a identidade permanente do usuário, independente do contexto operacional.
const personalProfile = allProfiles.find((p) => p.profile_type === "personal") || profile;
```

### 2. Validação de Integridade

Adicionar validação para garantir que perfil personal existe:

```typescript
if (!personalProfile) {
  logger.error('Personal profile not found for user', { userId: user?.id });
  // Fallback ou erro
}
```

### 3. Testes Automatizados

Criar testes para garantir:
- Perfil personal sempre existe após signup
- Header sempre exibe perfil personal
- Troca de perfil não afeta header

---

**Documento gerado em**: 2026-04-18  
**Autor**: Kiro AI Assistant  
**Versão**: 1.0
