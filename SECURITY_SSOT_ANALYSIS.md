# 🎯 ANÁLISE SSOT - Configurações de Segurança

**Data:** 2026-04-18  
**Status:** ⚠️ **VIOLAÇÃO DE SSOT DETECTADA**

---

## 🚨 PROBLEMA: VIOLAÇÃO DE SSOT

As configurações de segurança **NÃO seguem SSOT** atualmente!

### Violações Identificadas

#### 1. Content Security Policy (CSP)

**Fonte de Verdade Atual:** `vercel.json` ✅

**Duplicações Encontradas:**
- ❌ `SECURITY_VALIDATION_REPORT.md` (linha 212) - Documentação
- ❌ `SECURITY_CSP_FIX.md` (linhas 40, 48, 177) - Documentação
- ❌ `SECURITY_FIXES_APPLIED.md` (linha 56) - Documentação

**Problema:** CSP está hardcoded em múltiplos lugares. Se mudar em `vercel.json`, documentação fica desatualizada.

#### 2. Domínios Permitidos

**Fontes Múltiplas:**
- `vercel.json` - CSP headers
- Documentação - Exemplos e tabelas
- Nenhum arquivo central de configuração

**Problema:** Adicionar novo domínio requer mudanças em múltiplos arquivos.

#### 3. Componentes de Segurança

**Fontes Múltiplas:**
- `src/shared/components/security/SafeHtml.tsx` - Configuração DOMPurify
- `src/shared/components/security/SafeLink.tsx` - Lista de protocolos bloqueados
- `src/shared/components/security/SafeImage.tsx` - Lista de extensões permitidas

**Problema:** Configurações de segurança espalhadas por múltiplos componentes.

---

## ✅ SOLUÇÃO: IMPLEMENTAR SSOT

### Arquitetura Proposta

```
┌─────────────────────────────────────────────────────────┐
│ SSOT: src/config/security.config.ts                    │
│ (Single Source of Truth)                               │
└────────────────┬────────────────────────────────────────┘
                 │
                 ├─→ vercel.json (gerado automaticamente)
                 ├─→ Componentes de segurança (importam)
                 ├─→ Testes (importam)
                 └─→ Documentação (gerada automaticamente)
```

---

## 🏗️ IMPLEMENTAÇÃO

### 1. Criar SSOT Central

**Arquivo:** `src/config/security.config.ts`

```typescript
/**
 * SSOT - Configurações de Segurança
 * 
 * Este arquivo é a ÚNICA fonte de verdade para todas as
 * configurações de segurança do projeto.
 * 
 * ⚠️ IMPORTANTE: Não duplique estas configurações em outros lugares!
 * 
 * Uso:
 * - vercel.json é gerado a partir deste arquivo
 * - Componentes importam deste arquivo
 * - Testes importam deste arquivo
 * - Documentação é gerada a partir deste arquivo
 */

/**
 * Domínios permitidos no CSP
 */
export const SECURITY_DOMAINS = {
  // CDN
  CDN_JSDELIVR: 'https://cdn.jsdelivr.net',
  
  // Backend
  SUPABASE_HTTPS: 'https://*.supabase.co',
  SUPABASE_WSS: 'wss://*.supabase.co',
  
  // Fontes
  GOOGLE_FONTS_CSS: 'https://fonts.googleapis.com',
  GOOGLE_FONTS_FILES: 'https://fonts.gstatic.com',
  
  // Mapas
  OPENSTREETMAP_NOMINATIM: 'https://nominatim.openstreetmap.org',
  OPENFREEMAP_TILES: 'https://tiles.openfreemap.org',
} as const;

/**
 * Diretivas do Content Security Policy
 */
export const CSP_DIRECTIVES = {
  'default-src': ["'self'"],
  
  'script-src': [
    "'self'",
    "'unsafe-inline'",
    "'unsafe-eval'",
    SECURITY_DOMAINS.CDN_JSDELIVR,
    SECURITY_DOMAINS.SUPABASE_HTTPS,
  ],
  
  'style-src': [
    "'self'",
    "'unsafe-inline'",
    SECURITY_DOMAINS.CDN_JSDELIVR,
    SECURITY_DOMAINS.GOOGLE_FONTS_CSS,
  ],
  
  'font-src': [
    "'self'",
    'data:',
    SECURITY_DOMAINS.CDN_JSDELIVR,
    SECURITY_DOMAINS.GOOGLE_FONTS_FILES,
  ],
  
  'img-src': [
    "'self'",
    'data:',
    'https:',
    'blob:',
  ],
  
  'connect-src': [
    "'self'",
    SECURITY_DOMAINS.SUPABASE_HTTPS,
    SECURITY_DOMAINS.SUPABASE_WSS,
    SECURITY_DOMAINS.OPENSTREETMAP_NOMINATIM,
    SECURITY_DOMAINS.OPENFREEMAP_TILES,
  ],
  
  'worker-src': [
    "'self'",
    'blob:',
  ],
  
  'frame-ancestors': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
} as const;

/**
 * Gera string de CSP para headers
 */
export function generateCSPString(): string {
  return Object.entries(CSP_DIRECTIVES)
    .map(([directive, values]) => `${directive} ${values.join(' ')}`)
    .join('; ') + ';';
}

/**
 * Headers de segurança
 */
export const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(self), microphone=(), camera=()',
  'Content-Security-Policy': generateCSPString(),
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
} as const;

/**
 * Configurações de sanitização HTML (DOMPurify)
 */
export const HTML_SANITIZATION_CONFIG = {
  ALLOWED_TAGS: [
    'p', 'br', 'strong', 'em', 'u', 'a', 'ul', 'ol', 'li',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'blockquote', 'code', 'pre',
  ],
  ALLOWED_ATTR: ['href', 'title', 'target', 'rel'],
  ALLOW_DATA_ATTR: false,
  FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed'],
  FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],
} as const;

/**
 * Protocolos bloqueados em URLs
 */
export const BLOCKED_URL_PROTOCOLS = [
  'javascript:',
  'data:',
  'vbscript:',
  'file:',
  'about:',
] as const;

/**
 * Extensões de imagem permitidas
 */
export const ALLOWED_IMAGE_EXTENSIONS = [
  '.jpg',
  '.jpeg',
  '.png',
  '.gif',
  '.webp',
  '.avif',
] as const;

/**
 * Configurações de cookies seguros
 */
export const SECURE_COOKIE_CONFIG = {
  path: '/',
  sameSite: 'strict' as const,
  secure: true,
  maxAge: 60 * 60 * 24 * 7, // 7 dias
} as const;

/**
 * Prefixo de cookies de autenticação
 */
export const AUTH_COOKIE_PREFIX = 'sb-auth' as const;
```

### 2. Atualizar Componentes para Usar SSOT

**SafeHtml.tsx:**

```typescript
import DOMPurify from 'dompurify';
import { HTML_SANITIZATION_CONFIG } from '@/config/security.config';

export function SafeHtml({ content }: SafeHtmlProps) {
  const sanitizedContent = DOMPurify.sanitize(content, {
    ALLOWED_TAGS: HTML_SANITIZATION_CONFIG.ALLOWED_TAGS,
    ALLOWED_ATTR: HTML_SANITIZATION_CONFIG.ALLOWED_ATTR,
    ALLOW_DATA_ATTR: HTML_SANITIZATION_CONFIG.ALLOW_DATA_ATTR,
  });
  
  return <div dangerouslySetInnerHTML={{ __html: sanitizedContent }} />;
}
```

**SafeLink.tsx:**

```typescript
import { BLOCKED_URL_PROTOCOLS } from '@/config/security.config';

export function SafeLink({ href, children }: SafeLinkProps) {
  const isBlocked = BLOCKED_URL_PROTOCOLS.some(protocol => 
    href.toLowerCase().startsWith(protocol)
  );
  
  if (isBlocked) {
    return <span>{children}</span>;
  }
  
  return <a href={href}>{children}</a>;
}
```

**SafeImage.tsx:**

```typescript
import { ALLOWED_IMAGE_EXTENSIONS } from '@/config/security.config';

export function SafeImage({ src, alt }: SafeImageProps) {
  const extension = src.toLowerCase().match(/\.[^.]+$/)?.[0];
  const isAllowed = extension && ALLOWED_IMAGE_EXTENSIONS.includes(extension);
  
  if (!isAllowed) {
    return <img src="/placeholder.png" alt={alt} />;
  }
  
  return <img src={src} alt={alt} />;
}
```

### 3. Gerar vercel.json Automaticamente

**Script:** `scripts/generate-vercel-config.ts`

```typescript
import fs from 'fs';
import { SECURITY_HEADERS } from '../src/config/security.config';

const vercelConfig = {
  buildCommand: "npm run build",
  outputDirectory: "dist",
  devCommand: "npm run dev",
  installCommand: "npm install",
  framework: "vite",
  rewrites: [
    {
      source: "/(.*)",
      destination: "/index.html"
    }
  ],
  headers: [
    {
      source: "/(.*)",
      headers: Object.entries(SECURITY_HEADERS).map(([key, value]) => ({
        key,
        value,
      })),
    },
    {
      source: "/assets/(.*)",
      headers: [
        {
          key: "Cache-Control",
          value: "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
};

fs.writeFileSync(
  'vercel.json',
  JSON.stringify(vercelConfig, null, 2)
);

console.log('✅ vercel.json gerado a partir de security.config.ts');
```

**Adicionar ao package.json:**

```json
{
  "scripts": {
    "generate:vercel": "tsx scripts/generate-vercel-config.ts",
    "prebuild": "npm run generate:vercel"
  }
}
```

### 4. Gerar Documentação Automaticamente

**Script:** `scripts/generate-security-docs.ts`

```typescript
import fs from 'fs';
import {
  SECURITY_DOMAINS,
  CSP_DIRECTIVES,
  generateCSPString,
} from '../src/config/security.config';

const docsContent = `
# 🔒 Configurações de Segurança (Auto-gerado)

**⚠️ Este arquivo é gerado automaticamente. Não edite manualmente!**

## Content Security Policy

\`\`\`
${generateCSPString()}
\`\`\`

## Domínios Permitidos

${Object.entries(SECURITY_DOMAINS).map(([key, value]) => 
  `- **${key}:** \`${value}\``
).join('\n')}

## Diretivas CSP

${Object.entries(CSP_DIRECTIVES).map(([directive, values]) => 
  `### ${directive}\n${values.map(v => `- \`${v}\``).join('\n')}`
).join('\n\n')}
`;

fs.writeFileSync('docs/SECURITY_CONFIG_AUTO.md', docsContent);

console.log('✅ Documentação gerada a partir de security.config.ts');
```

---

## 📊 COMPARAÇÃO: ANTES vs DEPOIS

### Antes (Sem SSOT)

```
❌ CSP definido em: vercel.json
❌ CSP duplicado em: 4 arquivos de documentação
❌ Domínios hardcoded em: múltiplos lugares
❌ Configurações espalhadas em: 3+ componentes
❌ Mudança requer: editar 8+ arquivos
❌ Risco de inconsistência: ALTO
```

### Depois (Com SSOT)

```
✅ CSP definido em: security.config.ts (SSOT)
✅ vercel.json: gerado automaticamente
✅ Componentes: importam de SSOT
✅ Documentação: gerada automaticamente
✅ Mudança requer: editar 1 arquivo
✅ Risco de inconsistência: ZERO
```

---

## 🎯 BENEFÍCIOS DO SSOT

### 1. Manutenibilidade

**Antes:**
```typescript
// Adicionar novo domínio requer editar:
// 1. vercel.json
// 2. SECURITY_VALIDATION_REPORT.md
// 3. SECURITY_CSP_FIX.md
// 4. SECURITY_FIXES_APPLIED.md
// 5. Outros docs...
```

**Depois:**
```typescript
// Adicionar novo domínio:
// 1. Editar security.config.ts
// 2. Rodar npm run generate:vercel
// 3. Rodar npm run generate:docs
// Pronto! Tudo atualizado automaticamente
```

### 2. Consistência

**Antes:** Risco de CSP diferente entre docs e produção

**Depois:** Impossível ter inconsistência (mesma fonte)

### 3. Type Safety

```typescript
// TypeScript garante que domínios são válidos
import { SECURITY_DOMAINS } from '@/config/security.config';

// ✅ Autocomplete e validação
const domain = SECURITY_DOMAINS.GOOGLE_FONTS_CSS;

// ❌ Erro em tempo de compilação se domínio não existe
const invalid = SECURITY_DOMAINS.INVALID_DOMAIN; // Error!
```

### 4. Testabilidade

```typescript
import { CSP_DIRECTIVES, generateCSPString } from '@/config/security.config';

describe('Security Config', () => {
  it('deve incluir Google Fonts no style-src', () => {
    expect(CSP_DIRECTIVES['style-src']).toContain(
      'https://fonts.googleapis.com'
    );
  });
  
  it('deve gerar CSP válido', () => {
    const csp = generateCSPString();
    expect(csp).toContain('default-src');
    expect(csp).toContain('script-src');
  });
});
```

---

## 🚀 PLANO DE IMPLEMENTAÇÃO

### Fase 1: Criar SSOT (1h)

- [ ] Criar `src/config/security.config.ts`
- [ ] Migrar todas as configurações para SSOT
- [ ] Adicionar tipos TypeScript
- [ ] Adicionar documentação inline

### Fase 2: Atualizar Componentes (30min)

- [ ] Atualizar SafeHtml para usar SSOT
- [ ] Atualizar SafeLink para usar SSOT
- [ ] Atualizar SafeImage para usar SSOT
- [ ] Atualizar cookieStorage para usar SSOT

### Fase 3: Automação (1h)

- [ ] Criar script `generate-vercel-config.ts`
- [ ] Criar script `generate-security-docs.ts`
- [ ] Adicionar scripts ao package.json
- [ ] Configurar prebuild hook

### Fase 4: Testes (30min)

- [ ] Criar testes para security.config.ts
- [ ] Validar geração de vercel.json
- [ ] Validar geração de documentação
- [ ] Testar em staging

### Fase 5: Documentação (30min)

- [ ] Atualizar README_SECURITY.md
- [ ] Criar SECURITY_SSOT_GUIDE.md
- [ ] Atualizar SECURITY_GUIDELINES.md
- [ ] Adicionar ao SECURITY_INDEX.md

**Tempo total:** ~3.5 horas

---

## ✅ CHECKLIST DE VALIDAÇÃO SSOT

### Configurações

- [ ] CSP tem ÚNICA fonte de verdade
- [ ] Domínios definidos em um só lugar
- [ ] Componentes importam de SSOT
- [ ] Testes importam de SSOT

### Automação

- [ ] vercel.json gerado automaticamente
- [ ] Documentação gerada automaticamente
- [ ] Build falha se SSOT inválido
- [ ] CI/CD valida SSOT

### Documentação

- [ ] Docs explicam SSOT
- [ ] Docs mostram como adicionar domínio
- [ ] Docs mostram como atualizar CSP
- [ ] Docs têm aviso "auto-gerado"

---

## 🎯 RESULTADO ESPERADO

```
╔══════════════════════════════════════════════════════════╗
║                                                          ║
║   ✅ SSOT IMPLEMENTADO                                  ║
║   ✅ 1 FONTE DE VERDADE                                 ║
║   ✅ 0 DUPLICAÇÕES                                      ║
║   ✅ 100% CONSISTÊNCIA                                  ║
║   ✅ TYPE SAFETY                                        ║
║   ✅ AUTOMAÇÃO COMPLETA                                 ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
```

---

## 📚 REFERÊNCIAS

- **SSOT Pattern:** [Martin Fowler - Single Source of Truth](https://martinfowler.com/bliki/SingleSourceOfTruth.html)
- **Config as Code:** [12 Factor App - Config](https://12factor.net/config)
- **Type Safety:** [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)

---

**Versão:** 1.0.0  
**Data:** 2026-04-18  
**Status:** ⚠️ **PROPOSTA - AGUARDANDO IMPLEMENTAÇÃO**

---

*SSOT: Uma fonte de verdade, zero inconsistências.*
