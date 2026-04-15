# Guia Rápido: Sistema de Conteúdo Territorial com IA

## 🚀 Como Usar

### Para Usuários Finais

#### Visualizar Conteúdo Gerado por IA
1. Acesse qualquer landing territorial:
   - Bairro individual: `/bairro/nordeste-de-amaralina`
   - Grupo/Complexo: `/grupo/complexo-do-nordeste-de-amaralina`

2. O conteúdo será gerado automaticamente na primeira visita:
   - ⏳ Aguarde 5-10 segundos (loading com skeleton)
   - ✨ Conteúdo aparece automaticamente

3. Seções exibidas:
   - 📖 **Sobre o bairro** - Descrição e história
   - 📊 **Dados do território** - População, área, economia
   - 🎭 **Eventos e cultura** - Agenda cultural local

---

### Para Administradores

#### Acessar Painel Admin
```
URL: /admin/territory-content
```

#### Editar Conteúdo Manualmente

1. **Selecionar Território**
   - Digite o slug do território (ex: `nordeste-de-amaralina`)
   - Digite o nome (ex: `Nordeste de Amaralina`)

2. **Editar Campos**
   - ✏️ Descrição (texto longo)
   - 📜 História (texto longo)
   - 👥 População estimada (número)
   - 📏 Área em km² (número)
   - 💼 Economia local (texto)
   - 🏷️ Características (separadas por vírgula)

3. **Gerenciar Eventos**
   - ➕ Adicionar novo evento
   - ✏️ Editar nome, descrição, frequência
   - 🎨 Escolher categoria (cultura, esporte, religioso, comunitário)
   - 🗑️ Remover evento

4. **Salvar Alterações**
   - Clique em **"Salvar"**
   - Conteúdo é marcado como editado manualmente
   - Alterações aparecem imediatamente na landing

#### Regenerar com IA

1. Clique em **"Regenerar com IA"** ✨
2. Aguarde processamento (5-10 segundos)
3. Conteúdo é sobrescrito com nova geração
4. Edições manuais anteriores são perdidas

---

## 🔧 Configuração Inicial (DevOps)

### 1. Configurar Secrets do Supabase

```bash
# Via CLI
supabase secrets set LOVABLE_API_KEY=sua-chave-aqui

# Ou via Dashboard
# Settings > Edge Functions > Secrets
```

### 2. Deploy da Edge Function

```bash
# Deploy
supabase functions deploy territory-ai-content

# Verificar logs
supabase functions logs territory-ai-content --tail
```

### 3. Verificar Tabela

```sql
-- Verificar se tabela existe
SELECT * FROM territory_ai_content LIMIT 1;

-- Verificar políticas RLS
SELECT * FROM pg_policies WHERE tablename = 'territory_ai_content';
```

---

## 🧪 Testes

### Teste 1: Geração Automática
```
1. Acesse: /bairro/teste-novo-bairro
2. Verifique loading
3. Aguarde conteúdo aparecer
4. Verifique no banco:
   SELECT * FROM territory_ai_content 
   WHERE territory_slug = 'teste-novo-bairro';
```

### Teste 2: Edição Manual
```
1. Acesse: /admin/territory-content
2. Slug: teste-novo-bairro
3. Edite descrição
4. Salve
5. Verifique na landing
6. Verifique no banco:
   SELECT is_manual_override, manually_edited_at 
   FROM territory_ai_content 
   WHERE territory_slug = 'teste-novo-bairro';
```

### Teste 3: Regeneração
```
1. No admin, clique "Regenerar com IA"
2. Verifique novo conteúdo
3. Verifique no banco:
   SELECT ai_generated_at, is_manual_override 
   FROM territory_ai_content 
   WHERE territory_slug = 'teste-novo-bairro';
```

---

## 🐛 Troubleshooting

### Erro: "LOVABLE_API_KEY not configured"
**Solução:** Configure a secret no Supabase
```bash
supabase secrets set LOVABLE_API_KEY=sua-chave
```

### Erro: "Rate limit exceeded"
**Causa:** Muitas requisições à API Lovable  
**Solução:** Aguarde alguns minutos ou aumente o plano

### Erro: "Payment required"
**Causa:** Créditos da API Lovable esgotados  
**Solução:** Adicione créditos no workspace Lovable

### Conteúdo não aparece na landing
**Verificações:**
1. Verifique se Edge Function está deployada
2. Verifique logs: `supabase functions logs territory-ai-content`
3. Verifique se tabela existe
4. Verifique políticas RLS
5. Verifique console do navegador (erros JS)

### Conteúdo não atualiza após edição
**Solução:** Limpe cache do navegador ou aguarde 10 minutos

---

## 📊 Monitoramento

### Verificar Conteúdo Gerado
```sql
-- Listar todos os territórios com conteúdo
SELECT 
  territory_slug,
  territory_name,
  ai_generated_at,
  is_manual_override,
  manually_edited_at
FROM territory_ai_content
ORDER BY created_at DESC;
```

### Estatísticas
```sql
-- Total de territórios com conteúdo
SELECT COUNT(*) FROM territory_ai_content;

-- Conteúdo gerado por IA vs editado manualmente
SELECT 
  is_manual_override,
  COUNT(*) as total
FROM territory_ai_content
GROUP BY is_manual_override;

-- Territórios mais recentes
SELECT 
  territory_name,
  created_at
FROM territory_ai_content
ORDER BY created_at DESC
LIMIT 10;
```

### Logs da Edge Function
```bash
# Logs em tempo real
supabase functions logs territory-ai-content --tail

# Últimos 100 logs
supabase functions logs territory-ai-content --limit 100
```

---

## 💡 Dicas

### Para Melhores Resultados com IA

1. **Use nomes completos e corretos**
   - ✅ "Nordeste de Amaralina"
   - ❌ "NDA" ou "Nordeste"

2. **Para grupos, liste todos os membros**
   ```typescript
   members: [
     'Nordeste de Amaralina',
     'Santa Cruz',
     'Vale das Pedrinhas'
   ]
   ```

3. **Regenere se conteúdo não estiver bom**
   - IA pode gerar resultados diferentes a cada vez
   - Tente 2-3 vezes até obter resultado satisfatório

### Para Edição Manual

1. **Seja específico e local**
   - Mencione pontos de referência conhecidos
   - Use linguagem acessível

2. **Mantenha consistência**
   - Use mesmo tom em todos os territórios
   - Padronize formato de eventos

3. **Atualize regularmente**
   - Revise dados demográficos anualmente
   - Atualize eventos sazonais

---

## 🔐 Segurança

### Políticas RLS Configuradas

- ✅ **Leitura:** Pública (qualquer um pode ver)
- ✅ **Inserção:** Apenas usuários autenticados
- ✅ **Atualização:** Apenas usuários autenticados
- ❌ **Deleção:** Não permitida (use soft delete se necessário)

### Recomendações

1. **Adicione verificação de admin** no painel:
   ```typescript
   // Verificar se usuário é admin antes de permitir edição
   const { user } = useAuth();
   const isAdmin = user?.role === 'admin';
   ```

2. **Audit log** (futuro):
   - Registre quem editou o quê e quando
   - Mantenha histórico de versões

3. **Rate limiting** (futuro):
   - Limite regenerações por território (ex: 1x por hora)
   - Evite abuso da API Lovable

---

## 📞 Suporte

### Problemas Técnicos
- Verifique logs da Edge Function
- Verifique console do navegador
- Verifique políticas RLS no banco

### Dúvidas sobre Conteúdo
- Use o painel admin para editar manualmente
- Regenere com IA se necessário
- Consulte documentação do Lovable AI

---

**Última atualização:** 25/03/2026  
**Versão:** 1.0.0
