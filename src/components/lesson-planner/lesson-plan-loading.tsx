import LoadingImage from "../../../public/images/loader.gif";
import Image from "next/image";

export default function LessonPlanLoading() {
  return (
    <div className="flex flex-col items-center justify-center py-8">
      <Image
        src={LoadingImage}
        alt="Generazione piano di lezione..."
        unoptimized
      />
      <p className="text-sm text-muted-foreground mt-4">Generazione del tuo piano di lezione...</p>
    </div>
  );
}
