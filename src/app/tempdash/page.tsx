'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { ToolCard } from '@/components/ui/ToolCard';
import { UserMenu } from '@/components/user/UserMenu';

const toolLinks = [
  {
    name: 'Generatore di Flashcard',
    href: '/flashcards',
    icon: '/icons/flashcard.png',
  },
  {
    name: 'Pianificatore di Lezioni AI',
    href: '/lesson-planner',
    icon: '/icons/planner.png',
  },
  {
    name: 'Generatore di Lezioni',
    href: '/lesson-generator',
    icon: '/icons/lesson.png',
  },
  {
    name: 'Generatore di Presentazioni Beta',
    href: '/presentation',
    icon: '/icons/presentation.png',
  },
  {
    name: 'Generatore di Quiz',
    href: '/quiz-generator',
    icon: '/icons/quiz.png',
  },
  {
    name: 'Generatore di Diagrammi',
    href: '/diagram-generator',
    icon: '/icons/diagram.png',
  },
  {
    name: 'Generatore di Riassunti',
    href: '/summary-generator',
    icon: '/icons/summary.png',
  },
  {
    name: 'METODOLOGIE SPECIALI',
    href: '/lesson-planner',
    icon: '/icons/special.png',
  },
  {
    name: 'Generatore di Outline',
    href: '/summary-generator',
    icon: '/icons/outline.png',
  },
];

// Dashboard tools configuration
const dashboardTools = [
  {
    name: 'Quiz IA',
    subtitle: 'Crea quiz completi con domande multiple choice',
    href: '/quiz-generator',
    icon: '/icons/quiz.png',
    banner: '/banners/quiz.png',
    featured: true,
    starred: false,
  },
  {
    name: 'Lezioni IA',
    subtitle: 'Crea lezioni multi-pagina complete con l\'IA',
    href: '/lesson-generator',
    icon: '/icons/lesson.png',
    banner: '/banners/lesson.png',
    featured: true,
    starred: false,
  },
  {
    name: 'Presentazioni IA Beta',
    subtitle: 'Genera slide straordinarie basate sull\'IA istantaneamente',
    href: '/presentation',
    icon: '/icons/presentation.png',
    banner: '/banners/presentation.png',
    featured: true,
    starred: false,
  },
  {
    name: 'Generatore di Flashcard',
    href: '/flashcards',
    icon: '/icons/flashcard.png',
    starred: true,
  },
  {
    name: 'Pianificatore di Lezioni AI',
    href: '/lesson-planner',
    icon: '/icons/planner.png',
    starred: true,
  },
  {
    name: 'Generatore di Lezioni',
    href: '/lesson-generator',
    icon: '/icons/lesson.png',
    starred: true,
  },
  {
    name: 'Generatore di Presentazioni Beta',
    href: '/presentation',
    icon: '/icons/presentation.png',
    starred: true,
  },
  {
    name: 'Generatore di Quiz',
    href: '/quiz-generator',
    icon: '/icons/quiz.png',
    starred: true,
  },
  {
    name: 'Generatore di Diagrammi',
    href: '/diagram-generator',
    icon: '/icons/diagram.png',
    starred: true,
  },
  {
    name: 'Generatore di Riassunti',
    href: '/summary-generator',
    icon: '/icons/summary.png',
  },
  {
    name: 'METODOLOGIE SPECIALI',
    href: '/lesson-planner',
    icon: '/icons/special.png',
  },
  {
    name: 'Generatore di Outline',
    href: '/summary-generator',
    icon: '/icons/outline.png',
  },
  {
    name: 'Generatore di Grafici',
    icon: '/icons/chart.png',
    comingSoon: true,
  },
  {
    name: 'Chat con PDF',
    icon: '/icons/chat-pdf.png',
    comingSoon: true,
  },
  {
    name: 'Completa gli Spazi',
    icon: '/icons/fill-blanks.png',
    comingSoon: true,
  },
  {
    name: 'Vero o Falso',
    icon: '/icons/true-false.png',
    comingSoon: true,
  },
  {
    name: 'Generatore di Schede di Lavoro',
    icon: '/icons/worksheet.png',
    comingSoon: true,
  },
];

export default function TempDashboard() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [openToolsDropdown, setOpenToolsDropdown] = useState(false);

  // Check if user is logged in
  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };
    checkAuth();
  }, []);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Caricamento...</p>
        </div>
      </div>
    );
  }

  const featuredTools = dashboardTools.filter(tool => tool.featured);
  const allTools = dashboardTools.filter(tool => !tool.featured);

  return (
    <div className="min-h-screen bg-white">
      {/* Header - White Background */}
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Link href="/" className="flex items-center gap-3">
                <Image
                  src="/fastschool logo on white.png"
                  alt="FastSchool"
                  width={150}
                  height={48}
                  className="h-10 w-auto"
                />
              </Link>
              
              {/* Tools Dropdown */}
              <div className="ml-10 relative"
                onMouseEnter={() => setOpenToolsDropdown(true)}
                onMouseLeave={() => setOpenToolsDropdown(false)}
              >
                <button className="flex items-center gap-2 text-base font-semibold text-[#343457] hover:text-[#5149F3] transition">
                  Strumenti
                  <span className="text-xs">▾</span>
                </button>

                {openToolsDropdown && (
                  <div className="absolute left-0 top-[110%] w-[320px] rounded-2xl border border-[#ECECEC] bg-white p-4 shadow-[0_20px_60px_rgba(20,25,45,0.12)] z-30">
                    <ul className="space-y-3">
                      {toolLinks.map((tool) => (
                        <li key={tool.name}>
                          <Link
                            href={tool.href}
                            className="flex items-center gap-3 rounded-xl px-3 py-2 transition hover:bg-[#F7F6FF]"
                          >
                            <Image src={tool.icon} alt={tool.name} width={32} height={32} />
                            <span className="text-sm font-semibold text-[#1E1E2F]">{tool.name}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Pricing and Contact Links */}
              <div className="ml-8 flex items-center gap-6">
                <Link
                  href="/pricing"
                  className="text-base font-semibold text-[#343457] hover:text-[#5149F3] transition"
                >
                  Prezzi
                </Link>
                <Link
                  href="/contact"
                  className="text-base font-semibold text-[#343457] hover:text-[#5149F3] transition"
                >
                  Contattaci
                </Link>
              </div>
            </div>
            <UserMenu />
          </div>
        </div>
      </header>

      {/* Hero Section - White Background */}
      <section className="bg-white">
        <div className="max-w-6xl mx-auto px-6 py-16 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-[#1A1A1A] mb-4">
            FastSchool – La scuola con un click
          </h1>
          <p className="text-xl text-[#5F5F6A] max-w-2xl mx-auto">
            Risparmia tempo prezioso e crea materiali didattici in pochi secondi
          </p>
        </div>
      </section>

      {/* Popular Tools Section - White Background */}
      <section className="bg-white">
        <div className="max-w-6xl mx-auto px-6 pb-12">
          <h2 className="text-2xl font-bold text-[#1A1A1A] mb-6">Strumenti Popolari</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredTools.map((tool) => (
              <ToolCard
                key={tool.name}
                title={tool.name}
                subtitle={tool.subtitle}
                icon={tool.icon}
                banner={tool.banner}
                href={tool.href}
                featured={tool.featured}
                starred={tool.starred}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Help Banner - White Background, Full Opacity */}
      <section className="bg-white pb-0">
        <div className="max-w-6xl mx-auto px-6 pb-12">
          <ToolCard
            title="Non sei sicuro? Cosa fare?"
            subtitle="Se non sai e hai bisogno del nostro aiuto, clicca per guardare un video che mostra cosa puoi fare con la nostra IA"
            banner="/banners/help.png"
            wide={true}
            href="#"
            disabled={false}
          />
        </div>
      </section>

      {/* All Tools Section - Smooth Gradient Background starting from white */}
      <section 
        className="py-12"
        style={{
          background: 'linear-gradient(to bottom, #ffffff 0%, #f8fafc 5%, #eff6ff 15%, #dbeafe 30%, #dbeafe 100%)',
        }}
      >
        <div className="max-w-6xl mx-auto px-6 pb-16">
          <h2 className="text-2xl font-bold text-[#1A1A1A] mb-6">Tutti gli Strumenti</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allTools.map((tool) => (
              <ToolCard
                key={tool.name}
                title={tool.name}
                subtitle={tool.subtitle}
                icon={tool.icon}
                banner={tool.banner}
                href={tool.href}
                starred={tool.starred}
                comingSoon={tool.comingSoon}
              />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
