/**
 * 📸 EVENT IMAGE UPLOADER
 * 
 * Componente para upload de imagens de eventos
 * Suporta drag & drop, preview e validação
 * 
 * @version 1.0.0
 */

import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  X,
  Image as ImageIcon,
  Loader2,
  AlertCircle,
  Check,
} from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/utils/cn';

interface EventImageUploaderProps {
  value?: string;
  onChange: (url: string) => void;
  aspectRatio?: 'video' | 'square' | 'portrait';
  maxSizeMB?: number;
  className?: string;
}

export function EventImageUploader({
  value,
  onChange,
  aspectRatio = 'video',
  maxSizeMB = 5,
  className,
}: EventImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const aspectRatioClasses = {
    video: 'aspect-video',
    square: 'aspect-square',
    portrait: 'aspect-[3/4]',
  };

  // Handle file upload
  const handleFileUpload = useCallback(async (file: File) => {
    setError(null);
    
    // Validate
    let validationError: string | null = null;
    if (!file.type.startsWith('image/')) {
      validationError = 'Por favor, selecione uma imagem válida';
    } else {
      const sizeMB = file.size / (1024 * 1024);
      if (sizeMB > maxSizeMB) {
        validationError = `A imagem deve ter no máximo ${maxSizeMB}MB`;
      }
    }
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsUploading(true);

    try {
      // TODO: Implementar upload real para storage (Supabase, S3, etc)
      // Por enquanto, criar URL local para preview
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        onChange(dataUrl);
        setIsUploading(false);
      };

      reader.onerror = () => {
        setError('Erro ao carregar imagem');
        setIsUploading(false);
      };

      reader.readAsDataURL(file);
    } catch (err) {
      setError('Erro ao fazer upload da imagem');
      setIsUploading(false);
    }
  }, [maxSizeMB, onChange]);

  // Handle drag events
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  }, [handleFileUpload]);

  // Handle file input change
  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  }, [handleFileUpload]);

  // Handle click to upload
  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // Handle remove
  const handleRemove = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [onChange]);

  return (
    <div className={cn('relative', className)}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Upload area */}
      <div
        onClick={handleClick}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={cn(
          'relative overflow-hidden rounded-lg border-2 border-dashed transition-all cursor-pointer',
          aspectRatioClasses[aspectRatio],
          isDragging
            ? 'border-primary bg-primary/5'
            : 'border-border bg-muted/30 hover:border-primary/50 hover:bg-muted/50'
        )}
      >
        <AnimatePresence mode="wait">
          {value ? (
            // Preview
            <motion.div
              key="preview"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="relative h-full w-full"
            >
              <img
                src={value}
                alt="Preview"
                className="h-full w-full object-cover"
              />
              
              {/* Overlay on hover */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity hover:opacity-100">
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={handleClick}
                    className="gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    Alterar
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={handleRemove}
                    className="gap-2"
                  >
                    <X className="h-4 w-4" />
                    Remover
                  </Button>
                </div>
              </div>

              {/* Success indicator */}
              {!isUploading && (
                <div className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-green-500 text-white shadow-lg">
                  <Check className="h-4 w-4" />
                </div>
              )}
            </motion.div>
          ) : (
            // Upload prompt
            <motion.div
              key="upload"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex h-full w-full flex-col items-center justify-center p-6 text-center"
            >
              {isUploading ? (
                <>
                  <Loader2 className="mb-3 h-10 w-10 animate-spin text-primary" />
                  <p className="text-sm font-medium text-foreground">
                    Fazendo upload...
                  </p>
                </>
              ) : (
                <>
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <ImageIcon className="h-6 w-6 text-primary" />
                  </div>
                  <p className="mb-1 text-sm font-medium text-foreground">
                    Clique ou arraste uma imagem
                  </p>
                  <p className="text-xs text-muted-foreground">
                    PNG, JPG ou WEBP até {maxSizeMB}MB
                  </p>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Error message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-2 flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-2 text-xs text-destructive"
          >
            <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
