import React from "react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/shared/components/ui/dialog";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import { Clock, FileText } from "lucide-react";
import { INLINE_STYLES } from "./styles/communityDesignSystem";
interface EditHistory {
  id: string;
  previous_content: string;
  previous_images?: string[];
  edited_at: string;
  editor_name: string;
}

interface EditHistoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentContent: string;
  editHistory: EditHistory[];
}

export function EditHistoryModal({
  open,
  onOpenChange,
  currentContent,
  editHistory,
}: EditHistoryModalProps) {
  const getRelativeTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "agora";
    if (diffMins < 60) return `há ${diffMins}min`;
    if (diffHours < 24) return `há ${diffHours}h`;
    if (diffDays < 7) return `há ${diffDays}d`;
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="rounded-[20px] shadow-2xl max-w-2xl max-h-[85vh] flex flex-col border-0 p-0 gap-0 overflow-hidden"
        style={{ backgroundColor: "#1E2529" }}
        aria-describedby="dialog-description"
      >
        {/* Header */}
        <DialogHeader
          className="border-b pb-3 pt-4 px-5 flex-shrink-0"
          style={{ borderColor: "rgba(255, 255, 255, 0.1)" }}
        >
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-teal-400" />
            <DialogTitle
              className="text-base font-bold"
              style={INLINE_STYLES.textPrimary}
            >
              Histórico de Edições
            </DialogTitle>
            <span id="dialog-description" className="sr-only">
              Conteúdo do diálogo
            </span>
          </div>
          <p className="text-xs mt-1" style={INLINE_STYLES.textSecondary}>
            Todas as alterações são registradas para transparência
          </p>
        </DialogHeader>
        <DialogDescription className="sr-only">
          Histórico de edições desta publicação
        </DialogDescription>

        {/* Timeline */}
        <ScrollArea className="flex-1 px-5 py-4">
          <div className="space-y-4">
            {/* Versão Atual */}
            <div className="relative pl-6 pb-4 border-l-2 border-teal-400">
              <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-teal-400 ring-4 ring-[#1E2529]" />

              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-teal-400/20 text-teal-400 border border-teal-400/30">
                  Versão Atual
                </span>
                <span
                  className="text-[10px]"
                  style={INLINE_STYLES.textSecondary}
                >
                  agora
                </span>
              </div>

              <div
                className="p-3 rounded-lg border"
                style={{
                  backgroundColor: "#12181B",
                  borderColor: "rgba(79, 209, 197, 0.2)",
                }}
              >
                <p
                  className="text-sm leading-relaxed"
                  style={INLINE_STYLES.textPrimary}
                >
                  {currentContent}
                </p>
              </div>
            </div>

            {/* Versões Anteriores */}
            {editHistory.map((edit, index) => (
              <div
                key={edit.id}
                className="relative pl-6 pb-4 border-l-2 border-gray-600"
              >
                <div className="absolute -left-[7px] top-0 w-3 h-3 rounded-full bg-gray-600 ring-4 ring-[#1E2529]" />

                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="text-xs font-bold"
                    style={INLINE_STYLES.textSecondary}
                  >
                    Versão {editHistory.length - index}
                  </span>
                  <span
                    className="text-[10px]"
                    style={INLINE_STYLES.textSecondary}
                  >
                    · {getRelativeTime(edit.edited_at)}
                  </span>
                </div>

                <div
                  className="p-3 rounded-lg border"
                  style={{
                    backgroundColor: "#12181B",
                    borderColor: "rgba(255, 255, 255, 0.1)",
                  }}
                >
                  <p
                    className="text-sm leading-relaxed opacity-70"
                    style={INLINE_STYLES.textPrimary}
                  >
                    {edit.previous_content}
                  </p>

                  {edit.previous_images && edit.previous_images.length > 0 && (
                    <div className="mt-2 flex gap-2">
                      {edit.previous_images.map((img, i) => (
                        <img
                          key={i}
                          src={img}
                          alt={`Imagem ${i + 1}`}
                          className="w-16 h-16 object-cover rounded"
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Versão Original */}
            <div className="relative pl-6">
              <div className="absolute -left-[7px] top-0 w-3 h-3 rounded-full bg-gray-800 ring-4 ring-[#1E2529]" />

              <div className="flex items-center gap-2">
                <FileText
                  className="w-3.5 h-3.5"
                  style={{ color: "#9CA3AF" }}
                />
                <span
                  className="text-xs font-bold"
                  style={INLINE_STYLES.textSecondary}
                >
                  Post Original
                </span>
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* Footer */}
        <div
          className="border-t p-4 flex-shrink-0"
          style={{
            borderColor: "rgba(255, 255, 255, 0.1)",
            backgroundColor: "#12181B",
          }}
        >
          <div
            className="flex items-start gap-2 p-2 rounded-lg"
            style={{ backgroundColor: "rgba(79, 209, 197, 0.1)" }}
          >
            <svg
              className="w-4 h-4 flex-shrink-0 mt-0.5 text-teal-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p
              className="text-[11px] leading-relaxed"
              style={{ color: "#4FD1C5" }}
            >
              <strong>Transparência:</strong> Todas as edições são registradas e
              visíveis publicamente para garantir a integridade das informações
              compartilhadas na comunidade.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
