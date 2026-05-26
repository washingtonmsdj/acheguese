// Admin Module - Public API

// Services
export { adminRolesService } from "../../core/admin/services/AdminRolesService";
export type { UserRole } from "../../core/admin/services/AdminRolesService";
export { adminStatsService } from "../../core/admin/services/AdminStatsService";
export type {
  TableStats,
  ActivityData,
  RecentActivity,
  PremiumStats,
} from "../../core/admin/services/AdminStatsService";

// Pages exported for routing
export { default as AdminDashboard } from "./pages/AdminDashboard";
export { default as AdminUsuarios } from "./pages/AdminUsuarios";
export { default as AdminModeracao } from "./pages/AdminModeracao";
export { default as AdminAlertas } from "./pages/AdminAlertas";
export { default as AdminMotoristas } from "@/core/admin/drivers/pages/AdminMotoristasPage";
export { default as AdminEmpresas } from "./pages/AdminEmpresas";
export { default as AdminServicos } from "./pages/AdminServicos";
export { default as AdminClassificados } from "./pages/AdminClassificados";
export { default as AdminZeladoria } from "./pages/AdminZeladoria";
export { default as AdminEventos } from "./pages/AdminEventos";
export { default as AdminMensagens } from "./pages/AdminMensagens";
export { default as AdminCupons } from "./pages/AdminCupons";
export { default as AdminGamificacao } from "./pages/AdminGamificacao";
export { default as AdminConfiguracoes } from "./pages/AdminConfiguracoes";
export { default as AdminOperacoes } from "./pages/AdminOperacoes";
export { default as AdminSSOT } from "./pages/AdminSSOT";
export { default as AdminVerificacoes } from "./pages/AdminVerificacoes";
export { default as AdminModeracaoCompleta } from "./pages/AdminModeracaoCompleta";
export { default as AdminModeracaoComunidade } from "./pages/AdminModeracaoComunidade";
export { default as AdminPontosEmbarque } from "./pages/AdminPontosEmbarque";
export { default as AdminReportsPassageiros } from "./pages/AdminReportsPassageiros";
export { default as AdminReivindicacoes } from "./pages/AdminReivindicacoes";
export { default as AdminAnalyticsMobilidade } from "./pages/AdminAnalyticsMobilidade";
export { default as AdminRealtimeDashboard } from "./pages/AdminRealtimeDashboard";
export { default as BannersPage } from "./pages/BannersPage";
export { default as AdminLayout } from "./pages/AdminLayout";
export { default as AdminGastronomia } from "./pages/AdminGastronomia";
export { default as AdminVagas } from "./pages/AdminVagas";
export { default as AdminRoles } from "./pages/AdminRoles";
export { default as AdminPromocoes } from "./pages/AdminPromocoes";
export { default as AdminAssinaturas } from "./pages/AdminAssinaturas";
export { default as AdminCommunityAlerts } from "./pages/AdminCommunityAlerts";
export { default as AdminCommunityIssues } from "./pages/AdminCommunityIssues";
export { default as AdminPricing } from "./pages/AdminPricing";
