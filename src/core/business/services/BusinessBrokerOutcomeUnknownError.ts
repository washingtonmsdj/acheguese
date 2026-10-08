/**
 * A broker invocation may have been committed remotely when its response was
 * lost. This is different from a definite rejection. Do not automatically
 * compensate or resubmit commands without server-side idempotency.
 */
export class BusinessBrokerOutcomeUnknownError extends Error {
  readonly operation: "create" | "update";

  constructor(operation: "create" | "update") {
    super(
      operation === "create"
        ? "Não foi possível confirmar o cadastro. Verifique suas empresas antes de tentar novamente."
        : "Não foi possível confirmar a atualização. Verifique os dados da empresa antes de salvar novamente.",
    );
    this.name = "BusinessBrokerOutcomeUnknownError";
    this.operation = operation;
  }
}
