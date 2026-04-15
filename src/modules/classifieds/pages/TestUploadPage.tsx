/**
 * 🧪 PÁGINA DE TESTE: Upload de Fotos
 * 
 * Página temporária para testar o sistema de upload.
 * Acessível em: /test/upload-fotos
 * 
 * REMOVER APÓS VALIDAÇÃO EM PRODUÇÃO
 */

import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { PhotoUploadTest } from "@/modules/classifieds/components/create/PhotoUploadTest";

export default function TestUploadPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-border bg-card/95 backdrop-blur-sm">
        <div className="flex items-center gap-3 px-4 py-3 max-w-4xl mx-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-foreground">
              Teste de Upload de Fotos
            </h1>
            <p className="text-xs text-muted-foreground">
              Ambiente de teste - Não usar em produção
            </p>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="py-8">
        <PhotoUploadTest />
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6 mt-12">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <p className="text-xs text-muted-foreground">
            ⚠️ Esta é uma página de teste. Remova após validação em produção.
          </p>
        </div>
      </footer>
    </div>
  );
}
