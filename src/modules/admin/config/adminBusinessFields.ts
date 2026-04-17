/**
 * 🏆 ADMIN BUSINESS FIELDS - SSOT COMPLIANT
 *
 * ✅ Campos baseados em business_data (SSOT)
 * ✅ Mapeamento correto para BusinessService
 * ✅ Campos legados removidos
 * ✅ Tipagem correta
 *
 * @version 1.0.0 - SSOT Migration
 */

export const ADMIN_BUSINESS_FIELDS = [
  { key: "name", label: "Nome", required: true },
  {
    key: "category",
    label: "Categoria",
    type: "select" as const,
    options: [
      "restaurante",
      "mercado",
      "farmacia",
      "saude",
      "educacao",
      "servicos",
      "lazer",
      "outros",
    ],
  },
  {
    key: "status",
    label: "Status",
    type: "select" as const,
    options: ["active", "inactive", "pending", "suspended"],
  },
  { key: "is_premium", label: "Plano Premium", type: "boolean" as const },
  { key: "is_verified", label: "Verificado", type: "boolean" as const },
  { key: "can_post_vagas", label: "Pode Publicar Vagas", type: "boolean" as const },
  { key: "is_featured", label: "Destaque", type: "boolean" as const },
  {
    key: "modos_atendimento",
    label: "Modos Atendimento (vírgula)",
    placeholder: "presencial, delivery, domicilio, online",
    hideInTable: true,
  },
  { key: "subcategoria", label: "Subcategoria", hideInTable: true },
  { key: "neighborhood", label: "Bairro" },
  { key: "address", label: "Endereço", hideInTable: true },
  { key: "cep", label: "CEP", hideInTable: true },
  { key: "phone", label: "Telefone" },
  { key: "whatsapp", label: "WhatsApp" },
  {
    key: "email",
    label: "E-mail",
    placeholder: "contato@empresa.com",
    hideInTable: true,
  },
  {
    key: "website",
    label: "Website",
    placeholder: "https://...",
    hideInTable: true,
  },
  {
    key: "instagram",
    label: "Instagram",
    placeholder: "@usuario",
    hideInTable: true,
  },
  {
    key: "facebook",
    label: "Facebook",
    placeholder: "https://facebook.com/...",
    hideInTable: true,
  },
  {
    key: "especialidades",
    label: "Especialidades (vírgula)",
    hideInTable: true,
    placeholder: "Carnes frescas, Aves, Peixes",
  },
  {
    key: "formas_pagamento",
    label: "Formas Pagamento (vírgula)",
    hideInTable: true,
    placeholder: "Dinheiro, PIX, Cartão",
  },
  {
    key: "facilidades",
    label: "Facilidades (vírgula)",
    hideInTable: true,
    placeholder: "Estacionamento, Wi-Fi, Acessibilidade",
  },
  {
    key: "tem_delivery",
    label: "Tem Delivery",
    type: "boolean" as const,
    hideInTable: true,
  },
  {
    key: "aceita_cartao",
    label: "Aceita Cartão",
    type: "boolean" as const,
    hideInTable: true,
  },
  {
    key: "aceita_pix",
    label: "Aceita PIX",
    type: "boolean" as const,
    hideInTable: true,
  },
  { key: "rating", label: "Avaliação", type: "number" as const },
  {
    key: "total_reviews",
    label: "Total Avaliações",
    type: "number" as const,
    hideInTable: true,
  },
  {
    key: "total_products",
    label: "Total Produtos",
    type: "number" as const,
    hideInTable: true,
  },
  {
    key: "description",
    label: "Descrição",
    type: "textarea" as const,
    hideInTable: true,
  },
  {
    key: "latitude",
    label: "Latitude",
    type: "number" as const,
    hideInTable: true,
  },
  {
    key: "longitude",
    label: "Longitude",
    type: "number" as const,
    hideInTable: true,
  },
  {
    key: "logo_url",
    label: "Logo URL",
    hideInTable: true,
    placeholder: "https://...",
  },
  {
    key: "banner_url",
    label: "Banner URL",
    hideInTable: true,
    placeholder: "https://...",
  },
  {
    key: "fotos",
    label: "Fotos (vírgula)",
    hideInTable: true,
    placeholder: "https://foto1.jpg, https://foto2.jpg",
  },
];

export const ADMIN_BUSINESS_CATEGORIES = [
  "restaurante",
  "mercado",
  "farmacia",
  "saude",
  "educacao",
  "servicos",
  "lazer",
  "outros",
] as const;

export const ADMIN_BUSINESS_STATUS = [
  "active",
  "inactive",
  "pending",
  "suspended",
] as const;

export type AdminBusinessCategory = (typeof ADMIN_BUSINESS_CATEGORIES)[number];
export type AdminBusinessStatus = (typeof ADMIN_BUSINESS_STATUS)[number];
