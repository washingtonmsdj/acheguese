interface RideRouteProps {
  origin?: string | null;
  destination?: string | null;
}

export const RideRoute = ({ origin, destination }: RideRouteProps) => {
  return (
    <div className="mb-4 flex items-start gap-3">
      <div className="mt-1 flex flex-col items-center" aria-hidden="true">
        <div className="h-3 w-3 rounded-full border-2 border-category-mobility/30 bg-category-mobility" />
        <div className="h-8 w-0.5 bg-gradient-to-b from-category-mobility/50 to-warning/50" />
        <div className="h-3 w-3 rounded-full border-2 border-warning/30 bg-warning" />
      </div>
      <div className="min-w-0 flex-1 space-y-3">
        <div>
          <p className="text-[0.65rem] uppercase tracking-wider text-muted-foreground">
            Origem
          </p>
          <p className="break-words text-sm font-medium text-foreground">
            {origin || "Origem não informada"}
          </p>
        </div>
        <div>
          <p className="text-[0.65rem] uppercase tracking-wider text-muted-foreground">
            Destino
          </p>
          <p className="break-words text-sm font-medium text-foreground">
            {destination || "Destino não informado"}
          </p>
        </div>
      </div>
    </div>
  );
};
