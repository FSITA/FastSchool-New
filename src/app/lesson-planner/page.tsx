"use client";

import LessonPlannerFormContainer from "@/components/lesson-planner/LessonPlannerFormContainer";
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import React, { useState } from "react";

export default function LessonPlannerPage() {
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      {/* Logo - Always visible at top center */}
      <header className="relative max-w-4xl mx-auto px-6 pt-8 pb-4">
        <div className="flex flex-col items-center relative">
          {/* Home Button */}
          <Link 
            href="/"
            className="absolute top-0 left-0 flex items-center gap-2 px-4 py-2 border border-gray-200 bg-white hover:bg-gray-50 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md text-[#1A1A1A]"
          >
            <ArrowLeft className="w-4 h-4" />
            Casa
          </Link>
          
          {/* Logo - Always visible */}
          <Link href="/" className="inline-block">
            <Image
              src="/fastschool logo on white.png"
              alt="FastSchool Logo"
              width={300}
              height={90}
              className="h-16 w-auto opacity-90"
            />
          </Link>
        </div>
      </header>

      {/* Title and Description - Hide when loading */}
      {!isLoading && (
        <header className="max-w-4xl mx-auto px-6 pb-8">
          <div className="flex flex-col items-center">
            <h1 className="text-4xl font-bold text-[#1A1A1A] mb-3 tracking-tight text-center">
              Pianificatore di Lezioni IA
            </h1>
            <p className="text-lg text-[#5A5A5A] font-normal text-center max-w-2xl">
              Crea piani didattici completi con attività strutturate, obiettivi e valutazioni usando l'IA
            </p>
          </div>
        </header>
      )}
      
      {/* Main Content - White rounded rectangle with form */}
      <main className="max-w-4xl mx-auto px-6 pb-12">
        <LessonPlannerFormContainer onLoadingStateChange={setIsLoading} />
      </main>
    </div>
  );
}
