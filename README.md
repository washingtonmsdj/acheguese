# 🏢 Ordax - Plataforma de Serviços Locais

> Sistema modular de marketplace local com foco em gastronomia, mobilidade, classificados e serviços profissionais.

## 📋 Visão Geral

Plataforma web moderna construída com React, TypeScript e Supabase, seguindo princípios SSOT (Single Source of Truth) e arquitetura modular.

### 🎯 Módulos Principais

- **🍽️ Gastronomia** - Cardápios digitais, reviews e favoritos
- **🚗 Mobilidade** - Solicitação de corridas e entregas
- **📢 Classificados** - Anúncios locais categorizados
- **👔 Profissionais** - Perfis e serviços profissionais
- **🏢 Business** - Gestão de estabelecimentos comerciais

## 🚀 Quick Start

### Pré-requisitos

- Node.js 18+
- npm ou yarn
- Conta Supabase

### Instalação

```bash
# Clonar repositório
git clone [repository-url]
cd projeto-ordax2

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env.local
# Edite .env.local apenas com URL e chave publica do Supabase

# Iniciar desenvolvimento
npm run dev
```

### Testes

```bash
# Testes unitários
npm run test

# Testes E2E
npm run test:e2e

# Cobertura
npm run test:coverage
```

## 📚 Documentação

### Para Desenvolvedores
- [Arquitetura](./docs/ARCHITECTURE.md) - Visão geral da arquitetura
- [Getting Started](./docs/GETTING_STARTED.md) - Guia de início
- [Migrations](./docs/MIGRATIONS.md) - Guia de migrations
- [SSOT Rules](./docs/CURRENT_RULES.md) - Regras SSOT
- [Supabase Secrets](./docs/SUPABASE_SECRETS.md) - Fluxo local canonico para secrets do Supabase

### Para Gestores
- [Geographic Foundation](./docs/GEOGRAPHIC_FOUNDATION.md) - Sistema territorial
- [Data Modeling](./docs/DATA_MODELING.md) - Modelagem de dados
- [Security](./SECURITY.md) - Políticas de segurança

### Auditorias e Relatórios
- [Auditorias](./docs/audits/) - Auditorias técnicas
- [Histórico](./docs/historico/) - Histórico de mudanças

## 🏗️ Arquitetura

### Estrutura de Pastas

```
projeto-ordax2/
├── src/
│   ├── modules/          # Módulos por domínio
│   │   ├── gastronomy/
│   │   ├── mobility/
│   │   ├── business/
│   │   └── ...
│   ├── core/             # Funcionalidades centrais
│   ├── shared/           # Código compartilhado
│   ├── features/         # Features cross-module
│   └── pages/            # Páginas da aplicação
├── supabase/
│   ├── migrations/       # Migrations versionadas
│   └── functions/        # Edge functions
├── tests/                # Testes unitários
├── e2e/                  # Testes end-to-end
└── docs/                 # Documentação
```

### Tecnologias

- **Frontend:** React 18, TypeScript, Vite
- **UI:** TailwindCSS, Radix UI, Shadcn/ui
- **Backend:** Supabase (PostgreSQL + Auth + Storage)
- **Maps:** MapLibre GL
- **Testes:** Vitest, Playwright
- **Linting:** ESLint (custom rules para SSOT)

## 🔒 Segurança

- Row Level Security (RLS) em todas as tabelas
- Autenticação via Supabase Auth
- Validação de dados em múltiplas camadas
- Auditoria de acessos administrativos

## 📊 Status do Projeto

### Módulos Implementados
- ✅ Gastronomia (100%)
- ✅ Classificados (100%)
- ✅ Mobilidade (90%)
- ✅ Business (95%)
- ✅ Profissionais (95%)

### Qualidade
- ✅ Cobertura de testes: 75%+
- ✅ SSOT compliance: 95%+
- ✅ TypeScript strict mode
- ✅ ESLint sem warnings

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

### Padrões de Código

- Seguir princípios SSOT
- TypeScript strict mode
- Testes para novas features
- Documentação atualizada

## 📝 Licença

Proprietary - Todos os direitos reservados

## 👥 Time

Desenvolvido com ❤️ pela equipe Ordax

---

**Versão:** 2.0.0  
**Última atualização:** Abril 2026
