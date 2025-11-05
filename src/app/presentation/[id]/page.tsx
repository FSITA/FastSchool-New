"use client";
import PresentationPage from "@/components/presentation/presentation-page/Main";
import { PrintFriendlyView } from "@/components/presentation/presentation-page/PrintFriendlyView";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

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
    <Suspense fallback={<div>Caricamento...</div>}>
      <PageContent />
    </Suspense>
  );
}
