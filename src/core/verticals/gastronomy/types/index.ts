export type CuisineType =
  | "brasileira"
  | "italiana"
  | "japonesa"
  | "chinesa"
  | "mexicana"
  | "arabe"
  | "francesa"
  | "portuguesa"
  | "indiana"
  | "tailandesa"
  | "americana"
  | "vegetariana"
  | "vegana"
  | "frutos-do-mar"
  | "churrascaria"
  | "pizzaria"
  | "hamburgueria"
  | "hamburguer"
  | "lanchonete"
  | "cafeteria"
  | "padaria"
  | "sorveteria"
  | "doceria"
  | "bar"
  | "pub"
  | "contemporanea"
  | "fusion"
  | "regional"
  | "baiana"
  | "mineira"
  | "nordestina"
  | "pastel"
  | "outros";

export type GastronomyActivationStatus =
  | "not_configured"
  | "active"
  | "inactive"
  | "temporarily_closed"
  | "not_eligible";

export interface GastronomyProfileStatus {
  id: string;
  business_id: string;
  status: Exclude<GastronomyActivationStatus, "not_configured" | "not_eligible">;
}

