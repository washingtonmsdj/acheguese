# Guia de Início Rápido

## 🚀 Bem-vindo!

Este guia vai te ajudar a configurar o ambiente de desenvolvimento em poucos minutos.

## 📋 Pré-requisitos

### Obrigatórios

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **npm** 9+ (vem com Node.js)
- **Git** ([Download](https://git-scm.com/))

### Recomendados

- **VS Code** ([Download](https://code.visualstudio.com/))
- **Supabase CLI** (opcional, para migrations)

## 🛠️ Setup do Ambiente

### 1. Clonar o Repositório

```bash
git clone https://github.com/seu-usuario/projeto.git
cd projeto
```

### 2. Instalar Dependências

```bash
npm install
```

### 3. Configurar Variaveis de Ambiente

Crie o arquivo `.env.local` na raiz do projeto:

```bash
cp .env.example .env.local
```

Edite `.env.local` apenas com a configuracao publica do Supabase:

```env
VITE_SUPABASE_URL="https://seu-projeto.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="sua-chave-publica"
```

**Como obter as credenciais:**

1. Acesse [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecione seu projeto
3. Va em Settings -> API
4. Copie:
   - Project URL -> `VITE_SUPABASE_URL`
   - publishable/anon key -> `VITE_SUPABASE_PUBLISHABLE_KEY`

**Para scripts administrativos:**

Nao grave `SUPABASE_SERVICE_ROLE_KEY` no repositorio. Salve o segredo com:

```powershell
.\scripts\security\Save-LocalSupabaseSecrets.ps1 -FetchFromSupabase
```

E carregue no shell quando precisar:

```powershell
.\scripts\security\Import-LocalSupabaseSecrets.ps1
```

Leia tambem: [Supabase Secrets](./SUPABASE_SECRETS.md)

### 4. Validar Configuracao

```bash
# Verificar se não há credenciais hardcoded
npm run security:validate

# Verificar tipos
npm run typecheck

# Verificar lint
npm run lint
```

Todos os comandos devem passar sem erros.

### 5. Iniciar Servidor de Desenvolvimento

```bash
npm run dev
```

Acesse: http://localhost:8080/

## 🎯 Estrutura do Projeto

```
projeto/
├── src/                    # Código fonte
│   ├── components/        # Componentes React
│   ├── services/          # Lógica de negócio
│   ├── types/            # TypeScript types
│   ├── lib/              # Configurações
│   ├── hooks/            # React hooks
│   └── pages/            # Páginas
├── docs/                  # Documentação
├── scripts/               # Scripts de automação
├── supabase/             # Migrations
└── public/               # Assets estáticos
```

## 📚 Comandos Principais

### Desenvolvimento

```bash
# Iniciar dev server
npm run dev

# Build para produção
npm run build

# Preview do build
npm run preview
```

### Qualidade de Código

```bash
# Lint
npm run lint

# Type check
npm run typecheck

# Validar segurança
npm run security:validate
```

### Testes

```bash
# Rodar todos os testes
npm run test

# Testes em watch mode
npm run test:watch

# Coverage
npm run test:coverage
```

## 🔧 Configuração do VS Code

### Extensões Recomendadas

Instale estas extensões para melhor experiência:

- **ESLint** - Linting em tempo real
- **Prettier** - Formatação de código
- **TypeScript** - Suporte TypeScript
- **Tailwind CSS IntelliSense** - Autocomplete Tailwind
- **Error Lens** - Erros inline

### Settings

Crie `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "tailwindCSS.experimental.classRegex": [
    ["cva\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"]
  ]
}
```

## 🗄️ Setup do Banco de Dados

### Opção 1: Usar Projeto Existente

Se você tem acesso a um projeto Supabase existente, apenas configure as variáveis de ambiente (passo 3 acima).

### Opção 2: Criar Novo Projeto

1. Acesse [Supabase Dashboard](https://supabase.com/dashboard)
2. Clique em "New Project"
3. Preencha:
   - Name: nome-do-projeto
   - Database Password: senha-segura
   - Region: escolha mais próxima
4. Aguarde criação (~2 minutos)
5. Execute migrations:

```bash
# Via Dashboard
# 1. Vá em SQL Editor
# 2. Cole conteúdo de supabase/migrations/*.sql
# 3. Execute cada migration em ordem

# Ou via CLI
supabase link --project-ref seu-projeto-id
supabase db push
```

## 🎨 Desenvolvimento

### Criar Novo Componente

```bash
# Estrutura recomendada
src/components/
└── meu-componente/
    ├── MeuComponente.tsx
    ├── MeuComponente.test.tsx
    └── index.ts
```

```typescript
// MeuComponente.tsx
export function MeuComponente() {
  return <div>Meu Componente</div>;
}

// index.ts
export { MeuComponente } from './MeuComponente';
```

### Criar Novo Service

```typescript
// src/services/meu-service/MeuService.ts
import { supabase } from '@/lib/supabase';

export class MeuService {
  async getData() {
    const { data, error } = await supabase
      .from('tabela')
      .select('*');
    
    if (error) throw error;
    return data;
  }
}

export const meuService = new MeuService();
```

### Adicionar Nova Rota

```typescript
// src/App.tsx
import { MinhaPagina } from '@/pages/MinhaPagina';

<Route path="/minha-pagina" element={<MinhaPagina />} />
```

## 🐛 Troubleshooting

### Erro: "Missing environment variables"

**Solução**: Verifique se `.env.local` existe e contém todas as variáveis necessárias.

```bash
# Verificar arquivo
cat .env.local

# Deve conter:
# VITE_SUPABASE_URL=...
# VITE_SUPABASE_PUBLISHABLE_KEY=...
# SUPABASE_SERVICE_ROLE_KEY deve ser carregada no shell, nao persistida no repo
```

### Erro: "Failed to fetch"

**Solução**: Verifique se as credenciais do Supabase estão corretas.

```bash
# Testar conexão
node scripts/test-connection.mjs
```

### Erro: Port 8080 already in use

**Solução**: Mude a porta ou mate o processo:

```bash
# Windows
netstat -ano | findstr :8080
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:8080 | xargs kill -9

# Ou use outra porta
npm run dev -- --port 3000
```

### Erro de TypeScript

**Solução**: Limpe cache e reinstale:

```bash
rm -rf node_modules
rm package-lock.json
npm install
npm run typecheck
```

## 📖 Próximos Passos

Agora que seu ambiente está configurado:

1. **Leia a documentação**
   - [ARCHITECTURE.md](./ARCHITECTURE.md) - Entenda a arquitetura
   - [DATA_MODELING.md](./DATA_MODELING.md) - Aprenda o padrão SSOT
   - [SECURITY.md](./SECURITY.md) - Práticas de segurança

2. **Explore o código**
   - Navegue pelos componentes em `src/components/`
   - Veja os services em `src/services/`
   - Entenda os types em `src/types/`

3. **Faça sua primeira contribuição**
   - Escolha uma issue
   - Crie uma branch
   - Faça suas mudanças
   - Abra um Pull Request

## 🤝 Suporte

### Documentação

- [Documentação Completa](./README.md)
- [FAQ](./FAQ.md)
- [Troubleshooting](./TROUBLESHOOTING.md)

### Comunidade

- **Issues**: [GitHub Issues](https://github.com/seu-usuario/projeto/issues)
- **Discussions**: [GitHub Discussions](https://github.com/seu-usuario/projeto/discussions)
- **Email**: dev@projeto.com

### Recursos Externos

- [React Docs](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Supabase Docs](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)

## ✅ Checklist de Setup

- [ ] Node.js 18+ instalado
- [ ] Repositório clonado
- [ ] Dependências instaladas (`npm install`)
- [ ] `.env.local` criado e configurado
- [ ] Validações passando (`npm run security:validate`)
- [ ] Servidor rodando (`npm run dev`)
- [ ] Acesso ao Supabase Dashboard
- [ ] VS Code configurado
- [ ] Extensões instaladas
- [ ] Documentação lida

## 🎉 Pronto!

Você está pronto para começar a desenvolver!

Se tiver dúvidas, consulte a documentação ou abra uma issue.

Bom código! 🚀

---

**Última atualização**: 2026-03-19  
**Versão**: 1.0.0  
**Mantido por**: Equipe de Desenvolvimento
