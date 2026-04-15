# Guia para Configurar Supabase Remoto

## Passo 1: Criar Projeto no Supabase Cloud

1. Acesse: https://supabase.com
2. Faça login ou crie uma conta
3. Clique em "New Project"
4. Preencha:
   - **Name**: projeto-23.1 (ou outro nome)
   - **Database Password**: anote esta senha
   - **Region**: escolha mais próxima (ex: São Paulo)
5. Clique em "Create new project"

## Passo 2: Obter Credenciais

Após criar o projeto:

1. Vá para **Settings > API**
2. Anote:
   - **Project URL**: `https://xxxxxxxxxxxx.supabase.co`
   - **anon/public key**: `[Obter do dashboard - API Settings]`
   - **service_role key**: `[Obter do dashboard - API Settings]` (NÃO compartilhe esta!)

## Passo 3: Configurar Arquivo .env.remote

Crie o arquivo `.env.remote` na raiz do projeto:

```bash
# Configuração Supabase Remoto
VITE_SUPABASE_URL="https://SEU_PROJETO.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="sua_anon_key_aqui"
VITE_SUPABASE_SERVICE_ROLE_KEY="sua_service_role_key_aqui"
```

## Passo 4: Executar Migrations (Opcional)

Se quiser migrar o banco local para remoto:

```bash
# Exportar do local
supabase db dump --local

# Importar para remoto  
supabase db push --db-url="postgresql://postgres:[password]@db.SEU_PROJETO.supabase.co:5432/postgres"
```

## Passo 5: Criar Usuário Admin

```bash
npx tsx src/scripts/createAdminRemote.ts
```

## Passo 6: Testar Conexão

```bash
# Verificar se está funcionando
curl -I https://SEU_PROJETO.supabase.co/rest/v1/
```

## Problemas Comuns

1. **Timeout**: Verifique firewall/antivírus
2. **Credenciais inválidas**: Confira se copiou corretamente
3. **Permissões**: Service role key precisa de permissões admin

## Links Úteis

- [Dashboard Supabase](https://supabase.com/dashboard)
- [Documentação API](https://supabase.com/docs/reference/javascript/introduction)
- [Guia de Migração](https://supabase.com/docs/guides/migrations)

---

**Nota**: O Supabase Cloud tem plano gratuito com 500MB de banco e 2GB de armazenamento, suficiente para desenvolvimento.