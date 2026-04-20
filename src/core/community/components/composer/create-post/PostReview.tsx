import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/shared/components/ui/dialog";
import {
  Send,
  MapPin,
  Tag,
  Users,
  Building,
  Globe,
  AlertTriangle,
  Loader2,
  Eye,
} from "lucide-react";
import type { UnifiedPostType } from "@/core/community/hooks/usePostCreation";

const postTypeLabels = {
  discussao: "DiscussÃ£o",
  pergunta: "Pergunta",
  enquete: "Enquete",
  evento: "Evento",
  alerta: "Alerta",
  achado_perdido: "Achado/Perdido",
  classificado: "Classificado",
  recomendacao: "RecomendaÃ§Ã£o",
};

interface PostReviewProps {
  tipo: UnifiedPostType;
  texto: string;
  perguntaEnquete: string;
  opcoesEnquete: string[];
  duracaoEnquete: string;
  imagens: File[];
  imagensPreview: string[];
  tagsInput: string;
  alcance: "rua" | "neighborhood" | "city";
  location: { lat: number; lng: number } | null;
  publicando: boolean;
  showWarning: boolean;
  onShowWarningChange: (show: boolean) => void;
  onPublicar: () => void;
  onPublicarDireto: () => void;
}

export function PostReview({
  tipo,
  texto,
  perguntaEnquete,
  opcoesEnquete,
  duracaoEnquete,
  imagens,
  imagensPreview,
  tagsInput,
  alcance,
  location,
  publicando,
  showWarning,
  onShowWarningChange,
  onPublicar,
  onPublicarDireto,
}: PostReviewProps) {
  const alcanceLabels = {
    rua: { label: "Rua", icon: Users, color: "text-blue-600" },
    neighborhood: { label: "Bairro", icon: Building, color: "text-green-600" },
    city: { label: "Cidade", icon: Globe, color: "text-purple-600" },
  };

  const AlcanceIcon = alcanceLabels[alcance].icon;
  const tags = tagsInput
    ? tagsInput
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean)
    : [];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">Revisar e Publicar</h2>
        <p className="text-muted-foreground">
          Confira como seu post ficarÃ¡ antes de publicar
        </p>
      </div>

      {/* Post Preview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Preview do Post</CardTitle>
            <Badge variant="outline">{postTypeLabels[tipo]}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Poll Content */}
          {tipo === "enquete" && (
            <div className="space-y-3">
              <div className="p-3 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">ðŸ“Š {perguntaEnquete}</h4>
                <div className="space-y-2">
                  {opcoesEnquete
                    .filter((opt) => opt.trim())
                    .map((opcao, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 p-2 bg-background rounded border"
                      >
                        <div className="w-4 h-4 border-2 border-muted-foreground rounded-full" />
                        <span className="text-sm">{opcao}</span>
                      </div>
                    ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Enquete ativa por {duracaoEnquete}{" "}
                  {duracaoEnquete === "1" ? "dia" : "dias"}
                </p>
              </div>
            </div>
          )}

          {/* Text Content */}
          {texto && <div className="whitespace-pre-wrap text-sm">{texto}</div>}

          {/* Images */}
          {imagensPreview.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {imagensPreview.map((preview, index) => (
                <img
                  key={index}
                  src={preview}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-20 object-cover rounded"
                />
              ))}
            </div>
          )}

          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {tags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  #{tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Metadata */}
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <AlcanceIcon
                  className={`h-3 w-3 ${alcanceLabels[alcance].color}`}
                />
                <span>{alcanceLabels[alcance].label}</span>
              </div>

              {location && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  <span>Com localizaÃ§Ã£o</span>
                </div>
              )}

              {tags.length > 0 && (
                <div className="flex items-center gap-1">
                  <Tag className="h-3 w-3" />
                  <span>
                    {tags.length} {tags.length === 1 ? "tag" : "tags"}
                  </span>
                </div>
              )}
            </div>

            <span>Agora</span>
          </div>
        </CardContent>
      </Card>

      {/* Publish Button */}
      <div className="space-y-3">
        <Button
          onClick={onPublicar}
          disabled={publicando}
          className="w-full h-12"
          size="lg"
        >
          {publicando ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Publicando...
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Publicar Post
            </>
          )}
        </Button>

        <div className="text-center">
          <Button variant="ghost" size="sm" className="text-muted-foreground">
            <Eye className="h-4 w-4 mr-2" />
            Salvar como Rascunho
          </Button>
        </div>
      </div>

      {/* Warning Dialog */}
      <Dialog open={showWarning} onOpenChange={onShowWarningChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Confirmar PublicaÃ§Ã£o
            </DialogTitle>
            <DialogDescription>
              Como vocÃª Ã© novo na plataforma, seu post passarÃ¡ por uma revisÃ£o
              rÃ¡pida antes de ser publicado.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-4 bg-orange-50 rounded-lg">
              <h4 className="font-medium text-orange-800 mb-2">
                O que acontece agora?
              </h4>
              <ul className="text-sm text-orange-700 space-y-1">
                <li>â€¢ Seu post serÃ¡ analisado em atÃ© 30 minutos</li>
                <li>â€¢ VocÃª receberÃ¡ uma notificaÃ§Ã£o quando for aprovado</li>
                <li>â€¢ Posts que seguem as regras sÃ£o aprovados rapidamente</li>
              </ul>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => onShowWarningChange(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={onPublicarDireto}
                disabled={publicando}
                className="flex-1"
              >
                {publicando ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Publicar Mesmo Assim
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

