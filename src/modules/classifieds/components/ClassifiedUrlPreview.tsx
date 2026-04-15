/**
 * ClassifiedUrlPreview — Preview da URL pública do classificado
 *
 * Mostra como ficará a URL canônica e a URL curta.
 * Exibe avisos sobre mudanças que podem alterar a URL.
 *
 * @version 1.0.0
 */

import React from 'react';
import { Link2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { slugify } from '@/modules/classifieds/services/ClassifiedUrlService';

interface ClassifiedUrlPreviewProps {
  title: string;
  locationName?: string;
  categoryName?: string;
  subcategoryName?: string;
  publicId?: string;
  showWarning?: boolean;
}

export function ClassifiedUrlPreview({
  title,
  locationName,
  categoryName,
  subcategoryName,
  publicId,
  showWarning = false,
}: ClassifiedUrlPreviewProps) {
  if (!title || !locationName || !categoryName || !subcategoryName) {
    return null;
  }

  const slug = slugify(title);
  const displayPublicId = publicId || 'xxxxxxxx';
  
  // Simula URL canônica (sem UF/cidade por enquanto, só bairro)
  const canonicalUrl = `/classificados/.../.../${locationName}/${categoryName}/${subcategoryName}/${slug}/${displayPublicId}`;
  const shortUrl = `/c/${displayPublicId}`;

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <label className="text-sm font-semibold flex items-center gap-1.5">
          <Link2 className="h-3.5 w-3.5" />
          Preview da URL pública
        </label>
        
        <div className="p-3 rounded-xl bg-muted/50 border space-y-2">
          <div>
            <p className="text-xs text-muted-foreground mb-1">URL completa:</p>
            <code className="text-xs break-all">{canonicalUrl}</code>
          </div>
          
          <div>
            <p className="text-xs text-muted-foreground mb-1">Link curto de compartilhamento:</p>
            <code className="text-xs">{shortUrl}</code>
          </div>
        </div>
      </div>

      {showWarning && (
        <Alert variant="default" className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-xs text-amber-800 dark:text-amber-200">
            Mudar o título, localização ou categoria pode alterar a URL pública. 
            O link curto sempre funcionará.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
