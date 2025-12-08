import React from "react";
import { Loader } from "@/components/ui/loader";

export default function Loading() {
  return (
    <div className="h-screen w-screen flex items-center justify-center">
      <Loader size="lg" variant="dots" />
    </div>
  );
}
