import FormContainer from "@/components/quiz/pages/FormContainer";
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import React from "react";

export default function QuizPage() {
  return (
    <main className="relative min-h-screen bg-gray-50">
      {/* Header with Logo and Home Button */}
      <div className="pt-8 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            {/* Home Button */}
            <Link 
              href="/"
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <ArrowLeft className="w-4 h-4" />
              Casa
            </Link>
            
            {/* Logo */}
            <div className="flex-1 flex justify-center">
              <Image
                src="/fastschool logo on white.png"
                alt="FastSchool Logo"
                width={200}
                height={60}
                className="h-12 w-auto"
              />
            </div>
            
            {/* Spacer for balance */}
            <div className="w-24"></div>
          </div>
          
          {/* Main Heading */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Generatore di Quiz basato sull'IA
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Crea quiz interattivi dai tuoi appunti, file o contenuti online grazie alla potenza dell'IA
            </p>
          </div>
        </div>
      </div>
      
      <FormContainer />
    </main>
  );
}
