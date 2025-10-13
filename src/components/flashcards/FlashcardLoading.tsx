import LoadingImage from "../../../public/images/loader.gif";
import Image from "next/image";

export default function FlashcardLoading() {
  return (
    <div className="flex flex-col items-center justify-center py-8">
      <Image
        src={LoadingImage}
        alt="Generating flashcards..."
        unoptimized
      />
      <p className="text-sm text-muted-foreground mt-4">Generating your flashcards...</p>
    </div>
  );
}
