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

type VerificationStatus = "not_requested" | "pending" | "approved" | "rejected";

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
      const verificationResult = await VerificationService.createVerificationRequest({
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

      if (!verificationResult.success) throw new Error(verificationResult.error);

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
      <div className="rounded-2xl border border-success/30 bg-card overflow-hidden">
        <div className="p-5 border-b border-success/20 flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-success/10 flex items-center justify-center">
            <CheckCircle className="h-4 w-4 text-success" />
          </div>
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <VerifiedResidentBadge size="medium" showTooltip={false} />
            Morador Verificado
          </h3>
        </div>
        <div className="p-5">
          <div className="flex items-start gap-3 p-4 rounded-xl bg-success/5 border border-success/10">
            <CheckCircle className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm text-success mb-1">
                Parabéns! Você é um morador verificado
              </p>
              <p className="text-sm text-muted-foreground">
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
      <div className="rounded-2xl border border-warning/30 bg-card overflow-hidden">
        <div className="p-5 border-b border-warning/20 flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-warning/10 flex items-center justify-center">
            <Clock className="h-4 w-4 text-warning" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">Verificação Pendente</h3>
        </div>
        <div className="p-5">
          <div className="flex items-start gap-3 p-4 rounded-xl bg-warning/5 border border-warning/10">
            <Clock className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm text-warning mb-1">
                Sua solicitação está em análise
              </p>
              <p className="text-sm text-muted-foreground">
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
      <div className="rounded-2xl border border-destructive/30 bg-card overflow-hidden">
        <div className="p-5 border-b border-destructive/20 flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-destructive/10 flex items-center justify-center">
            <XCircle className="h-4 w-4 text-destructive" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">Verificação Rejeitada</h3>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex items-start gap-3 p-4 rounded-xl bg-destructive/5 border border-destructive/10">
            <XCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm text-destructive mb-1">
                Sua solicitação foi rejeitada
              </p>
              <p className="text-sm text-muted-foreground mb-2">
                {rejectionReason || "Os documentos enviados não foram aceitos."}
              </p>
              <p className="text-xs text-muted-foreground">
                Você pode enviar uma nova solicitação com documentos atualizados.
              </p>
            </div>
          </div>
          <Button
            onClick={() => setStatus("not_requested")}
            variant="outline"
            className="w-full"
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
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="p-5 border-b border-border flex items-center gap-2.5">
        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Home className="h-4 w-4 text-primary" />
        </div>
        <h3 className="text-sm font-semibold text-foreground">
          Torne-se um Morador Verificado
        </h3>
      </div>
      <div className="p-5 space-y-5">
        {/* Benefícios */}
        <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
          <p className="text-xs font-semibold text-primary mb-2 uppercase tracking-wider">
            Por que verificar?
          </p>
          <ul className="text-sm text-muted-foreground space-y-1.5 list-disc list-inside">
            <li>Aumente a confiança da comunidade em você</li>
            <li>Facilite empréstimos e trocas com vizinhos</li>
            <li>Participe de eventos exclusivos para moradores</li>
            <li>
              Receba o selo{" "}
              <VerifiedResidentBadge size="small" showTooltip={false} className="inline-flex mx-1" />{" "}
              ao lado do seu nome
            </li>
          </ul>
        </div>

        {/* Etapa 1: Endereço estruturado */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            <p className="text-xs font-semibold text-foreground uppercase tracking-wider">
              Etapa 1: Seu endereço
            </p>
          </div>

          {/* CEP */}
          <div className="space-y-2">
            <Label htmlFor="cep" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              CEP *
            </Label>
            <div className="flex gap-2">
              <Input
                id="cep"
                value={form.postalCode}
                onChange={(e) => handleCepChange(e.target.value)}
                placeholder="00000-000"
                maxLength={9}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => lookupCep(form.postalCode)}
                disabled={form.cepLoading || !form.postalCode}
              >
                <Search className={`h-4 w-4 ${form.cepLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
            {form.cepData && (
              <p className="text-xs text-success flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                {form.cepData.bairro && `${form.cepData.bairro}, `}
                {form.cepData.localidade}/{form.cepData.uf}
              </p>
            )}
          </div>

          {/* Logradouro */}
          <div className="space-y-2">
            <Label htmlFor="street" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Logradouro *
            </Label>
            <Input
              id="street"
              value={form.street}
              onChange={(e) => setField('street', e.target.value)}
              placeholder="Rua, Avenida, Travessa..."
              disabled={form.cepLoading}
            />
          </div>

          {/* Número + Complemento */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="number" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Número *
              </Label>
              <Input
                id="number"
                value={form.number}
                onChange={(e) => setField('number', e.target.value)}
                placeholder="123"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="complement" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Complemento
              </Label>
              <Input
                id="complement"
                value={form.complement}
                onChange={(e) => setField('complement', e.target.value)}
                placeholder="Apto, Bloco..."
              />
            </div>
          </div>
        </div>

        {/* Etapa 2: Documentos */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Upload className="h-4 w-4 text-primary" />
            <p className="text-xs font-semibold text-foreground uppercase tracking-wider">
              Etapa 2: Documentos
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address-proof" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Comprovante de Endereço *
            </Label>
            <p className="text-xs text-muted-foreground">
              Conta de luz, água, internet, etc. (PDF, JPG ou PNG)
            </p>
            <Input
              id="address-proof"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => handleFileChange(e, "proof")}
              className="cursor-pointer"
            />
            {addressProof && (
              <div className="flex items-center gap-1.5 text-xs text-success">
                <FileCheck className="h-3 w-3" />
                {addressProof.name}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="house-photo" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Foto da Fachada *
            </Label>
            <p className="text-xs text-muted-foreground">
              Foto da frente da sua casa ou prédio (JPG ou PNG)
            </p>
            <Input
              id="house-photo"
              type="file"
              accept=".jpg,.jpeg,.png"
              onChange={(e) => handleFileChange(e, "photo")}
              className="cursor-pointer"
            />
            {housePhoto && (
              <div className="flex items-center gap-1.5 text-xs text-success">
                <FileCheck className="h-3 w-3" />
                {housePhoto.name}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="additional-info" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Informações Adicionais (Opcional)
            </Label>
            <Textarea
              id="additional-info"
              placeholder="Ex: Moro no apartamento 302, bloco B..."
              value={additionalInfo}
              onChange={(e) => setAdditionalInfo(e.target.value)}
              className="min-h-[80px] resize-none"
            />
          </div>
        </div>

        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || isRegistering || !isFormValid || !addressProof || !housePhoto}
          className="w-full h-11"
        >
          {isSubmitting || isRegistering ? (
            <>
              <Upload className="h-4 w-4 mr-2 animate-pulse" />
              Enviando...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Solicitar Verificação
            </>
          )}
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          Seus documentos e endereço serão analisados em até 48 horas.
          <br />
          <span className="text-xs italic">
            Seu endereço completo nunca será exibido publicamente.
          </span>
        </p>
      </div>
    </div>
  );
}
