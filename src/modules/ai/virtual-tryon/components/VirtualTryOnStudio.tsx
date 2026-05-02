import { TryOnUploadPanel } from './TryOnUploadPanel';
import { TryOnResultsPanel } from './TryOnResultsPanel';
import { useVirtualTryOn } from '../hooks/useVirtualTryOn';

export function VirtualTryOnStudio() {
  const { generation, loading, error, startGeneration, selectImage, regenerate } = useVirtualTryOn();

  return (
    <div className="container max-w-5xl mx-auto py-8 space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">Virtual Try-On com IA</h1>
        <p className="text-muted-foreground">
          Envie a foto do seu produto e gere imagens realistas de modelos usando a peça.
        </p>
      </header>

      <TryOnUploadPanel
        disabled={loading}
        onSubmit={(file, opts) => startGeneration(file, opts)}
      />

      <TryOnResultsPanel
        generation={generation}
        loading={loading}
        error={error}
        onSelect={selectImage}
        onRegenerate={regenerate}
      />
    </div>
  );
}
