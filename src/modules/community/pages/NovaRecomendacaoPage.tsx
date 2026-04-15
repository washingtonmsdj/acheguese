import React from "react";
import { useNovaRecomendacao } from "@/modules/community/hooks/useNovaRecomendacao";
import { RecomendacaoHeader } from "@/shared/components/recomendacoes/RecomendacaoHeader";
import { RecomendacaoTip } from "@/shared/components/recomendacoes/RecomendacaoTip";
import { CategorySelector } from "@/shared/components/recomendacoes/CategorySelector";
import { RecomendacaoForm } from "@/shared/components/recomendacoes/RecomendacaoForm";

export default function NovaRecomendacaoPage() {
  const {
    // Data
    formData,
    loading,

    // Computed
    isFormValid,

    // Actions
    updateField,
    submitRecomendacao,
    handleGoBack,
  } = useNovaRecomendacao();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitRecomendacao();
  };

  const handleCategoryChange = (categoryId: string) => {
    updateField("category", categoryId);
  };

  return (
    <div className="flex flex-col pb-24">
      <RecomendacaoHeader onGoBack={handleGoBack} />

      <div className="px-4 py-4 space-y-5">
        <RecomendacaoTip />

        <CategorySelector
          selectedCategory={formData.category}
          onCategoryChange={handleCategoryChange}
        />

        <RecomendacaoForm
          formData={formData}
          loading={loading}
          isFormValid={isFormValid}
          onFieldChange={updateField}
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  );
}
