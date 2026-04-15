import React from "react";
import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Textarea } from "@/shared/components/ui/textarea";
import { useToast } from "@/shared/hooks/use-toast";
import { VerifiedResidentBadge } from "@/shared/components/badges";
import {
  Home,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  FileText,
  Image as ImageIcon,
  User,
  MapPin,
  Calendar,
  ExternalLink,
  Shield,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { cn } from "@/shared/utils/cn";
import { RIDE_STATUS, USER_ROLE } from "@/shared/types/constants";
import { useSessionContext } from "@/core/session";
import { AuthorizationEngine } from "@/core/authorization";

interface VerificationRequest {
  id: string;
  user_id: string;
  status: "pending" | "approved" | "rejected";
  address_proof_url: string;
  house_photo_url: string;
  additional_info: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
  profiles: {
    name: string;
    avatar_url: string;
    neighborhood: string;
    city: string;
    state: string;
  };
}

export default function AdminVerificacoes() {
  const { activeProfile } = useSessionContext();
  const { toast } = useToast();
  const [canModerate, setCanModerate] = useState<boolean | null>(null);
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<
    "all" | "pending" | "approved" | "rejected"
  >("pending");
  const [selectedRequest, setSelectedRequest] =
    useState<VerificationRequest | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadRequests();
  }, [filter]);

  // Check moderation permission via AuthorizationEngine
  useEffect(() => {
    if (!activeProfile) {
      setCanModerate(false);
      return;
    }
    AuthorizationEngine.canProfilePerformAction(
      activeProfile.id,
      "verifyUser",
      {},
    ).then(setCanModerate);
  }, [activeProfile?.id]);

  // Validação de admin
  if (canModerate === false) {
    return (
      <div className="min-h-screen bg-[#0A0F14] flex items-center justify-center p-4">
        <div className="text-center">
          <Shield className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Acesso Negado</h1>
          <p className="text-gray-400">
            Apenas administradores podem acessar esta página.
          </p>
        </div>
      </div>
    );
  }

  const loadRequests = async () => {
    setLoading(true);
    try {
      // TODO: Implementar funcionalidade de verificação de morador
      // A tabela resident_verification_requests precisa ser criada primeiro
      // Por enquanto, retornar array vazio
      setRequests([]);
    } catch (error: any) {
      toast({
        title: "Error load solicitações",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReview = (request: VerificationRequest) => {
    setSelectedRequest(request);
    setRejectionReason("");
    setReviewDialogOpen(true);
  };

  const handleApprove = async () => {
    if (!selectedRequest) return;

    setProcessing(true);
    try {
      // TODO: Implementar quando a tabela resident_verification_requests for criada
      toast({
        title: "Funcionalidade em desenvolvimento",
        description: "A verificação de morador será implementada em breve.",
      });
    } catch (error: any) {
      toast({
        title: "Error aprovar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest || !rejectionReason.trim()) {
      toast({
        title: "Motivo obrigatório",
        description: "Por favor, informe o motivo da rejeição.",
        variant: "destructive",
      });
      return;
    }

    setProcessing(true);
    try {
      // TODO: Implementar quando a tabela resident_verification_requests for criada
      toast({
        title: "Funcionalidade em desenvolvimento",
        description: "A verificação de morador será implementada em breve.",
      });
    } catch (error: any) {
      toast({
        title: "Error rejeitar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case RIDE_STATUS.PENDING:
        return (
          <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
            <Clock className="w-3 h-3 mr-1" />
            Pendente
          </Badge>
        );
      case "approved":
        return (
          <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
            <CheckCircle className="w-3 h-3 mr-1" />
            Aprovado
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-red-500/10 text-red-500 border-red-500/20">
            <XCircle className="w-3 h-3 mr-1" />
            Rejeitado
          </Badge>
        );
      default:
        return null;
    }
  };

  const stats = {
    total: requests.length,
    pending: requests.filter((r) => r.status === RIDE_STATUS.PENDING).length,
    approved: requests.filter((r) => r.status === "approved").length,
    rejected: requests.filter((r) => r.status === "rejected").length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-display mb-1 flex items-center gap-2">
          <Home className="h-6 w-6 text-blue-500" />
          Verificações de Morador
        </h1>
        <p className="text-sm text-muted-foreground">
          Analise e aprove solicitações de verificação de endereço
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card
          className="cursor-pointer hover:border-primary/50 transition-colors"
          onClick={() => setFilter("all")}
        >
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-xs text-muted-foreground">Total</div>
          </CardContent>
        </Card>
        <Card
          className="cursor-pointer hover:border-yellow-500/50 transition-colors"
          onClick={() => setFilter(RIDE_STATUS.PENDING)}
        >
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-500">
              {stats.pending}
            </div>
            <div className="text-xs text-muted-foreground">Pendentes</div>
          </CardContent>
        </Card>
        <Card
          className="cursor-pointer hover:border-green-500/50 transition-colors"
          onClick={() => setFilter("approved")}
        >
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-500">
              {stats.approved}
            </div>
            <div className="text-xs text-muted-foreground">Aprovados</div>
          </CardContent>
        </Card>
        <Card
          className="cursor-pointer hover:border-red-500/50 transition-colors"
          onClick={() => setFilter("rejected")}
        >
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-500">
              {stats.rejected}
            </div>
            <div className="text-xs text-muted-foreground">Rejeitados</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {(["all", RIDE_STATUS.PENDING, "approved", "rejected"] as const).map(
          (f) => (
            <Button
              key={f}
              variant={filter === f ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(f)}
            >
              {f === "all" && "Todas"}
              {f === RIDE_STATUS.PENDING && "Pendentes"}
              {f === "approved" && "Aprovadas"}
              {f === "rejected" && "Rejeitadas"}
            </Button>
          ),
        )}
      </div>

      {/* Requests List */}
      {requests.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Home className="h-16 w-16 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma solicitação</h3>
            <p className="text-muted-foreground text-center">
              Não há solicitações de verificação{" "}
              {filter !== "all" && `com status "${filter}"`}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {requests.map((request) => (
            <Card
              key={request.id}
              className="hover:border-primary/50 transition-colors"
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="relative">
                    <div className="h-16 w-16 rounded-full bg-secondary flex items-center justify-center overflow-hidden">
                      {request.profiles.avatar_url ? (
                        <img
                          src={request.profiles.avatar_url}
                          alt={request.profiles.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <User className="h-8 w-8 text-muted-foreground" />
                      )}
                    </div>
                    {request.status === "approved" && (
                      <div className="absolute -bottom-1 -right-1">
                        <VerifiedResidentBadge
                          size="small"
                          showTooltip={false}
                        />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div>
                        <h3 className="font-semibold text-lg">
                          {request.profiles.name}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                          <MapPin className="h-3.5 w-3.5" />
                          <span>
                            {[
                              request.profiles.neighborhood,
                              request.profiles.city,
                              request.profiles.state,
                            ]
                              .filter(Boolean)
                              .join(", ")}
                          </span>
                        </div>
                      </div>
                      {getStatusBadge(request.status)}
                    </div>

                    {request.additional_info && (
                      <p className="text-sm text-muted-foreground mb-3">
                        {request.additional_info}
                      </p>
                    )}

                    {request.rejection_reason && (
                      <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 mb-3">
                        <p className="text-sm text-red-500">
                          <strong>Motivo da rejeição:</strong>{" "}
                          {request.rejection_reason}
                        </p>
                      </div>
                    )}

                    <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>
                          Solicitado em {formatDate(request.created_at)}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleReview(request)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Revisar Documentos
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Home className="h-5 w-5 text-blue-500" />
              Revisar Verificação de Morador
            </DialogTitle>
            <DialogDescription>
              Analise os documentos enviados e aprove ou rejeite a solicitação
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-6 mt-4">
              {/* User Info */}
              <div className="flex items-center gap-4 p-4 rounded-lg bg-secondary/50">
                <div className="h-16 w-16 rounded-full bg-background flex items-center justify-center overflow-hidden">
                  {selectedRequest.profiles.avatar_url ? (
                    <img
                      src={selectedRequest.profiles.avatar_url}
                      alt={selectedRequest.profiles.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <User className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-lg">
                    {selectedRequest.profiles.name}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" />
                    <span>
                      {[
                        selectedRequest.profiles.neighborhood,
                        selectedRequest.profiles.city,
                        selectedRequest.profiles.state,
                      ]
                        .filter(Boolean)
                        .join(", ")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Additional Info */}
              {selectedRequest.additional_info && (
                <div>
                  <h4 className="text-sm font-semibold mb-2">
                    Informações Adicionais
                  </h4>
                  <p className="text-sm text-muted-foreground p-3 rounded-lg bg-secondary/50">
                    {selectedRequest.additional_info}
                  </p>
                </div>
              )}

              {/* Documents */}
              <div className="grid md:grid-cols-2 gap-4">
                {/* Address Proof */}
                <div>
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Comprovante de Endereço
                  </h4>
                  <a
                    href={selectedRequest.address_proof_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block aspect-[3/4] rounded-lg border-2 border-dashed hover:border-primary transition-colors overflow-hidden group"
                  >
                    <img
                      src={selectedRequest.address_proof_url}
                      alt="Comprovante de endereço"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <ExternalLink className="h-8 w-8 text-white" />
                    </div>
                  </a>
                </div>

                {/* House Photo */}
                <div>
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <ImageIcon className="h-4 w-4" />
                    Foto da Fachada
                  </h4>
                  <a
                    href={selectedRequest.house_photo_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block aspect-[3/4] rounded-lg border-2 border-dashed hover:border-primary transition-colors overflow-hidden group"
                  >
                    <img
                      src={selectedRequest.house_photo_url}
                      alt="Foto da fachada"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <ExternalLink className="h-8 w-8 text-white" />
                    </div>
                  </a>
                </div>
              </div>

              {/* Rejection Reason (only if rejecting) */}
              {selectedRequest.status === RIDE_STATUS.PENDING && (
                <div>
                  <h4 className="text-sm font-semibold mb-2">
                    Motivo da Rejeição (opcional)
                  </h4>
                  <Textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Informe o motivo caso vá rejeitar a solicitação..."
                    className="min-h-[100px]"
                  />
                </div>
              )}

              {/* Actions */}
              {selectedRequest.status === RIDE_STATUS.PENDING && (
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setReviewDialogOpen(false)}
                    disabled={processing}
                  >
                    Cancelar
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleReject}
                    disabled={processing}
                  >
                    {processing ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <XCircle className="h-4 w-4 mr-2" />
                    )}
                    Rejeitar
                  </Button>
                  <Button
                    onClick={handleApprove}
                    disabled={processing}
                    style={{
                      background:
                        "linear-gradient(135deg, #10B981 0%, #059669 100%)",
                    }}
                  >
                    {processing ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    )}
                    Aprovar Verificação
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
