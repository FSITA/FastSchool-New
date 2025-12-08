"use client";

import { Plus, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePresentationState } from "@/states/presentation-state";
import { useRouter } from "next/navigation";
import { PresentationTemplates } from "./PresentationTemplates";
import { useEffect } from "react";
import { PresentationHeader } from "./PresentationHeader";
import { createEmptyPresentation } from "@/app/_actions/presentation/presentationActions";
import UniversalFormContainer from "../universal-form/UniversalFormContainer";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";

export function PresentationDashboard() {
  const router = useRouter();
  const {
    setCurrentPresentation,
    setIsGeneratingOutline,
    // We'll use these instead of directly calling startOutlineGeneration
    setShouldStartOutlineGeneration,
    setFormStep,
    setUniversalFormData,
    setPresentationInput,
    setIsFromUniversalForm,
  } = usePresentationState();

  useEffect(() => {
    setCurrentPresentation("", "");
    // Make sure to reset any generation flags when landing on dashboard
    setIsGeneratingOutline(false);
    setShouldStartOutlineGeneration(false);
    // Reset form state
    setFormStep(0);
    setUniversalFormData(null);
    setIsFromUniversalForm(false);
  }, []);


  const handleCreateBlank = async () => {
    try {
      // Clear universal form data to ensure blank presentation
      setUniversalFormData(null);
      // Set a default presentation input for blank presentations
      setPresentationInput("Presentazione FastSchool senza titolo");
      // Mark that this is NOT from universal form (allows language selection)
      setIsFromUniversalForm(false);
      // Don't set isGeneratingOutline to true for blank presentations
      // This allows users to manually create their own outline
      const result = await createEmptyPresentation("Presentazione FastSchool senza titolo");
      if (result.success && result.presentation) {
        setCurrentPresentation(
          result.presentation.id,
          result.presentation.title
        );
        router.push(`/presentation/generate/${result.presentation.id}`);
      } else {
        toast.error(result.message || "Impossibile creare la presentazione");
      }
    } catch (error) {
      console.error("Error creating presentation:", error);
      toast.error("Impossibile creare la presentazione");
    }
  };

  return (
    <div className="min-h-screen w-full bg-white">
      {/* Header with Logo and Home Button */}
      <header className="relative max-w-4xl mx-auto px-6 pt-8 pb-8">
        <div className="flex flex-col items-center relative">
          {/* Home Button */}
          <Link 
            href="/"
            className="absolute top-0 left-0 flex items-center gap-2 px-4 py-2 border border-gray-200 bg-white hover:bg-gray-50 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md text-[#1A1A1A]"
          >
            <ArrowLeft className="w-4 h-4" />
            Casa
          </Link>
          
          {/* Logo */}
          <Link href="/" className="inline-block mb-6">
            <Image
              src="/fastschool logo on white.png"
              alt="FastSchool Logo"
              width={300}
              height={90}
              className="h-16 w-auto opacity-90"
            />
          </Link>

          {/* Two-line Heading */}
          <h1 className="text-4xl font-bold text-[#1A1A1A] mb-3 tracking-tight text-center">
            Generatore di Presentazioni IA
          </h1>
          <p className="text-lg text-[#5A5A5A] font-normal text-center max-w-2xl">
            Genera slide straordinarie basate sull'IA istantaneamente
          </p>
        </div>
      </header>

      {/* Main Content - White rounded rectangle with form */}
      <main className="max-w-4xl mx-auto px-6 pb-12">
        <div className="space-y-8">
          <UniversalFormContainer />
          <div className="flex items-center justify-end">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={handleCreateBlank}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Crea Vuoto
              </Button>
            </div>
          </div>
        </div>

        <PresentationTemplates />
      </main>
    </div>
  );
}
