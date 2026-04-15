import React from "react";

interface RideRouteProps {
  origin: string;
  destination: string;
}

export const RideRoute = ({ origin, destination }: RideRouteProps) => {
  return (
    <div className="flex items-start gap-3 mb-4">
      <div className="mt-1 flex flex-col items-center">
        <div className="w-3 h-3 rounded-full bg-teal-400 border-2 border-teal-400/30" />
        <div className="w-0.5 h-8 bg-gradient-to-b from-teal-400/50 to-amber-400/50" />
        <div className="w-3 h-3 rounded-full bg-amber-400 border-2 border-amber-400/30" />
      </div>
      <div className="flex-1 space-y-3">
        <div>
          <p className="text-[0.65rem] text-gray-500 uppercase tracking-wider">
            Origem
          </p>
          <p className="text-sm text-white font-medium">{origin}</p>
        </div>
        <div>
          <p className="text-[0.65rem] text-gray-500 uppercase tracking-wider">
            Destino
          </p>
          <p className="text-sm text-white font-medium">{destination}</p>
        </div>
      </div>
    </div>
  );
};
