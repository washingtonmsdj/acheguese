# Padrão de Modelagem de Dados

## 🎯 Fundação: User vs Profile vs Author

Este é o padrão SSOT (Single Source of Truth) oficial para modelagem de dados no projeto.

## 📖 Definições

### `user_id`
**Identidade de Autenticação**

- Representa a conta no sistema (auth.users)
- Usado para: login, sessão, roles globais, billing, auditoria técnica
- **Escopo**: Global/Sistema
- **Cardinalidade**: 1 user = 1 conta

### `profile_id`
**Identidade de Atuação**

- Representa o perfil ativo/contextual do usuário
- Usado para: conteúdo, interação social, reputação, participação
- **Escopo**: Contexto de uso
- **Cardinalidade**: 1 user = N profiles

### `author` (Papel Contextual)
**NÃO é Entidade Própria**

- É apenas um papel contextual
- Author de post/comentário sempre aponta para `profile_id`
- **Nunca** usar `author_id` sozinho (ambíguo)
- **Sempre** usar `author_profile_id` (explícito)

## 🏗️ Arquitetura de Profiles

### Tipos de Profile

Um usuário pode ter múltiplos profiles simultâneos:

```
User (João)
├── Profile Personal (id: uuid-1, type: 'personal')
├── Profile Driver (id: uuid-2, type: 'driver')
├── Profile Business (id: uuid-3, type: 'business')
└── Profile Professional (id: uuid-4, type: 'professional')
```

### Profile Ativo

O sistema mantém um "profile ativo" por contexto:

```typescript
// Exemplo: Usuário troca de profile
user.activeProfile = 'driver'; // Agora atua como motorista
user.activeProfile = 'business'; // Agora atua como empresa
```

## ✅ Regras de Modelagem

### Quando Usar `user_id`

```sql
-- ✅ Correto: Contexto de autenticação/conta
CREATE TABLE user_settings (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  theme TEXT,
  language TEXT
);

-- ✅ Correto: Billing/pagamento
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  plan TEXT,
  expires_at TIMESTAMP
);

-- ✅ Correto: Auditoria técnica
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  action TEXT,
  timestamp TIMESTAMP
);
```

### Quando Usar `profile_id`

```sql
-- ✅ Correto: Conteúdo social
CREATE TABLE posts (
  id UUID PRIMARY KEY,
  author_profile_id UUID REFERENCES profiles(id),
  content TEXT,
  created_at TIMESTAMP
);

-- ✅ Correto: Interações sociais
CREATE TABLE likes (
  id UUID PRIMARY KEY,
  post_id UUID REFERENCES posts(id),
  liker_profile_id UUID REFERENCES profiles(id)
);

-- ✅ Correto: Relacionamentos entre profiles
CREATE TABLE profile_followers (
  id UUID PRIMARY KEY,
  follower_profile_id UUID REFERENCES profiles(id),
  followed_profile_id UUID REFERENCES profiles(id)
);
```

## 🚫 Nomenclatura Proibida

### Nomes Ambíguos

```sql
-- ❌ PROIBIDO: Ambíguo (user ou profile?)
author_id UUID

-- ❌ PROIBIDO: Ambíguo
owner_id UUID

-- ❌ PROIBIDO: Ambíguo
creator_id UUID

-- ❌ PROIBIDO: Genérico demais
user_id UUID  -- Em contexto social
```

## ✅ Nomenclatura Obrigatória

### Nomes Explícitos

```sql
-- ✅ OBRIGATÓRIO: Explícito e claro
author_profile_id UUID REFERENCES profiles(id)

-- ✅ OBRIGATÓRIO: Papel + tipo de identidade
creator_profile_id UUID REFERENCES profiles(id)
reviewer_profile_id UUID REFERENCES profiles(id)
reviewed_profile_id UUID REFERENCES profiles(id)
liker_profile_id UUID REFERENCES profiles(id)
saver_profile_id UUID REFERENCES profiles(id)
sender_profile_id UUID REFERENCES profiles(id)
receiver_profile_id UUID REFERENCES profiles(id)
member_profile_id UUID REFERENCES profiles(id)
owner_profile_id UUID REFERENCES profiles(id)

-- ✅ OBRIGATÓRIO: Contexto global/admin
moderator_user_id UUID REFERENCES auth.users(id)
admin_user_id UUID REFERENCES auth.users(id)
```

## 🎯 Regra de Decisão

Antes de modelar qualquer tabela ou coluna, responda:

### 3 Perguntas Fundamentais

1. **Isso representa conta autenticada ou identidade que atua?**
   - Conta → `user_id`
   - Identidade → `profile_id`

2. **Isso precisa respeitar profile ativo/switching?**
   - Sim → `profile_id`
   - Não → `user_id`

3. **Se o mesmo user tiver 2 profiles, o comportamento muda por profile?**
   - Sim → `*_profile_id`
   - Não → `*_user_id`

## 📊 Exemplos Práticos

### Exemplo 1: Sistema de Posts

```sql
-- ✅ Modelagem correta
CREATE TABLE posts (
  id UUID PRIMARY KEY,
  author_profile_id UUID NOT NULL REFERENCES profiles(id),
  content TEXT NOT NULL,
  city TEXT,
  neighborhood TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Comentário explicativo
COMMENT ON COLUMN posts.author_profile_id IS 
'Profile ID do autor. Segue padrão SSOT: author sempre aponta para profile_id. 
Um user pode ter múltiplos profiles (personal, driver, business, professional).';
```

### Exemplo 2: Sistema de Likes

```sql
-- ✅ Modelagem correta
CREATE TABLE post_likes (
  id UUID PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES posts(id),
  liker_profile_id UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(post_id, liker_profile_id)
);

-- ❌ Modelagem ERRADA
CREATE TABLE post_likes_wrong (
  id UUID PRIMARY KEY,
  post_id UUID NOT NULL,
  user_id UUID NOT NULL,  -- ERRADO: Deveria ser liker_profile_id
  created_at TIMESTAMP
);
```

### Exemplo 3: Sistema de Reviews

```sql
-- ✅ Modelagem correta
CREATE TABLE reviews (
  id UUID PRIMARY KEY,
  reviewer_profile_id UUID NOT NULL REFERENCES profiles(id),
  reviewed_profile_id UUID NOT NULL REFERENCES profiles(id),
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(reviewer_profile_id, reviewed_profile_id)
);
```

### Exemplo 4: Sistema de Grupos

```sql
-- ✅ Modelagem correta
CREATE TABLE groups (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  creator_profile_id UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE group_members (
  id UUID PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES groups(id),
  member_profile_id UUID NOT NULL REFERENCES profiles(id),
  role TEXT DEFAULT 'member',
  joined_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(group_id, member_profile_id)
);
```

### Exemplo 5: Sistema de Moderação

```sql
-- ✅ Modelagem correta (contexto global)
CREATE TABLE moderation_actions (
  id UUID PRIMARY KEY,
  moderator_user_id UUID NOT NULL REFERENCES auth.users(id),
  target_post_id UUID REFERENCES posts(id),
  action TEXT NOT NULL,
  reason TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Moderação é contexto global/admin, usa user_id
```

## 🔍 Auditoria e Validação

### ESLint Rule Customizada

O projeto possui regra ESLint que valida nomenclatura:

```javascript
// eslint-plugin-ssot.cjs
rules: {
  'no-ambiguous-naming': {
    // Detecta: author_id, owner_id, creator_id
    // Sugere: author_profile_id, owner_profile_id, etc.
  }
}
```

### Script de Auditoria

```bash
# Auditar nomenclatura em todo o projeto
npm run audit:naming

# Validar padrão SSOT
npm run lint
```

## 📋 Checklist de Modelagem

Ao criar nova tabela:

- [ ] Identifiquei se é contexto de conta ou atuação?
- [ ] Usei `*_profile_id` para contexto social?
- [ ] Usei `*_user_id` apenas para contexto global/admin?
- [ ] Evitei nomes ambíguos (author_id, owner_id)?
- [ ] Adicionei comentário explicativo na coluna?
- [ ] Criei foreign key apropriada?
- [ ] Criei índice se necessário?
- [ ] Documentei a decisão?

## 🎓 Casos Especiais

### Caso 1: Tabela de Notificações

```sql
-- ✅ Correto: Notificação vai para o USER (não profile específico)
CREATE TABLE notifications (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Justificativa: Notificações são globais para a conta
```

### Caso 2: Tabela de Pagamentos

```sql
-- ✅ Correto: Pagamento é da conta (billing)
CREATE TABLE payments (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  amount DECIMAL NOT NULL,
  status TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Justificativa: Billing é contexto de conta
```

### Caso 3: Tabela de Mensagens Diretas

```sql
-- ✅ Correto: Mensagem entre profiles
CREATE TABLE direct_messages (
  id UUID PRIMARY KEY,
  sender_profile_id UUID NOT NULL REFERENCES profiles(id),
  receiver_profile_id UUID NOT NULL REFERENCES profiles(id),
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Justificativa: Conversa é entre identidades de atuação
```

## 🔄 Migration de Dados Legados

Se encontrar tabelas com nomenclatura antiga:

```sql
-- Exemplo de migration
ALTER TABLE posts 
  RENAME COLUMN author_id TO author_profile_id;

-- Atualizar comentário
COMMENT ON COLUMN posts.author_profile_id IS 
'Profile ID do autor. Segue padrão SSOT oficial.';
```

## 📚 Referências

- [ARCHITECTURE.md](./ARCHITECTURE.md) - Arquitetura geral
- [MIGRATIONS.md](./MIGRATIONS.md) - Histórico de migrations
- `eslint-plugin-ssot.cjs` - Regras de validação

## ❓ FAQ

**P: Por que não usar apenas user_id em tudo?**  
R: Porque um usuário pode ter múltiplos profiles (pessoal, motorista, empresa). O conteúdo social deve ser associado ao profile ativo, não à conta.

**P: Quando usar author_id?**  
R: NUNCA. Sempre use `author_profile_id` para ser explícito.

**P: E se eu não souber se é user ou profile?**  
R: Use as 3 perguntas fundamentais da seção "Regra de Decisão".

**P: Posso ter exceções?**  
R: Apenas com justificativa documentada e aprovação da equipe.

---

**Última atualização**: 2026-03-19  
**Versão**: 1.0.0  
**Status**: OFICIAL - Padrão obrigatório para todo o projeto
