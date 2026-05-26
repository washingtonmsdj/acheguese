/**
 * SegurancaSection - Seção de segurança e dados
 *
 * SSOT: Componente isolado com props tipadas
 * Sem gambiarras: Lógica clara e organizada
 */

import { Database, Download, Lock, Pause, Trash2 } from "lucide-react";

import { SectionFrame, AccountHealthPanel } from "@/modules/profile/components/hub";
import { SecurityActionCard } from "@/modules/profile/components/cards";
import { DataManagementDialogs } from "@/modules/profile/components/DataManagementDialogs";

import type { SegurancaSectionProps } from "./types";

export function SegurancaSection({
  profile,
  identity,
  context,
  account,
  roles,
  activeProfile,
  stats,
  user,
  verificationStatus,
  verificationRejectionReason,
  downloadDataOpen,
  setDownloadDataOpen,
  viewDataOpen,
  setViewDataOpen,
  deactivateOpen,
  setDeactivateOpen,
  deleteOpen,
  setDeleteOpen,
  deleteConfirm,
  setDeleteConfirm,
  handleDownloadData,
  handleDeactivateAccount,
  handleDeleteAccount,
  navigate,
  appUrls,
}: SegurancaSectionProps) {
  return (
    <>
      <div className="space-y-6">
        <AccountHealthPanel
          accountSnapshot={(account || {
              accountState: "inactive",
              isBlocked: false,
              isSuspended: false,
              verificationStatus,
              verificationRejectionReason,
            }) as any}
          identity={identity}
          context={context}
          activeProfile={activeProfile as any}
          roles={roles as any}
        />

        <SectionFrame
          title="Segurança e dados"
          description="Ações sensíveis da conta centralizadas em um único lugar."
        >
          <div className="grid gap-3 md:grid-cols-2">
            <SecurityActionCard
              icon={Lock}
              title="Minha conta"
              description="Senha, email de acesso e validações de segurança."
              actionLabel="Abrir conta"
              onAction={() => navigate(appUrls.profile.account)}
            />
            <SecurityActionCard
              icon={Download}
              title="Baixar meus dados"
              description="Exportar snapshot de dados pessoais em JSON."
              actionLabel="Baixar dados"
              onAction={() => setDownloadDataOpen(true)}
            />
            <SecurityActionCard
              icon={Database}
              title="Visualizar meus dados"
              description="Consultar os dados salvos na conta."
              actionLabel="Ver dados"
              onAction={() => setViewDataOpen(true)}
            />
            <SecurityActionCard
              icon={Pause}
              title="Pausar conta"
              description="Abrir fluxo oficial de pausa temporária."
              actionLabel="Pausar conta"
              onAction={() => setDeactivateOpen(true)}
            />
            <SecurityActionCard
              icon={Trash2}
              title="Encerrar conta"
              description="Abrir fluxo oficial de encerramento definitivo."
              actionLabel="Encerrar conta"
              onAction={() => setDeleteOpen(true)}
              tone="danger"
            />
          </div>
        </SectionFrame>
      </div>

      <DataManagementDialogs
        profile={profile as any}
        stats={stats as any}
        userEmail={user?.email}
        downloadOpen={downloadDataOpen}
        viewOpen={viewDataOpen}
        deactivateOpen={deactivateOpen}
        deleteOpen={deleteOpen}
        deleteConfirm={deleteConfirm}
        onDownloadOpenChange={setDownloadDataOpen}
        onViewOpenChange={setViewDataOpen}
        onDeactivateOpenChange={setDeactivateOpen}
        onDeleteOpenChange={setDeleteOpen}
        onDeleteConfirmChange={setDeleteConfirm}
        onDownload={handleDownloadData}
        onDeactivate={handleDeactivateAccount}
        onDelete={handleDeleteAccount}
      />
    </>
  );
}
