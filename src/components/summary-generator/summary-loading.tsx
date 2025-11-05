"use client";

import Image from 'next/image';
import type { SummaryOutline } from '@/types/summary-generator';

interface SummaryLoadingProps {
  currentContent: string;
  generatedOutlines: SummaryOutline[];
}

export default function SummaryLoading({ generatedOutlines }: SummaryLoadingProps) {
  const totalOutlines = 10;
  const currentCount = generatedOutlines.length;

  const getStatusMessage = () => {
    if (currentCount === 0) {
      return "Inizializzazione generazione riassunti...";
    } else if (currentCount < totalOutlines) {
      return `Generazione riassunto ${currentCount} di ${totalOutlines}...`;
    } else {
      return "Finalizzazione contenuto riassunti...";
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-8 min-h-[400px]">
      <Image
        src="/images/loader.gif"
        alt="Generazione riassunti..."
        width={200}
        height={200}
        unoptimized
        className="w-auto h-auto"
      />
      <p className="text-sm text-muted-foreground mt-4">
        {getStatusMessage()}
      </p>
    </div>
  );
}

