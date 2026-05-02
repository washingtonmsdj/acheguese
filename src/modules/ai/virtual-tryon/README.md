# Módulo `ai/virtual-tryon` (SSOT)

Sistema de **Virtual Try-On com IA generativa**: lojista envia a foto do
produto, a IA gera variações realistas de um modelo sintético usando a peça.

## Estrutura

```
src/modules/ai/virtual-tryon/
├── index.ts                 # API pública (SSOT)
├── domain/
│   ├── types.ts             # Contratos canônicos
│   ├── mapping.ts           # Categoria → alvo no corpo
│   ├── promptBuilder.ts     # Engenharia de prompt
│   └── safety.ts            # Guardrails de conteúdo
├── services/
│   └── tryon.service.ts     # Orquestra DB + storage + edge function
├── hooks/
│   └── useVirtualTryOn.ts   # Estado + Realtime
├── api/
│   ├── providerRegistry.ts  # Registry de providers (DI)
│   ├── providers/LovableAIProvider.ts
│   └── ProviderStubs.ts     # Replicate / fal stubs
└── components/
    ├── TryOnUploadPanel.tsx
    ├── TryOnResultsPanel.tsx
    └── VirtualTryOnStudio.tsx
```

## Pipeline

```
Upload → uploadProductImage (Storage)
       → createPending (DB, status=pending)
       → enqueueGeneration (Edge Function `tryon-generate`)
            ├── status=processing
            ├── pré-processamento (categoria → bodyTarget)
            ├── prompt + negative prompt + safety
            ├── chama provider (default: Lovable AI Gemini Image)
            ├── upload das imagens geradas no bucket `tryon`
            └── status=completed | failed (Realtime → UI)
       → seleção / publicação
```

## Trocando o provider de IA

Implemente `TryOnProvider` e registre em `api/providerRegistry.ts`. A
edge function lê o provider salvo no registro da geração — basta atualizar
o campo `provider` ao criar a entrada.

Stubs prontos:
- **Replicate** (IDM-VTON, CatVTON) — requer `REPLICATE_API_TOKEN`.
- **fal.ai** (FASHN, Kling try-on) — requer `FAL_KEY`.

## Uso

```tsx
import { VirtualTryOnStudio } from '@/modules/ai/virtual-tryon';

export default function Page() {
  return <VirtualTryOnStudio />;
}
```

## Segurança

- RLS por `user_id` em `tryon_generations`.
- Bucket `tryon` público para leitura (necessário para exibir imagens),
  escrita restrita ao owner via `storage.foldername(name)[1] = auth.uid()`.
- `safety.buildNegativePrompt()` força conteúdo apropriado; categoria
  `swimwear` é tratada como contexto editorial de moda.
- A edge function rejeita requisições de geração de outro usuário.
