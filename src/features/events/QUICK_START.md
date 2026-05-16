# ⚡ Quick Start - Events V2

## 🎯 Acesso Rápido em 3 Passos

### 1️⃣ Adicionar Rota

Abra o arquivo de rotas (ex: `src/app/routes/index.tsx`) e adicione:

```typescript
import EventDetailPageV2 from '@/features/events-v2/pages/EventDetailPageV2';

// Adicione no array de rotas:
{
  path: '/eventos/demo',
  element: <EventDetailPageV2 />
}
```

### 2️⃣ Iniciar o Servidor

```bash
npm run dev
```

### 3️⃣ Acessar

Abra no navegador:

```
http://localhost:5173/eventos/demo
```

## 🎨 O que você vai ver

✅ **Hero Premium** - Banner full-width com overlay e informações destacadas  
✅ **Sistema de Ingressos** - Cards interativos com progress bars  
✅ **Descrição Rica** - Conteúdo formatado com features do evento  
✅ **Programação** - Timeline visual com horários  
✅ **Localização** - Mapa e instruções de acesso  
✅ **Organizador** - Perfil completo com estatísticas  
✅ **CTA Sticky** - Call-to-action sempre visível  
✅ **Animações** - Framer Motion em todos os elementos  
✅ **Responsivo** - Teste em mobile, tablet e desktop  
✅ **Dark Mode** - Alterne o tema e veja a adaptação  

## 📱 Teste em Diferentes Dispositivos

### Desktop
- Abra em tela cheia
- Teste hover effects
- Valide layout em 1920px

### Tablet
- Redimensione para 768px
- Valide grid adaptativo
- Teste touch interactions

### Mobile
- Redimensione para 375px
- Valide scroll vertical
- Teste CTA sticky

## 🎭 Dados de Demonstração

A página usa dados mock realistas:

- **Evento 1**: Roda de Samba (Presencial, Híbrido - Gratuito + Pago)
- **Evento 2**: Workshop Digital (Híbrido, Gratuito)

Para ver outros eventos, edite `src/features/events-v2/utils/mockData.ts`

## 🔧 Customização Rápida

### Alterar Evento Exibido

Em `EventDetailPageV2.tsx`, linha ~200:

```typescript
// Trocar de evt-001 para evt-002
const event = getMockEventById('evt-002');
```

### Adicionar Novo Evento Mock

Em `utils/mockData.ts`, adicione ao array `MOCK_EVENTS`:

```typescript
{
  id: 'evt-003',
  title: 'Seu Evento',
  // ... resto dos campos
}
```

### Mudar Cores

Os componentes usam o design system. Para customizar:

```typescript
// Exemplo: mudar cor do CTA
<Button className="bg-gradient-to-r from-blue-500 to-cyan-600">
  Seu texto
</Button>
```

## 🐛 Problemas Comuns

### Rota não funciona

**Solução**: Verifique se adicionou corretamente no arquivo de rotas e reiniciou o servidor.

### Estilos não aparecem

**Solução**: Verifique se o Tailwind está configurado para incluir `src/features/**` no `content`.

### Imagens não carregam

**Solução**: Os mocks usam Unsplash. Verifique sua conexão com internet.

### Tipos não reconhecidos

**Solução**: Reinicie o TypeScript server no VS Code (Cmd/Ctrl + Shift + P → "Restart TS Server").

## 📚 Próximos Passos

Após validar visualmente:

1. ✅ **Feedback**: Anote melhorias e ajustes necessários
2. 📝 **Backend**: Conecte com dados reais (ver `IMPLEMENTATION_GUIDE.md`)
3. 🧪 **Testes**: Adicione testes unitários e E2E
4. 🚀 **Deploy**: Configure feature flag e faça rollout gradual

## 📖 Documentação Completa

- **README.md** - Visão geral e features
- **IMPLEMENTATION_GUIDE.md** - Guia detalhado de implementação
- **SUMMARY.md** - Resumo executivo
- **demo-route.example.tsx** - Exemplos de rotas

## 💬 Feedback

Ao testar, considere:

- ✅ Design está profissional?
- ✅ Informações estão claras?
- ✅ Navegação é intuitiva?
- ✅ CTAs são evidentes?
- ✅ Mobile está otimizado?
- ✅ Animações são suaves?
- ✅ Performance é boa?

## 🎉 Pronto!

Você agora tem acesso à V2 completa dos eventos!

Explore, teste e valide a nova experiência premium. 🚀

---

**Dúvidas?** Consulte os arquivos de documentação na pasta `src/features/events-v2/`
