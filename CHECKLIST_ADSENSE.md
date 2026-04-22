# ✅ Checklist Rápido - Ativar Google AdSense

## 📋 Passo a Passo Simplificado

### 1. Criar Conta AdSense
- [ ] Acessar https://www.google.com/adsense
- [ ] Fazer login com conta Google
- [ ] Preencher informações do site
- [ ] Aceitar termos de serviço

### 2. Obter Códigos
- [ ] Copiar **Publisher ID** (formato: `ca-pub-XXXXXXXXXXXXXXXX`)
- [ ] Copiar **script do AdSense** fornecido pelo Google

### 3. Configurar no Projeto

#### A. Adicionar Script no HTML
Edite `index.html` e adicione no `<head>`:

```html
<!-- Google AdSense -->
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX"
     crossorigin="anonymous"></script>
```

#### B. Configurar Variável de Ambiente
Adicione no `.env.local`:

```env
VITE_ADSENSE_CLIENT_ID=ca-pub-XXXXXXXXXXXXXXXX
```

#### C. Criar Unidade de Anúncio
No painel do AdSense:
- [ ] Ir em **Anúncios** → **Por unidade de anúncio**
- [ ] Criar nova unidade (Display responsivo)
- [ ] Copiar o **Ad Slot ID** (ex: `1234567890`)

#### D. Atualizar o Código
Em `src/modules/business/gastronomy/pages/GastronomyLandingPage.tsx`:

```tsx
<AdSense 
  slot="1234567890"  // ← Cole seu Ad Slot ID aqui
  format="horizontal"
  style={{ minHeight: '90px' }}
/>
```

### 4. Publicar e Verificar
- [ ] Fazer commit das alterações
- [ ] Fazer deploy do site
- [ ] Voltar ao painel do AdSense
- [ ] Clicar em "Verificar site"
- [ ] Aguardar aprovação (1-7 dias)

### 5. Testar
- [ ] Abrir o site em modo anônimo
- [ ] Verificar se o espaço do anúncio aparece
- [ ] Verificar console do navegador (sem erros)
- [ ] Aguardar anúncios reais aparecerem (após aprovação)

---

## 🔍 Verificação Rápida

### O script está carregado?
Abra o console do navegador e digite:
```javascript
console.log(window.adsbygoogle);
```
Deve retornar um array (não `undefined`)

### Há erros?
Verifique o console para mensagens de erro do AdSense

### O site está aprovado?
Acesse o painel do AdSense e verifique o status

---

## 📞 Precisa de Ajuda?

Consulte o guia completo: `GUIA_GOOGLE_ADSENSE.md`

Links úteis:
- Painel: https://www.google.com/adsense
- Suporte: https://support.google.com/adsense
- Políticas: https://support.google.com/adsense/answer/48182
