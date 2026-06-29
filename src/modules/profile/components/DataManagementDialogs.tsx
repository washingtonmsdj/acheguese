import { Database, Download, Pause, Trash2 } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import type { ProfileActivityStats } from "@/core/profiles/services/ProfileOperationTypes";

interface DataManagementProfile {
  displayName?: string | null;
  name?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  createdAt?: string | null;
}

interface DataManagementDialogsProps {
  profile: DataManagementProfile | null;
  stats: ProfileActivityStats;
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
              Baixar meus dados
            </DialogTitle>
            <DialogDescription>
              Faça o download de uma cópia dos seus dados pessoais em formato JSON.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-2 space-y-4">
            <div className="rounded-lg bg-secondary/50 p-4 text-sm">
              <p className="mb-2 font-medium">O arquivo incluirá:</p>
              <ul className="list-inside list-disc space-y-1 text-muted-foreground">
                <li>Dados do perfil</li>
                <li>Estatísticas de atividade</li>
                <li>Lista de empresas</li>
                <li>Data de exportação</li>
              </ul>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => onDownloadOpenChange(false)}>
                Cancelar
              </Button>
              <Button onClick={onDownload}>
                <Download className="mr-2 h-4 w-4" />
                Baixar dados
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
              Meus dados pessoais
            </DialogTitle>
            <DialogDescription>
              Veja todos os dados que armazenamos sobre você.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-2 space-y-3">
            <DataField label="Nome" value={profile?.displayName || profile?.name || "Não informado"} />
            <DataField label="E-mail" value={userEmail || "Não informado"} />
            <DataField label="Localização" value="Não informado" />
            <DataField label="Telefone" value={profile?.phone || "Não informado"} />
            <DataField label="WhatsApp" value={profile?.whatsapp || "Não informado"} />
            <DataField
              label="Membro desde"
              value={
                profile?.createdAt
                  ? new Date(profile.createdAt).toLocaleDateString("pt-BR")
                  : "N/A"
              }
            />
            <DataField
              label="Estatísticas"
              value={`${stats.posts} posts | ${stats.businesses} empresas | ${stats.favorites} favoritos`}
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
              Pausar conta temporariamente
            </DialogTitle>
            <DialogDescription>
              O fluxo de pausa e revisão é feito na área Minha Conta.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-2 space-y-4">
            <div className="rounded-lg border border-warning/30 bg-warning/10 p-4 text-sm">
              <p className="mb-2 font-medium">Próximo passo:</p>
              <ul className="list-inside list-disc space-y-1 text-muted-foreground">
                <li>Você será redirecionado para Minha Conta</li>
                <li>A pausa é validada com contexto de segurança</li>
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
              Encerrar conta
            </DialogTitle>
            <DialogDescription>
              O encerramento definitivo é iniciado pela área Minha Conta.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-2 space-y-4">
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm">
              <p className="mb-2 font-medium text-destructive">ATENÇÃO:</p>
              <ul className="list-inside list-disc space-y-1 text-muted-foreground">
                <li>Você será redirecionado para Minha Conta</li>
                <li>O pedido de encerramento passa por validações de segurança</li>
                <li>As regras oficiais de retenção de dados serão aplicadas</li>
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
