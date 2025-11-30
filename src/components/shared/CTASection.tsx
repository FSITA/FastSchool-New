'use client';

import Link from 'next/link';
import PhysicsCards from './PhysicsCards';

export default function CTASection() {
  return (
    <section className="w-full bg-white pt-6 pb-0" style={{ border: 'none', outline: 'none' }}>
      <div className="mx-auto max-w-6xl px-6 text-center">
        <h3 className="text-4xl font-bold text-[#1A1A1A] md:text-5xl">
          Inizia con FastSchool
        </h3>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-[#5F5F6A]">
          Trasforma un semplice file in materiali didattici pronti all'uso.
        </p>
        <Link
          href="/signup"
          className="mt-10 inline-flex items-center rounded-full bg-gradient-to-r from-[#5149F3] to-[#6B63FF] px-10 py-4 text-lg font-semibold text-white shadow-[0_25px_45px_rgba(81,73,243,0.35)] transition hover:opacity-90"
        >
          Prova gratis
        </Link>
      </div>

      <div className="relative -mb-1" style={{ border: 'none', outline: 'none', borderTop: 'none', borderRight: 'none', borderBottom: 'none', borderLeft: 'none' }}>
        <PhysicsCards />
      </div>
    </section>
  );
}

