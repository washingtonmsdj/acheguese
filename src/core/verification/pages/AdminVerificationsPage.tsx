/**
 * AdminVerificationsPage - Painel administrativo de verificacoes.
 */
import { CheckCircle, Clock, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { Button } from "@/shared/components/ui/button";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { VerificationCard } from "@/core/verification/components/VerificationCard";
import { useVerifications } from "@/core/verification/hooks/useVerifications";
import type { PendingVerification } from "@/core/profiles/services/ProfileVerificationAdminService";

type ReviewMode = "approve" | "reject";

const INITIAL_CHECKLIST = {
  profileConsistent: false,
  evidenceReviewed: false,
  territoryMatch: false,
  antiFraudReviewed: false,
};

export default function AdminVerificationsPage() {
  const {
    pending,
    verified,
    rejected,
    stats,
    loadingPending,
    loadingVerified,
    loadingRejected,
    isApproving,
    isRejecting,
    approve,
    reject,
  } = useVerifications();
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewMode, setReviewMode] = useState<ReviewMode>("approve");
  const [target, setTarget] = useState<PendingVerification | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [checklist, setChecklist] = useState(INITIAL_CHECKLIST);

  const allChecklistDone = useMemo(
    () => Object.values(checklist).every(Boolean),
    [checklist],
  );

  function openReview(verification: PendingVerification, mode: ReviewMode) {
    setTarget(verification);
    setReviewMode(mode);
    setRejectReason("");
    setChecklist(INITIAL_CHECKLIST);
    setReviewOpen(true);
  }

  function closeReview() {
    setReviewOpen(false);
    setTarget(null);
    setRejectReason("");
    setChecklist(INITIAL_CHECKLIST);
  }

  function handleDecision() {
    if (!target) return;

    if (!allChecklistDone) return;

    if (reviewMode === "approve") {
      approve(target.profile_id);
      closeReview();
      return;
    }

    const normalizedReason = rejectReason.trim();
    if (normalizedReason.length < 10) return;

    reject({ profileId: target.profile_id, reason: normalizedReason });
    closeReview();
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Verificacoes de Perfil</h1>
        <p className="text-muted-foreground">
          Aprove ou rejeite solicitacoes pendentes de verificacao.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.pending || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verificados</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.verified || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejeitados</CardTitle>
            <Users className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.rejected || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total || 0}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending" className="gap-2">
            <Clock className="h-4 w-4" />
            Pendentes ({pending.length})
          </TabsTrigger>
          <TabsTrigger value="verified" className="gap-2">
            <CheckCircle className="h-4 w-4" />
            Verificados ({verified.length})
          </TabsTrigger>
          <TabsTrigger value="rejected" className="gap-2">
            <Users className="h-4 w-4" />
            Rejeitados ({rejected.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {loadingPending ? (
            <div className="text-center py-12 text-muted-foreground">Carregando...</div>
          ) : pending.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Nenhuma verificacao pendente no momento.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {pending.map((verification) => (
                <VerificationCard
                  key={verification.id}
                  verification={verification}
                  onApprove={() => openReview(verification, "approve")}
                  onReject={() => openReview(verification, "reject")}
                  isApproving={isApproving}
                  isRejecting={isRejecting}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="verified" className="space-y-4">
          {loadingVerified ? (
            <div className="text-center py-12 text-muted-foreground">Carregando...</div>
          ) : verified.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Nenhum perfil verificado ainda.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {verified.map((verification) => (
                <VerificationCard
                  key={verification.id}
                  verification={verification}
                  onApprove={approve}
                  onReject={(profileId) => reject({ profileId })}
                  showActions={false}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="rejected" className="space-y-4">
          {loadingRejected ? (
            <div className="text-center py-12 text-muted-foreground">Carregando...</div>
          ) : rejected.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Nenhum perfil rejeitado.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {rejected.map((verification) => (
                <VerificationCard
                  key={verification.id}
                  verification={verification}
                  onApprove={approve}
                  onReject={(_profileId) => {}}
                  showActions={false}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog
        open={reviewOpen}
        onOpenChange={(open) => {
          if (!open) closeReview();
          else setReviewOpen(true);
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {reviewMode === "approve" ? "Aprovar verificacao" : "Rejeitar verificacao"}
            </DialogTitle>
            <DialogDescription>
              Revise o checklist operacional antes de concluir a decisao.
            </DialogDescription>
          </DialogHeader>

          {target ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-border p-3 text-sm">
                <p className="font-semibold">{target.display_name}</p>
                <p className="text-muted-foreground">Perfil: {target.profile_id}</p>
              </div>

              <div className="space-y-3 rounded-lg border border-border p-3">
                <p className="text-sm font-semibold">Checklist de revisao obrigatoria</p>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="profileConsistent"
                    checked={checklist.profileConsistent}
                    onCheckedChange={(checked) =>
                      setChecklist((prev) => ({ ...prev, profileConsistent: Boolean(checked) }))
                    }
                  />
                  <Label htmlFor="profileConsistent">Dados do perfil conferem com a solicitacao</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="evidenceReviewed"
                    checked={checklist.evidenceReviewed}
                    onCheckedChange={(checked) =>
                      setChecklist((prev) => ({ ...prev, evidenceReviewed: Boolean(checked) }))
                    }
                  />
                  <Label htmlFor="evidenceReviewed">Comprovantes/documentos foram revisados</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="territoryMatch"
                    checked={checklist.territoryMatch}
                    onCheckedChange={(checked) =>
                      setChecklist((prev) => ({ ...prev, territoryMatch: Boolean(checked) }))
                    }
                  />
                  <Label htmlFor="territoryMatch">Territorio do perfil esta coerente com a comunidade</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="antiFraudReviewed"
                    checked={checklist.antiFraudReviewed}
                    onCheckedChange={(checked) =>
                      setChecklist((prev) => ({ ...prev, antiFraudReviewed: Boolean(checked) }))
                    }
                  />
                  <Label htmlFor="antiFraudReviewed">Validacao anti-fraude foi aplicada</Label>
                </div>
              </div>

              {reviewMode === "reject" && (
                <div className="space-y-2">
                  <Label htmlFor="rejectReason">Motivo da rejeicao (obrigatorio)</Label>
                  <Textarea
                    id="rejectReason"
                    value={rejectReason}
                    onChange={(event) => setRejectReason(event.target.value)}
                    placeholder="Descreva objetivamente o motivo da rejeicao."
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground">
                    Minimo de 10 caracteres para auditoria e retorno ao solicitante.
                  </p>
                </div>
              )}
            </div>
          ) : null}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeReview}>
              Cancelar
            </Button>
            <Button
              type="button"
              variant={reviewMode === "approve" ? "default" : "destructive"}
              disabled={
                !allChecklistDone ||
                isApproving ||
                isRejecting ||
                (reviewMode === "reject" && rejectReason.trim().length < 10)
              }
              onClick={handleDecision}
            >
              {reviewMode === "approve" ? "Confirmar aprovacao" : "Confirmar rejeicao"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
