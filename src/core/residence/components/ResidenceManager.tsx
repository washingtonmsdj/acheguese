import { useState, useEffect, useCallback } from "react";
import { MapPin, Edit2, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Card } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Badge } from "@/shared/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/shared/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import {
  residenceService,
  UserResidence,
  UserResidenceWithRelations,
} from "@/core/residence/services/ResidenceService";
import { AddressService } from "@/core/address/services/AddressService";
import { useLocations } from "@/core/location/hooks/useLocations";
import { toast } from "sonner";
import { useSessionContext } from "@/core/session";
import { logger } from "@/shared/utils/logger";

export function ResidenceManager() {
  const { user } = useSessionContext();
  const [residence, setResidence] = useState<UserResidenceWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  // ETAPA 11: Carregar locations disponíveis
  const { data: allLocations = [] } = useLocations();
  const addressService = new AddressService();

  // Form state - ETAPA 12: Apenas campos para criar address
  const [street, setStreet] = useState("");
  const [number, setNumber] = useState("");
  const [complement, setComplement] = useState("");
  const [postalCode, setPostalCode] = useState("");
  
  // ETAPA 11: Campos canônicos com seleção explícita
  const [addressId, setAddressId] = useState<string | null>(null);
  const [locationId, setLocationId] = useState<string | null>(null);

  const fetchResidence = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      // ✅ ETAPA 12 - Carregar com relações canônicas
      const residences = await residenceService.getUserResidencesWithRelations(user.id);
      setResidence(residences[0] || null);
    } catch (error: any) {
      logger.error("Error fetching residence:", error);
      toast.error("Erro ao carregar residência");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchResidence();
    }
  }, [user, fetchResidence]);

  function openEditDialog() {
    if (residence) {
      // ETAPA 12: Carregar dados do address canônico
      setAddressId(residence.address_id);
      setLocationId(residence.location_id);
      // Campos do form serão carregados do address se necessário editar
      setStreet("");
      setNumber("");
      setComplement("");
      setPostalCode("");
    } else {
      setStreet("");
      setNumber("");
      setComplement("");
      setPostalCode("");
      setAddressId(null);
      setLocationId(null);
    }
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!user) {
      toast.error("Usuário não encontrado");
      return;
    }

    // ETAPA 12: Validar campos mínimos
    if (!locationId) {
      toast.error("Selecione o território");
      return;
    }

    if (!street || !number || !postalCode) {
      toast.error("Preencha rua, número e CEP");
      return;
    }

    try {
      if (residence) {
        // ETAPA 12: Update apenas preserva canônico (não permite editar address inline)
        toast.info("Edição de endereço não implementada. Crie uma nova residência.");
        return;
      } else {
        // ✅ ETAPA 12 - Criar com address manual canônico
        let createdAddressId: string;

        try {
          // Determinar address_type
          const hasStreetAndNumber = street.trim() && number.trim();
          const addressType = hasStreetAndNumber ? 'exact' : 'approximate';

          const address = await addressService.createAddress({
            location_id: locationId,
            street: street || null,
            number: number || null,
            complement: complement || null,
            postal_code: postalCode || null,
            address_type: addressType,
            geocoding_source: 'manual',
            latitude: null,
            longitude: null,
          });

          createdAddressId = address.id;
        } catch (err) {
          logger.error("Error creating address:", err);
          toast.error("Erro ao criar endereço canônico");
          return;
        }

        // Criar residência apenas com campos canônicos
        await residenceService.createResidence({
          user_id: user.id,
          address_id: createdAddressId,
          location_id: locationId,
          country: "Brasil",
        });
        toast.success("Residência cadastrada");
      }

      setDialogOpen(false);
      fetchResidence();
    } catch (error: any) {
      logger.error("Error saving residence:", error);
      toast.error("Erro ao salvar residência");
    }
  }

  async function handleRequestVerification() {
    if (!residence) return;

    try {
      // ✅ SSOT - Solicitar verificação usando ResidenceService
      await residenceService.requestVerification(residence.id);
      toast.success("Solicitação de verificação enviada");
      fetchResidence();
    } catch (error: any) {
      logger.error("Error requesting verification:", error);
      toast.error("Erro ao solicitar verificação");
    }
  }

  if (!user) {
    return (
      <Card className="p-6">
        <p className="text-sm text-muted-foreground">Usuário não encontrado</p>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="p-6">
        <p className="text-sm text-muted-foreground">Carregando...</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Minha Residência</h3>
          <p className="text-sm text-muted-foreground">Onde você mora</p>
        </div>
        <Button onClick={openEditDialog} size="sm">
          {residence ? (
            <>
              <Edit2 className="h-4 w-4 mr-2" />
              Editar
            </>
          ) : (
            <>
              <MapPin className="h-4 w-4 mr-2" />
              Cadastrar
            </>
          )}
        </Button>
      </div>

      {!residence ? (
        <Card className="p-6 text-center">
          <MapPin className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-sm text-muted-foreground mb-4">
            Nenhuma residência cadastrada
          </p>
          <Button onClick={openEditDialog} variant="outline" size="sm">
            Cadastrar Residência
          </Button>
        </Card>
      ) : (
        <Card className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="h-4 w-4 text-primary" />
                <h4 className="font-semibold">Endereço</h4>
                {residence.is_verified && (
                  <Badge variant="default" className="text-xs">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Verificado
                  </Badge>
                )}
                {!residence.is_verified &&
                  residence.verification_requested_at && (
                    <Badge variant="secondary" className="text-xs">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Em análise
                    </Badge>
                  )}
              </div>

              <div className="space-y-1 text-sm">
                <p>
                  {residence.address?.street}, {residence.address?.number}
                  {residence.address?.complement && ` - ${residence.address.complement}`}
                </p>
                <p className="text-muted-foreground">
                  {residence.location?.name}
                </p>
                <p className="text-muted-foreground">
                  CEP: {residence.address?.postal_code}
                </p>
              </div>

              {!residence.is_verified &&
                !residence.verification_requested_at && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={handleRequestVerification}
                  >
                    Solicitar Verificação
                  </Button>
                )}
            </div>

            <Button variant="ghost" size="sm" onClick={openEditDialog}>
              <Edit2 className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {residence ? "Editar" : "Cadastrar"} Residência
            </DialogTitle>
            <DialogDescription>Informe seu endereço completo</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4">
            {/* ETAPA 12: Seletor de território obrigatório */}
            <div className="col-span-2">
              <Label>Território (Cidade/Bairro) *</Label>
              <Select value={locationId || ""} onValueChange={setLocationId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione sua cidade ou bairro" />
                </SelectTrigger>
                <SelectContent>
                  {allLocations
                    .filter((loc) => loc.status === "active")
                    .map((loc) => (
                      <SelectItem key={loc.id} value={loc.id}>
                        {loc.name} ({loc.type === "city" ? "Cidade" : "Bairro"})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2">
              <Label>Rua/Avenida *</Label>
              <Input
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                placeholder="Ex: Rua das Flores"
              />
            </div>

            <div>
              <Label>Número *</Label>
              <Input
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                placeholder="Ex: 123"
              />
            </div>

            <div>
              <Label>Complemento</Label>
              <Input
                value={complement}
                onChange={(e) => setComplement(e.target.value)}
                placeholder="Ex: Apto 101"
              />
            </div>

            <div className="col-span-2">
              <Label>CEP *</Label>
              <Input
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                placeholder="Ex: 40000-000"
                maxLength={9}
              />
            </div>
          </div>

          <div className="flex gap-2 justify-end mt-4">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>Salvar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
