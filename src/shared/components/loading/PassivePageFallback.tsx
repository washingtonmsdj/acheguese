interface PassivePageFallbackProps {
  fullScreen?: boolean;
}

/**
 * Placeholder visual neutro para esperas curtas de rota/chunk.
 *
 * Não exibe spinner, mensagem ou timer de recuperação. Serve apenas para
 * preservar a superfície da página enquanto a resolução assíncrona termina,
 * sem criar a percepção de uma tela intermediária de carregamento.
 */
export function PassivePageFallback({
  fullScreen = true,
}: PassivePageFallbackProps) {
  return (
    <div
      className={fullScreen ? "min-h-screen bg-background" : "min-h-[40vh] bg-background"}
      role="status"
      aria-live="polite"
      aria-label="Carregando conteúdo"
      data-passive-page-fallback
    />
  );
}
