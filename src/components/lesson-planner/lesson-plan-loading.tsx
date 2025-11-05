import Image from "next/image";

export default function LessonPlanLoading() {
  return (
    <div className="flex flex-col items-center justify-center py-8 min-h-[400px]">
      <Image
        src="/images/loader.gif"
        alt="Generazione piano di lezione..."
        width={200}
        height={200}
        unoptimized
        className="w-auto h-auto"
      />
      <p className="text-sm text-muted-foreground mt-4">Generazione del tuo piano di lezione...</p>
    </div>
  );
}
