import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Database, Download, Pause, Trash2 } from "lucide-react";
import type { Profile, ProfileStats } from "@/core/profiles/services/types";

interface DataManagementDialogsProps {
  profile: Profile | null;
  stats: ProfileStats;
  userEmail?: string;
  downloadOpen: boolean;
  viewOpen: boolean;
  deactivateOpen: boolean;
  deleteOpen: boolean;
  deleteConfirm: string;
  onDownloadOpenChange: (open: boolean) => void;
  onViewOpenChange: (open: boolean) => void;
  onDeactivateOpenChange: (open: boolean) => void;
  onDeleteOpenChange: (open: boolean) => void;
  onDeleteConfirmChange: (value: string) => void;
  onDownload: () => void;
  onDeactivate: () => void;
  onDelete: () => void;
}

export function DataManagementDialogs({
  profile,
  stats,
  userEmail,
  downloadOpen,
  viewOpen,
  deactivateOpen,
  deleteOpen,
  deleteConfirm,
  onDownloadOpenChange,
  onViewOpenChange,
  onDeactivateOpenChange,
  onDeleteOpenChange,
  onDeleteConfirmChange,
  onDownload,
  onDeactivate,
  onDelete,
}: DataManagementDialogsProps) {
  return (
    <>
      <Dialog open={downloadOpen} onOpenChange={onDownloadOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Baixar Meus Dados
            </DialogTitle>
            <DialogDescription>
              Faca o download de uma copia dos seus dados pessoais em formato JSON.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-2 space-y-4">
            <div className="rounded-lg bg-secondary/50 p-4 text-sm">
              <p className="mb-2 font-medium">O arquivo incluira:</p>
              <ul className="list-inside list-disc space-y-1 text-muted-foreground">
                <li>Dados do perfil</li>
                <li>Estatisticas de atividade</li>
                <li>Lista de empresas</li>
                <li>Data de exportacao</li>
              </ul>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => onDownloadOpenChange(false)}>
                Cancelar
              </Button>
              <Button onClick={onDownload}>
                <Download className="mr-2 h-4 w-4" />
                Baixar Dados
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={viewOpen} onOpenChange={onViewOpenChange}>
        <DialogContent className="max-h-[80vh] max-w-md overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Meus Dados Pessoais
            </DialogTitle>
            <DialogDescription>
              Veja todos os dados que armazenamos sobre voce.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-2 space-y-3">
            <DataField label="Nome" value={profile?.name || "Nao informado"} />
            <DataField label="Email" value={userEmail || "Nao informado"} />
            <DataField
              label="Localizacao"
              value={
                [profile?.neighborhood, profile?.city, profile?.state]
                  .filter(Boolean)
                  .join(", ") || "Nao informado"
              }
            />
            <DataField
              label="Telefone"
              value={profile?.phone || profile?.telefone || "Nao informado"}
            />
            <DataField label="WhatsApp" value={profile?.whatsapp || "Nao informado"} />
            <DataField
              label="Membro desde"
              value={
                profile?.created_at
                  ? new Date(profile.created_at).toLocaleDateString("pt-BR")
                  : "N/A"
              }
            />
            <DataField
              label="Estatisticas"
              value={`${stats.posts} posts • ${stats.businesses} empresas • ${stats.favorites} favoritos`}
            />

            <div className="flex justify-end">
              <Button variant="outline" onClick={() => onViewOpenChange(false)}>
                Fechar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={deactivateOpen} onOpenChange={onDeactivateOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-warning">
              <Pause className="h-5 w-5" />
              Pausar Conta Temporariamente
            </DialogTitle>
            <DialogDescription>
              O fluxo de pausa e revisao e feito na area Minha Conta.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-2 space-y-4">
            <div className="rounded-lg border border-warning/30 bg-warning/10 p-4 text-sm">
              <p className="mb-2 font-medium">Proximo passo:</p>
              <ul className="list-inside list-disc space-y-1 text-muted-foreground">
                <li>Voce sera redirecionado para Minha Conta</li>
                <li>A pausa e validada com contexto de seguranca</li>
                <li>O sistema aplica o estado oficial da conta</li>
              </ul>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => onDeactivateOpenChange(false)}>
                Cancelar
              </Button>
              <Button
                variant="default"
                className="bg-warning hover:bg-warning/90"
                onClick={onDeactivate}
              >
                <Pause className="mr-2 h-4 w-4" />
                Ir para Minha Conta
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={onDeleteOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              Encerrar Conta
            </DialogTitle>
            <DialogDescription>
              O encerramento definitivo e iniciado pela area Minha Conta.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-2 space-y-4">
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm">
              <p className="mb-2 font-medium text-destructive">ATENCAO:</p>
              <ul className="list-inside list-disc space-y-1 text-muted-foreground">
                <li>Voce sera redirecionado para Minha Conta</li>
                <li>O pedido de encerramento passa por validacoes de seguranca</li>
                <li>As regras oficiais de retencao de dados serao aplicadas</li>
              </ul>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Digite "EXCLUIR" para confirmar:
              </label>
              <Input
                value={deleteConfirm}
                onChange={(event) => onDeleteConfirmChange(event.target.value)}
                placeholder="EXCLUIR"
                className="font-mono"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  onDeleteOpenChange(false);
                  onDeleteConfirmChange("");
                }}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={onDelete}
                disabled={deleteConfirm !== "EXCLUIR"}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Continuar no fluxo
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function DataField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-secondary/50 p-3">
      <p className="mb-1 text-xs font-medium text-muted-foreground">{label}</p>
      <p className="text-sm">{value}</p>
    </div>
  );
}
