import React from "react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import { MapPin, Send, Loader2 } from "lucide-react";

interface AnswerFormProps {
  answerText: string;
  submitting: boolean;
  showMention: boolean;
  mentionSearch: string;
  mentionResults: any[];
  selectedPro: string | null;
  selectedBiz: string | null;
  onAnswerTextChange: (text: string) => void;
  onToggleMention: () => void;
  onMentionSearchChange: (query: string) => void;
  onSelectMention: (result: any) => void;
  onClearMention: () => void;
  onSubmit: () => void;
}

export function AnswerForm({
  answerText,
  submitting,
  showMention,
  mentionSearch,
  mentionResults,
  selectedPro,
  selectedBiz,
  onAnswerTextChange,
  onToggleMention,
  onMentionSearchChange,
  onSelectMention,
  onClearMention,
  onSubmit,
}: AnswerFormProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t px-4 py-3 space-y-2 z-20">
      {/* Mention search */}
      {showMention && (
        <div className="space-y-2">
          <Input
            placeholder="Buscar profissional ou empresa..."
            value={mentionSearch}
            onChange={(e) => onMentionSearchChange(e.target.value)}
            className="h-8 text-xs"
          />
          {mentionResults.length > 0 && (
            <div className="max-h-32 overflow-y-auto space-y-1">
              {mentionResults.map((result) => (
                <button
                  key={`${result.type}-${result.id}`}
                  onClick={() => onSelectMention(result)}
                  className="flex items-center gap-2 w-full p-2 rounded-lg bg-secondary text-left text-xs hover:bg-secondary/80 transition-colors"
                >
                  <span
                    role="img"
                    aria-label={
                      result.type === "professional"
                        ? "Profissional"
                        : "Empresa"
                    }
                  >
                    {result.type === "professional" ? "🔧" : "🏪"}
                  </span>
                  <span className="font-medium">{result.name}</span>
                  <span className="text-muted-foreground">
                    {result.service || result.category}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Selected mention indicator */}
      {(selectedPro || selectedBiz) && (
        <div className="flex items-center gap-2 text-xs bg-primary/10 px-2 py-1 rounded">
          <span>{selectedPro ? "🔧" : "🏪"} Indicação anexada</span>
          <button
            onClick={onClearMention}
            className="text-destructive ml-auto hover:text-destructive/80 transition-colors"
            aria-label="Remover indicação"
          >
            ✕
          </button>
        </div>
      )}

      {/* Answer input */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="flex-shrink-0 h-10 w-10"
          onClick={onToggleMention}
          title="Indicar profissional ou empresa"
        >
          <MapPin className="h-4 w-4" />
        </Button>

        <Textarea
          value={answerText}
          onChange={(e) => onAnswerTextChange(e.target.value.slice(0, 500))}
          placeholder="Escreva sua recomendação..."
          className="min-h-[40px] max-h-[80px] text-sm resize-none flex-1"
          rows={1}
        />

        <Button
          size="icon"
          className="flex-shrink-0 h-10 w-10"
          onClick={onSubmit}
          disabled={submitting || !answerText.trim()}
          aria-label="Enviar resposta"
        >
          {submitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
