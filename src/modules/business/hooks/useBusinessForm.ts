import { useState, useRef } from "react";
import { toast } from "sonner";
import type { Business } from "@/core/business/types";

export function useBusinessForm() {
  const [etapa, setEtapa] = useState(1);
  const logoRef = useRef<HTMLInputElement>(null);
  const bannerRef = useRef<HTMLInputElement>(null);

  // Etapa 1: Básico
  const [name, setNome] = useState("");
  const [description, setDescricao] = useState("");
  const [category, setCategoria] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string>("");

  // Etapa 2: Contato
  const [phone, setTelefone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [address, setEndereco] = useState("");
  const [schedules, setHorarios] = useState("");
  const [selectedModos, setSelectedModos] = useState<string[]>(["presencial"]);

  // Etapa 3: Extras
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [bannerUrl, setBannerUrl] = useState<string>("");
  const [website, setWebsite] = useState("");
  const [instagram, setInstagram] = useState("");
  const [facebook, setFacebook] = useState("");
  const [selectedPagamentos, setSelectedPagamentos] = useState<string[]>([]);
  const [especialidades, setEspecialidades] = useState("");
  const [facilidades, setFacilidades] = useState("");

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Logo deve ter no máximo 5MB");
      return;
    }
    setLogoFile(file);
    const reader = new FileReader();
    reader.onload = () => setLogoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Banner deve ter no máximo 5MB");
      return;
    }
    setBannerFile(file);
    const reader = new FileReader();
    reader.onload = () => setBannerPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const loadBusinessData = (business: Business) => {
    setNome(business.name || "");
    setDescricao(business.description || "");
    setCategoria(business.category || "");
    setLogoUrl(business.logo_url || "");
    setLogoPreview(business.logo_url || "");

    setTelefone(business.phone || "");
    setWhatsapp(business.whatsapp || "");
    setEmail(business.email || "");
    
    // ETAPA 12: Usar address canônico
    const addressParts: string[] = [];
    if (business.address?.street) addressParts.push(business.address.street);
    if (business.address?.number) addressParts.push(business.address.number);
    if (business.address?.complement) addressParts.push(business.address.complement);
    setEndereco(addressParts.join(', '));
    
    setHorarios(
      business.horario_funcionamento
        ? JSON.stringify(business.horario_funcionamento)
        : "",
    );
    setSelectedModos(business.modos_atendimento || ["presencial"]);

    setBannerUrl(business.banner_url || "");
    setBannerPreview(business.banner_url || "");
    setWebsite(business.website || "");
    setInstagram(business.instagram || "");
    setFacebook(business.facebook || "");
    setSelectedPagamentos(business.formas_pagamento || []);
    setEspecialidades(business.especialidades?.join(", ") || "");
    setFacilidades(business.facilidades?.join(", ") || "");
  };

  const getFormData = () => ({
    name,
    description,
    category,
    phone,
    whatsapp,
    email,
    address,
    schedules,
    website,
    instagram,
    facebook,
    logoFile,
    logoUrl,
    bannerFile,
    bannerUrl,
    selectedModos,
    selectedPagamentos,
    especialidades: especialidades
      ? especialidades.split(",").map((e) => e.trim())
      : [],
    facilidades: facilidades ? facilidades.split(",").map((f) => f.trim()) : [],
  });

  return {
    etapa,
    setEtapa,
    logoRef,
    bannerRef,
    name,
    setNome,
    description,
    setDescricao,
    category,
    setCategoria,
    logoFile,
    logoPreview,
    logoUrl,
    phone,
    setTelefone,
    whatsapp,
    setWhatsapp,
    email,
    setEmail,
    address,
    setEndereco,
    schedules,
    setHorarios,
    selectedModos,
    setSelectedModos,
    bannerFile,
    bannerPreview,
    bannerUrl,
    website,
    setWebsite,
    instagram,
    setInstagram,
    facebook,
    setFacebook,
    selectedPagamentos,
    setSelectedPagamentos,
    especialidades,
    setEspecialidades,
    facilidades,
    setFacilidades,
    errors,
    setErrors,
    handleLogoChange,
    handleBannerChange,
    loadBusinessData,
    getFormData,
  };
}
