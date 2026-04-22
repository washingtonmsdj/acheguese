import React from "react";
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { mediaService } from "@/core/media/services/MediaService";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Upload, Loader2, CalendarIcon, MapPin } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import { Label } from "@/shared/components/ui/label";
import { useAppUrls } from "@/core/routing/hooks"; // ✅ SSOT URLs
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Calendar } from "@/shared/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/components/ui/popover";
import { LocationPickerSheet } from "@/shared/components/LocationPickerSheet";
import { useToast } from "@/shared/hooks/use-toast";
import { lostFoundService } from "@/modules/community/lostfound/services";
import { useAuth } from "@/core/auth/hooks/useAuth";
import { cn } from "@/shared/utils/cn";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { InlineFieldError } from "@/shared/components/ui/InlineFieldError";
import {
  NovoAchadoPerdidoSchema,
  type NovoAchadoPerdidoInput,
} from "@/shared/validation/schemas/lostfound.schema";
const CATEGORIAS = [
  { id: "animal", label: "Animal perdido", icon: "🐾" },
  { id: "celular", label: "Celular", icon: "📱" },
  { id: "documentos", label: "Documentos", icon: "📄" },
  { id: "chaves", label: "Chaves", icon: "🔑" },
  { id: "carteira", label: "Carteira", icon: "👛" },
  { id: "objetos", label: "Objetos diversos", icon: "📦" },
  { id: "outro", label: "Outro", icon: "❓" },
];

const BAIRROS = [
  "Nova Holanda",
  "Parque União",
  "Rubens Vaz",
  "Parque Maré",
  "Baixa do Sapateiro",
  "Morro do Timbau",
  "Parque Roquete Pinto",
  "Praia de Ramos",
  "Conjunto Esperança",
  "Vila do João",
  "Salsa e Merengue",
  "Marcílio Dias",
  "Bento Ribeiro Dantas",
  "Conjunto Pinheiros",
  "Vila dos Pinheiros",
  "Novo Pinheiros",
];

export default function NovoAchadoPerdidoPage() {
  const navigate = useNavigate();
  const appUrls = useAppUrls(); // ✅ SSOT URLs
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [photoPreview, setFotoPreview] = useState<string | null>(null);
  const [photoFile, setFotoFile] = useState<File | null>(null);
  const [locationPickerOpen, setLocationPickerOpen] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<NovoAchadoPerdidoInput>({
    resolver: zodResolver(NovoAchadoPerdidoSchema),
    mode: "onBlur",
    defaultValues: {
      tipo: undefined,
      category: undefined,
      titulo: "",
      description: "",
      neighborhood: "",
      localizacaoAprox: "",
      dateOcorrido: new Date(),
      latitude: null,
      longitude: null,
    },
  });

  const watchTipo = watch("tipo");
  const watchLatitude = watch("latitude");
  const watchLongitude = watch("longitude");

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setFotoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const onValid = async (data: NovoAchadoPerdidoInput) => {
    if (!user) {
      toast({ title: "Faça login para publicar", variant: "destructive" });
      navigate(appUrls.auth.login); // ✅ SSOT
      return;
    }

    setLoading(true);
    try {
      let photoUrl = "";
      // Upload usando MediaService
      if (photoFile) {
        const result = await mediaService.uploadPostImage(user.id, photoFile);
        photoUrl = result.url;
      }

      // ✅ SSOT: Usar LostFoundService para criar post
      const result = await lostFoundService.createPost({
        autor_id: user.id,
        tipo: data.tipo === "encontrado" ? "achado" : data.tipo,
        categoria: data.category,
        titulo: data.titulo.trim(),
        descricao: data.description?.trim() ?? "",
        imagens: photoUrl ? [photoUrl] : [],
        local_perdido: data.localizacaoAprox?.trim() ?? "",
        data_perdido: format(data.dateOcorrido, "yyyy-MM-dd"),
        resolvido: false,
      });

      if (!result) throw new Error("Erro ao criar post");
      toast({ title: "Publicação criada!" });
      navigate(`/achados-perdidos/${result.id}`);
    } catch {
      toast({ title: "Erro ao publicar", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col pb-24">
      <div className="flex items-center gap-3 px-4 py-3 border-b sticky top-0 bg-background z-10">
        <button
          onClick={() => navigate(-1)}
          className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-bold font-display">Publicar item</h1>
      </div>

      <form onSubmit={handleSubmit(onValid)} className="px-4 py-4 space-y-4">
        {/* Tipo */}
        <div className="space-y-2">
          <Label>O que aconteceu? *</Label>
          <Controller
            name="tipo"
            control={control}
            render={({ field }) => (
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => field.onChange("perdido")}
                  className={cn(
                    "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                    field.value === "perdido"
                      ? "border-destructive bg-destructive/5"
                      : "border-border bg-card hover:bg-secondary/50",
                  )}
                >
                  <span className="text-3xl">😢</span>
                  <span className="text-sm font-bold">Perdi algo</span>
                  <span className="text-[10px] text-muted-foreground">
                    Preciso de ajuda para encontrar
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => field.onChange("encontrado")}
                  className={cn(
                    "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                    field.value === "encontrado"
                      ? "border-success bg-success/5"
                      : "border-border bg-card hover:bg-secondary/50",
                  )}
                >
                  <span className="text-3xl">🤗</span>
                  <span className="text-sm font-bold">Encontrei algo</span>
                  <span className="text-[10px] text-muted-foreground">
                    Quero devolver ao dono
                  </span>
                </button>
              </div>
            )}
          />
          <InlineFieldError message={errors.tipo?.message} />
        </div>

        {/* Categoria */}
        <div className="space-y-2">
          <Label>Categoria do item *</Label>
          <Controller
            name="category"
            control={control}
            render={({ field }) => (
              <div className="grid grid-cols-2 gap-2">
                {CATEGORIAS.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => field.onChange(cat.id)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-xl border text-left transition-all text-sm",
                      field.value === cat.id
                        ? "bg-primary/10 border-primary"
                        : "bg-card border-border hover:bg-secondary/50",
                    )}
                  >
                    <span className="text-lg">{cat.icon}</span>
                    <span className="font-medium text-xs">{cat.label}</span>
                  </button>
                ))}
              </div>
            )}
          />
          <InlineFieldError message={errors.category?.message} />
        </div>

        {/* Foto */}
        <div className="flex flex-col items-center gap-2">
          <Label>Foto (opcional)</Label>
          <label className="cursor-pointer w-full">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFotoChange}
            />
            {photoPreview ? (
              <img
                src={photoPreview}
                alt="Preview"
                className="w-full h-40 rounded-xl object-cover border-2 border-dashed border-primary"
              />
            ) : (
              <div className="w-full h-32 rounded-xl bg-secondary border-2 border-dashed border-muted-foreground flex flex-col items-center justify-center">
                <Upload className="h-6 w-6 text-muted-foreground" />
                <span className="text-xs text-muted-foreground mt-1">
                  Toque para add photo
                </span>
              </div>
            )}
          </label>
        </div>

        {/* Título */}
        <div className="space-y-1.5">
          <Label>Título *</Label>
          <Input
            {...register("titulo")}
            placeholder="Ex: Cachorro perdido na Nova Holanda"
            maxLength={150}
          />
          <InlineFieldError message={errors.titulo?.message} />
        </div>

        {/* Descrição */}
        <div className="space-y-1.5">
          <Label>Descrição</Label>
          <Textarea
            {...register("description")}
            placeholder="Descreva o item com o máximo de detalhes: cor, tamanho, características..."
            rows={3}
            maxLength={1000}
          />
          <InlineFieldError message={errors.description?.message} />
        </div>

        {/* Bairro */}
        <div className="space-y-1.5">
          <Label>Bairro</Label>
          <Controller
            name="neighborhood"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o bairro" />
                </SelectTrigger>
                <SelectContent>
                  {BAIRROS.map((b) => (
                    <SelectItem key={b} value={b}>
                      {b}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>

        {/* Localização aprox */}
        <div className="space-y-1.5">
          <Label>Localização aproximada</Label>
          <Input {...register("localizacaoAprox")} placeholder="Ex: Perto da praça principal" />
        </div>

        {/* Localização Exata no Mapa */}
        <div className="space-y-2">
          <Label>Localização Exata (Opcional)</Label>
          <p className="text-xs text-muted-foreground mb-2">
            Marque no mapa o ponto exato onde{" "}
            {watchTipo === "perdido" ? "perdeu" : "encontrou"} o item. Isso
            ajuda outras pessoas a localizarem melhor.
          </p>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => setLocationPickerOpen(true)}
          >
            <MapPin className="h-4 w-4 mr-2" />
            {watchLatitude && watchLongitude
              ? `📍 Localização marcada (${watchLatitude.toFixed(4)}, ${watchLongitude.toFixed(4)})`
              : "Marcar no Mapa"}
          </Button>
          {watchLatitude && watchLongitude && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full text-xs"
              onClick={() => {
                setValue("latitude", null);
                setValue("longitude", null);
              }}
            >
              Remover localização
            </Button>
          )}
        </div>

        {/* Data */}
        <div className="space-y-1.5">
          <Label>Data do ocorrido *</Label>
          <Controller
            name="dateOcorrido"
            control={control}
            render={({ field }) => (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {field.value
                      ? format(field.value, "dd 'de' MMMM 'de' yyyy", {
                          locale: ptBR,
                        })
                      : "Selecione a data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(d) => d > new Date()}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            )}
          />
          <InlineFieldError message={errors.dateOcorrido?.message} />
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={loading}
        >
          {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Publicar
        </Button>
      </form>

      {/* Location Picker Sheet */}
      <LocationPickerSheet
        open={locationPickerOpen}
        onOpenChange={setLocationPickerOpen}
        initialLat={watchLatitude || undefined}
        initialLng={watchLongitude || undefined}
        onConfirm={(lat, lng) => {
          setValue("latitude", lat);
          setValue("longitude", lng);
          setLocationPickerOpen(false);
        }}
      />
    </div>
  );
}
