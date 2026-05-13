# Segurança do Projeto

## 🔐 Visão Geral

Este documento descreve as políticas e práticas de segurança implementadas no projeto.

## 🎯 Princípios

1. **Security by Default** - Segurança desde o design
2. **Zero Trust** - Validar sempre, confiar nunca
3. **Least Privilege** - Mínimo privilégio necessário
4. **Defense in Depth** - Múltiplas camadas de proteção

## 🔑 Gestão de Credenciais

### Política

**NUNCA** commitar credenciais no código. Todas as credenciais devem estar em variáveis de ambiente.

### Configuração

#### Arquivo `.env.local`

```env
# Supabase publico
VITE_SUPABASE_URL="https://seu-projeto.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="sua-chave-publica"
```

`SUPABASE_SERVICE_ROLE_KEY` nao deve ser persistida em arquivos versionados ou em `.env.local`. Carregue o segredo apenas no shell administrativo ou num backend secret manager.

#### Validação Obrigatória

```typescript
// src/lib/supabase.ts
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}
```

### Scripts de Validação

#### Validar Credenciais Hardcoded

```bash
# Verificar se há credenciais no código
npm run security:validate
```

Este script:
- ✅ Escaneia todo o código
- ✅ Detecta URLs, Service Keys, Anon Keys
- ✅ Reporta violações por severidade
- ✅ Exit code 1 se encontrar problemas

#### Migrar Scripts Legados

```bash
# Migrar scripts antigos para usar .env
npm run security:migrate
```

Este script:
- ✅ Cria backups automáticos
- ✅ Substitui credenciais hardcoded
- ✅ Atualiza imports para usar config.mjs
- ✅ Valida após migração

### Configuração Centralizada

Todos os scripts devem usar a configuração centralizada:

```javascript
// scripts/config.mjs
import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Carregar .env.local
config({ path: '.env.local' });

// Validar
const url = process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  throw new Error('Missing environment variables');
}

// Exportar clientes configurados
export const supabaseAdmin = createClient(url, serviceKey);
```

## 🛡️ Proteções Implementadas

### 1. Pre-commit Hooks

```bash
# .husky/pre-commit
npm run security:validate
npm run lint
npm run typecheck
```

Previne commits com:
- Credenciais hardcoded
- Erros de lint
- Erros de tipo

### 2. CI/CD Validation

```yaml
# .github/workflows/security-check.yml
name: Security Check
on: [push, pull_request]
jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm ci
      - run: npm run security:validate
```

### 3. Gitignore

```gitignore
# Credenciais
.env
.env.local
.env.*.local

# Backups de scripts
scripts/backups/

# Logs
*.log
```

### 4. Rate limiting distribuido para endpoints administrativos

Endpoints administrativos com controle de abuso devem usar armazenamento distribuido em producao (serverless), evitando bypass por multiplas instancias.

Variaveis obrigatorias para modo distribuido:

```env
UPSTASH_REDIS_REST_URL="https://<instance>.upstash.io"
UPSTASH_REDIS_REST_TOKEN="<token>"
```

Sem essas variaveis, o fallback em memoria deve ser considerado apenas para desenvolvimento local.

### 5. Assinatura HMAC para endpoint administrativo de importacao

O endpoint `api/admin/google-places-import.ts` suporta modo estrito com HMAC para mitigar replay e vazamento de token estatico.

Ativacao:

```env
IMPORT_ADMIN_REQUIRE_HMAC="true"
```

Headers obrigatorios quando ativo:

- `x-import-timestamp`: epoch em milissegundos
- `x-import-nonce`: identificador unico por requisicao
- `x-import-signature`: HMAC SHA-256 do payload

Formato da assinatura:

`HMAC_SHA256(IMPORT_ADMIN_TOKEN, "<timestamp>.<nonce>.<sha256(body)>")`

Janela de validade:

- Maximo de 5 minutos de diferenca de relogio
- Nonce aceito uma unica vez dentro da janela

### 6. Rotacao de segredo sem downtime

Para rotacionar o segredo administrativo sem interromper automacoes:

1. Defina:
   - `IMPORT_ADMIN_TOKEN_ACTIVE` = novo segredo
   - `IMPORT_ADMIN_TOKEN_PREVIOUS` = segredo antigo
2. Atualize os clientes/scripts para usar o novo segredo.
3. Apos a janela de transicao, remova `IMPORT_ADMIN_TOKEN_PREVIOUS`.

Observacoes:

- O endpoint aceita `ACTIVE` e `PREVIOUS` durante a transicao.
- Em ausencia de `IMPORT_ADMIN_TOKEN_ACTIVE`, existe fallback para `IMPORT_ADMIN_TOKEN` (legado).

## 🔒 Row Level Security (RLS)

### Políticas no Supabase

Todas as tabelas devem ter RLS habilitado:

```sql
-- Habilitar RLS
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Política: Usuário vê apenas seus posts
CREATE POLICY "Users can view own posts"
ON posts FOR SELECT
USING (
  author_profile_id IN (
    SELECT id FROM profiles WHERE user_id = auth.uid()
  )
);

-- Política: Usuário cria posts apenas com seu profile
CREATE POLICY "Users can create posts with own profile"
ON posts FOR INSERT
WITH CHECK (
  author_profile_id IN (
    SELECT id FROM profiles WHERE user_id = auth.uid()
  )
);
```

### Checklist RLS

Para cada tabela:

- [ ] RLS habilitado
- [ ] Política de SELECT
- [ ] Política de INSERT
- [ ] Política de UPDATE
- [ ] Política de DELETE
- [ ] Testado com diferentes usuários

## 🔐 Autenticação

### Supabase Auth

```typescript
// Login
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'secure-password'
});

// Verificar sessão
const { data: { user } } = await supabase.auth.getUser();

// Logout
await supabase.auth.signOut();
```

### Proteção de Rotas

```typescript
// Exemplo: Proteção de rota
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { data: { user } } = useQuery({
    queryKey: ['user'],
    queryFn: () => supabase.auth.getUser()
  });

  if (!user) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
}
```

## 🛡️ Sanitização de Inputs

### Frontend

```typescript
// Sanitizar HTML
import DOMPurify from 'dompurify';

const sanitized = DOMPurify.sanitize(userInput);
```

### Backend (Edge Functions)

```typescript
// Validar e sanitizar
import { z } from 'zod';

const schema = z.object({
  content: z.string().min(1).max(1000),
  title: z.string().min(3).max(100)
});

const validated = schema.parse(input);
```

## 🔍 Auditoria

### Logs de Segurança

```typescript
// Registrar ações sensíveis
await supabase.from('audit_logs').insert({
  user_id: user.id,
  action: 'delete_post',
  resource_id: postId,
  timestamp: new Date().toISOString()
});
```

### Monitoramento

- Falhas de autenticação
- Tentativas de acesso não autorizado
- Mudanças em dados sensíveis
- Uso de credenciais de admin

## 🚨 Resposta a Incidentes

### Procedimento

1. **Detectar** - Monitoramento automático
2. **Conter** - Revogar acessos comprometidos
3. **Erradicar** - Remover vulnerabilidade
4. **Recuperar** - Restaurar operação normal
5. **Aprender** - Documentar e melhorar

### Contatos

- **Segurança**: security@projeto.com
- **Emergência**: +55 11 9999-9999

## 📋 Checklist de Segurança

### Para Desenvolvedores

- [ ] Nunca commitar credenciais
- [ ] Sempre usar variáveis de ambiente
- [ ] Validar inputs do usuário
- [ ] Implementar RLS em novas tabelas
- [ ] Testar permissões
- [ ] Revisar código de segurança

### Para Code Review

- [ ] Sem credenciais hardcoded
- [ ] Validação de inputs presente
- [ ] RLS configurado
- [ ] Testes de segurança passando
- [ ] Documentação atualizada

### Para Deploy

- [ ] Variáveis de ambiente configuradas
- [ ] RLS habilitado em produção
- [ ] Backups configurados
- [ ] Monitoramento ativo
- [ ] Logs de auditoria funcionando

## 🔄 Rotação de Credenciais

### Frequência

- **Service Role Key**: A cada 90 dias
- **Anon Key**: Apenas se comprometida
- **Database Password**: A cada 180 dias

### Procedimento

1. Gerar nova credencial no Supabase Dashboard
2. Atualizar `.env.local` local
3. Atualizar variáveis no CI/CD
4. Atualizar variáveis em produção
5. Testar aplicação
6. Revogar credencial antiga
7. Documentar mudança

## 📚 Recursos

### Ferramentas

- [Supabase Security](https://supabase.com/docs/guides/auth)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [DOMPurify](https://github.com/cure53/DOMPurify)
- [Zod](https://zod.dev/)

### Treinamento

- Curso de segurança web
- OWASP guidelines
- Supabase security best practices

## 📊 Métricas de Segurança

### KPIs

- Tempo médio de detecção de vulnerabilidades
- Tempo médio de correção
- Número de incidentes por mês
- Cobertura de testes de segurança

### Relatórios

- Mensal: Resumo de segurança
- Trimestral: Auditoria completa
- Anual: Revisão de políticas

## ⚠️ Vulnerabilidades Conhecidas

Nenhuma vulnerabilidade conhecida no momento.

Para reportar vulnerabilidades: security@projeto.com

## 🔐 Compliance

### LGPD (Lei Geral de Proteção de Dados)

- Dados pessoais criptografados
- Consentimento explícito
- Direito ao esquecimento implementado
- DPO designado

### Boas Práticas

- Criptografia em trânsito (HTTPS)
- Criptografia em repouso (Supabase)
- Backup regular
- Disaster recovery plan

---

**Última atualização**: 2026-03-19  
**Versão**: 1.0.0  
**Responsável**: Equipe de Segurança
