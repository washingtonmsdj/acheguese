# 🛡️ SCRIPTS DE TESTE DE SEGURANÇA
## Ferramentas para Validar Vulnerabilidades

---

## 1. TESTE DE POLÍTICAS RLS

### Script: `test-rls-driver-locations.js`

```javascript
/**
 * Testa se políticas RLS de driver_locations são permissivas
 * VULNERABILIDADE: Qualquer usuário autenticado pode ver todas as localizações
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

async function testDriverLocationsRLS() {
  console.log('🔍 Testando RLS de driver_locations...\n');

  // 1. Criar usuário de teste
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: `test-${Date.now()}@security-audit.local`,
    password: 'TestPassword123!',
  });

  if (authError) {
    console.error('❌ Erro ao criar usuário:', authError);
    return;
  }

  console.log('✅ Usuário de teste criado:', authData.user.email);

  // 2. Tentar acessar TODAS as localizações de motoristas
  const { data: locations, error: locError } = await supabase
    .from('driver_locations')
    .select('*, driver_data(*)')
    .order('updated_at', { ascending: false })
    .limit(10);

  if (locError) {
    console.log('✅ SEGURO: Acesso negado', locError.message);
  } else {
    console.log('⚠️ VULNERÁVEL: Acesso permitido!');
    console.log(`📍 Localizações obtidas: ${locations.length}`);
    console.log('Amostra:', locations.slice(0, 2));
  }

  // 3. Cleanup
  await supabase.auth.signOut();
}

testDriverLocationsRLS();
```

---

## 2. TESTE DE RATE LIMITING

### Script: `test-rate-limiting.js`

```javascript
/**
 * Testa se rate limiting pode ser bypassado com rotação de User-Agent
 */

async function testRateLimitBypass() {
  console.log('🔍 Testando bypass de rate limiting...\n');

  const endpoint = 'https://xhdowzacfujckjelqhtd.supabase.co/functions/v1/subscribe-push';
  const maxAttempts = 15; // Limite é 10/min
  let successCount = 0;
  let blockedCount = 0;

  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': `TestBot-${i}`, // Rotaciona UA
          'Authorization': 'Bearer fake-token',
        },
        body: JSON.stringify({
          userId: 'test-user-id',
          subscription: { endpoint: 'test' },
        }),
      });

      if (response.status === 429) {
        blockedCount++;
        console.log(`❌ Tentativa ${i + 1}: Bloqueado (429)`);
      } else {
        successCount++;
        console.log(`✅ Tentativa ${i + 1}: Passou (${response.status})`);
      }
    } catch (error) {
      console.log(`⚠️ Tentativa ${i + 1}: Erro`, error.message);
    }

    // Pequeno delay
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log(`\n📊 Resultado:`);
  console.log(`   Sucesso: ${successCount}/${maxAttempts}`);
  console.log(`   Bloqueado: ${blockedCount}/${maxAttempts}`);

  if (successCount > 10) {
    console.log('⚠️ VULNERÁVEL: Rate limiting bypassado!');
  } else {
    console.log('✅ SEGURO: Rate limiting funcionando');
  }
}

testRateLimitBypass();
```

---

## 3. TESTE DE OPEN REDIRECT

### Script: `test-open-redirect.js`

```javascript
/**
 * Testa se validação de redirectUrl previne open redirect
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

async function testOpenRedirect() {
  console.log('🔍 Testando open redirect...\n');

  // Login como usuário legítimo
  await supabase.auth.signInWithPassword({
    email: 'test@example.com',
    password: 'TestPassword123!',
  });

  const maliciousUrls = [
    'https://evil.com/phishing',
    'http://evil.com',
    'javascript:alert(1)',
    '//evil.com',
    'https://acheguese.com.br.evil.com',
  ];

  for (const url of maliciousUrls) {
    try {
      const response = await fetch(
        `${process.env.VITE_SUPABASE_URL}/functions/v1/billing-create-checkout`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session.access_token}`,
          },
          body: JSON.stringify({
            planCode: 'pro',
            successUrl: url,
            cancelUrl: 'https://acheguese.com.br',
          }),
        }
      );

      if (response.ok) {
        console.log(`⚠️ VULNERÁVEL: ${url} - Aceito!`);
      } else {
        const error = await response.json();
        console.log(`✅ BLOQUEADO: ${url} - ${error.error}`);
      }
    } catch (error) {
      console.log(`✅ BLOQUEADO: ${url} - ${error.message}`);
    }
  }
}

testOpenRedirect();
```

---

## 4. TESTE DE XSS

### Script: `test-xss.js`

```javascript
/**
 * Testa se SafeHtml sanitiza corretamente conteúdo malicioso
 */

import DOMPurify from 'dompurify';

function testXSS() {
  console.log('🔍 Testando XSS...\n');

  const xssPayloads = [
    '<script>alert("XSS")</script>',
    '<img src=x onerror=alert("XSS")>',
    '<svg onload=alert("XSS")>',
    '<iframe src="javascript:alert(\'XSS\')">',
    '<body onload=alert("XSS")>',
    '<input onfocus=alert("XSS") autofocus>',
    '<marquee onstart=alert("XSS")>',
    '<details open ontoggle=alert("XSS")>',
  ];

  let vulnerableCount = 0;

  for (const payload of xssPayloads) {
    const sanitized = DOMPurify.sanitize(payload);

    if (sanitized.includes('alert') || sanitized.includes('onerror') || sanitized.includes('onload')) {
      console.log(`⚠️ VULNERÁVEL: ${payload}`);
      console.log(`   Sanitizado: ${sanitized}\n`);
      vulnerableCount++;
    } else {
      console.log(`✅ BLOQUEADO: ${payload}`);
      console.log(`   Sanitizado: ${sanitized}\n`);
    }
  }

  if (vulnerableCount > 0) {
    console.log(`⚠️ ${vulnerableCount} payloads XSS passaram!`);
  } else {
    console.log('✅ Todos os payloads XSS foram bloqueados');
  }
}

testXSS();
```

---

## 5. TESTE DE SQL INJECTION

### Script: `test-sql-injection.js`

```javascript
/**
 * Testa se queries são vulneráveis a SQL injection
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

async function testSQLInjection() {
  console.log('🔍 Testando SQL Injection...\n');

  await supabase.auth.signInWithPassword({
    email: 'test@example.com',
    password: 'TestPassword123!',
  });

  const sqlPayloads = [
    "' OR '1'='1",
    "'; DROP TABLE profiles; --",
    "' UNION SELECT * FROM auth.users --",
    "1' AND 1=1 --",
    "admin'--",
  ];

  for (const payload of sqlPayloads) {
    try {
      // Tentar injetar em busca de perfis
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', payload);

      if (error) {
        console.log(`✅ BLOQUEADO: ${payload}`);
        console.log(`   Erro: ${error.message}\n`);
      } else {
        console.log(`⚠️ Query executada: ${payload}`);
        console.log(`   Resultados: ${data.length}\n`);
      }
    } catch (error) {
      console.log(`✅ BLOQUEADO: ${payload}`);
      console.log(`   Exceção: ${error.message}\n`);
    }
  }
}

testSQLInjection();
```

---

## 6. TESTE DE ENUMERAÇÃO DE USUÁRIOS

### Script: `test-user-enumeration.js`

```javascript
/**
 * Testa se é possível enumerar usuários existentes
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

async function testUserEnumeration() {
  console.log('🔍 Testando enumeração de usuários...\n');

  const testEmails = [
    'admin@acheguese.com.br',
    'test@example.com',
    'nonexistent@example.com',
  ];

  for (const email of testEmails) {
    const startTime = Date.now();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: 'WrongPassword123!',
    });

    const responseTime = Date.now() - startTime;

    console.log(`Email: ${email}`);
    console.log(`  Tempo de resposta: ${responseTime}ms`);
    console.log(`  Mensagem: ${error?.message}\n`);
  }

  console.log('⚠️ Se os tempos de resposta forem muito diferentes,');
  console.log('   pode ser possível enumerar usuários existentes.');
}

testUserEnumeration();
```

---

## 7. TESTE DE CSRF

### Script: `test-csrf.js`

```javascript
/**
 * Testa se endpoints estão protegidos contra CSRF
 */

async function testCSRF() {
  console.log('🔍 Testando CSRF...\n');

  // Simular requisição cross-origin sem token CSRF
  const maliciousForm = `
    <form action="https://xhdowzacfujckjelqhtd.supabase.co/functions/v1/user-delete-account" method="POST">
      <input type="hidden" name="confirm" value="true">
      <input type="submit" value="Click aqui para ganhar prêmio!">
    </form>
  `;

  console.log('Formulário malicioso:');
  console.log(maliciousForm);

  try {
    const response = await fetch(
      'https://xhdowzacfujckjelqhtd.supabase.co/functions/v1/user-delete-account',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': 'https://evil.com',
        },
        body: JSON.stringify({ confirm: true }),
      }
    );

    if (response.status === 403 || response.status === 401) {
      console.log('✅ PROTEGIDO: CORS bloqueou requisição cross-origin');
    } else {
      console.log('⚠️ VULNERÁVEL: Requisição cross-origin aceita!');
    }
  } catch (error) {
    console.log('✅ PROTEGIDO: Requisição bloqueada');
  }
}

testCSRF();
```

---

## 8. TESTE DE HEADERS DE SEGURANÇA

### Script: `test-security-headers.sh`

```bash
#!/bin/bash

echo "🔍 Testando headers de segurança..."
echo ""

URL="https://acheguese.com.br"

echo "📋 Headers de segurança:"
curl -I -s $URL | grep -E "(X-Frame-Options|X-Content-Type-Options|Strict-Transport-Security|Content-Security-Policy|X-XSS-Protection|Referrer-Policy)"

echo ""
echo "✅ Headers esperados:"
echo "  - X-Frame-Options: DENY"
echo "  - X-Content-Type-Options: nosniff"
echo "  - Strict-Transport-Security: max-age=31536000"
echo "  - Content-Security-Policy: (deve existir)"
echo "  - X-XSS-Protection: 1; mode=block"
echo "  - Referrer-Policy: strict-origin-when-cross-origin"
```

---

## 9. TESTE DE DEPENDÊNCIAS VULNERÁVEIS

### Script: `test-dependencies.sh`

```bash
#!/bin/bash

echo "🔍 Verificando dependências vulneráveis..."
echo ""

# Audit npm
echo "📦 NPM Audit:"
npm audit --production

echo ""
echo "📦 Verificando versões desatualizadas:"
npm outdated

echo ""
echo "⚠️ Dependências críticas para atualizar:"
npm audit --production --json | jq '.vulnerabilities | to_entries[] | select(.value.severity == "critical" or .value.severity == "high") | {name: .key, severity: .value.severity}'
```

---

## 10. TESTE AUTOMATIZADO COMPLETO

### Script: `run-security-tests.sh`

```bash
#!/bin/bash

echo "🛡️ EXECUTANDO SUITE COMPLETA DE TESTES DE SEGURANÇA"
echo "=================================================="
echo ""

# 1. Verificar credenciais expostas
echo "1️⃣ Verificando credenciais expostas..."
if grep -r "password\|secret\|api_key" .env.local 2>/dev/null; then
  echo "⚠️ ALERTA: Credenciais encontradas em .env.local"
else
  echo "✅ Nenhuma credencial exposta"
fi
echo ""

# 2. Verificar políticas RLS
echo "2️⃣ Testando políticas RLS..."
node test-rls-driver-locations.js
echo ""

# 3. Testar rate limiting
echo "3️⃣ Testando rate limiting..."
node test-rate-limiting.js
echo ""

# 4. Testar XSS
echo "4️⃣ Testando XSS..."
node test-xss.js
echo ""

# 5. Testar SQL Injection
echo "5️⃣ Testando SQL Injection..."
node test-sql-injection.js
echo ""

# 6. Verificar headers
echo "6️⃣ Verificando headers de segurança..."
bash test-security-headers.sh
echo ""

# 7. Audit de dependências
echo "7️⃣ Auditando dependências..."
npm audit --production
echo ""

echo "=================================================="
echo "✅ SUITE DE TESTES CONCLUÍDA"
echo "=================================================="
```

---

## 📊 COMO USAR

### Instalação

```bash
# 1. Instalar dependências
npm install @supabase/supabase-js dompurify

# 2. Configurar variáveis de ambiente
cp .env.example .env.test
# Editar .env.test com credenciais de teste

# 3. Dar permissão aos scripts
chmod +x test-security-headers.sh
chmod +x test-dependencies.sh
chmod +x run-security-tests.sh
```

### Execução

```bash
# Executar todos os testes
./run-security-tests.sh

# Ou executar individualmente
node test-rls-driver-locations.js
node test-rate-limiting.js
node test-xss.js
```

---

## ⚠️ AVISOS IMPORTANTES

1. **NÃO execute estes testes em produção!**
2. Use apenas em ambiente de desenvolvimento/staging
3. Alguns testes podem gerar muitas requisições
4. Limpe dados de teste após execução
5. Mantenha logs dos testes para auditoria

---

## 📝 INTERPRETAÇÃO DOS RESULTADOS

### ✅ SEGURO
- Acesso negado conforme esperado
- Rate limiting funcionando
- Validação bloqueando payloads maliciosos

### ⚠️ VULNERÁVEL
- Acesso permitido quando deveria ser negado
- Rate limiting bypassado
- Payloads maliciosos não sanitizados

### ❌ CRÍTICO
- Dados sensíveis expostos
- Bypass de autenticação
- Execução de código arbitrário

---

**Desenvolvido por:** Kiro AI Security Team  
**Última atualização:** 24/04/2026
