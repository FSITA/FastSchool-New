'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { ToolCard } from '@/components/ui/ToolCard';
import { UserMenu } from '@/components/user/UserMenu';
import { TrialStatusBanner } from '@/components/shared/TrialStatusBanner';
import Header from '../components/shared/Header';
import FAQSection from '../components/shared/FAQSection';
import CTASection from '../components/shared/CTASection';
import Footer from '../components/shared/Footer';

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

const heroWords = [
  { label: 'Mappe Mentali', color: '#FEE091' },
  { label: 'Flashcard', color: '#B9D2FF' },
  { label: 'Presentazioni AI', color: '#FFB1B1' },
  { label: 'Quiz', color: '#C8F3D2' },
  { label: 'Pianificatore di Lezioni', color: '#FFD4A8' },
];

const benefitLeftCards = [
  {
    image: '/homepage data/mindmap.png',
    title: 'Organizza tutto in modo semplice',
    text:
      'Niente più materiali sparsi. FastSchool analizza i tuoi contenuti (PDF, YouTube, appunti…) e li organizza in modo chiaro e professionale.',
  },
  {
    image: '/homepage data/formats.png',
    title: 'Si adatta al tuo modo di insegnare',
    text:
      'Personalizza il contenuto in base al livello scolastico e allo stile di insegnamento.',
  },
  {
    image: '/homepage data/rocket.png',
    title: 'Più sicurezza nell\'insegnamento',
    text:
      'FastSchool ti supporta con materiali pronti per la classe: quiz, riassunti, lezioni e flashcard.',
  },
];

const benefitRightCards = [
  {
    image: '/homepage data/subjects..svg',
    title: 'Lavora meglio in ogni materia',
    text:
      'FastSchool trasforma qualsiasi contenuto in materiale didattico organizzato per ogni disciplina.',
  },
  {
    image: '/homepage data/time.svg',
    title: 'Risparmio di tempo',
    text:
      'Con pochi clic risparmi ore di preparazione delle lezioni.',
  },
];

// Dashboard tools configuration
const dashboardTools = [
  {
    name: 'Generatore di Quiz',
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
    name: 'Generatore di Presentazioni',
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

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [wordIndex, setWordIndex] = useState(0);
  const [displayText, setDisplayText] = useState('');
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

  const safeIndex = heroWords.length ? wordIndex % heroWords.length : 0;
  const activeWord = heroWords[safeIndex]!;

  useEffect(() => {
    let charIndex = 0;
    let holdTimeout: ReturnType<typeof setTimeout> | null = null;
    setDisplayText('');

    const word = heroWords[safeIndex]?.label;
    if (!word) return;
    const typeInterval = setInterval(() => {
      charIndex += 1;
      setDisplayText(word.slice(0, charIndex));

      if (charIndex === word.length) {
        clearInterval(typeInterval);

        holdTimeout = setTimeout(() => {
          setWordIndex((prev) => (prev + 1) % heroWords.length);
        }, 1200);
      }
    }, 120);

    return () => {
      clearInterval(typeInterval);
      if (holdTimeout) clearTimeout(holdTimeout);
    };
  }, [safeIndex]);


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

  // If user is logged in, show dashboard view
  if (user) {
    const featuredTools = dashboardTools.filter(tool => tool.featured);
    const allTools = dashboardTools.filter(tool => !tool.featured);

  return (
      <div className="min-h-screen bg-white">
        {/* Trial Status Banner */}
        <TrialStatusBanner />
        
        {/* Header */}
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

  // If user is not logged in, show marketing homepage
  return (
    <div 
      className="min-h-screen bg-white text-[#1E1E2F]"
      style={{ fontFamily: '"Museo Sans Rounded", "Poppins", "Inter", sans-serif' }}
    >
      <Header />

      <main>
        <section className="relative mx-auto flex max-w-4xl flex-col items-center px-6 pt-24 text-center">
          <h1 className="text-[2.8rem] font-bold leading-tight text-[#1E1E2F] md:text-[5.75rem]">
          AI all-in-one per la creazione
          </h1>
          
          <div className="mt-6 h-24 w-full">
            <motion.div
              key={activeWord.label}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, backgroundColor: activeWord.color }}
              transition={{ duration: 0.6, ease: 'easeInOut' }}
              className="mx-auto inline-flex min-w-[260px] items-center justify-center rounded-[32px] px-10 py-5 shadow-[0_25px_55px_rgba(30,30,47,0.12)]"
            >
              <span className="text-4xl font-semibold text-[#1E1E2F]">{displayText}</span>
            </motion.div>
          </div>
          
          <p className="mt-10 text-base font-medium text-[#5F5F6A] md:text-lg">
          La con un click.
          </p>

          <Link
            href="/signup"
            className="mt-8 inline-flex items-center rounded-full bg-gradient-to-r from-[#5149F3] to-[#6B63FF] px-10 py-4 text-lg font-semibold text-white shadow-[0_25px_45px_rgba(81,73,243,0.35)] transition hover:opacity-90"
          >
            Prova gratis
          </Link>
          
        

          <Image
            src="/homepage data/homepage 1st section arrow.svg"
            alt="Decorative arrow"
            width={300}
            height={120}
            className="pointer-events-none absolute right-[15%] top-[375px] hidden max-w-[15%] lg:block"
          />
        </section>

        <section className="mt-24 w-full px-6 pb-16">
          <div className="mx-auto flex max-w-5xl flex-col items-center justify-center">
            <div className="relative w-full">
              <video
                className="w-full"
                autoPlay
                loop
                muted
                playsInline
                preload="auto"
                controls={false}
              >
                <source 
                  src="/homepage%20data/homepage-video.mp4" 
                  type="video/mp4" 
                />
                Your browser does not support the video tag.
              </video>
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-[0_25px_60px_rgba(0,0,0,0.15)]">
                  <span className="text-3xl font-semibold text-[#FF6A21]">g</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-10 flex flex-col items-center space-y-4">
            <Image
              src="/homepage%20data/homepage%20teachers%20circle%20list.png"
              alt="Teachers community"
              width={220}
              height={48}
              className="h-12 w-auto"
            />
            <p className="text-center text-sm font-medium text-[#5F5F6A] md:text-base">
            Trusted by more than 4 Million students, teachers and lifelong learners worldwide
            </p>
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-6 pb-24">
          <div className="mt-14 text-center">
            <p className="text-base font-semibold uppercase tracking-[0.4em] text-[#7A7A7A]">
              Benefits
            </p>
            <h2 className="mt-3 text-[2.5rem] font-bold text-[#1A1A1A] md:text-[4rem]">Perché scegliere FastSchool?</h2>
          </div>

          <div className="mx-auto mt-12 grid max-w-6xl grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="space-y-6">
              {benefitLeftCards.map((card, index) => (
                <motion.div
                  key={card.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className={`rounded-[26px] border border-[#F1F1F5] bg-white p-10 shadow-[0_35px_65px_rgba(20,25,60,0.08)] ${
                    index === 2 ? 'mt-4 lg:mt-10' : ''
                  }`}
                >
                  <Image
                    src={card.image}
                    alt={card.title}
                    width={600}
                    height={260}
                    className={`mx-auto h-auto w-full object-contain ${
                      index === 2 ? 'mb-6 max-w-[480px]' : 'mb-10 max-w-[520px]'
                    }`}
                  />
                  <h3 className="text-2xl font-semibold text-[#1A1A1A]">{card.title}</h3>
                  <p className="mt-4 text-base leading-relaxed text-[#4A4A56]">{card.text}</p>
                </motion.div>
              ))}
            </div>

            <div className="space-y-6">
              {benefitRightCards.map((card, index) => (
                <motion.div
                  key={card.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="rounded-[22px] border border-[#F1F1F5] bg-white p-8 shadow-[0_30px_55px_rgba(20,25,60,0.08)]"
                >
                  <Image
                    src={card.image}
                    alt={card.title}
                    width={460}
                    height={200}
                    className="mx-auto mb-6 h-auto w-full max-w-[380px] object-contain"
                  />
                  <h3 className="text-xl font-semibold text-[#1A1A1A]">{card.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-[#4A4A56]">{card.text}</p>
                </motion.div>
              ))}

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="flex flex-col rounded-[26px] bg-[#4F65F6] p-10 text-white shadow-[0_35px_65px_rgba(79,101,246,0.4)] lg:-mt-6 lg:self-start"
                style={{ minHeight: '240px' }}
              >
                <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
                  <div className="flex-1">
                    <h3 className="text-3xl font-semibold">Inizia con FastSchool</h3>
                    <p className="mt-4 text-base text-white/80">
                      Tutti gli strumenti di cui hai bisogno per creare, organizzare e presentare in modo più intelligente—disponibili in un'unica piattaforma.
                    </p>
                    <Link
                      href="/signup"
                      className="mt-8 inline-flex rounded-full bg-white px-7 py-3 text-base font-semibold text-[#1A1A1A] shadow-[0_10px_30px_rgba(0,0,0,0.18)] transition hover:-translate-y-0.5"
                    >
                      Provalo adesso
                    </Link>
                  </div>
                  <div className="flex justify-center lg:justify-end">
                    <Image
                      src="/homepage data/mascot.png"
                      alt="FastSchool mascot"
                      width={220}
                      height={220}
                      className="w-40 object-contain lg:w-48"
                    />
                  </div>
                </div>
                <div className="mt-8 flex-1" />
              </motion.div>
            </div>
          </div>
        </section>

        <section className="w-full bg-[#FAFAFC] py-20">
          <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-16 px-6 lg:flex-row lg:items-center">
            <div className="w-full max-w-xl text-center lg:text-left">
              <p className="text-base font-semibold uppercase tracking-[0.4em] text-[#7E7A8A]">COME FUNZIONA</p>
              <h3 className="mt-4 text-[2.5rem] font-semibold leading-tight text-[#1D1728] md:text-[4rem]">
                Trasforma un file in materiali didattici in 3 semplici passi
              </h3>
              <p className="mt-6 text-lg leading-relaxed text-[#6D6879]">
                Studia in modo più intelligente con modelli AI pronti all'uso o crea i tuoi per un'esperienza di apprendimento completamente personalizzata. Ogni passaggio è guidato così puoi concentrarti su ciò che conta di più.
              </p>
            </div>
            <div className="w-full">
              <Image
                src="/homepage data/3steps main image.png"
                alt="Three steps illustration"
                width={800}
                height={500}
                className="w-full object-contain"
              />
            </div>
          </div>
        </section>

        <section className="w-full bg-[#FAFAFC] py-24">
          <div className="mx-auto max-w-7xl px-6">
            <div className="relative">
              {/* Timeline Line */}
              <div className="absolute left-0 right-0 top-1/2 hidden h-1 -translate-y-1/2 bg-gradient-to-r from-[#5149F3] via-[#6B63FF] to-[#5149F3] lg:block" />

              {/* Steps Container */}
              <div className="relative grid grid-cols-1 gap-12 lg:grid-cols-3 lg:gap-8">
                {[
                  {
                    step: 1,
                    title: 'Seleziona uno strumento',
                    description:
                      'Scegli lo strumento AI (quiz, lezione, presentazione, ecc.) che meglio si adatta alle tue esigenze e obiettivi.',
                    icon: '🎯',
                    color: '#5149F3',
                  },
                  {
                    step: 2,
                    title: 'Carica il contenuto',
                    description:
                      'Carica il contenuto: YouTube, PDF, testo o Wikipedia.',
                    icon: '📥',
                    color: '#6B63FF',
                  },
                  {
                    step: 3,
                    title: 'Ottieni materiali pronti',
                    description:
                      'Ottieni materiali pronti per l\'uso: quiz, presentazioni, flashcard, riassunti o lezioni.',
                    icon: '✨',
                    color: '#8B7FFF',
                  },
                ].map((item, index) => (
                  <motion.div
                    key={item.step}
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.6, delay: index * 0.15 }}
                    whileHover={{ y: -12, scale: 1.02 }}
                    className="group relative"
                  >
                    {/* Step Number Badge */}
                    <div className="relative z-10 mb-6 flex items-center justify-center lg:mb-8">
                      <motion.div
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#5149F3] to-[#6B63FF] text-2xl font-bold text-white shadow-[0_15px_40px_rgba(81,73,243,0.35)] lg:h-20 lg:w-20"
                      >
                        {item.step}
                      </motion.div>
                      {/* Connecting Line Dots */}
                      {index < 2 && (
                        <div className="absolute left-full hidden h-1 w-full items-center justify-center lg:flex">
                          <div className="h-2 w-2 rounded-full bg-[#5149F3] opacity-60" />
                        </div>
                      )}
                    </div>

                    {/* Card */}
                    <motion.div
                      className="relative overflow-hidden rounded-[28px] border border-[#F0F0F5] bg-white p-8 shadow-[0_20px_50px_rgba(20,25,60,0.08)] transition-all duration-500 group-hover:shadow-[0_30px_70px_rgba(81,73,243,0.2)]"
                      style={{
                        background: 'linear-gradient(135deg, #FFFFFF 0%, #FAFAFC 100%)',
                      }}
                    >
                      {/* Hover Gradient Overlay */}
                      <motion.div
                        className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                        style={{
                          background: `linear-gradient(135deg, ${item.color}08 0%, ${item.color}03 100%)`,
                        }}
                      />

                      {/* Content */}
                      <div className="relative z-10">
                        <div className="mb-6 text-5xl">{item.icon}</div>
                        <h4 className="mb-4 text-2xl font-bold text-[#1A1A1A]">
                          {item.title}
                        </h4>
                        <p className="text-base leading-relaxed text-[#5F5F6A]">
                          {item.description}
                        </p>
                      </div>

                      {/* Animated Border on Hover */}
                      <motion.div
                        className="absolute inset-0 rounded-[28px] opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                        style={{
                          background: `linear-gradient(135deg, ${item.color}20, ${item.color}05)`,
                          border: `2px solid ${item.color}40`,
                        }}
                        initial={false}
                      />
                    </motion.div>

                    {/* Floating Particles Effect on Hover */}
                    <motion.div
                      className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100"
                      initial={false}
                    >
                      {[...Array(3)].map((_, i) => (
                        <motion.div
                          key={i}
                          className="absolute h-2 w-2 rounded-full"
                          style={{
                            backgroundColor: item.color,
                            left: `${20 + i * 30}%`,
                            top: `${10 + i * 20}%`,
                          }}
                          animate={{
                            y: [0, -20, 0],
                            opacity: [0.3, 0.8, 0.3],
                            scale: [1, 1.5, 1],
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            delay: i * 0.3,
                            ease: 'easeInOut',
                          }}
                        />
                      ))}
                    </motion.div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="w-full bg-white pt-12 pb-24">
          <div className="mx-auto max-w-6xl px-6">
            <div className="text-center">
              <h3 className="text-4xl font-bold text-[#1A1A1A] md:text-5xl">
                Una comunità in crescita di educatori
              </h3>
              <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-[#5F5F6A]">
                Unisciti a migliaia di studenti, educatori e creatori che usano FastSchool per studiare, insegnare e
                condividere conoscenze con strumenti basati sull'AI.
              </p>
            </div>

            <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.5 }}
                className="rounded-[28px] bg-gradient-to-br from-[#E8E5FF] to-[#F0EDFF] p-12 text-center shadow-[0_20px_50px_rgba(81,73,243,0.12)]"
              >
                <div className="text-7xl font-bold text-[#5149F3] md:text-8xl">+150</div>
                <p className="mt-6 text-lg font-medium text-[#5149F3] md:text-xl">
                  scuole e docenti già interessati
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="rounded-[28px] bg-gradient-to-br from-[#FFF4E5] to-[#FFEED5] p-12 text-center shadow-[0_20px_50px_rgba(255,138,61,0.12)]"
              >
                <div className="text-7xl font-bold text-[#FF8A3D] md:text-8xl">+4M</div>
                <p className="mt-6 text-lg font-medium text-[#FF8A3D] md:text-xl">contenuti generati</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="rounded-[28px] bg-gradient-to-br from-[#E5F9F0] to-[#D5F5E8] p-12 text-center shadow-[0_20px_50px_rgba(16,185,129,0.12)]"
              >
                <div className="break-words text-7xl font-bold text-[#10B981] md:text-7xl">+350K</div>
                <p className="mt-6 text-lg font-medium text-[#10B981] md:text-xl">flashcard create ogni mese</p>
              </motion.div>
            </div>
      </div>
        </section>

        <FAQSection />

        <CTASection />

        {/* Footer */}
        <Footer />
      </main>
    </div>
  );
}
