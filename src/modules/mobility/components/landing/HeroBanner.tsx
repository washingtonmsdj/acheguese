import React, { memo } from "react";
import { motion } from "framer-motion";
import { Zap } from "lucide-react";

export const HeroBanner = memo(() => (
  <div className="relative w-full h-32 md:h-48 overflow-hidden bg-gradient-to-br from-background via-card to-secondary">
    {/* Background Image with Overlay */}
    <div className="absolute inset-0">
      <img
        src="https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?q=80&w=2070&auto=format&fit=crop"
        alt="Mobilidade urbana"
        className="w-full h-full object-cover opacity-20"
      />
      <div className="absolute inset-0 bg-gradient-to-br from-background/95 via-card/90 to-secondary/95" />
    </div>
  </div>
));

HeroBanner.displayName = "HeroBanner";
