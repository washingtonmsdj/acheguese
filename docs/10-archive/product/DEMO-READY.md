# DEMO-READY — Sprint DEMO.1

Guia oficial da apresentação. Valida o que está pronto para uma demo de 10 minutos para empreendedores, potenciais parceiros e interessados.

Última revisão: sprint DEMO.1.

## Prioridade 0 — Percepção em 30 segundos

Objetivo: qualquer visitante entende o Achegue-se sem precisar de explicação.

- Splash `/` traz o value-prop explícito: **"A rede do seu bairro. Vizinhos, empresas e o que acontece pertinho de você — tudo em um só lugar."**
- CTA único: informar cidade → onboarding → Territory Home.
- Territory Home mostra território, o que acontece hoje, destaques e ações rápidas com dados de demonstração coerentes com um bairro vivo.
- Toda tela transmite evolução: qualquer módulo pausado usa `LaunchPausedPage` com copy "Estamos expandindo · chega em breve no seu bairro", nunca tela vazia.

## Roteiro recomendado (10 min)

1. **Home splash `/`** — leitura do value-prop, "usar minha localização" ou digitar Salvador.
2. **Onboarding** — escolher Pituba (ou bairro coberto).
3. **Territory Home** — narrar: Hoje na Pituba → Vale conferir → Passear pelo bairro.
4. **Feed** — mostrar leitura de conversas + composer "Publicar no bairro".
5. **Empresas** — mostrar destaque de negócio local + rota.
6. **Cadastro `/cadastro`** — apresentar bloco "Chegou pela apresentação?" com CTAs para acompanhar lançamento, cadastrar empresa, ser parceiro, apoiar.
7. **Fechamento** — retornar à Territory Home e destacar Bottom Nav como convite à exploração.

## Jornadas prontas para demo

| Jornada | Rota | Status |
|--------|------|--------|
| Splash / value-prop | `/` | ✅ Pronto |
| Escolha de território | `/onboarding` | ✅ Pronto |
| Territory Home (bairro ativo) | `/comunidade/:uf/:city/:district` | ✅ Pronto com dados de demonstração |
| Feed do bairro | `/comunidade/:uf/:city/:district/feed` | ✅ Pronto |
| Empresas | `/empresas/:uf/:city` | ✅ Pronto |
| Cadastro | `/cadastro` | ✅ Pronto + CTAs de continuidade |
| Login | `/login` | ✅ Pronto |
| Cadastro de interesse | `/interesse` | ✅ Pronto (waitlist bairros `coming_soon`) |
| Módulos em expansão | Diversas | ✅ Redirecionam para `LaunchPausedPage` |

## Áreas usando dados de demonstração

Nenhum destes fluxos requer autenticação para renderizar. Todos os dados são coerentes com um bairro real (Pituba/Salvador).

- **Territory Home — Hoje na Pituba**: alerta de interdição, feira orgânica, discussão sobre eletricista.
- **Territory Home — Vale conferir**: post de moradora, negócio local ("Mercado Bom Dia"), evento comunitário.
- **Territory Home — Ações rápidas**: 4 chips coerentes (Procurar, Perto de mim, Comer agora, Como chegar).
- **Empresas e Gastronomia**: usam serviços de listagem reais; quando vazios, mostram estado de continuidade "Estamos expandindo".

## Áreas em expansão (comunicadas como tal)

Nenhuma exibe estado vazio. Todas caem em `LaunchPausedPage` com copy "Estamos expandindo · chega em breve no seu bairro":

- Vagas, Classificados avançados, Mobilidade (motoboy), Gamificação, Virtual Try-On, Mapa detalhado (algumas cidades), Bairros marcados como `coming_soon`.

## CTAs para investidores e parceiros

Adicionados no `/cadastro`, bloco **"Chegou pela apresentação?"**:

- **Quero acompanhar o lançamento** → `/interesse`
- **Quero cadastrar minha empresa** → fluxo de nova empresa
- **Quero ser parceiro** → e-mail `parcerias@achegue-se.com.br`
- **Quero apoiar o projeto** → e-mail `contato@achegue-se.com.br`

Nenhum destes CTAs cria modelo de domínio novo — todos apontam para rotas existentes ou canais de contato.

## Bottom Navigation — auditada

- **Início** → Territory Home (sempre renderiza demo).
- **Explorar** → Cidade ativa (sempre renderiza).
- **Postar** → `/novo-post` com autoguard e rascunho.
- **Busca** → `/busca` da cidade ativa.
- **Mais** → sheet com módulos filtrados por `isLaunchSurfaceEnabled`, nenhum item leva a tela vazia.

## Perguntas prováveis do público

**"Isto é uma rede social ou um app de bairro?"**
Ambos. É a rede social do bairro: reúne vizinhos, negócios locais e o que acontece por perto.

**"Já está funcionando em quantos bairros?"**
Lançamento inicial em Salvador. 170 bairros mapeados; os que ainda não abriram entram na waitlist `/interesse` e são avisados quando ativarmos.

**"Como empresas participam?"**
Cadastro dedicado (visível no `/cadastro`). Aparecem para vizinhos que já procuram por serviços no próprio bairro.

**"Qual o modelo de negócio?"**
Camada gratuita para vizinhos e empresas locais + serviços premium para negócios (destaque, insights, campanhas).

**"E moderação / conteúdo?"**
Publicações territoriais (bairro/cidade), com regras da comunidade e moderação por administradores locais + reportes.

**"E LGPD / segurança?"**
Cadastro com Turnstile, senhas verificadas contra HIBP em memória, RLS por `user_id` no banco, rascunhos criptografados no cliente (AES-GCM).

**"Dá para levar para outras cidades?"**
Sim — o domínio é `Territory` genérico (cidade/bairro). Salvador é a validação. Sitemap já indexa 987 localidades.

## Checklist pré-apresentação

- [ ] `npm run build` limpo.
- [ ] Rota `/` renderiza splash com tagline nova.
- [ ] Fluxo `/onboarding → Pituba → Territory Home` sem erro de console.
- [ ] `/cadastro` mostra bloco "Chegou pela apresentação?".
- [ ] Nenhum item da Bottom Nav leva a 404 ou tela vazia.
- [ ] Wi-Fi/hotspot do evento testado (Nominatim precisa de rede).
- [ ] Modo escuro/claro alinhado ao tema do dispositivo.

## Fora do escopo desta sprint

- Novas features de produto.
- Alterações em domínio, backend, banco, RLS.
- Novos tokens de design.
- Refactors de rota canônica.
