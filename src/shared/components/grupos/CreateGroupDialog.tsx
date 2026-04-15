 
import React from "react";
import { Lock, Globe, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import { Button } from "@/shared/components/ui/button";
// NewGroupData type definido localmente abaixo

const CATEGORIES = [
  { id: "geral", label: "Geral", emoji: "💬" },
  { id: "vizinhanca", label: "Vizinhança", emoji: "🏘️" },
  { id: "pets", label: "Pets", emoji: "🐕" },
  { id: "esportes", label: "Esportes", emoji: "🚴" },
  { id: "familia", label: "Família", emoji: "👶" },
  { id: "seguranca", label: "Segurança", emoji: "🚨" },
  { id: "sustentabilidade", label: "Sustentabilidade", emoji: "🌱" },
  { id: "cultura", label: "Cultura", emoji: "🎭" },
];

interface CreateGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  newGroup: NewGroupData;
  onUpdateGroup: (updates: Partial<NewGroupData>) => void;
  creating: boolean;
  onSubmit: () => void;
}

export function CreateGroupDialog({
  open,
  onOpenChange,
  newGroup,
  onUpdateGroup,
  creating,
  onSubmit,
}: CreateGroupDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1E2529] border-white/10 text-white max-w-md">
        <DialogHeader>
          <DialogTitle>Criar Novo Grupo</DialogTitle>
        </DialogHeader>
        <DialogDescription className="sr-only">
          Crie um novo grupo para sua comunidade
        </DialogDescription>

        <div className="space-y-4 pt-2">
          <div>
            <label className="text-sm text-gray-400 mb-1 block">
              Nome do grupo *
            </label>
            <Input
              value={newGroup.name}
              onChange={(e) => onUpdateGroup({ name: e.target.value })}
              placeholder="Ex: Vizinhos da Rua X"
              className="bg-white/5 border-white/10 text-white"
              maxLength={60}
            />
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-1 block">
              Descrição
            </label>
            <Textarea
              value={newGroup.description}
              onChange={(e) => onUpdateGroup({ description: e.target.value })}
              placeholder="Sobre o que é esse grupo?"
              className="bg-white/5 border-white/10 text-white resize-none"
              rows={3}
              maxLength={300}
            />
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-2 block">
              Categoria
            </label>
            <div className="grid grid-cols-4 gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => onUpdateGroup({ category: cat.id })}
                  className={`flex flex-col items-center gap-1 p-2 rounded-lg border text-xs transition-colors ${
                    newGroup.category === cat.id
                      ? "border-teal-400 bg-teal-400/10 text-teal-400"
                      : "border-white/10 text-gray-400 hover:border-white/20"
                  }`}
                >
                  <span className="text-lg">{cat.emoji}</span>
                  <span className="truncate w-full text-center">
                    {cat.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() =>
                onUpdateGroup({ is_private: !newGroup.is_private })
              }
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors ${
                newGroup.is_private
                  ? "border-yellow-400/50 bg-yellow-400/10 text-yellow-400"
                  : "border-white/10 text-gray-400"
              }`}
            >
              {newGroup.is_private ? (
                <Lock className="w-4 h-4" />
              ) : (
                <Globe className="w-4 h-4" />
              )}
              {newGroup.is_private ? "Privado" : "Público"}
            </button>
          </div>

          <Button
            onClick={onSubmit}
            disabled={creating || !newGroup.name.trim()}
            className="w-full bg-teal-500 hover:bg-teal-600 text-white"
          >
            {creating ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : null}
            Criar Grupo
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
