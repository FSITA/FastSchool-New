"use client";
import PresentationPage from "@/components/presentation/presentation-page/Main";
import { PrintFriendlyView } from "@/components/presentation/presentation-page/PrintFriendlyView";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Loader } from "@/components/ui/loader";

function PageContent() {
  const searchParams = useSearchParams();
  const isPdfMode = searchParams?.get("pdf") === "1";

  if (isPdfMode) {
    return <PrintFriendlyView />;
  }

  return <PresentationPage />;
}

export default function Page() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader size="lg" variant="dots" />
      </div>
    }>
      <PageContent />
    </Suspense>
  );
}
