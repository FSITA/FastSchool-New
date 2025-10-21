import { FeatureCard } from '@/components/ui/FeatureCard';
import { Plus, FileText, Brain, BookOpen, GitBranch } from 'lucide-react';
import Image from 'next/image';
import { UserMenu } from '@/components/user/UserMenu';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Logo */}
      <div className="pt-8 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header with Logo and User Menu */}
          <div className="flex justify-between items-center mb-12">
            <Image
              src="/fastschool logo on white.png"
              alt="FastSchool Logo"
              width={200}
              height={60}
              className="h-12 w-auto"
            />
            <UserMenu />
          </div>
          
          {/* Main Heading */}
          <div className="text-center mb-16 animate-fade-in-up">
            <h2 className="text-5xl font-bold text-gray-900 mb-4">
              Strumenti di Apprendimento basati sull'IA
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Crea presentazioni straordinarie, quiz interattivi, flashcard di studio, piani didattici completi e diagrammi professionali grazie alla potenza dell'intelligenza artificiale
            </p>
          </div>
          
          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 max-w-7xl mx-auto">
            <div className="opacity-0 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <FeatureCard
                title="Crea Presentazioni"
                description="Genera slide straordinarie basate sull'IA istantaneamente."
                icon={Plus}
                gradient="bg-gradient-to-br from-purple-500 via-purple-600 to-purple-700"
                href="/presentation"
              />
            </div>
            
            <div className="opacity-0 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
              <FeatureCard
                title="Crea Quiz"
                description="Crea rapidamente quiz interattivi con l'IA."
                icon={FileText}
                gradient="bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700"
                href="/quiz"
              />
            </div>
            
            <div className="opacity-0 animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
              <FeatureCard
                title="Genera Flashcard"
                description="Crea carte di studio interattive con l'IA."
                icon={Brain}
                gradient="bg-gradient-to-br from-green-500 via-green-600 to-green-700"
                href="/flashcards"
              />
            </div>
            
            <div className="opacity-0 animate-fade-in-up" style={{ animationDelay: '0.8s' }}>
              <FeatureCard
                title="Pianificatore di Lezioni"
                description="Crea piani didattici completi con l'IA."
                icon={BookOpen}
                gradient="bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700"
                href="/lesson-planner"
              />
            </div>
            
            <div className="opacity-0 animate-fade-in-up" style={{ animationDelay: '1.0s' }}>
              <FeatureCard
                title="Generatore di Diagrammi"
                description="Crea diagrammi professionali con l'IA."
                icon={GitBranch}
                gradient="bg-gradient-to-br from-indigo-500 via-indigo-600 to-indigo-700"
                href="/diagram-generator"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
