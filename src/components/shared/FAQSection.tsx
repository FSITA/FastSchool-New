'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';

const faqData = [
  {
    question: 'A chi è destinato FastSchool?',
    answer:
      'FastSchool è pensato per insegnanti, educatori, tutor e formatori che vogliono creare contenuti didattici in modo veloce e professionale.',
  },
  {
    question: 'In cosa è diverso FastSchool dagli altri strumenti AI?',
    answer:
      'FastSchool si concentra specificamente sull\'educazione e l\'apprendimento. A differenza degli strumenti AI generici, FastSchool fornisce modelli specializzati per materiali didattici, aiuta a organizzare le informazioni in modi che migliorano la ritenzione e crea percorsi di apprendimento personalizzati adattati ai tuoi obiettivi.',
  },
  {
    question: 'Quali tipi di contenuto posso caricare su FastSchool?',
    answer:
      'Puoi caricare link YouTube, file PDF, testo libero o link Wikipedia.',
  },
  {
    question: 'Quali contenuti genera FastSchool?',
    answer:
      'FastSchool genera quiz, flashcard, riassunti, lezioni, presentazioni e altri materiali educativi pronti all\'uso senza dover partire da zero.',
  },
  {
    question: 'Quanto costa FastSchool?',
    answer:
      '2 giorni gratis (senza carta), poi €10/mese o €100/anno.',
  },
];

export default function FAQSection() {
  const [openFaq, setOpenFaq] = useState<number>(-1);

  return (
    <section className="w-full bg-white pt-12 pb-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left Side - Title and Image */}
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.4em] text-[#7A7A7A]">FAQ</p>
            <h3 className="mt-4 text-4xl font-bold text-[#1A1A1A] md:text-5xl">
              Domande Frequenti
            </h3>
            <div className="mt-8">
              <Image
                src="/homepage data/FAQs homepage.svg"
                alt="FAQ illustration"
                width={400}
                height={400}
                className="w-full max-w-md object-contain"
              />
            </div>
          </div>

          {/* Right Side - FAQ Accordion */}
          <div className="space-y-4">
            {faqData.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="overflow-hidden rounded-[20px] border border-[#F0F0F5] bg-white shadow-[0_10px_30px_rgba(20,25,60,0.06)] transition-all hover:shadow-[0_15px_40px_rgba(20,25,60,0.1)]"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === index ? -1 : index)}
                  className="flex w-full items-center justify-between p-6 text-left transition-colors hover:bg-[#FAFAFC]"
                >
                  <h4 className="pr-8 text-lg font-semibold text-[#1A1A1A]">{faq.question}</h4>
                  <motion.div
                    animate={{ rotate: openFaq === index ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex-shrink-0 text-[#5149F3]"
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 20 20"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M5 7.5L10 12.5L15 7.5"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </motion.div>
                </button>
                <motion.div
                  initial={false}
                  animate={{
                    height: openFaq === index ? 'auto' : 0,
                    opacity: openFaq === index ? 1 : 0,
                  }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <div className="px-6 pb-6 pt-2">
                    <p className="text-base leading-relaxed text-[#5F5F6A]">{faq.answer}</p>
                  </div>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

