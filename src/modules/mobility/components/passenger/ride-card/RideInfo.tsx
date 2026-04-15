import React from "react";
import { Badge } from "@/shared/components/ui/badge";
import { Clock, DollarSign } from "lucide-react";
import { PAYMENT_METHOD } from "@/shared/types/constants";
interface RideInfoProps {
  departureTime: string;
  price: number;
  paymentMethod?: string;
  observation?: string;
}

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

export const RideInfo = ({
  departureTime,
  price,
  paymentMethod,
  observation,
}: RideInfoProps) => {
  return (
    <>
      <div className="flex items-center gap-4 mb-4 text-xs text-gray-400">
        <div className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 text-teal-400" />
          <span>{formatTime(departureTime)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <DollarSign className="h-3.5 w-3.5 text-emerald-400" />
          <span className="text-emerald-400 font-bold text-sm">
            R$ {price.toFixed(2)}
          </span>
        </div>
        {paymentMethod && (
          <Badge className="bg-white/5 text-gray-400 text-[0.6rem] px-2 rounded-full border border-white/10">
            {paymentMethod === PAYMENT_METHOD.PIX ? "💳 Pix" : "💵 Dinheiro"}
          </Badge>
        )}
      </div>

      {observation && (
        <div className="mb-4 px-3 py-2 rounded-xl bg-white/5 border border-white/5">
          <p className="text-xs text-gray-300 italic">"{observation}"</p>
        </div>
      )}
    </>
  );
};
