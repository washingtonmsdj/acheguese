# 📚 Documentação de Operação - Identidade Pública

## Objetivo: Guia Operacional para Suporte e Desenvolvimento

---

## 1. Como Funciona por Domínio

### Business (Empresa)
**Campo de identidade:** `slug` (kebab-case)
**Formato:** `padaria-do-joao`, `loja-maria`
**Tabela:** `businesses.slug`
**Histórico:** `business_slug_history`
**Cooldown:** 90 dias
**Redirect:** ✅ SIM - Links antigos redirecionam automaticamente

**URLs:**
- Pública: `/empresas/:uf/:cidade/:slug`
- Exemplo: `/empresas/ba/salvador/padaria-do-joao`
- Premium: `/p/:slug` (se is_premium=true)

**Comportamento de mudança:**
1. Usuário altera slug de `padaria-do-joao` para `padaria-joao-novo`
2. Sistema mostra aviso azul: "Links antigos continuarão redirecionando"
3. Ao salvar, abre dialog de confirmação
4. Se confirmar: slug atualizado, histórico registrado
5. Link antigo `/empresas/ba/salvador/padaria-do-joao` → redirect 301 para novo
6. Cooldown de 90 dias ativado

---

### Profile (Perfil Pessoal)
**Campo de identidade:** `username` (snake_case)
**Formato:** `joao_silva`, `maria_santos`
**Tabela:** `profiles.handle` (username é alias de handle)
**Histórico:** `profile_username_history`
**Cooldown:** 30 dias
**Redirect:** ❌ NÃO - Links antigos param de funcionar

**URLs:**
- Pública por username: `/u/:username`
- Pública por handle: `/p/:handle`
- Exemplo: `/u/joao_silva` ou `/p/joao_silva`

**Comportamento de mudança:**
1. Usuário altera username de `joao_silva` para `joao_silva_novo`
2. Sistema mostra aviso amarelo: "Links antigos podem parar de funcionar"
3. Menciona: "QR Code, cartão ou materiais já compartilhados"
4. Ao salvar, abre dialog de confirmação com aviso forte
5. Se confirmar: username atualizado, histórico registrado
6. Link antigo `/u/joao_silva` → 404 (não funciona mais)
7. Cooldown de 30 dias ativado

**IMPORTANTE:** Profile não tem redirect. Usuário deve ser alertado claramente.

---

### Professional (Profissional)
**Campo de identidade:** `slug` (kebab-case)
**Formato:** `joao-eletricista`, `maria-pintora`
**Tabela:** `professionals.slug`
**Histórico:** `professional_slug_history`
**Cooldown:** 60 dias
**Redirect:** ❌ NÃO - Links antigos param de funcionar (nesta fase)

**URLs:**
- Pública: `/profissionais/:uf/:cidade/:slug`
- Exemplo: `/profissionais/ba/salvador/joao-eletricista`

**Comportamento de mudança:**
1. Usuário altera slug de `joao-eletricista` para `joao-eletricista-novo`
2. Sistema mostra aviso amarelo: "Links antigos podem parar de funcionar"
3. Menciona: "cartões, anúncios, QR Codes e materiais já divulgados"
4. Ao salvar, abre dialog de confirmação
5. Se confirmar: slug atualizado, histórico registrado
6. Link antigo `/profissionais/ba/salvador/joao-eletricista` → 404
7. Cooldown de 60 dias ativado

**NOTA:** Redirect pode ser implementado em fase futura, mas não está ativo agora.

---

## 2. Diferença entre Campos

### name vs display_name vs slug/username

| Campo | Tipo | Visibilidade | Mutabilidade | Exemplo |
|-------|------|--------------|--------------|---------|
| `name` | string | Privado/Admin | Alta | "João da Silva Santos" |
| `display_name` | string | Público | Alta | "João Silva" |
| `slug` | string | Público/URL | Baixa (cooldown) | "joao-silva" |
| `username` | string | Público/URL | Baixa (cooldown) | "joao_silva" |

**name:**
- Nome completo real da pessoa/empresa
- Usado internamente, admin, documentos
- Pode mudar livremente
- Não aparece em URLs

**display_name:**
- Nome de exibição público
- Aparece em cards, listas, perfil
- Pode mudar livremente
- Não aparece em URLs

**slug/username:**
- Identificador único público
- Aparece em URLs
- Mudança controlada por cooldown
- Requer confirmação explícita
- Pode ter impacto em links compartilhados

---

## 3. Comportamento de Links Antigos

### Business: Redirect Automático ✅
```
Situação: Empresa mudou slug de "padaria-joao" para "padaria-joao-novo"

Link antigo: /empresas/ba/salvador/padaria-joao
Comportamento: Redirect 301 → /empresas/ba/salvador/padaria-joao-novo
Resultado: Link antigo continua funcionando

Implementação: business_slug_history + resolver
```

### Profile: Sem Redirect ❌
```
Situação: Usuário mudou username de "joao_silva" para "joao_silva_novo"

Link antigo: /u/joao_silva
Comportamento: 404 - Perfil não encontrado
Resultado: Link antigo para de funcionar

Motivo: Decisão de produto - evitar confusão de identidade
```

### Professional: Sem Redirect (Nesta Fase) ❌
```
Situação: Profissional mudou slug de "joao-eletricista" para "joao-eletricista-novo"

Link antigo: /profissionais/ba/salvador/joao-eletricista
Comportamento: 404 - Profissional não encontrado
Resultado: Link antigo para de funcionar

Nota: Redirect pode ser implementado em fase futura
```

---

## 4. Regra de Cooldown

### Períodos por Domínio
- **Business:** 90 dias
- **Profile:** 30 dias
- **Professional:** 60 dias

### Como Funciona
1. Usuário altera slug/username e salva
2. Sistema registra data da mudança em `*_history`
3. Próxima tentativa de mudança verifica última alteração
4. Se < cooldown: bloqueio com mensagem "Você poderá alterar novamente em X dias"
5. Se >= cooldown: permite nova alteração

### Verificação
```sql
-- Business
SELECT last_changed_at 
FROM business_slug_history 
WHERE business_id = :id 
ORDER BY changed_at DESC 
LIMIT 1;

-- Profile
SELECT last_changed_at 
FROM profile_username_history 
WHERE profile_id = :id 
ORDER BY changed_at DESC 
LIMIT 1;

-- Professional
SELECT last_changed_at 
FROM professional_slug_history 
WHERE professional_id = :id 
ORDER BY changed_at DESC 
LIMIT 1;
```

### Bypass de Cooldown
**Não há bypass automático.** Se necessário por suporte:
1. Verificar motivo legítimo
2. Atualizar manualmente `last_changed_at` para data antiga
3. Documentar ação em log de suporte
4. Informar usuário que cooldown será reativado

---

## 5. Regra de Confirmação de Mudança

### Quando Dialog Aparece
- ✅ Há valor original (não é criação)
- ✅ Valor atual é diferente do original
- ✅ Ambos os valores não estão vazios

### Quando Dialog NÃO Aparece
- ❌ Criação de nova entidade (sem valor original)
- ❌ Valor não mudou (mesmo slug/username)
- ❌ Apenas outros campos mudaram (descrição, telefone, etc)

### Conteúdo do Dialog por Domínio

**Business:**
- Título: "Confirmar alteração de link público"
- Texto: "Você está alterando o link público da empresa. Links antigos continuarão funcionando e serão redirecionados para o novo endereço."
- Tom: Informativo (azul)

**Profile:**
- Título: "Confirmar alteração de nome de usuário"
- Texto: "Você está alterando seu nome de usuário público. Links antigos podem deixar de funcionar. Use essa troca apenas se for realmente necessário."
- Tom: Atenção (amarelo)

**Professional:**
- Título: "Confirmar alteração de link público"
- Texto: "Você está alterando o link público profissional. Links antigos podem deixar de funcionar. Revise bem antes de confirmar."
- Tom: Atenção (amarelo)

### Ações do Usuário
- **Confirmar alteração:** Save executado, slug/username atualizado
- **Cancelar:** Dialog fecha, save não executado, usuário volta para edição
- **ESC:** Mesmo comportamento de Cancelar

---

## 6. Eventos e Logs Relevantes

### Verificação de Disponibilidade
```
[PublicIdentityService] checkAvailability:available
[PublicIdentityService] checkAvailability:reserved
[PublicIdentityService] checkAvailability:taken
[PublicIdentityService] checkAvailability:invalid
```

### Cooldown
```
[PublicIdentityService] canChangeIdentifier:blocked
  - reason: cooldown_active
  - daysRemaining: X
```

### Dialog de Confirmação
```
[IdentityChangeConfirmDialog] opened
[IdentityChangeConfirmDialog] confirmed
[IdentityChangeConfirmDialog] cancelled
```

### Save de Mudança
```
[{Page}] identity_change_save_attempt
[{Page}] identity_change_save_success
[{Page}] identity_change_save_error
```

### Páginas Públicas
```
[PublicPage] page_view
  - wasRedirected: true/false (business apenas)
[PublicPage] page_not_found
```

### Erros
```
[PublicIdentityService] checkAvailability error
[{Adapter}] identifierExists error
[{Adapter}] canChange error
```

---

## 7. Troubleshooting Comum

### Problema: "Slug/username já está em uso"
**Causa:** Outra entidade já usa esse identificador
**Solução:**
1. Verificar no banco: `SELECT * FROM {table} WHERE slug/handle = :identifier`
2. Se encontrado: sugerir alternativa ao usuário
3. Se não encontrado: verificar cache ou índices

### Problema: "Não consigo alterar, diz que preciso esperar X dias"
**Causa:** Cooldown ativo
**Solução:**
1. Verificar última mudança: `SELECT * FROM {table}_history WHERE {entity}_id = :id ORDER BY changed_at DESC LIMIT 1`
2. Calcular dias restantes: `cooldown_days - DATEDIFF(NOW(), last_changed_at)`
3. Informar usuário ou, se legítimo, fazer bypass manual

### Problema: "Link antigo não funciona mais"
**Causa:** Depende do domínio
**Solução:**
- **Business:** Verificar se redirect está funcionando, verificar `business_slug_history`
- **Profile:** Comportamento esperado, não há redirect
- **Professional:** Comportamento esperado nesta fase, não há redirect

### Problema: "Página pública retorna 404"
**Causa:** Slug/username não existe ou foi alterado
**Solução:**
1. Verificar se entidade existe: `SELECT * FROM {table} WHERE id = :id`
2. Verificar slug/username atual: `SELECT slug/handle FROM {table} WHERE id = :id`
3. Se business, verificar histórico para redirect
4. Se profile/professional, informar que link antigo não funciona

### Problema: "Dialog de confirmação não aparece"
**Causa:** Não há mudança real de slug/username
**Solução:**
1. Verificar se slug/username realmente mudou
2. Verificar se não é criação (sem valor original)
3. Verificar logs do navegador para erros

### Problema: "Badge de disponibilidade não aparece"
**Causa:** Erro de rede ou validação
**Solução:**
1. Verificar console do navegador
2. Verificar se API está respondendo
3. Verificar se formato do slug/username é válido

---

## 8. Queries Úteis

### Verificar Histórico de Mudanças
```sql
-- Business
SELECT 
  bsh.old_slug,
  bsh.new_slug,
  bsh.changed_at,
  bsh.reason
FROM business_slug_history bsh
WHERE bsh.business_id = :business_id
ORDER BY bsh.changed_at DESC;

-- Profile
SELECT 
  puh.old_username,
  puh.new_username,
  puh.changed_at
FROM profile_username_history puh
WHERE puh.profile_id = :profile_id
ORDER BY puh.changed_at DESC;

-- Professional
SELECT 
  psh.old_slug,
  psh.new_slug,
  psh.changed_at
FROM professional_slug_history psh
WHERE psh.professional_id = :professional_id
ORDER BY psh.changed_at DESC;
```

### Verificar Cooldown Restante
```sql
-- Business (90 dias)
SELECT 
  b.slug as current_slug,
  bsh.changed_at as last_change,
  DATEDIFF(NOW(), bsh.changed_at) as days_since_change,
  90 - DATEDIFF(NOW(), bsh.changed_at) as days_remaining
FROM businesses b
LEFT JOIN business_slug_history bsh ON b.id = bsh.business_id
WHERE b.id = :business_id
ORDER BY bsh.changed_at DESC
LIMIT 1;

-- Profile (30 dias)
SELECT 
  p.handle as current_username,
  puh.changed_at as last_change,
  DATEDIFF(NOW(), puh.changed_at) as days_since_change,
  30 - DATEDIFF(NOW(), puh.changed_at) as days_remaining
FROM profiles p
LEFT JOIN profile_username_history puh ON p.id = puh.profile_id
WHERE p.id = :profile_id
ORDER BY puh.changed_at DESC
LIMIT 1;

-- Professional (60 dias)
SELECT 
  pr.slug as current_slug,
  psh.changed_at as last_change,
  DATEDIFF(NOW(), psh.changed_at) as days_since_change,
  60 - DATEDIFF(NOW(), psh.changed_at) as days_remaining
FROM professionals pr
LEFT JOIN professional_slug_history psh ON pr.id = psh.professional_id
WHERE pr.id = :professional_id
ORDER BY psh.changed_at DESC
LIMIT 1;
```

### Verificar Slugs/Usernames Disponíveis
```sql
-- Business
SELECT slug FROM businesses WHERE slug = :slug;
-- Se retornar vazio: disponível

-- Profile
SELECT handle FROM profiles WHERE handle = :username;
-- Se retornar vazio: disponível

-- Professional
SELECT slug FROM professionals WHERE slug = :slug;
-- Se retornar vazio: disponível
```

### Buscar por Slug/Username Antigo (Business apenas)
```sql
-- Buscar redirect de slug antigo
SELECT 
  b.id,
  b.slug as current_slug,
  bsh.old_slug
FROM businesses b
JOIN business_slug_history bsh ON b.id = bsh.business_id
WHERE bsh.old_slug = :old_slug
ORDER BY bsh.changed_at DESC
LIMIT 1;
```

---

## 9. Contatos e Escalação

### Suporte Nível 1
- Verificar documentação
- Executar queries de troubleshooting
- Resolver problemas comuns (cooldown, disponibilidade)

### Suporte Nível 2
- Investigar erros de sistema
- Analisar logs de aplicação
- Fazer bypass de cooldown (com justificativa)

### Desenvolvimento
- Bugs de código
- Problemas de performance
- Novas features ou ajustes

---

## ✅ Checklist de Operação

### Ao Receber Ticket de Suporte
- [ ] Identificar domínio (business/profile/professional)
- [ ] Verificar se é problema de cooldown
- [ ] Verificar se é problema de disponibilidade
- [ ] Verificar se é problema de redirect (business)
- [ ] Executar queries de diagnóstico
- [ ] Documentar solução aplicada
- [ ] Atualizar base de conhecimento se necessário

### Ao Fazer Bypass de Cooldown
- [ ] Verificar motivo legítimo
- [ ] Documentar justificativa
- [ ] Executar update manual
- [ ] Informar usuário sobre reativação de cooldown
- [ ] Registrar em log de suporte

### Ao Investigar 404
- [ ] Verificar se entidade existe
- [ ] Verificar slug/username atual
- [ ] Verificar histórico de mudanças
- [ ] Verificar se é business (redirect)
- [ ] Informar usuário sobre comportamento esperado
