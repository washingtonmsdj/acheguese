# Análise Completa do Site Achegue-se

**Data da Análise:** 24 de abril de 2026  
**Versão do Projeto:** 0.0.0  
**Analista:** Kiro AI

---

## 1. VISÃO GERAL DO PROJETO

### 1.1 Identidade
- **Nome:** Achegue-se
- **Proposta:** Plataforma modular de serviços locais com foco territorial
- **Território Inicial:** Complexo do Nordeste de Amaralina, Salvador/BA
- **Modelo:** Plataforma territorial (não é rede social tradicional)

### 1.2 Propósito
Conectar moradores, comerciantes, prestadores de serviços e pessoas em busca de emprego em territórios específicos, começando por bairros de Salvador.

---

## 2. STACK TECNOLÓGICA

### 2.1 Frontend
- **Framework:** React 18.3.1 + TypeScript 5.8.3
- **Build Tool:** Vite 5.4.21
- **Roteamento:** React Router DOM 6.30.1
- **Estilização:** Tailwind CSS 3.4.17 + Radix UI
- **Animações:** Framer Motion 12.35.1
- **State Management:** Zustand 5.0.11 + TanStack Query 5.90.21

### 2.2 Backend & Infraestrutura
- **BaaS:** Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **Mapas:** MapLibre GL 5.21.1
- **Analytics:** Vercel Analytics 2.0.1
- **Monitoramento:** Sentry 10.47.0
- **Hospedagem:** Vercel

### 2.3 Qualidade & Testes
- **Testes Unitários:** Vitest 3.2.4
- **Testes E2E:** Playwright 1.59.1
- **Linting:** ESLint 9.32.0
- **Formatação:** Prettier 3.8.1
- **Git Hooks:** Husky 9.1.7

---

## 3. ARQUITETURA DO CÓDIGO

### 3.1 Estrutura de Pastas
```
src/
├── app/            # Shell da aplicação (rotas, providers, páginas)
├── core/           # Contratos e capacidades transversais (SSOT)
├── modules/        # Domínios de produto (feature-first)
├── shared/         # UI e utilitários compartilhados
└── integrations/   # Adaptadores externos (Supabase, mapas)
```

### 3.2 Princípios Arquiteturais
- **SSOT (Single Source of Truth):** Cada domínio tem um owner canônico
- **Fluxo de Dados:** Database → Service → Hook → Component
- **Separação de Responsabilidades:** Core (contratos) vs Modules (features)
- **Baixo Acoplamento:** Módulos independentes com contratos bem definidos

### 3.3 Camadas
1. **Core:** Capacidades transversais (auth, session, maps, billing, etc.)
2. **Modules:** Domínios de produto (business, classifieds, community, mobility, etc.)
3. **Shared:** Componentes UI reutilizáveis e utilitários
4. **Integrations:** Adaptadores para serviços externos

---

## 4. MÓDULOS PRINCIPAIS

### 4.1 Módulos Ativos
1. **Comunidade** (`/comunidade`)
   - Feed de posts
   - Alertas comunitários
   - Problemas do bairro
   - Grupos locais

2. **Empresas** (`/empresas`)
   - Listagem de negócios locais
   - Perfis de empresas
   - Categorização por tipo
   - Dashboard empresarial

3. **Serviços** (`/servicos`)
   - Profissionais autônomos
   - Prestadores de serviços
   - Perfis públicos

4. **Classificados** (`/classificados`)
   - Anúncios de produtos
   - Chat entre comprador/vendedor
   - Categorias e subcategorias

5. **Vagas** (`/vagas`)
   - Oportunidades de emprego locais
   - Publicação de vagas
   - Candidaturas

6. **Mobilidade** (`/mobilidade`)
   - Passageiro
   - Motorista
   - Motoboy
   - Rastreamento de corridas

7. **Gastronomia** (`/gastronomia`)
   - Restaurantes e bares
   - Cardápios digitais
   - Sistema de pedidos
   - Gestão de entregas

8. **Guia Turístico** (`/pontos-turisticos`)
   - Pontos turísticos
   - Informações culturais
   - Rotas e mapas

### 4.2 Módulos Administrativos
- Dashboard admin completo
- Moderação de conteúdo
- Gestão de usuários
- Analytics e métricas
- Configurações de território

---

## 5. SISTEMA DE ROTAS

### 5.1 Estrutura Territorial
O site usa um sistema de rotas hierárquico baseado em território:

```
/:state/:city/:district
/:state/:city
/:state
/brasil
```

**Exemplo:**
- `/ba/salvador` - Cidade
- `/ba/salvador/complexo-do-nordeste-de-amaralina` - Distrito/Complexo
- `/ba/salvador/santa-cruz` - Bairro

### 5.2 Rotas Canônicas por Módulo

**Empresas:**
- `/empresas/:state/:city/:district/:slug` - Detalhe
- `/empresas/:state/:city/:district` - Hub do bairro
- `/empresas/:state/:city` - Hub da cidade
- `/empresas/:state/:city/categoria/:category` - Por categoria

**Classificados:**
- `/classificados/:uf/:cidade/:bairro/:categoria/:subcategoria/:slug/:publicId`
- `/classificados/:state/:city/:district/:category`
- `/classificados/:state/:city`

**Vagas:**
- `/vagas/:state/:city/:slug` - Detalhe
- `/vagas/:state/:city/:district` - Listagem territorial
- `/vagas/:state/:city` - Listagem cidade

**Gastronomia:**
- `/gastronomia/:state/:city/:district/:slug` - Detalhe
- `/gastronomia/:state/:city/:district` - Listagem bairro
- `/gastronomia/:state/:city` - Listagem cidade

### 5.3 Rotas Globais
- `/u/:username` - Perfil público de usuário
- `/p/:slug` - Negócio premium
- `/c/:publicId` - Classificado (short URL)
- `/q/:token` - QR Code resolver

---

## 6. PÁGINAS PRINCIPAIS

### 6.1 Landing Pages
1. **MainLandingPage** (`/`)
   - Hero impactante com imagem de Salvador
   - Grid de módulos (6 cards)
   - Territórios ativos (4 bairros)
   - Bairros em breve (4 cards)
   - Seção "Para Você" (4 personas)
   - CTA final
   - Footer completo

2. **HomePage** (`/home-v1`)
   - Banner hero com overlay
   - Módulos em grid
   - Outros territórios
   - Design mais compacto

3. **CidadeLandingPage**
   - Landing específica por cidade
   - Informações territoriais

4. **ComplexoNordesteLandingPage**
   - Landing do território de lançamento

### 6.2 Páginas de Usuário
- Login/Cadastro
- Perfil (gerenciamento de identidades)
- Configurações
- Notificações
- Mensagens/Chat
- Família

### 6.3 Páginas de Conteúdo
- Busca global
- Mapa interativo
- Perto de mim
- Favoritos
- Ranking/Gamificação

### 6.4 Páginas Institucionais
- Sobre
- Contato
- Termos de Uso
- Política de Privacidade
- Regras da Comunidade
- Status do Sistema
- DPO (LGPD)

---

## 7. FUNCIONALIDADES PRINCIPAIS

### 7.1 Autenticação & Perfil
- Login/Cadastro com Supabase Auth
- Múltiplas identidades por usuário
- Perfis públicos e privados
- Gestão de família
- Configurações de privacidade (LGPD)

### 7.2 Geolocalização
- Seleção de território
- Mapa interativo com MapLibre
- Busca por proximidade
- Áreas de entrega
- Pontos de embarque

### 7.3 Interação Social
- Posts na comunidade
- Comentários
- Curtidas/Reações
- Compartilhamento
- Mensagens privadas
- Grupos locais

### 7.4 Comercial
- Cadastro de empresas
- Catálogos de produtos
- Sistema de pedidos
- Pagamentos (Stripe)
- Assinaturas/Planos
- Cupons e promoções

### 7.5 Moderação
- Sistema de denúncias
- Moderação de conteúdo
- Verificação de usuários
- Banimento/Suspensão
- Logs de atividades

### 7.6 Analytics
- Métricas de uso
- Dashboard de negócios
- Analytics de mobilidade
- Relatórios administrativos

---

## 8. DESIGN SYSTEM

### 8.1 Identidade Visual
- **Cores Primárias:** Teal/Turquesa (#14b8a6)
- **Fonte Principal:** DM Sans
- **Fonte Heading:** Space Grotesk
- **Tema:** Dark mode por padrão
- **Tokens:** Sistema HSL

### 8.2 Componentes UI
- Biblioteca Radix UI completa
- Componentes customizados em `shared/components`
- Sistema de toast/notificações (Sonner)
- Modais e dialogs
- Forms com React Hook Form + Zod
- Carrosséis (Embla)
- Gráficos (Recharts)

### 8.3 Acessibilidade
- Skip to content
- ARIA labels
- Navegação por teclado
- Contraste adequado
- Testes com Axe Core

---

## 9. PERFORMANCE

### 9.1 Otimizações
- Code splitting por rota
- Lazy loading de componentes
- Chunks de vendors separados:
  - `vendor-maplibre`
  - `vendor-charts`
  - `vendor-qr`
  - `vendor-sentry`
  - `vendor-supabase`

### 9.2 Métricas
- Web Vitals tracking
- Sentry para monitoramento
- Source maps para debugging
- Bundle analyzer (Rollup Visualizer)

### 9.3 Build
- Minificação com esbuild
- CSS code splitting
- Assets com hash
- Limite de chunk: 1100kb

---

## 10. SEGURANÇA

### 10.1 Práticas
- Sanitização de inputs (DOMPurify)
- Validação com Zod
- ESLint security plugins
- Gitleaks para secrets
- HTTPS obrigatório
- CSP headers

### 10.2 LGPD
- Consentimento de cookies
- Configurações de privacidade
- Contato com DPO
- Logs de email
- Direito ao esquecimento

### 10.3 Autenticação
- Supabase Auth
- JWT tokens
- Session management
- Password reset
- Email verification

---

## 11. QUALIDADE DE CÓDIGO

### 11.1 Validações Automatizadas
```bash
npm run validate:ssot              # Conformidade SSOT
npm run validate:architecture      # Governança arquitetural
npm run validate:docs-structure    # Estrutura de docs
npm run validate:migrations        # Migrações Supabase
npm run validate:hardcodes         # Hardcodes SSOT
npm run typecheck                  # TypeScript
npm run lint                       # ESLint
```

### 11.2 Testes
```bash
npm run test                       # Testes unitários
npm run test:e2e                   # Testes E2E
npm run test:ssot                  # Testes SSOT
npm run test:regression            # Testes de regressão
npm run test:maps                  # Testes de mapas
```

### 11.3 Git Hooks
- **pre-commit:** Lint, format, SSOT check
- **commit-msg:** Validação de mensagem
- **pre-push:** Testes e validações
- **pre-commit-security:** Scan de segurança

---

## 12. DOCUMENTAÇÃO

### 12.1 Estrutura
```
docs/
├── INDEX_CANONICO.md              # Índice principal
├── CURRENT_RULES.md               # Regras vigentes
├── ARCHITECTURE.md                # Arquitetura
├── STATUS.md                      # Status oficial
├── MIGRATIONS.md                  # Migrações
├── SECURITY.md                    # Segurança
├── architecture/                  # Docs de arquitetura
├── audits/                        # Auditorias
├── tasks/                         # Tarefas
├── historico/                     # Histórico
└── archive/                       # Arquivo legado
```

### 12.2 Documentação por Módulo
Cada módulo em `src/modules/*` e `src/core/*` possui seu próprio `README.md` com:
- Propósito
- Contratos
- Dependências
- Exemplos de uso

---

## 13. TERRITÓRIOS

### 13.1 Território de Lançamento
**Complexo do Nordeste de Amaralina** (Salvador/BA)
- Santa Cruz (~12.000 hab.)
- Nordeste de Amaralina (~25.000 hab.)
- Vale das Pedrinhas (~18.000 hab.)
- Chapada do Rio Vermelho (~8.000 hab.)

### 13.2 Em Breve
- Pituba (~65.000 hab.)
- Rio Vermelho (~45.000 hab.)
- Amaralina (~30.000 hab.)
- Itaigara (~20.000 hab.)

### 13.3 Configuração
```typescript
// src/config/territory.ts
TERRITORY_CONFIG = {
  launch: {
    state: 'ba',
    city: 'salvador',
    group: 'complexo-do-nordeste-de-amaralina'
  }
}
```

---

## 14. INTEGRAÇÕES

### 14.1 Supabase
- Autenticação
- Database (PostgreSQL)
- Storage (imagens, arquivos)
- Edge Functions (serverless)
- Realtime subscriptions

### 14.2 Mapas
- MapLibre GL (open source)
- Geocoding
- Clustering de markers
- Áreas de cobertura
- Rotas

### 14.3 Pagamentos
- Stripe (billing)
- Assinaturas recorrentes
- Webhooks
- Checkout

### 14.4 Outros
- Firebase (notificações push)
- QR Code (geração e leitura)
- Canvas Confetti (gamificação)
- Image compression

---

## 15. SCRIPTS DISPONÍVEIS

### 15.1 Desenvolvimento
```bash
npm run dev                        # Dev server
npm run build                      # Build produção
npm run preview                    # Preview build
```

### 15.2 Qualidade
```bash
npm run lint                       # Lint código
npm run lint:fix                   # Fix lint
npm run format                     # Format código
npm run typecheck                  # Check tipos
```

### 15.3 Validações
```bash
npm run validate:ssot              # SSOT compliance
npm run validate:architecture      # Arquitetura
npm run validate:deps              # Dependências
npm run validate:migrations        # Migrações
```

### 15.4 Testes
```bash
npm run test                       # Testes unitários
npm run test:watch                 # Watch mode
npm run test:e2e                   # E2E
npm run test:e2e:ui                # E2E UI mode
```

### 15.5 Dados
```bash
npm run seed:e2e                   # Seed E2E users
npm run seed:e2e:network           # Seed network
npm run geocode-locations          # Geocode
```

### 15.6 Segurança
```bash
npm run security:validate          # Validar segurança
npm run security:scan              # Scan vulnerabilidades
npm run lint:security              # Lint segurança
```

---

## 16. PONTOS FORTES

### 16.1 Arquitetura
✅ Estrutura modular bem definida  
✅ SSOT por domínio  
✅ Separação clara de responsabilidades  
✅ Baixo acoplamento entre módulos  
✅ Documentação extensa  

### 16.2 Qualidade
✅ TypeScript em todo o projeto  
✅ Testes automatizados (unit + E2E)  
✅ Validações arquiteturais automatizadas  
✅ Git hooks para qualidade  
✅ ESLint + Prettier configurados  

### 16.3 Performance
✅ Code splitting otimizado  
✅ Lazy loading de rotas  
✅ Chunks de vendors separados  
✅ Web Vitals tracking  
✅ Build otimizado com Vite  

### 16.4 Segurança
✅ Sanitização de inputs  
✅ Validação com Zod  
✅ Security linting  
✅ Gitleaks configurado  
✅ LGPD compliance  

### 16.5 UX/UI
✅ Design system consistente  
✅ Dark mode  
✅ Acessibilidade  
✅ Animações suaves (Framer Motion)  
✅ Responsivo  

---

## 17. ÁREAS DE ATENÇÃO

### 17.1 Complexidade
⚠️ Muitos módulos e rotas (pode dificultar manutenção)  
⚠️ Estrutura de pastas profunda  
⚠️ Múltiplas landing pages similares  

### 17.2 Performance
⚠️ Bundle size pode crescer com novos módulos  
⚠️ Muitas dependências (risco de bloat)  
⚠️ Mapas podem ser pesados em mobile  

### 17.3 Documentação
⚠️ Muitos arquivos de documentação (pode ficar desatualizado)  
⚠️ Histórico extenso em `.archive/` (138 arquivos)  

### 17.4 Escalabilidade
⚠️ Sistema territorial pode ser complexo para expandir  
⚠️ Múltiplas identidades por usuário pode gerar confusão  
⚠️ Muitos módulos ativos simultaneamente  

---

## 18. RECOMENDAÇÕES

### 18.1 Curto Prazo
1. **Consolidar landing pages** - Unificar MainLandingPage e HomePage
2. **Otimizar bundle** - Revisar dependências não utilizadas
3. **Documentação** - Arquivar docs obsoletos
4. **Testes** - Aumentar cobertura de testes

### 18.2 Médio Prazo
1. **Monitoramento** - Implementar alertas de performance
2. **Cache** - Estratégia de cache mais agressiva
3. **SEO** - Melhorar meta tags e structured data
4. **Mobile** - Otimizar experiência mobile

### 18.3 Longo Prazo
1. **Escalabilidade** - Preparar para múltiplas cidades
2. **Internacionalização** - Suporte a múltiplos idiomas
3. **PWA** - Transformar em Progressive Web App
4. **Offline** - Melhorar funcionalidades offline

---

## 19. MÉTRICAS ATUAIS

### 19.1 Código
- **Linhas de código:** ~50.000+ (estimado)
- **Arquivos TypeScript:** ~500+
- **Componentes React:** ~200+
- **Páginas:** ~80+
- **Rotas:** ~150+

### 19.2 Dependências
- **Produção:** 71 pacotes
- **Desenvolvimento:** 38 pacotes
- **Total:** 109 pacotes

### 19.3 Build
- **Chunk size warning:** 1100kb
- **Source maps:** Habilitados
- **Minificação:** esbuild
- **Target:** ES2020

---

## 20. CONCLUSÃO

O **Achegue-se** é uma plataforma territorial ambiciosa e bem estruturada, com:

### Destaques Positivos:
- Arquitetura sólida e modular
- Qualidade de código alta
- Segurança e LGPD em foco
- Performance otimizada
- Documentação extensa

### Desafios:
- Complexidade crescente
- Necessidade de consolidação
- Escalabilidade territorial
- Manutenção de múltiplos módulos

### Potencial:
O projeto tem grande potencial para se tornar a principal plataforma de serviços locais em Salvador, com possibilidade de expansão para outras cidades. A abordagem territorial é inovadora e diferenciada.

### Próximos Passos Sugeridos:
1. Lançar MVP no Complexo do Nordeste
2. Coletar feedback dos usuários
3. Iterar baseado em dados reais
4. Expandir gradualmente para novos bairros
5. Consolidar módulos mais usados

---

**Análise realizada por:** Kiro AI  
**Data:** 24 de abril de 2026  
**Versão do documento:** 1.0
