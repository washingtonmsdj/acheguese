import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Flag, Pencil } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Skeleton } from "@/shared/components/ui/skeleton";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/components/ui/tabs";
import { ReportContentDialog } from "@/core/moderation/components/ReportContentDialog";
import { ProfessionalHeader } from "@/modules/services/components/ProfessionalHeader";
import { ProfessionalActionButtons } from "@/modules/services/components/ProfessionalActionButtons";
import { ProfessionalDetails } from "@/modules/services/components/ProfessionalDetails";
import { ProfessionalReviewForm } from "@/modules/services/components/ProfessionalReviewForm";
import { ProfessionalReviewsList } from "@/modules/services/components/ProfessionalReviewsList";
import { useProfessionalDetail } from "@/modules/services/hooks/useProfessionalDetail";
import { useProfessionalReviews } from "@/modules/services/hooks/useProfessionalReviews";
import { useServiceUrls } from "@/modules/services/hooks/useServiceUrls";
import { ProfessionalService } from "@/core/professional/services/ProfessionalService";

export default function ProfissionalDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const serviceUrls = useServiceUrls();

  const [showReviewForm, setShowReviewForm] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);

  const { professional, loading, notFound, isOwner } =
    useProfessionalDetail(id);
  const { reviews, userReview, submitReview } = useProfessionalReviews(id);

  // Increment views on mount
  useEffect(() => {
    if (id) ProfessionalService.incrementViews(id);
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center px-4 pt-16 space-y-3">
        <Skeleton className="h-24 w-24 rounded-2xl" />
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-32 w-full mt-4" />
      </div>
    );
  }

  if (notFound || !professional) {
    return (
      <div className="p-4 text-center">
        <p className="text-muted-foreground">Profissional não encontrado.</p>
        <Button
          variant="outline"
          onClick={() => navigate(serviceUrls.list)}
          className="mt-4"
        >
          Voltar para Serviços
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col pb-24">
      {/* Header Bar */}
      <div className="flex items-center gap-3 px-4 py-3 border-b sticky top-0 bg-background z-10">
        <button
          onClick={() => navigate(-1)}
          className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        <h1 className="text-lg font-bold font-display">Perfil Profissional</h1>

        <div className="ml-auto flex items-center gap-1">
          {isOwner && (
            <button
              onClick={() => navigate(serviceUrls.edit(id!))}
              className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center"
            >
              <Pencil className="h-4 w-4 text-primary" />
            </button>
          )}
          <button
            onClick={() => setShowReportDialog(true)}
            className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center"
          >
            <Flag className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Professional Header */}
      <ProfessionalHeader professional={professional} />

      {/* Action Buttons */}
      <ProfessionalActionButtons
        professional={professional}
        onReviewClick={() => setShowReviewForm(true)}
      />

      {/* Tabbed Content */}
      <Tabs defaultValue="details" className="px-4 pt-4">
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="details">Detalhes</TabsTrigger>
          <TabsTrigger value="reviews">
            Avaliações ({professional.total_avaliacoes})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="-mx-4">
          <ProfessionalDetails professional={professional} />
        </TabsContent>

        <TabsContent value="reviews" className="space-y-4 pt-2">
          {showReviewForm && (
            <ProfessionalReviewForm
              userReview={userReview}
              onSubmit={submitReview}
              onCancel={() => setShowReviewForm(false)}
            />
          )}
          <ProfessionalReviewsList
            reviews={reviews}
            totalReviews={professional.total_avaliacoes}
          />
        </TabsContent>
      </Tabs>

      {/* Report Dialog */}
      <ReportContentDialog
        open={showReportDialog}
        onOpenChange={setShowReportDialog}
        targetType="profile"
        targetId={professional.id}
      />
    </div>
  );
}
