"use client";
import { useState } from "react";
import { Share } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function ShareButton() {
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="text-muted-foreground hover:text-foreground"
        onClick={() => setIsShareDialogOpen(true)}
      >
        <Share className="mr-1 h-4 w-4" />
        Condividi
      </Button>

      <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Prossimamente</DialogTitle>
            <DialogDescription>
              La funzionalità di condivisione sarà disponibile a breve. Resta
              aggiornato per gli aggiornamenti!
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </>
  );
}
