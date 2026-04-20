# Status do Projeto Ordax

> Última atualização: Abril 2026
> Versão: 2.0.0

---

## Resumo Executivo

O **Ordax** é uma plataforma de marketplace local modular, construída com React 18, TypeScript, Vite e Supabase.

### Estatísticas Principais
- **2.139 arquivos TypeScript/TSX**
- **224 migrations SQL**
- **14 Edge Functions**
- **18 arquivos de teste**
- **95%+ SSOT Compliance**

---

## Módulos Implementados

| Módulo | Status | Progresso | Responsável |
|--------|--------|-----------|-------------|
| 🍽️ Gastronomia | ✅ Completo | 100% | Core Team |
| 📢 Classificados | ✅ Completo | 100% | Core Team |
| 🏢 Business | ✅ Completo | 95% | Core Team |
| 👔 Serviços/Profissionais | ✅ Completo | 95% | Core Team |
| 🚗 Mobilidade | 🟡 Revisão | 90% | Core Team |
| 💼 Vagas/Empregos | ✅ Completo | 100% | Core Team |
| 👥 Comunidade | ✅ Completo | 100% | Core Team |
| 🗺️ Mapas/Territorial | ✅ Completo | 95% | Core Team |

---

## Qualidade de Código

| Métrica | Valor | Status |
|---------|-------|--------|
| Cobertura de Testes | 75%+ | 🟡 |
| SSOT Compliance | 95%+ | ✅ |
| TypeScript Strict Mode | Ativo | ✅ |
| ESLint Warnings | 0 | ✅ |
| Documentação | 100+ arquivos | 🟡 |

---

## Arquitetura

### Estrutura SSOT
```
src/
├── app/          # Shell da aplicação (73 linhas)
├── core/         # 721 itens - Capacidades transversais
├── modules/      # 1.169 itens - Domínios de produto
├── shared/       # 244 itens - UI compartilhada
└── integrations/ # 16 itens - Adaptadores externos
```

### Estado (State Management)
- **TanStack Query**: Server state (cache, sincronização)
- **SessionState**: SSOT de sessão e perfil
- **Zustand**: Client state mínimo (apenas gastronomia/cart)

---

## Infraestrutura

### Backend
- **Supabase**: Auth + PostgreSQL + Storage
- **Edge Functions**: 14 funções serverless
- **Migrations**: 24 ativas + 200 arquivadas

### CI/CD
- **Build**: Vite + SWC
- **Deploy**: Vercel
- **Testes**: Vitest + Playwright

---

## Próximos Passos

1. 🔄 Expandir cobertura de testes para 85%+
2. 🔄 Consolidar documentação de status em docs/
3. 🔄 Revisar arquitetura de estado (Zustand vs alternatives)
4. 🔄 Otimizar bundle size

---

## Documentação Relacionada

- [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) - Arquitetura
- [docs/CURRENT_RULES.md](./docs/CURRENT_RULES.md) - Regras vigentes
- [docs/GEOGRAPHIC_FOUNDATION.md](./docs/GEOGRAPHIC_FOUNDATION.md) - Sistema territorial
- [docs/MIGRATIONS.md](./docs/MIGRATIONS.md) - Guia de migrations

---

## Histórico de Mudanças

Ver `docs/historico/` para histórico completo.

Ver `docs/archive/` para documentação arquivada.

---

*Documento mantido pela equipe Ordax*
