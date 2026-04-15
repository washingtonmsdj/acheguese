# 🚀 START HERE - Arquitetura Community

> **Bem-vindo!** Este é o ponto de partida para entender a arquitetura Community.

---

## 🎯 VOCÊ ESTÁ AQUI

A arquitetura Community foi **CONGELADA** em versão oficial única e definitiva.

**Versão:** 1.0.0  
**Data:** 24/03/2026  
**Status:** ✅ OFICIAL

---

## 📚 LEIA PRIMEIRO

### 1. Referência Rápida (5 minutos)
👉 **[QUICK_REFERENCE_COMMUNITY.md](./QUICK_REFERENCE_COMMUNITY.md)**

O que você vai aprender:
- ✅ Regra de ouro
- ✅ O que é permitido
- ✅ O que é proibido
- ✅ Checklist de PR

### 2. Resumo Executivo (10 minutos)
👉 **[ARQUITETURA_CONGELADA_RESUMO.md](./ARQUITETURA_CONGELADA_RESUMO.md)**

O que você vai aprender:
- 📐 Linha definitiva
- 📚 Documentação disponível
- ✅ Status atual
- 🚫 Anti-regressões

### 3. Arquitetura Completa (30 minutos)
👉 **[ARQUITETURA_COMMUNITY_OFICIAL.md](./ARQUITETURA_COMMUNITY_OFICIAL.md)** ⭐

O que você vai aprender:
- 🏗️ Estrutura completa
- 🔒 Contratos de fronteira
- 📋 Checklist de conformidade
- 🎯 Próximos passos

---

## 🎯 CASOS DE USO

### "Preciso desenvolver uma feature"
1. Leia [QUICK_REFERENCE_COMMUNITY.md](./QUICK_REFERENCE_COMMUNITY.md)
2. Consulte [ARQUITETURA_COMMUNITY_OFICIAL.md](./ARQUITETURA_COMMUNITY_OFICIAL.md)
3. Valide com [VALIDACAO_BLINDAGEM_COMMUNITY.md](./VALIDACAO_BLINDAGEM_COMMUNITY.md)

### "Preciso revisar um PR"
1. Use checklist em [QUICK_REFERENCE_COMMUNITY.md](./QUICK_REFERENCE_COMMUNITY.md)
2. Valide anti-regressões em [ARQUITETURA_COMMUNITY_OFICIAL.md](./ARQUITETURA_COMMUNITY_OFICIAL.md)

### "Sou novo no projeto"
1. Leia [ARQUITETURA_CONGELADA_RESUMO.md](./ARQUITETURA_CONGELADA_RESUMO.md)
2. Leia [ARQUITETURA_COMMUNITY_OFICIAL.md](./ARQUITETURA_COMMUNITY_OFICIAL.md)
3. Explore código seguindo estrutura documentada

### "Preciso executar refatoração"
1. Leia [PLANO_EXECUCAO_ARQUITETURA_OFICIAL.md](./PLANO_EXECUCAO_ARQUITETURA_OFICIAL.md)
2. Siga checklist de conformidade
3. Execute validações

### "Tenho dúvidas sobre a documentação"
1. Consulte [INDICE_DOCUMENTACAO.md](./INDICE_DOCUMENTACAO.md)
2. Navegue pelos documentos relevantes

---

## 📐 LINHA DEFINITIVA (RESUMO)

```
/comunidade = FEED SOCIAL PURO

✅ Posts sociais (discussao, recomendacao, enquete, evento)
✅ AlertFeedSection (bloco contextual separado)
✅ IssueFeedSection (bloco contextual separado)

❌ AlertCard e IssueCard NUNCA inline
❌ PostType NUNCA inclui "alerta" ou "zeladoria"
❌ PostService NUNCA conhece alertas/problemas
```

---

## 🚫 REGRAS DE OURO

### 1. PostType = Apenas Social
```typescript
// ✅ CORRETO
export type PostType = "discussao" | "recomendacao" | "enquete" | "evento";

// ❌ PROIBIDO
export type PostType = ... | "alerta" | "zeladoria"; // ❌ NUNCA
```

### 2. Sem Mistura Inline
```typescript
// ✅ CORRETO
<CommunityFeed />
<AlertFeedSection />
<IssueFeedSection />

// ❌ PROIBIDO
<CommunityFeed>
  {items.map(item => item.type === 'alert' ? <AlertCard /> : ...)} // ❌
</CommunityFeed>
```

### 3. Sem Acesso Direto ao Banco
```typescript
// ✅ CORRETO
const posts = await postService.getFeed({ city });

// ❌ PROIBIDO
const { data } = await supabase.from("posts").select("*"); // ❌
```

---

## 📚 TODOS OS DOCUMENTOS

### Documentação Oficial (VÁLIDA)
1. ⭐ [ARQUITETURA_COMMUNITY_OFICIAL.md](./ARQUITETURA_COMMUNITY_OFICIAL.md) - Arquitetura completa
2. 🚀 [QUICK_REFERENCE_COMMUNITY.md](./QUICK_REFERENCE_COMMUNITY.md) - Referência rápida
3. 📋 [ARQUITETURA_CONGELADA_RESUMO.md](./ARQUITETURA_CONGELADA_RESUMO.md) - Resumo executivo
4. 📚 [INDICE_DOCUMENTACAO.md](./INDICE_DOCUMENTACAO.md) - Índice completo
5. 🎯 [PLANO_EXECUCAO_ARQUITETURA_OFICIAL.md](./PLANO_EXECUCAO_ARQUITETURA_OFICIAL.md) - Plano de execução
6. 📖 [CONSOLIDACAO_COMMUNITY_COMPLETA.md](./CONSOLIDACAO_COMMUNITY_COMPLETA.md) - Histórico
7. ✅ [VALIDACAO_BLINDAGEM_COMMUNITY.md](./VALIDACAO_BLINDAGEM_COMMUNITY.md) - Validação
8. 📊 [RELATORIO_VALIDACAO_COMMUNITY.md](./RELATORIO_VALIDACAO_COMMUNITY.md) - Relatório
9. 📝 [RESUMO_VALIDACAO_COMMUNITY.md](./RESUMO_VALIDACAO_COMMUNITY.md) - Resumo validação
10. 🎉 [ENTREGA_ARQUITETURA_CONGELADA.md](./ENTREGA_ARQUITETURA_CONGELADA.md) - Entrega

### Documentos Arquivados (HISTÓRICO)
- 🗄️ `docs-archive/` - 41 documentos antigos/contraditórios

---

## 🔍 VALIDAÇÃO RÁPIDA

```bash
# Validação completa
npm run typecheck && npm run lint && npm run build

# Buscar violações
grep -r "alerta|zeladoria" src/core/posts/types/
grep -r "from.*community-alerts/services" src/modules/community/
grep -r "supabase\.from" src/modules/community/
grep -r "AlertCard|IssueCard" src/modules/community/components/feed/
```

---

## 📞 PRECISA DE AJUDA?

### Dúvida sobre arquitetura?
→ Leia [ARQUITETURA_COMMUNITY_OFICIAL.md](./ARQUITETURA_COMMUNITY_OFICIAL.md)

### Precisa validar código?
→ Use [VALIDACAO_BLINDAGEM_COMMUNITY.md](./VALIDACAO_BLINDAGEM_COMMUNITY.md)

### Vai refatorar?
→ Siga [PLANO_EXECUCAO_ARQUITETURA_OFICIAL.md](./PLANO_EXECUCAO_ARQUITETURA_OFICIAL.md)

### Problema de conformidade?
→ Abra issue com label "conformity"

---

## ✅ CHECKLIST RÁPIDO

Antes de cada PR:

- [ ] PostType sem alerta/zeladoria
- [ ] Nenhum import proibido
- [ ] Nenhuma mistura inline
- [ ] Nenhum acesso direto ao banco
- [ ] `npm run typecheck` passa
- [ ] `npm run build` passa

---

## 🎉 PRONTO!

Você agora sabe:
- ✅ Onde encontrar a documentação
- ✅ Qual é a linha definitiva
- ✅ Quais são as regras de ouro
- ✅ Como validar seu código

**Próximo passo:** Escolha um documento acima e comece a ler! 📚

---

**Versão:** 1.0.0  
**Última Atualização:** 24/03/2026  
**Status:** ✅ OFICIAL
