# 🔒 Diretrizes de Segurança - Desenvolvimento

## ⚠️ REGRAS ABSOLUTAS (NUNCA QUEBRE)

### 1. NUNCA use `innerHTML` diretamente

```typescript
// ❌ PROIBIDO
element.innerHTML = userContent;

// ✅ CORRETO
import { SafeHtml } from '@/shared/components/security';
<SafeHtml content={userContent} />
```

### 2. NUNCA use `dangerouslySetInnerHTML`

```typescript
// ❌ PROIBIDO
<div dangerouslySetInnerHTML={{__html: content}} />

// ✅ CORRETO
import { SafeHtml } from '@/shared/components/security';
<SafeHtml content={content} />
```

### 3. NUNCA armazene tokens em localStorage

```typescript
// ❌ PROIBIDO
localStorage.setItem('auth_token', token);

// ✅ CORRETO
// Use HttpOnly cookies (configurado no Supabase)
```

### 4. SEMPRE valide URLs de usuário

```typescript
// ❌ PROIBIDO
<a href={userUrl}>Link</a>

// ✅ CORRETO
import { SafeLink } from '@/shared/components/security';
<SafeLink href={userUrl}>Link</SafeLink>
```

### 5. SEMPRE valide imagens de usuário

```typescript
// ❌ PROIBIDO
<img src={userImageUrl} />

// ✅ CORRETO
import { SafeImage } from '@/shared/components/security';
<SafeImage src={userImageUrl} alt="Avatar" />
```

---

## 📚 Componentes Seguros Disponíveis

### SafeHtml
Renderiza HTML sanitizado de usuário.

```typescript
import { SafeHtml } from '@/shared/components/security';

<SafeHtml 
  content={userPost.content}
  allowedTags={['p', 'strong', 'em', 'a']}
/>
```

### SafeLink
Links externos seguros.

```typescript
import { SafeLink } from '@/shared/components/security';

<SafeLink href={userWebsite} target="_blank">
  Visitar site
</SafeLink>
```

### SafeImage
Imagens de usuário com validação.

```typescript
import { SafeImage } from '@/shared/components/security';

<SafeImage 
  src={user.avatar} 
  alt={user.name}
  fallback="/default-avatar.png"
/>
```

---

## 🚨 Padrões Perigosos

### ❌ Manipulação DOM Direta

```typescript
// NUNCA faça isso:
const div = document.createElement('div');
div.innerHTML = userInput; // XSS!
```

### ❌ URLs Não Validadas

```typescript
// NUNCA faça isso:
window.location.href = userInput; // Open redirect!
```

### ❌ Atributos HTML Dinâmicos

```typescript
// CUIDADO com isso:
<div title={userInput} /> // Pode ter XSS em alguns browsers
```

---

## ✅ Checklist de Code Review

Antes de aprovar um PR, verifique:

- [ ] Nenhum uso de `innerHTML` sem `DOMPurify`
- [ ] Nenhum uso de `dangerouslySetInnerHTML`
- [ ] Nenhum armazenamento de tokens em `localStorage`
- [ ] Todas as URLs de usuário validadas
- [ ] Todas as imagens de usuário validadas
- [ ] ESLint security passou sem erros
- [ ] Testes de segurança passaram

---

## 🔧 Ferramentas de Segurança

### Rodar Scan Local

```bash
# ESLint security
npm run lint:security

# Scan completo
npm run security:scan

# Verificar dependências
npm audit
```

### Pre-commit Hook

O hook `.husky/pre-commit-security` roda automaticamente e bloqueia commits inseguros.

Para pular (APENAS EM EMERGÊNCIAS):

```bash
git commit --no-verify
```

**⚠️ NUNCA pule o hook sem revisar com o time de segurança!**

---

## 📖 Recursos

- [OWASP XSS Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- [DOMPurify Documentation](https://github.com/cure53/DOMPurify)
- [React Security Best Practices](https://react.dev/learn/security)

---

## 🆘 Dúvidas?

Se não tiver certeza se algo é seguro:

1. Pergunte no canal #security do Slack
2. Marque @security-team no PR
3. Consulte este documento

**Quando em dúvida, seja conservador. Segurança > Velocidade.**
