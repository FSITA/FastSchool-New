import { useState } from "react";
import { X, Edit } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export function ImageUploadNotification() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <Alert className="relative pr-10">
        <AlertTitle className="flex items-center gap-2">
          <Edit className="h-4 w-4" />
          <span>Suggerimento Immagine</span>
        </AlertTitle>
        <AlertDescription>
          Puoi caricare la tua immagine cliccando sull'icona di modifica (<Edit className="inline-block h-4 w-4 align-middle" />) su ogni diapositiva in caso di errore di generazione o se non ti piace l'immagine.
        </AlertDescription>
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 h-6 w-6 text-muted-foreground hover:bg-transparent"
          onClick={() => setIsVisible(false)}
        >
          <X className="h-4 w-4" />
        </Button>
      </Alert>
    </div>
  );
}
