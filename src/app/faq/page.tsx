'use client';

import Header from '@/components/shared/Header';
import FAQSection from '@/components/shared/FAQSection';
import CTASection from '@/components/shared/CTASection';
import Footer from '@/components/shared/Footer';

export default function FAQPage() {
  return (
    <div
      className="min-h-screen bg-white text-[#1E1E2F]"
      style={{ fontFamily: '"Museo Sans Rounded", "Poppins", "Inter", sans-serif' }}
    >
      <Header />

      <main>
        <FAQSection />
        <CTASection />
      </main>

      <Footer />
    </div>
  );
}

