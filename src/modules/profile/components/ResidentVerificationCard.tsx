/**
 * ResidentVerificationCard - Componente de verificação de morador
 * 
 * REFATORADO: Agora coleta endereço estruturado (CEP + logradouro + número)
 * antes de solicitar documentos. Usa ResidentAddressService via hook (SSOT).
 * 
 * Fluxo:
 * 1. Usuário digita CEP → autopreenchimento via ViaCEP
 * 2. Preenche número e complemento
 * 3. Envia comprovante + foto
 * 4. Sistema persiste endereço + solicita verificação
 */

import { useState } from "react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import { useToast } from "@/shared/hooks/use-toast";
import { VerifiedResidentBadge } from "@/shared/components/badges";
import { Home, Upload, CheckCircle, Clock, XCircle, FileCheck, Search, MapPin } from "lucide-react";
import { VerificationService } from "@/core/verification/services/VerificationService";
import { mediaService } from "@/core/media/services/MediaService";
import { useResidentAddress } from "@/core/address/hooks/useResidentAddress";
import type { ProfileVerificationStatus } from "@/core/verification/verificationStatus";

export type VerificationStatus = ProfileVerificationStatus;

interface ResidentVerificationCardProps {
  profileId: string;
  currentStatus?: VerificationStatus;
  rejectionReason?: string;
  onStatusChange?: (status: VerificationStatus) => void;
}

export function ResidentVerificationCard({
  profileId,
  currentStatus = "not_requested",
  rejectionReason,
  onStatusChange,
}: ResidentVerificationCardProps) {
  const { toast } = useToast();
  const [status, setStatus] = useState<VerificationStatus>(currentStatus);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addressProof, setAddressProof] = useState<File | null>(null);
  const [housePhoto, setHousePhoto] = useState<File | null>(null);
  const [additionalInfo, setAdditionalInfo] = useState("");

  // Hook SSOT para endereço residencial
  const {
    form,
    setField,
    lookupCep,
    register,
    isRegistering,
    isFormValid,
  } = useResidentAddress(profileId);

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "proof" | "photo",
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      if (type === "proof") setAddressProof(file);
      else setHousePhoto(file);
    }
  };

  // Autocompletar ao digitar CEP completo
  const handleCepChange = (value: string) => {
    // Formatar enquanto digita
    const cleaned = value.replace(/\D/g, '');
    let formatted = cleaned;
    if (cleaned.length > 5) {
      formatted = `${cleaned.slice(0, 5)}-${cleaned.slice(5, 8)}`;
    }
    setField('postalCode', formatted);

    // Consultar quando tiver 8 dígitos
    if (cleaned.length === 8) {
      lookupCep(cleaned);
    }
  };

  const handleSubmit = async () => {
    if (!addressProof || !housePhoto) {
      toast({
        title: "Documentos obrigatórios",
        description: "Por favor, envie o comprovante de endereço e a foto da fachada.",
        variant: "destructive",
      });
      return;
    }

    if (!isFormValid) {
      toast({
        title: "Endereço incompleto",
        description: "Preencha CEP, logradouro e número antes de enviar.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Registrar endereço via SSOT
      const result = await register();

      // 2. Upload dos documentos
      const [proofUrl, photoUrl] = await Promise.all([
        mediaService.uploadVerificationDocument(profileId, addressProof, "proof"),
        mediaService.uploadVerificationDocument(profileId, housePhoto, "photo"),
      ]);

      // 3. Criar solicitação de verificação vinculada ao endereço
      await VerificationService.createVerificationRequest({
        profile_id: profileId,
        verification_type: "resident",
        document_url: proofUrl,
        document_type: "address_proof",
        notes: [
          `address_id:${result.address.id}`,
          `residence_id:${result.residence_id}`,
          `location:${result.location_name}`,
          photoUrl ? `house_photo:${photoUrl}` : null,
          additionalInfo || null,
        ]
          .filter(Boolean)
          .join("\n") || undefined,
      });

      setStatus("pending");
      onStatusChange?.("pending");
      toast({
        title: "Solicitação enviada!",
        description: `Endereço cadastrado em ${result.location_name}. Será analisado em até 48 horas.`,
      });
    } catch (err: unknown) {
      toast({
        title: "Erro ao enviar",
        description: err instanceof Error
          ? err.message
          : "Não foi possível enviar sua solicitação. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ========================================
  // RENDER: Approved
  // ========================================
  if (status === "approved") {
    return (
      <div className="overflow-hidden rounded-xl border border-success/30 bg-card sm:rounded-2xl">
        <div className="flex items-center gap-2 border-b border-success/20 p-3 sm:gap-2.5 sm:p-5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-success/10 sm:h-8 sm:w-8">
            <CheckCircle className="h-3.5 w-3.5 text-success sm:h-4 sm:w-4" />
          </div>
          <h3 className="flex items-center gap-1.5 text-xs font-semibold text-foreground sm:gap-2 sm:text-sm">
            <VerifiedResidentBadge size="medium" showTooltip={false} />
            Morador Verificado
          </h3>
        </div>
        <div className="p-3 sm:p-5">
          <div className="flex items-start gap-2 rounded-lg border border-success/10 bg-success/5 p-3 sm:gap-3 sm:rounded-xl sm:p-4">
            <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-success sm:h-5 sm:w-5" />
            <div>
              <p className="mb-1 text-xs font-semibold text-success sm:text-sm">
                Parabéns! Você é um morador verificado
              </p>
              <p className="text-xs text-muted-foreground sm:text-sm">
                Seu endereço foi confirmado. Isso aumenta a confiança da
                comunidade em você para empréstimos, trocas e encontros presenciais.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ========================================
  // RENDER: Pending
  // ========================================
  if (status === "pending") {
    return (
      <div className="overflow-hidden rounded-xl border border-warning/30 bg-card sm:rounded-2xl">
        <div className="flex items-center gap-2 border-b border-warning/20 p-3 sm:gap-2.5 sm:p-5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-warning/10 sm:h-8 sm:w-8">
            <Clock className="h-3.5 w-3.5 text-warning sm:h-4 sm:w-4" />
          </div>
          <h3 className="text-xs font-semibold text-foreground sm:text-sm">Verificação Pendente</h3>
        </div>
        <div className="p-3 sm:p-5">
          <div className="flex items-start gap-2 rounded-lg border border-warning/10 bg-warning/5 p-3 sm:gap-3 sm:rounded-xl sm:p-4">
            <Clock className="mt-0.5 h-4 w-4 shrink-0 text-warning sm:h-5 sm:w-5" />
            <div>
              <p className="mb-1 text-xs font-semibold text-warning sm:text-sm">
                Sua solicitação está em análise
              </p>
              <p className="text-xs text-muted-foreground sm:text-sm">
                Nossa equipe está analisando seus documentos e endereço. 
                Você receberá uma notificação em até 48 horas.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ========================================
  // RENDER: Rejected
  // ========================================
  if (status === "rejected") {
    return (
      <div className="overflow-hidden rounded-xl border border-destructive/30 bg-card sm:rounded-2xl">
        <div className="flex items-center gap-2 border-b border-destructive/20 p-3 sm:gap-2.5 sm:p-5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-destructive/10 sm:h-8 sm:w-8">
            <XCircle className="h-3.5 w-3.5 text-destructive sm:h-4 sm:w-4" />
          </div>
          <h3 className="text-xs font-semibold text-foreground sm:text-sm">Verificação Rejeitada</h3>
        </div>
        <div className="space-y-3 p-3 sm:space-y-4 sm:p-5">
          <div className="flex items-start gap-2 rounded-lg border border-destructive/10 bg-destructive/5 p-3 sm:gap-3 sm:rounded-xl sm:p-4">
            <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive sm:h-5 sm:w-5" />
            <div>
              <p className="mb-1 text-xs font-semibold text-destructive sm:text-sm">
                Sua solicitação foi rejeitada
              </p>
              <p className="mb-1.5 text-xs text-muted-foreground sm:mb-2 sm:text-sm">
                {rejectionReason || "Os documentos enviados não foram aceitos."}
              </p>
              <p className="text-[10px] text-muted-foreground sm:text-xs">
                Você pode enviar uma nova solicitação com documentos atualizados.
              </p>
            </div>
          </div>
          <Button
            onClick={() => setStatus("not_requested")}
            variant="outline"
            className="h-9 w-full text-sm sm:h-10"
          >
            Enviar Nova Solicitação
          </Button>
        </div>
      </div>
    );
  }

  // ========================================
  // RENDER: Not requested (form com endereço estruturado)
  // ========================================
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden sm:rounded-2xl">
      <div className="flex items-center gap-2 border-b border-border p-3 sm:gap-2.5 sm:p-5">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 sm:h-8 sm:w-8">
          <Home className="h-3.5 w-3.5 text-primary sm:h-4 sm:w-4" />
        </div>
        <h3 className="text-xs font-semibold text-foreground sm:text-sm">
          Torne-se um Morador Verificado
        </h3>
      </div>
      <div className="space-y-4 p-3 sm:space-y-5 sm:p-5">
        {/* Benefícios */}
        <div className="rounded-lg border border-primary/10 bg-primary/5 p-3 sm:rounded-xl sm:p-4">
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-primary sm:mb-2 sm:text-xs">
            Por que verificar?
          </p>
          <ul className="list-inside list-disc space-y-1 text-xs text-muted-foreground sm:space-y-1.5 sm:text-sm">
            <li>Aumente a confiança da comunidade em você</li>
            <li>Facilite empréstimos e trocas com vizinhos</li>
            <li className="hidden sm:list-item">Participe de eventos exclusivos para moradores</li>
            <li>
              Receba o selo{" "}
              <VerifiedResidentBadge size="small" showTooltip={false} className="mx-1 inline-flex" />{" "}
              ao lado do seu nome
            </li>
          </ul>
        </div>

        {/* Etapa 1: Endereço estruturado */}
        <div className="space-y-3 sm:space-y-4">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-primary sm:h-4 sm:w-4" />
            <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground sm:text-xs">
              Etapa 1: Seu endereço
            </p>
          </div>

          {/* CEP */}
          <div className="space-y-1.5 sm:space-y-2">
            <Label htmlFor="cep" className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground sm:text-xs">
              CEP *
            </Label>
            <div className="flex gap-2">
              <Input
                id="cep"
                value={form.postalCode}
                onChange={(e) => handleCepChange(e.target.value)}
                placeholder="00000-000"
                maxLength={9}
                className="h-9 flex-1 text-sm sm:h-10"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => lookupCep(form.postalCode)}
                disabled={form.cepLoading || !form.postalCode}
                className="h-9 w-9 shrink-0 sm:h-10 sm:w-10"
              >
                <Search className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${form.cepLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
            {form.cepData && (
              <p className="flex items-center gap-1 text-[10px] text-success sm:text-xs">
                <CheckCircle className="h-3 w-3" />
                {form.cepData.neighborhood && `${form.cepData.neighborhood}, `}
                {form.cepData.city}/{form.cepData.stateCode ?? form.cepData.state}
              </p>
            )}
          </div>

          {/* Logradouro */}
          <div className="space-y-1.5 sm:space-y-2">
            <Label htmlFor="street" className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground sm:text-xs">
              Logradouro *
            </Label>
            <Input
              id="street"
              value={form.street}
              onChange={(e) => setField('street', e.target.value)}
              placeholder="Rua, Avenida, Travessa..."
              disabled={form.cepLoading}
              className="h-9 text-sm sm:h-10"
            />
          </div>

          {/* Número + Complemento */}
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="number" className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground sm:text-xs">
                Número *
              </Label>
              <Input
                id="number"
                value={form.number}
                onChange={(e) => setField('number', e.target.value)}
                placeholder="123"
                className="h-9 text-sm sm:h-10"
              />
            </div>
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="complement" className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground sm:text-xs">
                Complemento
              </Label>
              <Input
                id="complement"
                value={form.complement}
                onChange={(e) => setField('complement', e.target.value)}
                placeholder="Apto, Bloco..."
                className="h-9 text-sm sm:h-10"
              />
            </div>
          </div>
        </div>

        {/* Etapa 2: Documentos */}
        <div className="space-y-3 sm:space-y-4">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Upload className="h-3.5 w-3.5 shrink-0 text-primary sm:h-4 sm:w-4" />
            <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground sm:text-xs">
              Etapa 2: Documentos
            </p>
          </div>

          <div className="space-y-1.5 sm:space-y-2">
            <Label htmlFor="address-proof" className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground sm:text-xs">
              Comprovante de Endereço *
            </Label>
            <p className="text-[10px] text-muted-foreground sm:text-xs">
              Conta de luz, água, internet, etc. (PDF, JPG ou PNG)
            </p>
            <Input
              id="address-proof"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => handleFileChange(e, "proof")}
              className="h-9 cursor-pointer text-xs sm:h-10 sm:text-sm"
            />
            {addressProof && (
              <div className="flex items-center gap-1 text-[10px] text-success sm:gap-1.5 sm:text-xs">
                <FileCheck className="h-3 w-3" />
                <span className="truncate">{addressProof.name}</span>
              </div>
            )}
          </div>

          <div className="space-y-1.5 sm:space-y-2">
            <Label htmlFor="house-photo" className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground sm:text-xs">
              Foto da Fachada *
            </Label>
            <p className="text-[10px] text-muted-foreground sm:text-xs">
              Foto da frente da sua casa ou prédio (JPG ou PNG)
            </p>
            <Input
              id="house-photo"
              type="file"
              accept=".jpg,.jpeg,.png"
              onChange={(e) => handleFileChange(e, "photo")}
              className="h-9 cursor-pointer text-xs sm:h-10 sm:text-sm"
            />
            {housePhoto && (
              <div className="flex items-center gap-1 text-[10px] text-success sm:gap-1.5 sm:text-xs">
                <FileCheck className="h-3 w-3" />
                <span className="truncate">{housePhoto.name}</span>
              </div>
            )}
          </div>

          <div className="space-y-1.5 sm:space-y-2">
            <Label htmlFor="additional-info" className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground sm:text-xs">
              Informações Adicionais (Opcional)
            </Label>
            <Textarea
              id="additional-info"
              placeholder="Ex: Moro no apartamento 302, bloco B..."
              value={additionalInfo}
              onChange={(e) => setAdditionalInfo(e.target.value)}
              className="min-h-[70px] resize-none text-xs sm:min-h-[80px] sm:text-sm"
            />
          </div>
        </div>

        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || isRegistering || !isFormValid || !addressProof || !housePhoto}
          className="h-10 w-full text-sm sm:h-11"
        >
          {isSubmitting || isRegistering ? (
            <>
              <Upload className="mr-1.5 h-3.5 w-3.5 animate-pulse sm:mr-2 sm:h-4 sm:w-4" />
              Enviando...
            </>
          ) : (
            <>
              <Upload className="mr-1.5 h-3.5 w-3.5 sm:mr-2 sm:h-4 sm:w-4" />
              Solicitar Verificação
            </>
          )}
        </Button>

        <p className="text-center text-[10px] text-muted-foreground sm:text-xs">
          Seus documentos e endereço serão analisados em até 48 horas.
          <br />
          <span className="italic">
            Seu endereço completo nunca será exibido publicamente.
          </span>
        </p>
      </div>
    </div>
  );
}
