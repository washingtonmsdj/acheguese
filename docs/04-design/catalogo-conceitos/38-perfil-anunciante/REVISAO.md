# Revisão de implementação

| Item | Estado no concept mock |
| --- | --- |
| Remover indicadores sem fonte real e vendas inferidas de avaliações | Implementado; nenhum indicador de vendas ou resposta rápida é inventado |
| Propagar erros do hook sem converter falhas em perfil ausente | Estado de falha separado no mock, sem afirmar ausência do perfil |
| Não inventar data de ingresso | Implementado; data omitida quando desconhecida |
| Selecionar contexto do anúncio antes da mensagem | Implementado com seleção explícita e texto editável |
| Validar privacidade e status dos anúncios no servidor | Regra preservada; mock não simula autorização produtiva |
| Diferenciar telefone de WhatsApp | Implementado; canal exibido apenas como WhatsApp disponibilizado |
| Denúncia específica de perfil e avaliações reais | Denúncia representada; avaliações ficam como recurso previsto |
| Verificar filtros, paginação, teclado e responsividade | Validado visualmente nos viewports mobile e desktop, sem overflow |

Consultar README e contratos antes de implementar.

## Implementação do concept mock

Implementado em `src/app/pages/PerfilAnuncianteConceptMockPage.tsx`, isolado pela rota `/perfil-anunciante?concept-mock=1`. O mock cobre o perfil público com anúncios, a aba Sobre, a seleção explícita do anúncio antes da conversa, o texto editável e os estados de vazio, sem resultados, falha de carregamento e perfil indisponível.

Decisões aplicadas:

- “Avaliações” permanece como recurso previsto e não apresenta nota zero como reputação;
- não há data de ingresso, venda inferida, resposta rápida ou selo sem fonte;
- região pública mostra somente bairro/território, sem endereço residencial;
- a conversa mantém anúncio selecionado e não simula envio automático;
- o contato exibido é WhatsApp disponibilizado pelo anunciante, sem fallback silencioso para telefone;
- o rail desktop, filtros, cards, tabs e alvos mobile usam os tokens existentes e links/controles acessíveis.

## Verificação visual

- Mobile: viewport `425×1108`; perfil, Sobre, conversa, vazio e estados de falha foram navegados; `document.documentElement.scrollWidth` e `document.body.scrollWidth` permaneceram em `425`.
- Desktop: viewport `1707×960`; rail de classificados, perfil, filtros, cards, painel lateral e três estados inferiores foram conferidos; largura do documento permaneceu em `1707`.
- As pranchas têm fotos específicas de bicicleta e cadeira que não existem como assets individuais no repositório. O mock usa assets territoriais já presentes para manter proporção, recorte e hierarquia sem criar dados visuais falsos.
