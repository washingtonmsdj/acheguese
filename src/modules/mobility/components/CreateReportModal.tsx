/**
 * CreateReportModal - Modal para criar report de problema em corrida
 * 
 * Usado por passageiros e motoristas para reportar problemas
 * Integrado com useRideReports
 */

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Label } from "@/shared/components/ui/label";
import { useRideReports } from "@/modules/mobility/hooks/useRideReports";
import type { ReportType, ReportSeverity } from "@/modules/mobility/services/RideReportsService";
import {
  AlertTriangle,
  Shield,
  User,
  MapPin,
  DollarSign,
  Car,
  Ban,
  AlertCircle,
} from "lucide-react";

interface CreateReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  rideId: string;
  rideSummary?: string; // Ex: "Origem → Destino"
}

const REPORT_TYPES: Array<{ value: ReportType; label: string; icon: any }> = [
  { value: "safety_concern", label: "Preocupação de Segurança", icon: Shield },
  { value: "driver_behavior", label: "Comportamento do Motorista", icon: User },
  { value: "passenger_behavior", label: "Comportamento do Passageiro", icon: User },
  { value: "route_issue", label: "Problema na Rota", icon: MapPin },
  { value: "payment_issue", label: "Problema de Pagamento", icon: DollarSign },
  { value: "vehicle_condition", label: "Condição do Veículo", icon: Car },
  { value: "cancellation_abuse", label: "Abuso de Cancelamento", icon: Ban },
  { value: "fraud_suspicion", label: "Suspeita de Fraude", icon: AlertTriangle },
  { value: "other", label: "Outro", icon: AlertCircle },
];

const SEVERITIES: Array<{ value: ReportSeverity; label: string; description: string }> = [
  { value: "low", label: "Baixa", description: "Inconveniente menor" },
  { value: "medium", label: "Média", description: "Problema moderado" },
  { value: "high", label: "Alta", description: "Problema sério" },
  { value: "critical", label: "Crítica", description: "Risco de segurança" },
];

export function CreateReportModal({ isOpen, onClose, rideId, rideSummary }: CreateReportModalProps) {
  const { createReport, isSubmitting } = useRideReports();

  const [reportType, setReportType] = useState<ReportType>("other");
  const [severity, setSeverity] = useState<ReportSeverity>("medium");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) {
      return;
    }

    const result = await createReport({
      rideId,
      reportType,
      severity,
      title: title.trim(),
      description: description.trim(),
    });

    if (result.success) {
      // Resetar form
      setReportType("other");
      setSeverity("medium");
      setTitle("");
      setDescription("");
      onClose();
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  const selectedType = REPORT_TYPES.find((t) => t.value === reportType);
  const Icon = selectedType?.icon || AlertCircle;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Reportar Problema
          </DialogTitle>
          {rideSummary && (
            <p className="text-sm text-muted-foreground mt-2">
              Corrida: {rideSummary}
            </p>
          )}
        </DialogHeader>

        <div className="space-y-4">
          {/* Tipo de Report */}
          <div className="space-y-2">
            <Label htmlFor="report-type">Tipo de Problema</Label>
            <Select value={reportType} onValueChange={(v) => setReportType(v as ReportType)}>
              <SelectTrigger id="report-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REPORT_TYPES.map((type) => {
                  const TypeIcon = type.icon;
                  return (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <TypeIcon className="h-4 w-4" />
                        {type.label}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Severidade */}
          <div className="space-y-2">
            <Label htmlFor="severity">Severidade</Label>
            <Select value={severity} onValueChange={(v) => setSeverity(v as ReportSeverity)}>
              <SelectTrigger id="severity">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SEVERITIES.map((sev) => (
                  <SelectItem key={sev.value} value={sev.value}>
                    <div className="flex flex-col">
                      <span className="font-medium">{sev.label}</span>
                      <span className="text-xs text-muted-foreground">{sev.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Título */}
          <div className="space-y-2">
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              placeholder="Resumo do problema..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
            />
            <p className="text-xs text-muted-foreground">{title.length}/100 caracteres</p>
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrição Detalhada</Label>
            <Textarea
              id="description"
              placeholder="Descreva o problema em detalhes..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              maxLength={1000}
            />
            <p className="text-xs text-muted-foreground">{description.length}/1000 caracteres</p>
          </div>

          {/* Aviso */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Icon className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-400">
                <p className="font-medium mb-1">Seu report será analisado</p>
                <p className="text-xs text-blue-400/80">
                  Nossa equipe revisará seu report e tomará as ações necessárias. Você receberá
                  atualizações sobre o status da análise.
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleClose} variant="outline" disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !title.trim() || !description.trim()}
          >
            {isSubmitting ? "Enviando..." : "Enviar Report"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
