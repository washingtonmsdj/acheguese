import { Check, Download, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Card } from '@/shared/components/ui/card';
import type { TryOnGeneration } from '../domain/types';

interface Props {
  generation: TryOnGeneration | null;
  loading: boolean;
  error: string | null;
  onSelect: (url: string) => void;
  onRegenerate: () => void;
}

function extensionFromUrl(url: string): string {
  const ext = url.split('?')[0].split('.').pop()?.toLowerCase();
  return ext && ['jpg', 'jpeg', 'png', 'webp'].includes(ext) ? ext : 'jpg';
}

function downloadImage(url: string, filename: string) {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  document.body.appendChild(link);
  link.click();
  link.remove();
}

function downloadAll(urls: string[], generationId: string) {
  urls.forEach((url, index) => {
    window.setTimeout(() => {
      downloadImage(url, `tryon-${generationId}-${index + 1}.${extensionFromUrl(url)}`);
    }, index * 250);
  });
}

export function TryOnResultsPanel({ generation, loading, error, onSelect, onRegenerate }: Props) {
  if (error) {
    return <Card className="p-6 text-destructive">{error}</Card>;
  }
  if (!generation) return null;

  if (generation.status === 'pending' || generation.status === 'processing' || loading) {
    return (
      <Card className="p-8 flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="font-medium">Processando com IA...</p>
        <p className="text-sm text-muted-foreground">Isso pode levar de 20s a 1 minuto.</p>
      </Card>
    );
  }

  if (generation.status === 'failed') {
    return (
      <Card className="p-6 space-y-3">
        <p className="text-destructive">Falha: {generation.error_message ?? 'erro desconhecido'}</p>
        <Button variant="outline" onClick={onRegenerate}>
          <RefreshCw className="h-4 w-4 mr-2" />Tentar novamente
        </Button>
      </Card>
    );
  }

  return (
    <Card className="p-6 space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="font-semibold">Variações geradas</h3>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => downloadAll(generation.generated_urls, generation.id)}
          >
            <Download className="h-4 w-4 mr-2" />Baixar todas
          </Button>
          <Button size="sm" variant="outline" onClick={onRegenerate}>
            <RefreshCw className="h-4 w-4 mr-2" />Gerar novamente
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {generation.generated_urls.map((url, index) => {
          const selected = generation.selected_url === url;
          return (
            <div
              key={url}
              className={`relative rounded-lg overflow-hidden border ${selected ? 'border-primary ring-2 ring-primary' : 'border-border'}`}
            >
              <img src={url} alt="variação" className="w-full aspect-[3/4] object-cover" loading="lazy" />
              <div className="absolute right-2 top-2">
                <Button
                  type="button"
                  size="icon"
                  variant="secondary"
                  className="h-8 w-8 bg-background/85 backdrop-blur"
                  onClick={() => downloadImage(url, `tryon-${generation.id}-${index + 1}.${extensionFromUrl(url)}`)}
                  aria-label="Baixar imagem"
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
              <div className="absolute inset-x-0 bottom-0 p-2 bg-background/80 backdrop-blur">
                <Button
                  size="sm"
                  className="w-full"
                  variant={selected ? 'default' : 'secondary'}
                  onClick={() => onSelect(url)}
                >
                  {selected ? (<><Check className="h-4 w-4 mr-1" />Selecionada</>) : 'Usar essa imagem'}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
