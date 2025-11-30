'use client';

import { useState } from 'react';
import Image from 'next/image';
import Header from '@/components/shared/Header';
import CTASection from '@/components/shared/CTASection';
import Footer from '@/components/shared/Footer';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({
    type: null,
    message: '',
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: null, message: '' });

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus({
          type: 'success',
          message: 'Messaggio inviato con successo! Ti risponderemo presto.',
        });
        setFormData({
          name: '',
          email: '',
          subject: '',
          message: '',
        });
      } else {
        setStatus({
          type: 'error',
          message: data.error || 'Errore nell\'invio del messaggio. Riprova.',
        });
      }
    } catch (error) {
      setStatus({
        type: 'error',
        message: 'Errore nell\'invio del messaggio. Riprova.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-white text-[#1E1E2F]"
      style={{ fontFamily: '"Museo Sans Rounded", "Poppins", "Inter", sans-serif' }}
    >
      <Header />

      <main>
        {/* Header Section */}
        <section className="w-full bg-white pt-24 pb-16">
          <div className="mx-auto max-w-6xl px-6">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
              <div className="flex-1">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#1A1A1A] mb-4">
                  Contattaci
                </h1>
                <p className="text-lg md:text-xl text-[#5F5F6A] max-w-2xl">
                  Hai bisogno di assistenza? Compila il modulo, il nostro team è qui per aiutarti.
                </p>
              </div>
              <div className="flex-1 flex justify-center lg:justify-end">
                <Image
                  src="/contact-robot.svg"
                  alt="Contact robot"
                  width={400}
                  height={400}
                  className="w-full max-w-md h-auto"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Contact Form Section */}
        <section className="w-full bg-white py-16">
          <div className="mx-auto max-w-6xl px-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
              {/* Left Side - Support Info */}
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.4em] text-[#7A7A7A] mb-4">
                  SUPPORTO
                </p>
                <h2 className="text-4xl md:text-5xl font-bold text-[#1A1A1A] mb-8">
                  Siamo qui per aiutarti
                </h2>
                <div className="mt-8">
                  <Image
                    src="/contactform-robot.svg"
                    alt="Support robot"
                    width={400}
                    height={400}
                    className="w-full max-w-md object-contain"
                  />
                </div>
              </div>

              {/* Right Side - Contact Form */}
              <div>
                <form
                  onSubmit={handleSubmit}
                  className="bg-white rounded-[24px] border border-[#F0F0F5] shadow-[0_20px_50px_rgba(20,25,60,0.08)] p-8"
                >
                  <div className="space-y-6">
                    <div>
                      <label
                        htmlFor="name"
                        className="block text-sm font-semibold text-[#1A1A1A] mb-2"
                      >
                        Il tuo nome completo
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Nome e cognome"
                        required
                        className="w-full px-4 py-3 rounded-xl border border-[#E5E5E5] bg-white text-[#1A1A1A] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#5149F3] focus:border-transparent transition"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="email"
                        className="block text-sm font-semibold text-[#1A1A1A] mb-2"
                      >
                        Il tuo indirizzo email
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="email@esempio.com"
                        required
                        className="w-full px-4 py-3 rounded-xl border border-[#E5E5E5] bg-white text-[#1A1A1A] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#5149F3] focus:border-transparent transition"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="subject"
                        className="block text-sm font-semibold text-[#1A1A1A] mb-2"
                      >
                        Oggetto
                      </label>
                      <input
                        type="text"
                        id="subject"
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        placeholder="Inserire oggetto"
                        required
                        className="w-full px-4 py-3 rounded-xl border border-[#E5E5E5] bg-white text-[#1A1A1A] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#5149F3] focus:border-transparent transition"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="message"
                        className="block text-sm font-semibold text-[#1A1A1A] mb-2"
                      >
                        Messaggio
                      </label>
                      <textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        placeholder="Come possiamo aiutarti?"
                        required
                        rows={6}
                        className="w-full px-4 py-3 rounded-xl border border-[#E5E5E5] bg-white text-[#1A1A1A] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#5149F3] focus:border-transparent transition resize-y"
                      />
                    </div>

                    {status.type && (
                      <div
                        className={`p-4 rounded-xl ${
                          status.type === 'success'
                            ? 'bg-green-50 text-green-800 border border-green-200'
                            : 'bg-red-50 text-red-800 border border-red-200'
                        }`}
                      >
                        {status.message}
                      </div>
                    )}

                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-[#5149F3] to-[#6B63FF] text-white py-6 text-lg font-semibold rounded-full hover:opacity-90 transition disabled:opacity-50"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Invio in corso...
                        </>
                      ) : (
                        'Invia messaggio'
                      )}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </section>

        <CTASection />
      </main>

      <Footer />
    </div>
  );
}

