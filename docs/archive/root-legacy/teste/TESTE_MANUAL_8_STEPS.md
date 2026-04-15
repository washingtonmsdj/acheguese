# 🧪 Teste Manual: 8 Steps do Formulário de Criação de Anúncio

## ⚠️ Nota
Como não foi possível instalar o Playwright devido a espaço em disco, siga este guia para testar manualmente.

## 📋 Pré-requisitos
- ✅ Aplicação rodando: `npm run dev`
- ✅ Usuário logado no sistema
- ✅ Migration do storage aplicada

## 🚀 Teste Completo - 8 Steps

### Preparação
1. Abra o navegador
2. Acesse: `http://localhost:5173/classificados/novo`
3. Faça login se necessário

---

### ✅ STEP 1: Informações

**Campos a preencher:**
- [ ] **Título:** "iPhone 15 Pro Max 256GB Azul"
- [ ] **Descrição:** "iPhone 15 Pro Max em perfeito estado, apenas 2 meses de uso. Acompanha caixa, carregador original e nota fiscal. Sem arranhões, bateria 100%. Aceito propostas."
- [ ] **Categoria:** Clicar em "📱 Eletrônicos"
- [ ] **Subcategoria:** Clicar em "📱 Celulares" (deve aparecer após selecionar categoria)
- [ ] **Condição:** Clicar em "👍 Seminovo"

**Validações:**
- [ ] Contador de caracteres aparece no título (X/100)
- [ ] Contador de caracteres aparece na descrição (X/2000)
- [ ] Subcategorias aparecem após selecionar categoria
- [ ] Botão "Limpar subcategoria" aparece após selecionar
- [ ] Barra de progresso aumenta conforme preenche

**Clicar em:** "Próximo" ➡️

---

### ✅ STEP 2: Preço

**Campos a preencher:**
- [ ] **Tipo de Preço:** "💰 Fixo" (já selecionado por padrão)
- [ ] **Valor:** "4500"

**Validações:**
- [ ] Input de valor aparece (tipos "Grátis" e "Sob consulta" não mostram input)
- [ ] Pode alternar entre tipos de preço
- [ ] Valor aceita apenas números

**Clicar em:** "Próximo" ➡️

---

### ✅ STEP 3: Localização

**Verificar:**
- [ ] Status da localização aparece (ativa ou inativa)
- [ ] Se ativa: mostra nome da localização (ex: "📍 Salvador, BA")
- [ ] Se inativa: mostra mensagem de erro

**Campos a preencher:**
- [ ] **Bairro (opcional):** "Barra"

**Validações:**
- [ ] Ícone de check verde se localização ativa
- [ ] Ícone de alerta vermelho se localização inativa
- [ ] Campo de bairro é opcional

**Clicar em:** "Próximo" ➡️

---

### ✅ STEP 4: Fotos

**Ações:**
- [ ] Clicar em "Adicionar" (botão com ícone de imagem)
- [ ] Selecionar 2-3 fotos do seu computador
- [ ] Aguardar preview aparecer

**Validações:**
- [ ] Preview das fotos aparece imediatamente
- [ ] Primeira foto tem badge "Capa"
- [ ] Contador mostra "X/10" fotos
- [ ] Botões de reordenar aparecem ao passar mouse
- [ ] Botão X para remover foto funciona
- [ ] Pode adicionar até 10 fotos
- [ ] Botão "Adicionar" desaparece quando atingir 10 fotos

**⚠️ IMPORTANTE - Teste de Upload:**
Se você avançar para publicação, as fotos serão:
1. Comprimidas automaticamente
2. Convertidas para WebP
3. Enviadas para Supabase Storage
4. Thumbnails gerados

**Clicar em:** "Próximo" ➡️

---

### ✅ STEP 5: Detalhes

**Campos dinâmicos (variam por categoria):**

Para **Eletrônicos > Celulares:**
- [ ] **Marca:** "Apple"
- [ ] **Modelo:** "iPhone 15 Pro Max"
- [ ] **Armazenamento:** "256GB"
- [ ] **Garantia:** Selecionar "Com garantia"

**Validações:**
- [ ] Campos mudam conforme categoria selecionada
- [ ] Se categoria não tem campos, mostra mensagem
- [ ] Campos obrigatórios marcados com *
- [ ] Selects funcionam corretamente

**Clicar em:** "Próximo" ➡️

---

### ✅ STEP 6: Contato

**Campos a preencher:**
- [ ] **Telefone (opcional):** "71999887766"
- [ ] **WhatsApp (recomendado):** "71999887766"

**Validações:**
- [ ] Aceita apenas números
- [ ] Máximo 15 caracteres
- [ ] Toggle "Exibir telefone" funciona
- [ ] Descrição do toggle é clara

**Clicar em:** "Próximo" ➡️

---

### ✅ STEP 7: Visibilidade

**Verificar:**
- [ ] Switch "Anúncio Ativo" está visível
- [ ] Switch está ativo por padrão
- [ ] Descrição explica o que é rascunho
- [ ] Seção "Destaque Premium" aparece
- [ ] Botão "Em breve" está desabilitado

**Validações:**
- [ ] Switch pode ser alternado
- [ ] Visual muda ao alternar switch
- [ ] Card de destaque premium tem visual diferenciado

**Clicar em:** "Próximo" ➡️

---

### ✅ STEP 8: Preview e Publicação

**Verificar Preview:**
- [ ] **Título:** "iPhone 15 Pro Max 256GB Azul"
- [ ] **Preço:** "R$ 4.500" (formatado)
- [ ] **Tags:** 
  - [ ] "📱 Eletrônicos"
  - [ ] "📱 Celulares" (subcategoria)
  - [ ] "👍 Seminovo"
  - [ ] "💰 Fixo"
- [ ] **Descrição:** Texto completo visível
- [ ] **Fotos:** Preview da primeira foto (se adicionou)
- [ ] **Detalhes:** Marca, Modelo, Armazenamento
- [ ] **Localização:** "Barra, Salvador" (se preencheu)
- [ ] **Contato:** Telefone e WhatsApp

**Validações:**
- [ ] Card de preview tem visual de anúncio real
- [ ] Todas as informações estão corretas
- [ ] Fotos extras aparecem em miniatura abaixo
- [ ] Badge "✓ Anúncio pronto para ser publicado!"
- [ ] Botão "Editar" volta para step 1
- [ ] Botão "Publicar Anúncio" está habilitado

---

### 🚀 PUBLICAÇÃO (OPCIONAL)

**⚠️ ATENÇÃO:** Isso criará um anúncio real no banco de dados!

**Clicar em:** "✨ Publicar Anúncio"

**Aguardar:**
1. [ ] Mensagem "Enviando fotos..." (se houver fotos)
2. [ ] Barra de progresso de upload (se houver fotos)
3. [ ] Mensagem "Publicando..."
4. [ ] Toast de sucesso: "Anúncio publicado com sucesso! 🎉"
5. [ ] Redirecionamento para listagem

**Validar Anúncio Criado:**
- [ ] Anúncio aparece na listagem
- [ ] Fotos estão visíveis
- [ ] Primeira foto é a capa
- [ ] Dados estão corretos
- [ ] Pode acessar detalhes do anúncio

---

## 🧪 Testes Adicionais

### Teste 1: Validação de Campos Obrigatórios
1. Ir para Step 1
2. Clicar em "Próximo" sem preencher nada
3. **Validar:**
   - [ ] Não avança para próximo step
   - [ ] Mensagens de erro aparecem
   - [ ] Campos com erro têm borda vermelha

### Teste 2: Navegação Entre Steps
1. Preencher Step 1 e avançar
2. Clicar no indicador "1 - Informações" no topo
3. **Validar:**
   - [ ] Volta para Step 1
   - [ ] Dados preenchidos permanecem
   - [ ] Pode avançar novamente

### Teste 3: Barra de Progresso
1. Observar barra de progresso no topo
2. Preencher campos gradualmente
3. **Validar:**
   - [ ] Porcentagem aumenta
   - [ ] Barra visual cresce
   - [ ] Atualiza em tempo real

### Teste 4: Subcategorias Dinâmicas
1. Selecionar categoria "Veículos"
2. **Validar:**
   - [ ] Subcategorias aparecem: Carros, Motos, Caminhões, etc.
3. Trocar para "Imóveis"
4. **Validar:**
   - [ ] Subcategorias mudam: Apartamento, Casa, Terreno, etc.
   - [ ] Subcategoria anterior é resetada

### Teste 5: Upload de Fotos (Se Houver)
1. Adicionar 3 fotos
2. **Validar:**
   - [ ] Preview imediato
   - [ ] Pode reordenar (arrastar ou botões)
   - [ ] Pode remover
   - [ ] Primeira sempre tem badge "Capa"

---

## 📊 Checklist Final

### Funcionalidade
- [ ] Todos os 8 steps são acessíveis
- [ ] Campos obrigatórios validam
- [ ] Navegação entre steps funciona
- [ ] Barra de progresso atualiza
- [ ] Preview mostra dados corretos
- [ ] Publicação funciona (se testou)

### UI/UX
- [ ] Botões respondem ao clique
- [ ] Mensagens de erro são claras
- [ ] Indicadores de step funcionam
- [ ] Animações são suaves
- [ ] Layout responsivo

### Dados
- [ ] Título é salvo
- [ ] Descrição é salva
- [ ] Categoria é salva
- [ ] Subcategoria é salva
- [ ] Preço é salvo
- [ ] Fotos são enviadas (se houver)
- [ ] Detalhes são salvos
- [ ] Contato é salvo

### Upload de Fotos (Se Testou)
- [ ] Fotos foram comprimidas
- [ ] Formato WebP
- [ ] Thumbnails gerados
- [ ] URLs acessíveis
- [ ] Aparecem no anúncio

---

## 🐛 Problemas Encontrados?

### Anote aqui:
```
Step: ___
Problema: ___
Comportamento esperado: ___
Comportamento atual: ___
```

---

## ✅ Resultado Esperado

Se tudo funcionar corretamente:
- ✅ 8 steps completados sem erros
- ✅ Validações funcionando
- ✅ Navegação fluida
- ✅ Preview correto
- ✅ Publicação bem-sucedida (se testou)
- ✅ Fotos comprimidas e enviadas (se testou)

---

**Tempo estimado:** 10-15 minutos
**Última atualização:** 2026-04-01
