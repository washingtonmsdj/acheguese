# REGRAS TERRITORIAIS - POSTS

**Data**: 2026-04-05  
**Status**: 🚧 Em Definição  
**Módulo**: posts  
**Referência**: SPRINT2_POSTS_PLANO_V2.md - Fase 0

---

## DECISÕES NECESSÁRIAS

### DECISÃO 1: Escopo Territorial de Posts

**Pergunta**: Qual é a relação entre um post e o território?

#### Opção A: Post Vinculado ao Bairro do Autor ⭐ RECOMENDADA
```
Post herda location_id do perfil do autor
```

**Como funciona**:
- Ao criar post, `location_id` é automaticamente o do perfil do autor
- Usuário não escolhe bairro ao criar post
- Post sempre aparece no feed do bairro do autor
- Se autor muda de bairro, posts antigos permanecem no bairro original

**Prós**:
- ✅ Simples e consistente
- ✅ Sem ambiguidade sobre "onde" o post está
- ✅ Alinhado com conceito de "comunidade local"
- ✅ Evita spam cross-bairro
- ✅ Fácil de implementar

**Contras**:
- ❌ Não permite postar sobre eventos em outros bairros
- ❌ Menos flexível

**Exemplo de UX**:
```
[Criar Post]
Você está postando em: Barra
[Texto do post...]
[Publicar]
```

---

#### Opção B: Post com Território Independente
```
Usuário escolhe bairro ao criar post (pode ser diferente do seu)
```

**Como funciona**:
- Ao criar post, usuário seleciona bairro via `TerritorialSelector`
- Pode escolher qualquer bairro (não apenas o seu)
- Post aparece no feed do bairro escolhido
- Exemplo: Morador da Barra posta sobre evento no Pelourinho

**Prós**:
- ✅ Flexível
- ✅ Permite conteúdo cross-bairro
- ✅ Útil para eventos, recomendações

**Contras**:
- ❌ Mais complexo
- ❌ Pode gerar spam em outros bairros
- ❌ Usuário pode esquecer de mudar o seletor
- ❌ Requer validação anti-spam

**Exemplo de UX**:
```
[Criar Post]
Onde está acontecendo?
[Seletor: Pelourinho ▼]
[Texto do post...]
[Publicar]
```

---

#### Opção C: Post com Alcance Configurável
```
Post tem location_id base + campo reach (street/neighborhood/city)
```

**Como funciona**:
- Post tem `location_id` (bairro do autor)
- Post tem campo `reach` que define visibilidade
- `reach='neighborhood'`: apenas no bairro
- `reach='city'`: em toda a cidade (requer permissão)
- Validação baseada em reputação/verificação

**Prós**:
- ✅ Máxima flexibilidade
- ✅ Permite alertas de cidade
- ✅ Controle granular de visibilidade

**Contras**:
- ❌ Muito complexo
- ❌ Requer sistema de permissões robusto
- ❌ UX mais confusa
- ❌ Difícil de implementar

**Exemplo de UX**:
```
[Criar Post]
Você está postando em: Barra
Alcance: [Apenas Barra ▼]
         [Toda Salvador] (requer verificação)
[Texto do post...]
[Publicar]
```

---

### DECISÃO 2: Relação com Seletor Global

**Pergunta**: Como o seletor territorial global afeta posts?

#### Cenário 1: Seletor Filtra Feed ⭐ RECOMENDADO
```
Seletor global determina quais posts o usuário vê
```

**Como funciona**:
- Usuário seleciona "Barra" → vê posts com `location_id` da Barra
- Usuário seleciona "Salvador" → vê posts de todos os bairros de Salvador
- Criação de post usa `location_id` do perfil (se Opção A) ou do seletor (se Opção B)

**Prós**:
- ✅ Consistente com navegação territorial
- ✅ Permite explorar outros bairros
- ✅ Alinhado com tourist_points

**Contras**:
- ❌ Se Opção B, usuário pode criar post no bairro errado

**Fluxo**:
```
1. Usuário seleciona "Pelourinho" no seletor global
2. Feed mostra posts do Pelourinho
3. Ao criar post:
   - Opção A: post vai para bairro do perfil (ex: Barra)
   - Opção B: post vai para Pelourinho (seletor ativo)
```

---

#### Cenário 2: Seletor Independente de Posts
```
Seletor global não afeta posts
```

**Como funciona**:
- Seletor global afeta apenas tourist_points, eventos, etc
- Posts sempre mostram feed do bairro do usuário logado
- Criação de post sempre usa `location_id` do perfil

**Prós**:
- ✅ Simples, sem ambiguidade
- ✅ Feed de posts sempre "local"

**Contras**:
- ❌ Inconsistente com outros módulos
- ❌ Menos flexível
- ❌ Usuário não pode explorar posts de outros bairros

---

### DECISÃO 3: Grupos Territoriais

**Pergunta**: Posts podem ser vinculados a grupos territoriais (cidade)?

#### Opção A: Apenas Bairros Individuais ⭐ RECOMENDADA
```
location_id sempre aponta para um único bairro (type='district')
```

**Como funciona**:
- Todo post tem `location_id` de um bairro específico
- Não há posts "de cidade"
- Feed de cidade mostra posts de todos os bairros (expansão)

**Prós**:
- ✅ Simples, sem ambiguidade
- ✅ Alinhado com conceito de "comunidade local"
- ✅ Fácil de implementar

**Contras**:
- ❌ Não permite alertas para toda cidade
- ❌ Menos flexível

---

#### Opção B: Suporte a Grupos (Cidade)
```
location_id pode apontar para cidade (type='city')
```

**Como funciona**:
- Posts normais: `location_id` = bairro
- Posts de cidade: `location_id` = cidade (requer permissão)
- Feed de cidade mostra: posts da cidade + posts de todos os bairros
- Validação: apenas usuários verificados ou com alta reputação

**Prós**:
- ✅ Flexível
- ✅ Permite alertas/avisos para toda cidade
- ✅ Útil para conteúdo oficial

**Contras**:
- ❌ Mais complexo
- ❌ Requer sistema de permissões
- ❌ Pode gerar spam

**Exemplo**:
```
Post 1: location_id = Barra (bairro)
  → Aparece em: feed da Barra, feed de Salvador

Post 2: location_id = Salvador (cidade)
  → Aparece em: feed de Salvador, feed de todos os bairros
```

---

## RECOMENDAÇÃO OFICIAL

### Combinação Recomendada: A + 1 + A

**Escopo**: Opção A - Post vinculado ao bairro do autor  
**Seletor**: Cenário 1 - Seletor filtra feed  
**Grupos**: Opção A - Apenas bairros individuais

**Justificativa**:
- Simples de implementar
- Consistente com tourist_points
- Alinhado com conceito de "comunidade local"
- Evita complexidade de permissões
- Fácil de entender para usuários

**Fluxo Completo**:
```
1. Usuário tem perfil com location_id = Barra
2. Usuário seleciona "Pelourinho" no seletor global
3. Feed mostra posts do Pelourinho
4. Usuário clica "Criar Post"
5. Post é criado com location_id = Barra (do perfil)
6. Post aparece no feed da Barra (não do Pelourinho)
7. Para ver seu post, usuário precisa voltar seletor para Barra
```

**Feedback Visual**:
```
[Criar Post]
ℹ️ Você está postando em: Barra (seu bairro)
[Texto do post...]
[Publicar]
```

---

## DIAGRAMAS DE FLUXO

### Fluxo 1: Criação de Post

```
┌─────────────────┐
│ Usuário clica   │
│ "Criar Post"    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Buscar perfil   │
│ do usuário      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Extrair         │
│ location_id     │
│ do perfil       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Validar         │
│ location_id     │
│ (ativo?)        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Criar post com  │
│ location_id     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Post criado     │
│ com sucesso     │
└─────────────────┘
```

### Fluxo 2: Visualização de Feed

```
┌─────────────────┐
│ Usuário         │
│ seleciona       │
│ "Pelourinho"    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Buscar          │
│ location_id     │
│ do Pelourinho   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Query posts     │
│ WHERE           │
│ location_id =   │
│ Pelourinho      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Renderizar      │
│ posts no feed   │
└─────────────────┘
```

### Fluxo 3: Expansão Territorial (Cidade)

```
┌─────────────────┐
│ Usuário         │
│ seleciona       │
│ "Salvador"      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Detectar que    │
│ Salvador é      │
│ type='city'     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Buscar todos    │
│ distritos de    │
│ Salvador        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Query posts     │
│ WHERE           │
│ location_id IN  │
│ (distritos)     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Renderizar      │
│ posts no feed   │
└─────────────────┘
```

---

## IMPACTO EM UX

### Cenário 1: Usuário Cria Post no Seu Bairro
```
Usuário: João (mora na Barra)
Seletor Global: Barra
Ação: Criar post "Alguém viu o pôr do sol hoje?"

Resultado:
✅ Post criado com location_id = Barra
✅ Post aparece no feed da Barra
✅ João vê seu post imediatamente
```

### Cenário 2: Usuário Explora Outro Bairro
```
Usuário: João (mora na Barra)
Seletor Global: Pelourinho
Ação: Navegar pelo feed

Resultado:
✅ João vê posts do Pelourinho
✅ João pode criar post
⚠️ Post será criado na Barra (seu bairro)
⚠️ Post NÃO aparecerá no feed do Pelourinho
ℹ️ Feedback visual: "Você está postando em: Barra"
```

### Cenário 3: Usuário Muda de Bairro
```
Usuário: João
Situação Inicial: mora na Barra, tem 10 posts
Ação: Muda perfil para Pelourinho

Resultado:
✅ Posts antigos permanecem na Barra
✅ Novos posts vão para Pelourinho
✅ Histórico preservado
```

---

## PRÓXIMOS PASSOS

1. **Aprovar decisões acima**
2. **Atualizar plano com decisões**
3. **Iniciar auditoria completa**
4. **Prosseguir para Fase 1**

---

**Status**: 🟡 Aguardando Aprovação das Decisões  
**Recomendação**: A + 1 + A (mais simples e consistente)
