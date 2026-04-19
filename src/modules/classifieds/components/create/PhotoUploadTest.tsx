/**
 * 🧪 COMPONENTE DE TESTE: Upload de Fotos
 * 
 * Componente temporário para testar o sistema de upload de imagens.
 * Pode ser removido após validação em produção.
 */

import React, { useState } from "react";
import { Button } from "@/shared/components/ui/button";
import { useClassifiedImageUpload } from "@/modules/classifieds/hooks/useClassifiedImageUpload";
import { Camera, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/shared/utils/cn";

export function PhotoUploadTest() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const {
    uploadMultipleImages,
    uploading,
    progress,
    uploadedImages,
    error,
    reset,
  } = useClassifiedImageUpload();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;
    await uploadMultipleImages(selectedFiles);
  };

  const handleReset = () => {
    setSelectedFiles([]);
    reset();
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          🧪 Teste de Upload de Fotos
        </h2>
        <p className="text-sm text-muted-foreground">
          Componente de teste para validar compressão e upload
        </p>
      </div>

      {/* File Input */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-foreground">
          Selecionar Fotos
        </label>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="block w-full text-sm text-foreground file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
          disabled={uploading}
        />
        {selectedFiles.length > 0 && (
          <p className="text-xs text-muted-foreground">
            {selectedFiles.length} arquivo(s) selecionado(s)
          </p>
        )}
      </div>

      {/* Selected Files Preview */}
      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-foreground">
            Arquivos Selecionados:
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {selectedFiles.map((file, i) => (
              <div
                key={i}
                className="p-2 rounded-lg border border-border bg-card text-xs"
              >
                <p className="font-medium truncate">{file.name}</p>
                <p className="text-muted-foreground">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Progress */}
      {uploading && Object.keys(progress).length > 0 && (
        <div className="space-y-3 p-4 rounded-xl bg-primary/5 border border-primary/20">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Enviando...
          </h3>
          {Object.entries(progress).map(([fileName, prog]) => (
            <div key={fileName} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-foreground truncate flex-1">
                  {fileName}
                </span>
                <span
                  className={cn(
                    "font-medium ml-2",
                    prog.status === "complete"
                      ? "text-green-600"
                      : prog.status === "error"
                      ? "text-destructive"
                      : "text-primary"
                  )}
                >
                  {prog.status === "compressing" && "Comprimindo..."}
                  {prog.status === "uploading" && `${prog.progress}%`}
                  {prog.status === "complete" && "✓ Completo"}
                  {prog.status === "error" && "✗ Erro"}
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className={cn(
                    "h-full transition-all duration-300",
                    prog.status === "complete"
                      ? "bg-green-600"
                      : prog.status === "error"
                      ? "bg-destructive"
                      : "bg-primary"
                  )}
                  style={{ width: `${prog.progress}%` }}
                />
              </div>
              {prog.error && (
                <p className="text-xs text-destructive">{prog.error}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/20">
          <XCircle className="h-4 w-4 text-destructive shrink-0" />
          <p className="text-xs text-destructive">{error}</p>
        </div>
      )}

      {/* Uploaded Images */}
      {uploadedImages.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <h3 className="text-sm font-semibold text-foreground">
              Imagens Enviadas ({uploadedImages.length})
            </h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {uploadedImages.map((img, i) => (
              <div
                key={i}
                className="space-y-2 p-3 rounded-xl border border-border bg-card"
              >
                <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                  <img
                    src={img.thumbnailUrl}
                    alt={img.fileName}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="space-y-1 text-xs">
                  <p className="font-medium truncate">{img.fileName}</p>
                  <p className="text-muted-foreground">
                    Tamanho: {(img.size / 1024).toFixed(0)} KB
                  </p>
                  {img.width && img.height && (
                    <p className="text-muted-foreground">
                      Dimensões: {img.width}x{img.height}
                    </p>
                  )}
                  <div className="pt-1 space-y-1">
                    <a
                      href={img.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline block truncate"
                    >
                      Ver imagem completa →
                    </a>
                    <a
                      href={img.thumbnailUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline block truncate"
                    >
                      Ver thumbnail →
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          onClick={handleUpload}
          disabled={selectedFiles.length === 0 || uploading}
          className="flex-1"
        >
          {uploading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              <Camera className="h-4 w-4 mr-2" />
              Upload ({selectedFiles.length})
            </>
          )}
        </Button>
        <Button
          onClick={handleReset}
          variant="outline"
          disabled={uploading}
        >
          Limpar
        </Button>
      </div>

      {/* Info */}
      <div className="p-4 rounded-xl bg-accent/30 border border-accent/50 text-xs space-y-2">
        <p className="font-semibold text-foreground">ℹ️ Informações:</p>
        <ul className="space-y-1 text-muted-foreground list-disc list-inside">
          <li>Imagens são comprimidas automaticamente para WebP</li>
          <li>Tamanho máximo: 10MB (antes da compressão)</li>
          <li>Dimensão máxima: 1920px (lado maior)</li>
          <li>Thumbnails: 400px (lado maior)</li>
          <li>Formatos aceitos: JPEG, PNG, WebP, GIF</li>
        </ul>
      </div>
    </div>
  );
}
