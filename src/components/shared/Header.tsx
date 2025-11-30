'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FiHelpCircle, FiSend } from 'react-icons/fi';

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

export default function Header() {
  const [openDropdown, setOpenDropdown] = useState<'tools' | 'support' | null>(null);

  const showDropdown = (id: 'tools' | 'support') => setOpenDropdown(id);
  const hideDropdown = () => setOpenDropdown(null);

  return (
    <nav className="sticky top-0 z-20 w-full border-b border-[#F0F0F5] bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <div className="hidden flex flex-1 items-center gap-6 md:flex">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/fastschool logo on white.png"
              alt="FastSchool"
              width={150}
              height={48}
              className="h-10 w-auto"
            />
          </Link>

          <div className="ml-8 flex items-center gap-7 text-base font-semibold text-[#343457]">
            <div
              className="relative"
              onMouseEnter={() => showDropdown('tools')}
              onMouseLeave={hideDropdown}
            >
              <button className="flex items-center gap-2 transition hover:text-[#5149F3]">
                Strumenti
                <span className="text-xs">▾</span>
              </button>

              {openDropdown === 'tools' && (
                <div className="absolute left-0 top-[110%] w-[320px] rounded-2xl border border-[#ECECEC] bg-white p-4 shadow-[0_20px_60px_rgba(20,25,45,0.12)]">
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

            <Link href="/pricing" className="transition hover:text-[#5149F3]">
              Prezzi
            </Link>

            <div
              className="relative"
              onMouseEnter={() => showDropdown('support')}
              onMouseLeave={hideDropdown}
            >
              <button className="flex items-center gap-2 transition hover:text-[#5149F3]">
                Supporto
                <span className="text-xs">▾</span>
              </button>

              {openDropdown === 'support' && (
                <div className="absolute left-0 top-[110%] w-[180px] rounded-2xl border border-[#ECECEC] bg-white p-3 shadow-[0_20px_60px_rgba(20,25,45,0.12)]">
                  <ul className="space-y-2 text-sm font-semibold text-[#1E1E2F]">
                    <li>
                      <Link
                        href="/contact"
                        className="flex items-center gap-2 rounded-xl px-3 py-2 transition hover:bg-[#F7F6FF]"
                      >
                        <FiSend className="text-[#FF5B4A]" size={16} />
                        <span>Contattaci</span>
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/faq"
                        className="flex items-center gap-2 rounded-xl px-3 py-2 transition hover:bg-[#F7F6FF]"
                      >
                        <FiHelpCircle className="text-[#2BC760]" size={16} />
                        <span>FAQ</span>
                      </Link>
                    </li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="hidden items-center gap-6 text-base font-semibold text-[#343457] md:flex">
          <Link href="/login" className="transition hover:text-[#5149F3]">
            Accedi
          </Link>

          <Link
            href="/signup"
            className="rounded-full border border-[#5149F3] px-5 py-2 text-[#5149F3] transition hover:bg-[#5149F3] hover:text-white"
          >
            Prova gratis
          </Link>
        </div>
      </div>
    </nav>
  );
}

