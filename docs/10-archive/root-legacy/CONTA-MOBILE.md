# Conta Mobile - Prototipo de alta fidelidade

Status: especificacao visual textual. Sem implementacao.

## Objetivo da tela

Reunir identidade, preferencias e acessos de gestao sem contaminar a experiencia principal do morador.

## Estrutura completa da tela

1. Perfil compacto.
2. Progresso de completude.
3. Acoes pessoais.
4. Atalhos de atividade/configuracao.
5. Gestao contextual.
6. Suporte e planos.
7. Sair da conta.
8. Bottom navigation.

## Componentes

### Perfil compacto

Conteudo:

- Foto.
- Nome.
- @usuario.
- Bairro principal.
- CTA "Editar perfil".

### Completude

Conteudo:

- "Perfil 70% completo"
- Proximo passo: "Adicionar foto" ou "Confirmar bairro"

Nao deve parecer gamificacao pesada.

### Acoes pessoais

Itens:

- Editar perfil.
- Trocar foto.
- Preferencias.
- Privacidade.
- Notificacoes.
- Enderecos.

### Gestao contextual

So aparece se aplicavel:

- Minha empresa.
- Perfil profissional.
- Central.
- Eventos que organizo.

### Suporte

Itens:

- Ajuda.
- Planos.
- Termos e privacidade.

### Sair

Label claro:

- "Sair da conta"

## Hierarquia

1. Identidade.
2. Completar perfil.
3. Configuracoes pessoais.
4. Gestao contextual.
5. Suporte.
6. Sair.

## Espacamento

- Perfil com bastante respiro.
- Listas em grupos claros.
- Itens de lista com altura confortavel.
- Gestao separada visualmente de conta pessoal.
- Sair isolado no fim.

## Prioridades

Prioridade maxima:

- Usuario reconhecer sua identidade.
- Editar dados essenciais.

Prioridade media:

- Preferencias e privacidade.
- Central se aplicavel.

Prioridade baixa:

- Planos.
- Ajuda.
- Sair.

## Microinteracoes

- Tocar na foto abre opcoes: ver, trocar, remover.
- Completude leva ao proximo passo especifico.
- Itens de configuracao abrem telas secundarias.
- Central aparece com selo se houver pendencia.
- Sair pede confirmacao leve se houver acao em andamento.

## Estados vazios

Quando usuario nao tem empresa:

> "Voce ainda nao gerencia uma empresa."

CTA:

- "Cadastrar empresa"

Quando perfil esta incompleto:

> "Complete seu perfil para publicar no bairro."

CTA:

- "Completar agora"

## Loading

Skeleton:

- Avatar.
- Nome.
- Lista de opcoes.

Mensagem longa:

> "Carregando sua conta..."

## Erros

Mensagem:

> "Nao conseguimos carregar sua conta agora."

CTA principal:

- "Tentar novamente"

CTA secundario:

- "Voltar para Hoje"

## CTA principal

- "Editar perfil" ou "Completar perfil", conforme estado.

## CTA secundario

- "Central", se aplicavel.

## Wireframe ASCII detalhado

```text
┌────────────────────────────────────────┐
│  Conta                                 │
│                                        │
│  ┌──────────────────────────────────┐  │
│  │ [foto]  Ana Souza                │  │
│  │         @anasouza                │  │
│  │         Pituba · Salvador        │  │
│  │         [Editar perfil]          │  │
│  └──────────────────────────────────┘  │
│                                        │
│  ┌──────────────────────────────────┐  │
│  │ Perfil 70% completo              │  │
│  │ Adicione uma foto para publicar  │  │
│  │ [Completar agora]                │  │
│  └──────────────────────────────────┘  │
│                                        │
│  PESSOAL                               │
│  ┌──────────────────────────────────┐  │
│  │ Editar perfil                 >  │  │
│  │ Trocar foto                   >  │  │
│  │ Preferencias                  >  │  │
│  │ Privacidade                   >  │  │
│  │ Notificacoes                  >  │  │
│  └──────────────────────────────────┘  │
│                                        │
│  GESTAO                                │
│  ┌──────────────────────────────────┐  │
│  │ Minha empresa                 >  │  │
│  │ Perfil profissional           >  │  │
│  │ Central                       >  │  │
│  └──────────────────────────────────┘  │
│                                        │
│  SUPORTE                               │
│  ┌──────────────────────────────────┐  │
│  │ Ajuda                         >  │  │
│  │ Planos                        >  │  │
│  │ Termos e privacidade          >  │  │
│  └──────────────────────────────────┘  │
│                                        │
│  [Sair da conta]                       │
├────────────────────────────────────────┤
│ Hoje   Explorar   Comunidade   Ativ.   │
│                 Conta                  │
└────────────────────────────────────────┘
```

