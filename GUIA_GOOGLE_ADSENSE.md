# 📢 Guia de Configuração do Google AdSense

## 🎯 Passo a Passo para Ativar os Anúncios

### 1️⃣ Criar Conta no Google AdSense

1. Acesse: https://www.google.com/adsense
2. Faça login com sua conta Google
3. Clique em "Começar"
4. Preencha as informações:
   - URL do site: `https://seu-dominio.com`
   - País/região
   - Aceite os termos de serviço

### 2️⃣ Adicionar o Código do AdSense ao Site

Após criar a conta, o Google fornecerá um código como este:

```html
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX"
     crossorigin="anonymous"></script>
```

**Onde encontrar seu código:**
- Acesse: https://www.google.com/adsense
- Vá em: **Sites** → **Adicionar site**
- Copie o código fornecido

### 3️⃣ Adicionar o Script no Projeto

Edite o arquivo `index.html` e adicione o script no `<head>`:

```html
<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Achegue-se</title>
    
    <!-- Google AdSense -->
    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX"
         crossorigin="anonymous"></script>
    
    <!-- Resto do código... -->
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

**⚠️ IMPORTANTE:** Substitua `ca-pub-XXXXXXXXXXXXXXXX` pelo seu ID real do AdSense!

### 4️⃣ Criar Unidades de Anúncio

1. No painel do AdSense, vá em: **Anúncios** → **Por unidade de anúncio**
2. Clique em **Criar nova unidade de anúncio**
3. Escolha o tipo:
   - **Display responsivo** (recomendado para a maioria dos casos)
   - **In-feed** (para feeds de conteúdo)
   - **In-article** (para dentro de artigos)
4. Configure:
   - Nome da unidade (ex: "Banner Gastronomia Topo")
   - Tamanho: Responsivo
5. Clique em **Criar**
6. Copie o **data-ad-slot** (ex: `1234567890`)

### 5️⃣ Atualizar o Código na Página

Edite o arquivo: `src/modules/business/gastronomy/pages/GastronomyLandingPage.tsx`

Procure por esta seção:

```tsx
<ins
  className="adsbygoogle"
  style={{ display: 'block', width: '100%', minHeight: '90px' }}
  data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"  // ← Seu ID aqui
  data-ad-slot="XXXXXXXXXX"                  // ← Seu slot aqui
  data-ad-format="auto"
  data-full-width-responsive="true"
/>
```

**Substitua:**
- `ca-pub-XXXXXXXXXXXXXXXX` → Seu Publisher ID
- `XXXXXXXXXX` → Seu Ad Slot ID

### 6️⃣ Inicializar os Anúncios

O componente `AdSense` que criamos já faz isso automaticamente, mas se você adicionar anúncios manualmente, precisa inicializá-los:

```tsx
useEffect(() => {
  try {
    (window.adsbygoogle = window.adsbygoogle || []).push({});
  } catch (err) {
    console.error('AdSense error:', err);
  }
}, []);
```

### 7️⃣ Verificação e Aprovação

1. **Publique o site** com o código do AdSense
2. Volte ao painel do AdSense
3. Clique em **Verificar site**
4. O Google verificará se o código está instalado corretamente
5. **Aguarde a aprovação** (pode levar de 1 a 7 dias)

Durante a análise, você verá anúncios em branco ou de teste.

---

## 🎨 Usando o Componente AdSense Reutilizável

Criamos um componente `<AdSense />` para facilitar o uso:

```tsx
import { AdSense } from '@/shared/components/ads/AdSense';

// Uso básico
<AdSense slot="1234567890" />

// Com formato específico
<AdSense 
  slot="1234567890" 
  format="horizontal"
  style={{ minHeight: '90px' }}
/>

// Anúncio in-feed
<AdSense 
  slot="1234567890" 
  format="fluid"
  layout="in-article"
/>
```

### Props disponíveis:

- `slot` (obrigatório): ID da unidade de anúncio
- `client`: Publisher ID (padrão: variável de ambiente)
- `format`: Formato do anúncio (auto, fluid, rectangle, vertical, horizontal)
- `responsive`: Se deve ser responsivo (padrão: true)
- `layout`: Layout especial (in-article, in-feed)
- `style`: Estilos customizados
- `className`: Classes CSS adicionais

---

## 🔧 Configuração com Variáveis de Ambiente

Para não expor o ID diretamente no código, use variáveis de ambiente:

### 1. Adicione no `.env.local`:

```env
VITE_ADSENSE_CLIENT_ID=ca-pub-XXXXXXXXXXXXXXXX
```

### 2. Adicione no `.env.example`:

```env
# Google AdSense
VITE_ADSENSE_CLIENT_ID=ca-pub-XXXXXXXXXXXXXXXX
```

### 3. Use no componente:

```tsx
<AdSense 
  client={import.meta.env.VITE_ADSENSE_CLIENT_ID}
  slot="1234567890" 
/>
```

---

## 📊 Tipos de Anúncios Recomendados

### 1. **Banner Topo** (já implementado)
- Localização: Abaixo do hero
- Formato: Display responsivo
- Tamanho: Auto (adapta-se ao espaço)

### 2. **Banner Lateral** (sidebar)
- Formato: Vertical (300x600, 160x600)
- Bom para páginas de detalhes

### 3. **In-Feed** (entre cards)
- Formato: Fluid
- Layout: in-feed
- Aparece naturalmente entre os cards de lojas

### 4. **In-Article** (dentro de conteúdo)
- Formato: Fluid
- Layout: in-article
- Para páginas de blog/artigos

---

## ⚠️ Boas Práticas

### ✅ FAÇA:
- Use no máximo 3 anúncios por página
- Mantenha distância de botões importantes
- Use formatos responsivos
- Teste em diferentes dispositivos
- Monitore o desempenho no painel do AdSense

### ❌ NÃO FAÇA:
- Não clique nos próprios anúncios
- Não peça para outros clicarem
- Não coloque anúncios em páginas vazias
- Não use texto enganoso perto dos anúncios
- Não modifique o código do AdSense

---

## 🐛 Troubleshooting

### Anúncios não aparecem?

1. **Verifique o console do navegador** para erros
2. **Confirme que o script está carregado:**
   ```javascript
   console.log(window.adsbygoogle);
   ```
3. **Verifique se o site está aprovado** no painel do AdSense
4. **Aguarde alguns minutos** após publicar (cache)
5. **Teste em modo anônimo** (sem bloqueadores de anúncios)

### Anúncios em branco?

- Normal durante o período de análise
- Pode significar que não há anúncios disponíveis para seu nicho
- Verifique se o site está aprovado

### Erro "adsbygoogle.push() error"?

- Verifique se o script do AdSense está no `<head>`
- Confirme que o `data-ad-client` está correto
- Verifique se não há bloqueadores de anúncios

---

## 📈 Monitoramento

Acesse o painel do AdSense para ver:
- **Receita estimada** (diária, mensal)
- **Impressões** (quantas vezes os anúncios foram exibidos)
- **Cliques** (quantas vezes foram clicados)
- **CTR** (taxa de cliques)
- **CPC** (custo por clique)
- **RPM** (receita por mil impressões)

---

## 🔗 Links Úteis

- **Painel AdSense:** https://www.google.com/adsense
- **Central de Ajuda:** https://support.google.com/adsense
- **Políticas do AdSense:** https://support.google.com/adsense/answer/48182
- **Otimização de Anúncios:** https://support.google.com/adsense/answer/9183549

---

## 💡 Dicas para Aumentar a Receita

1. **Conteúdo de qualidade** - Mais visitantes = mais impressões
2. **SEO otimizado** - Tráfego orgânico é valioso
3. **Posicionamento estratégico** - Acima da dobra (visible sem scroll)
4. **Teste A/B** - Experimente diferentes posições
5. **Anúncios responsivos** - Adaptam-se melhor aos dispositivos
6. **Conteúdo em inglês** - Geralmente paga mais (se aplicável)

---

**Última atualização:** Abril 2026
