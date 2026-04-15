import React from "react";
import { Button } from "@/shared/components/ui/button";

export function SkipToContent() {
  const skipToMain = () => {
    const mainContent = document.getElementById("main-content");
    if (mainContent) {
      mainContent.focus();
      mainContent.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <Button
      onClick={skipToMain}
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 bg-primary text-primary-foreground"
      variant="default"
      size="sm"
    >
      Pular para o conteúdo principal
    </Button>
  );
}
