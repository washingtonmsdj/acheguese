import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

export function ClassificadoHeader() {
  const navigate = useNavigate();

  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b bg-card sticky top-0 z-10">
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => navigate(-1)}
        className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center"
      >
        <ArrowLeft className="h-5 w-5" />
      </motion.button>
      <h1 className="text-lg font-bold font-display">Novo Anúncio</h1>
    </div>
  );
}
