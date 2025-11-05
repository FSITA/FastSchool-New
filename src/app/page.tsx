import Image from 'next/image';
import Link from 'next/link';
import { UserMenu } from '@/components/user/UserMenu';
import { ToolCard } from '@/components/ui/ToolCard';

export default function Home() {
  return (
    <div 
      className="min-h-screen"
      style={{
        background: 'linear-gradient(to bottom, #FAF9F9 0%, #DDF1FF 40%, #C8E7FF 100%)'
      }}
    >
      {/* Header with Logo and User Menu */}
      <header className="relative max-w-[1200px] mx-auto px-6 pt-8 pb-12">
        <div className="flex flex-col items-center relative">
          {/* Logo */}
          <Link href="/" className="inline-block mb-8">
            <Image
              src="/fastschool logo on white.png"
              alt="FastSchool Logo"
              width={300}
              height={90}
              className="h-16 w-auto opacity-90"
            />
          </Link>
          
          {/* User Menu */}
          <div className="absolute top-0 right-0">
            <UserMenu />
          </div>

          {/* Main Title */}
          <h1 className="text-4xl font-bold text-[#1A1A1A] mb-3 tracking-tight text-center">
            FastSchool La scuola con un click
          </h1>
          
          {/* Subtitle */}
          <p className="text-lg text-[#5A5A5A] font-normal text-center">
            Risparmia tempo prezioso e crea materiali didattici in pochi secondi
          </p>
        </div>
      </header>

      {/* Page Container */}
      <div className="max-w-[1200px] mx-auto px-6 pb-20">
        {/* Featured / Popular Tools Section */}
        <section className="mb-16 mt-10">
          <h2 className="text-2xl font-semibold text-[#1A1A1A] mb-6 text-center">
            Strumenti Popolari
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <ToolCard
              title="Quiz IA"
              subtitle="Crea quiz completi con domande multiple choice"
              banner="/banners/quiz.png"
              href="/quiz-generator"
              featured={true}
            />
            <ToolCard
              title="Lezioni IA"
              subtitle="Crea lezioni multi-pagina complete con l'IA"
              banner="/banners/lesson.png"
              href="/lesson-generator"
              featured={true}
            />
            <ToolCard
              title={
                <>
                  Presentazioni IA{' '}
                  <sup className="text-xs font-normal text-[#5A5A5A]">Beta</sup>
                </>
              }
              subtitle="Genera slide straordinarie basate sull'IA istantaneamente"
              banner="/banners/presentation.png"
              href="/presentation"
              featured={true}
            />
          </div>
          
          {/* Wide Help Card */}
          <div className="max-w-3xl mx-auto mt-6">
            <ToolCard
              title="Non sei sicuro? Cosa fare?"
              subtitle="Se non sai e hai bisogno del nostro aiuto, clicca per guardare un video che mostra cosa puoi fare con la nostra IA"
              banner="/banners/help.png"
              wide={true}
              featured={false}
            />
          </div>
        </section>

        {/* All Tools Section */}
        <section className="mt-[200px]">
          <h2 className="text-2xl font-semibold text-[#1A1A1A] mb-6 text-center">
            Tutti gli Strumenti
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Active Tools */}
            <ToolCard
              title="Generatore di Flashcard"
              icon="/icons/flashcard.png"
              href="/flashcards"
            />
            <ToolCard
              title="Pianificatore di Lezioni AI"
              icon="/icons/planner.png"
              href="/lesson-planner"
              starred={true}
            />
            <ToolCard
              title="Generatore di Lezioni"
              icon="/icons/lesson.png"
              href="/lesson-generator"
              starred={true}
            />
            <ToolCard
              title={
                <>
                  Generatore di Presentazioni{' '}
                  <sup className="text-xs font-normal text-[#5A5A5A]">Beta</sup>
                </>
              }
              icon="/icons/presentation.png"
              href="/presentation"
              starred={true}
            />
            <ToolCard
              title="Generatore di Quiz"
              icon="/icons/quiz.png"
              href="/quiz-generator"
              starred={true}
            />
            <ToolCard
              title="Generatore di Diagrammi"
              icon="/icons/diagram.png"
              href="/diagram-generator"
            />
            <ToolCard
              title="Generatore di Riassunti"
              icon="/icons/summary.png"
              href="/summary-generator"
            />
            <ToolCard
              title="METODOLOGIE SPECIALI"
              icon="/icons/special.png"
              href="/lesson-planner"
            />
            <ToolCard
              title="Generatore di Outline"
              icon="/icons/outline.png"
              href="/summary-generator"
            />

            {/* Coming Soon Tools */}
            <ToolCard
              title="Generatore di Grafici"
              icon="/icons/chart.png"
              comingSoon={true}
            />
            <ToolCard
              title="Chat con PDF"
              icon="/icons/chat-pdf.png"
              comingSoon={true}
            />
            <ToolCard
              title="Completa gli Spazi"
              icon="/icons/fill-blanks.png"
              comingSoon={true}
            />
            <ToolCard
              title="Vero o Falso"
              icon="/icons/true-false.png"
              comingSoon={true}
            />
            <ToolCard
              title="Generatore di Schede di Lavoro"
              icon="/icons/worksheet.png"
              comingSoon={true}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
