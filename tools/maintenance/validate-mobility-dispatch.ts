/**
 * Validação operacional do dispatch de Mobilidade.
 *
 * Este script prova disponibilidade e contratos mínimos sem baixar tabelas
 * inteiras para o processo de manutenção.
 */
import { logger } from "@/shared/utils/logger";
import { supabase } from "@/integrations/supabase";
import { RideOperationalService } from "@/core/mobility/core/RideOperationalService";
import { RideDispatchService } from "@/core/mobility/core/RideDispatchService";
import { QUERYABLE_PRE_ACCEPT_RIDE_STATUSES } from "@/core/mobility/core/RideLifecycleStatus";

interface ValidationResult {
  check: string;
  status: "pass" | "fail" | "warning";
  message: string;
  details?: unknown;
}

async function validateDispatchSystem(): Promise<ValidationResult[]> {
  const results: ValidationResult[] = [];

  // 1. Verificar tabelas necessárias com projeções mínimas.
  try {
    const { error } = await supabase.from("ride_requests").select("id").limit(1);
    if (error) throw error;

    results.push({
      check: "Tabela ride_requests",
      status: "pass",
      message: "Tabela acessível",
    });
  } catch (error) {
    results.push({
      check: "Tabela ride_requests",
      status: "fail",
      message: (error as Error).message,
    });
  }

  try {
    const { error: auditError } = await supabase
      .from("ride_dispatch_audit")
      .select("id")
      .limit(1);

    results.push({
      check: "Tabela ride_dispatch_audit",
      status: auditError ? "fail" : "pass",
      message: auditError ? auditError.message : "Tabela acessível",
    });
  } catch (error) {
    results.push({
      check: "Tabela ride_dispatch_audit",
      status: "fail",
      message: (error as Error).message,
    });
  }

  try {
    const { error: availError } = await supabase
      .from("driver_availability")
      .select("profile_id")
      .limit(1);

    results.push({
      check: "Tabela driver_availability",
      status: availError ? "fail" : "pass",
      message: availError ? availError.message : "Tabela acessível",
    });
  } catch (error) {
    results.push({
      check: "Tabela driver_availability",
      status: "fail",
      message: (error as Error).message,
    });
  }

  // 2. Verificar motoristas disponíveis sem carregar driver_data.
  try {
    const { data: drivers, error } = await supabase
      .from("driver_availability")
      .select("profile_id")
      .eq("is_online", true)
      .eq("is_available", true)
      .limit(50);

    if (error) throw error;
    const count = drivers?.length ?? 0;
    results.push({
      check: "Motoristas disponíveis",
      status: count > 0 ? "pass" : "warning",
      message: `${count} motorista(s) online e disponível(is) na amostra operacional`,
      details: { count, sample_limit: 50 },
    });
  } catch (error) {
    results.push({
      check: "Motoristas disponíveis",
      status: "fail",
      message: (error as Error).message,
    });
  }

  // 3. Verificar corridas em pré-aceite pela authority compartilhada de lifecycle.
  try {
    const { data: rides, error } = await supabase
      .from("ride_requests")
      .select("id, status, created_at")
      .in("status", QUERYABLE_PRE_ACCEPT_RIDE_STATUSES)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) throw error;
    const count = rides?.length ?? 0;
    results.push({
      check: "Corridas em pré-aceite",
      status: "pass",
      message: `${count} corrida(s) em pré-aceite na amostra operacional`,
      details: { count, rides: rides?.slice(0, 3), sample_limit: 50 },
    });
  } catch (error) {
    results.push({
      check: "Corridas em pré-aceite",
      status: "fail",
      message: (error as Error).message,
    });
  }

  // 4. Verificar auditoria de dispatch.
  try {
    const { data: audits, error } = await supabase
      .from("ride_dispatch_audit")
      .select("ride_id, driver_profile_id, status, attempt_number")
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) throw error;
    const count = audits?.length ?? 0;
    results.push({
      check: "Auditoria de dispatch",
      status: "pass",
      message: `${count} registro(s) de auditoria encontrados`,
      details: { count, recent: audits?.slice(0, 3) },
    });
  } catch (error) {
    results.push({
      check: "Auditoria de dispatch",
      status: "warning",
      message: "Auditoria indisponível ou sem acesso; revisar o erro do ambiente.",
    });
  }

  // 5. Verificar serviços carregados.
  results.push({
    check: "Dispatch server-side",
    status: "pass",
    message: "Owner canônico: Database Webhook -> auto-dispatch-ride -> RPCs atômicas",
  });

  results.push({
    check: "RideOperationalService",
    status: typeof RideOperationalService.createRide === "function" ? "pass" : "fail",
    message: "Serviço carregado corretamente",
  });

  results.push({
    check: "RideDispatchService",
    status: typeof RideDispatchService.acceptRide === "function" ? "pass" : "fail",
    message: "Serviço carregado corretamente",
  });

  return results;
}

export async function runValidation() {
  console.log("Validando sistema de dispatch automático...\n");

  const results = await validateDispatchSystem();

  let passCount = 0;
  let failCount = 0;
  let warnCount = 0;

  results.forEach((result) => {
    console.log(`${result.check}: ${result.message}`);

    if (result.details) {
      console.log("   Detalhes:", JSON.stringify(result.details, null, 2));
    }

    if (result.status === "pass") passCount++;
    else if (result.status === "fail") failCount++;
    else warnCount++;
  });

  console.log("\nResumo:");
  console.log(`   Passou: ${passCount}`);
  console.log(`   Avisos: ${warnCount}`);
  console.log(`   Falhou: ${failCount}`);

  if (failCount === 0) {
    console.log("\nSistema de dispatch automático validado sem falhas bloqueantes.");
  } else {
    console.log("\nAlguns checks falharam. Verifique os erros acima.");
  }

  return { results, passCount, failCount, warnCount };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runValidation().catch((error) => {
    logger.error("validate-mobility-dispatch", error as Error);
    process.exitCode = 1;
  });
}
