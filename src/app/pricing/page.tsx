'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { loadStripe } from '@stripe/stripe-js'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Check } from 'lucide-react'
import Header from '@/components/shared/Header'
import FAQSection from '@/components/shared/FAQSection'
import CTASection from '@/components/shared/CTASection'
import Footer from '@/components/shared/Footer'

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''
)

export default function PricingPage() {
  const [loading, setLoading] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
    })
  }, [])

  const handleSubscribe = async (plan: 'monthly' | 'yearly') => {
    if (!user) {
      router.push('/auth/login?redirect=/pricing')
      return
    }

    setLoading(plan)
    try {
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create checkout session')
      }

      const { url } = await response.json()

      if (url) {
        window.location.href = url
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Impossibile avviare il checkout. Riprova.')
      setLoading(null)
    }
  }

  const plans = [
    {
      name: 'Mensile',
      price: '€10',
      period: '/mese',
      description: 'Perfetto per provare tutte le funzionalità',
      features: [
        'Accesso a tutti gli strumenti AI',
        'Generazioni illimitate',
        'Supporto prioritario',
        'Cancella in qualsiasi momento',
      ],
      plan: 'monthly' as const,
    },
    {
      name: 'Annuale',
      price: '€100',
      period: '/anno',
      description: 'Miglior valore - Risparmia €20 all\'anno',
      features: [
        'Accesso a tutti gli strumenti AI',
        'Generazioni illimitate',
        'Supporto prioritario',
        'Cancella in qualsiasi momento',
        'Risparmia €20 rispetto al mensile',
      ],
      plan: 'yearly' as const,
      popular: true,
    },
  ]

  return (
    <div 
      className="min-h-screen bg-white text-[#1E1E2F]"
      style={{ fontFamily: '"Museo Sans Rounded", "Poppins", "Inter", sans-serif' }}
    >
      <Header />
      
      <main>
        <div className="bg-gradient-to-b from-gray-50 to-white dark:from-slate-900 dark:to-slate-800 py-24 px-4">
          <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8 mb-16">
          <div className="flex-1">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-4">
            Abbonamenti e
              <br />
              <span className="text-[#5149F3]">prezzi</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-2xl">
            Inizia gratis e poi scegli il piano di abbonamento più adatto a te.
            </p>
          </div>
          <div className="flex-1 flex justify-center lg:justify-end">
            <Image
              src="/robot-price.svg"
              alt="Robot with coins"
              width={400}
              height={400}
              className="w-full max-w-md h-auto"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {plans.map((planItem) => (
            <Card
              key={planItem.name}
              className={`relative ${
                planItem.popular
                  ? 'border-2 border-blue-600 shadow-lg scale-105'
                  : ''
              }`}
            >
              {planItem.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                  Più vantaggioso
                  </span>
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-2xl">{planItem.name}</CardTitle>
                <CardDescription>{planItem.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-gray-900 dark:text-white">
                    {planItem.price}
                  </span>
                  <span className="text-gray-600 dark:text-gray-400">
                    {planItem.period}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {planItem.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 dark:text-gray-300">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  onClick={() => handleSubscribe(planItem.plan)}
                  disabled={loading !== null}
                  className={`w-full ${
                    planItem.popular
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : ''
                  }`}
                  variant={planItem.popular ? 'default' : 'outline'}
                >
                  {loading === planItem.plan ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Elaborazione...
                    </>
                  ) : (
                    'Abbonati'
                  )}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {!user && (
          <div className="text-center mt-12">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Nuovo su FastSchool? Inizia con una prova gratuita di 2 giorni.
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/auth/register">
                <Button>Registrati Gratis</Button>
              </Link>
              <Link href="/auth/login">
                <Button variant="outline">Accedi</Button>
              </Link>
            </div>
          </div>
        )}
          </div>
        </div>

        <FAQSection />
        <CTASection />
      </main>

      <Footer />
    </div>
  )
}

