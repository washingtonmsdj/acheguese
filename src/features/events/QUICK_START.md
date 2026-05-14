# âš¡ Quick Start - Events V2

## ðŸŽ¯ Acesso RÃ¡pido em 3 Passos

### 1ï¸âƒ£ Adicionar Rota

Abra o arquivo de rotas (ex: `src/app/routes/index.tsx`) e adicione:

```typescript
import EventDetailPageV2 from '@/features/events-v2/pages/EventDetailPageV2';

// Adicione no array de rotas:
{
  path: '/eventos/demo',
  element: <EventDetailPageV2 />
}
```

### 2ï¸âƒ£ Iniciar o Servidor

```bash
npm run dev
```

### 3ï¸âƒ£ Acessar

Abra no navegador:

```
http://localhost:5173/eventos/demo
```

## ðŸŽ¨ O que vocÃª vai ver

âœ… **Hero Premium** - Banner full-width com overlay e informaÃ§Ãµes destacadas  
âœ… **Sistema de Ingressos** - Cards interativos com progress bars  
âœ… **DescriÃ§Ã£o Rica** - ConteÃºdo formatado com features do evento  
âœ… **ProgramaÃ§Ã£o** - Timeline visual com horÃ¡rios  
âœ… **LocalizaÃ§Ã£o** - Mapa e instruÃ§Ãµes de acesso  
âœ… **Organizador** - Perfil completo com estatÃ­sticas  
âœ… **CTA Sticky** - Call-to-action sempre visÃ­vel  
âœ… **AnimaÃ§Ãµes** - Framer Motion em todos os elementos  
âœ… **Responsivo** - Teste em mobile, tablet e desktop  
âœ… **Dark Mode** - Alterne o tema e veja a adaptaÃ§Ã£o  

## ðŸ“± Teste em Diferentes Dispositivos

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

## ðŸŽ­ Dados de DemonstraÃ§Ã£o

A pÃ¡gina usa dados mock realistas:

- **Evento 1**: Roda de Samba (Presencial, HÃ­brido - Gratuito + Pago)
- **Evento 2**: Workshop Digital (HÃ­brido, Gratuito)

Para ver outros eventos, edite `src/features/events-v2/utils/mockData.ts`

## ðŸ”§ CustomizaÃ§Ã£o RÃ¡pida

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

## ðŸ› Problemas Comuns

### Rota nÃ£o funciona

**SoluÃ§Ã£o**: Verifique se adicionou corretamente no arquivo de rotas e reiniciou o servidor.

### Estilos nÃ£o aparecem

**SoluÃ§Ã£o**: Verifique se o Tailwind estÃ¡ configurado para incluir `src/features/**` no `content`.

### Imagens nÃ£o carregam

**SoluÃ§Ã£o**: Os mocks usam Unsplash. Verifique sua conexÃ£o com internet.

### Tipos nÃ£o reconhecidos

**SoluÃ§Ã£o**: Reinicie o TypeScript server no VS Code (Cmd/Ctrl + Shift + P â†’ "Restart TS Server").

## ðŸ“š PrÃ³ximos Passos

ApÃ³s validar visualmente:

1. âœ… **Feedback**: Anote melhorias e ajustes necessÃ¡rios
2. ðŸ“ **Backend**: Conecte com dados reais (ver `IMPLEMENTATION_GUIDE.md`)
3. ðŸ§ª **Testes**: Adicione testes unitÃ¡rios e E2E
4. ðŸš€ **Deploy**: Configure feature flag e faÃ§a rollout gradual

## ðŸ“– DocumentaÃ§Ã£o Completa

- **README.md** - VisÃ£o geral e features
- **IMPLEMENTATION_GUIDE.md** - Guia detalhado de implementaÃ§Ã£o
- **SUMMARY.md** - Resumo executivo
- **demo-route.example.tsx** - Exemplos de rotas

## ðŸ’¬ Feedback

Ao testar, considere:

- âœ… Design estÃ¡ profissional?
- âœ… InformaÃ§Ãµes estÃ£o claras?
- âœ… NavegaÃ§Ã£o Ã© intuitiva?
- âœ… CTAs sÃ£o evidentes?
- âœ… Mobile estÃ¡ otimizado?
- âœ… AnimaÃ§Ãµes sÃ£o suaves?
- âœ… Performance Ã© boa?

## ðŸŽ‰ Pronto!

VocÃª agora tem acesso Ã  V2 completa dos eventos!

Explore, teste e valide a nova experiÃªncia premium. ðŸš€

---

**DÃºvidas?** Consulte os arquivos de documentaÃ§Ã£o na pasta `src/features/events-v2/`
