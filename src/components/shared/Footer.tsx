'use client';

import Image from 'next/image';
import Link from 'next/link';

const premiumTools = [
  { name: 'Quiz AI', href: '/quiz-generator' },
  { name: 'Lezioni AI', href: '/lesson-generator' },
  { name: 'Presentazioni AI', href: '/presentation' },
];

const otherTools = [
  { name: 'Flashcard AI', href: '/flashcards' },
  { name: 'Pianificatore di Lezioni AI', href: '/lesson-planner' },
  { name: 'Generatore di Diagrammi AI', href: '/diagram-generator' },
  { name: 'Generatore di Riassunti AI', href: '/summary-generator' },
  { name: 'Generatore di Outline AI', href: '/summary-generator' },
];

const socialIcons = [
  { name: 'Instagram', href: '#' },
  { name: 'YouTube', href: '#' },
  { name: 'Facebook', href: '#' },
  { name: 'TikTok', href: '#' },
  { name: 'LinkedIn', href: '#' },
];

export default function Footer() {
  return (
    <footer className="w-full bg-white border-t-2 border-[#D1D1D1] rounded-t-[40px] relative z-10 -mt-2">
      <div className="mx-auto max-w-6xl px-6 pt-16 pb-12">
        {/* Logo and Footer Columns - Aligned Horizontally */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12 items-start">
          {/* Logo Column */}
          <div className="lg:col-span-1">
            <Link href="/" className="inline-flex items-center">
              <Image
                src="/fastschool logo on white.png"
                alt="FastSchool"
                width={150}
                height={48}
                className="h-12 w-auto"
              />
            </Link>
          </div>

          {/* Footer Columns */}
          {/* Column 1: Premium Tools */}
          <div className="lg:col-span-1">
            <h4 className="text-base font-semibold text-[#1A1A1A] mb-4">Strumenti Premium</h4>
            <ul className="space-y-3">
              {premiumTools.map((tool) => (
                <li key={tool.name}>
                  <Link
                    href={tool.href}
                    className="text-sm text-[#5F5F6A] hover:text-[#1A1A1A] transition-colors"
                  >
                    {tool.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 2: Tools */}
          <div className="lg:col-span-1">
            <h4 className="text-base font-semibold text-[#1A1A1A] mb-4">Strumenti</h4>
            <ul className="space-y-3">
              {otherTools.map((tool) => (
                <li key={tool.name}>
                  <Link
                    href={tool.href}
                    className="text-sm text-[#5F5F6A] hover:text-[#1A1A1A] transition-colors"
                  >
                    {tool.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Pricing */}
          <div className="lg:col-span-1">
            <h4 className="text-base font-semibold text-[#1A1A1A] mb-4">Prezzi</h4>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/pricing"
                  className="text-sm text-[#5F5F6A] hover:text-[#1A1A1A] transition-colors"
                >
                  Prezzi
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Other */}
          <div className="lg:col-span-1">
            <h4 className="text-base font-semibold text-[#1A1A1A] mb-4">Altro</h4>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/contact"
                  className="text-sm text-[#5F5F6A] hover:text-[#1A1A1A] transition-colors"
                >
                  Contattaci
                </Link>
              </li>
              <li>
                <Link
                  href="/faq"
                  className="text-sm text-[#5F5F6A] hover:text-[#1A1A1A] transition-colors"
                >
                  FAQ
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Contact + Address Line */}
        <div className="border-t border-[#E5E5E5] pt-8 pb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            {/* Social Media Icons */}
            <div className="flex items-center gap-5">
              {socialIcons.map((social) => (
                <Link
                  key={social.name}
                  href={social.href}
                  className="text-[#5F5F6A] hover:text-[#1A1A1A] transition-colors"
                  aria-label={social.name}
                >
                  {social.name === 'Instagram' && (
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                    </svg>
                  )}
                  {social.name === 'YouTube' && (
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                    </svg>
                  )}
                  {social.name === 'Facebook' && (
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                  )}
                  {social.name === 'TikTok' && (
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                    </svg>
                  )}
                  {social.name === 'LinkedIn' && (
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                    </svg>
                  )}
                </Link>
              ))}
            </div>

            {/* Contact Information */}
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6 text-sm text-[#5F5F6A]">
              <div className="flex items-center gap-2.5">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-[#7A7A7A]"
                >
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                <a
                  href="mailto:fastschoolitalia@gmail.com"
                  className="hover:text-[#1A1A1A] transition-colors"
                >
                  fastschoolitalia@gmail.com
                </a>
              </div>
              <div className="flex items-center gap-2.5">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-[#7A7A7A]"
                >
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <span>Via Example Street, Milan (IT)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Legal Row */}
        <div className="border-t border-[#E5E5E5] pt-6">
          <div className="text-center">
            <div className="text-xs text-[#7A7A7A] mb-3">
              FastSchool - P.IVA IT12345678901
            </div>
            <div className="flex flex-wrap justify-center gap-3 text-xs text-[#5F5F6A]">
              <Link
                href="#"
                className="hover:text-[#1A1A1A] transition-colors"
              >
                Privacy Policy
              </Link>
              <span className="text-[#E5E5E5]">·</span>
              <Link
                href="#"
                className="hover:text-[#1A1A1A] transition-colors"
              >
                Termini e Condizioni
              </Link>
              <span className="text-[#E5E5E5]">·</span>
              <Link
                href="#"
                className="hover:text-[#1A1A1A] transition-colors"
              >
                Cookie Policy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

