# 🎯 SSOT (Single Source of Truth) - Guia Rápido

**Bem-vindo!** Este guia te ajuda a navegar pela documentação SSOT do projeto.

---

## 🚀 Início Rápido

### Para Novos Desenvolvedores
1. **Leia primeiro**: [ONBOARDING.md](./ONBOARDING.md)
2. **Consulte sempre**: [SSOT_REGISTRY.md](./SSOT_REGISTRY.md)
3. **Use as ferramentas**: `npm run check:ssot`

### Para Desenvolvedores Experientes
1. **Referência rápida**: [SSOT_REGISTRY.md](./SSOT_REGISTRY.md)
2. **Status do projeto**: [SSOT_PROJECT_STATUS.md](./SSOT_PROJECT_STATUS.md)
3. **Plano de correção**: [SSOT_FIX_PLAN.md](./SSOT_FIX_PLAN.md)

---

## 📚 Documentação Completa

### Essenciais (Leitura Obrigatória)
| Documento | Descrição | Quando Ler |
|-----------|-----------|------------|
| [SSOT_REGISTRY.md](./SSOT_REGISTRY.md) | Lista de todos os SSOTs | Sempre que precisar acessar dados |
| [ONBOARDING.md](./ONBOARDING.md) | Guia completo de onboarding | Primeiro dia no projeto |

### Ferramentas
| Documento | Descrição | Quando Ler |
|-----------|-----------|------------|
| [SSOT_TOOLS.md](./SSOT_TOOLS.md) | Guia das ferramentas de compliance | Ao configurar ambiente |

### Referência
| Documento | Descrição | Quando Ler |
|-----------|-----------|------------|
| [SSOT_CORRECTION_REPORT.md](./SSOT_CORRECTION_REPORT.md) | Exemplo de correção profissional | Ao corrigir violações |
| [SSOT_LOCATION_VIOLATIONS.md](./SSOT_LOCATION_VIOLATIONS.md) | Relatório de violações corrigidas | Para aprender com exemplos |

### Status e Planejamento
| Documento | Descrição | Quando Ler |
|-----------|-----------|------------|
| [SSOT_PROJECT_STATUS.md](./SSOT_PROJECT_STATUS.md) | Status atual do projeto | Semanalmente |
| [SSOT_FIX_PLAN.md](./SSOT_FIX_PLAN.md) | Plano de ação priorizado | Ao planejar correções |
| [SSOT_IMPLEMENTATION_COMPLETE.md](./SSOT_IMPLEMENTATION_COMPLETE.md) | Relatório de implementação | Para contexto histórico |

---

## 🛠️ Comandos Principais

```bash
# Verificar compliance SSOT
npm run check:ssot

# Gerar plano de correção
npm run plan:ssot-fix

# Executar testes
npm run test

# Type check
npm run typecheck

# Lint
npm run lint
```

---

## 🎯 Regra de Ouro

**NUNCA faça queries diretas ao Supabase. SEMPRE use o serviço SSOT correspondente.**

```typescript
// ❌ ERRADO
const { data } = await supabase.from('locations').select('*');

// ✅ CORRETO
const { location } = await locationService.getLocationById({ id: 'uuid' });
```

---

## 📊 Status Atual

- ✅ **Documentação**: 100% completa
- ✅ **Ferramentas**: 100% implementadas
- ✅ **Compliance**: 79% (125 violações restantes)
- 🎯 **Meta**: 100% compliance em 10 dias

**Última sessão**: 2026-04-01 - 170 violações eliminadas! 🎉

---

## 🤝 Precisa de Ajuda?

1. **Dúvida sobre qual SSOT usar?** → Consulte [SSOT_REGISTRY.md](./SSOT_REGISTRY.md)
2. **Como corrigir uma violação?** → Veja [SSOT_CORRECTION_REPORT.md](./SSOT_CORRECTION_REPORT.md)
3. **Configurar ferramentas?** → Leia [SSOT_TOOLS.md](./SSOT_TOOLS.md)
4. **Onboarding?** → Comece por [ONBOARDING.md](./ONBOARDING.md)

---

## 🎓 Fluxo de Trabalho

```
1. Consultar SSOT_REGISTRY.md
   ↓
2. Usar serviço SSOT correto
   ↓
3. Executar npm run check:ssot
   ↓
4. Commit (pre-commit hook valida)
   ↓
5. PR (code review verifica compliance)
```

---

**Última atualização**: 2026-04-01  
**Versão**: 1.0.0
