import React from "react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { BarChart3, Plus, X } from "lucide-react";

interface PollEditorProps {
  question: string;
  options: string[];
  duration: string;
  onQuestionChange: (question: string) => void;
  onOptionChange: (index: number, value: string) => void;
  onAddOption: () => void;
  onRemoveOption: (index: number) => void;
  onDurationChange: (duration: string) => void;
}

export function PollEditor({
  question,
  options,
  duration,
  onQuestionChange,
  onOptionChange,
  onAddOption,
  onRemoveOption,
  onDurationChange,
}: PollEditorProps) {
  return (
    <div
      className="space-y-1 p-2 rounded-lg border"
      style={{
        backgroundColor: "rgba(79, 209, 197, 0.05)",
        borderColor: "rgba(79, 209, 197, 0.2)",
      }}
    >
      <div className="flex items-center gap-1.5 mb-1">
        <BarChart3 className="h-3 w-3" style={{ color: "#4FD1C5" }} />
        <Label className="text-[10px] font-bold" style={{ color: "#4FD1C5" }}>
          Enquete
        </Label>
      </div>

      <Input
        value={question}
        onChange={(e) => onQuestionChange(e.target.value)}
        placeholder="Pergunta da enquete"
        className="rounded-lg border-0 h-7 text-[10px]"
        style={{ backgroundColor: "#12181B", color: "#FFFFFF" }}
      />

      {/* Área de opções com scroll FIXO */}
      <div className="space-y-1 max-h-24 overflow-y-auto pr-1 scrollbar-thin">
        {options.map((option, index) => (
          <div key={index} className="flex items-center gap-1">
            <Input
              value={option}
              onChange={(e) => onOptionChange(index, e.target.value)}
              placeholder={`Opção ${index + 1}`}
              className="rounded-lg border-0 h-7 text-[10px] flex-1"
              style={{ backgroundColor: "#12181B", color: "#FFFFFF" }}
            />
            {options.length > 2 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onRemoveOption(index)}
                className="hover:bg-red-500/20 h-7 w-7 p-0 flex-shrink-0"
              >
                <X className="h-2.5 w-2.5 text-red-400" />
              </Button>
            )}
          </div>
        ))}
      </div>

      {/* Botão add opção */}
      {options.length < 6 && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onAddOption}
          className="w-full h-6 text-[9px] border-dashed"
          style={{
            borderColor: "rgba(79, 209, 197, 0.3)",
            color: "#4FD1C5",
            backgroundColor: "transparent",
          }}
        >
          <Plus className="h-2.5 w-2.5 mr-1" />
          Adicionar Opção ({options.length}/6)
        </Button>
      )}

      <Select value={duration} onValueChange={onDurationChange}>
        <SelectTrigger
          className="rounded-lg border-0 h-7 text-[10px]"
          style={{ backgroundColor: "#12181B", color: "#FFFFFF" }}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent
          style={{
            backgroundColor: "#1E2529",
            borderColor: "rgba(255, 255, 255, 0.2)",
          }}
        >
          <SelectItem
            value="1"
            className="text-[10px]"
            style={{ color: "#FFFFFF" }}
          >
            1 dia
          </SelectItem>
          <SelectItem
            value="7"
            className="text-[10px]"
            style={{ color: "#FFFFFF" }}
          >
            7 dias
          </SelectItem>
          <SelectItem
            value="30"
            className="text-[10px]"
            style={{ color: "#FFFFFF" }}
          >
            30 dias
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
