import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Check } from 'lucide-react'

export default function PricingPreview() {
  const plans = [
    {
      name: 'Free',
      price: '$0',
      period: 'forever',
      description: 'Essential Socratic AI tools & public peer study rooms.',
      features: [
        'Daily Socratic AI guidance (20 queries/day)',
        'Access to Public Peer Study Rooms',
        'Basic note exports',
      ],
      cta: 'Get Started',
      popular: false,
    },
    {
      name: 'Student Pro',
      price: '$29',
      period: 'per month',
      description: 'Unlimited Socratic AI + human tutoring credits.',
      features: [
        'Unlimited Socratic AI conversations',
        '2 Human Tutoring session credits / month',
        'Automated AI Session Recaps & Flashcards',
        'Private Study Room creation',
      ],
      cta: 'Start 14-Day Free Trial',
      popular: true,
    },
    {
      name: 'Tutor Pro',
      price: '$49',
      period: 'per month',
      description: 'For verified human educators and teaching assistants.',
      features: [
        'Verified Tutor Badge on profile',
        '0% platform commission on first $1k',
        'Advanced student analytics dashboard',
        'Custom scheduling & video link integration',
      ],
      cta: 'Apply as Tutor',
      popular: false,
    },
  ]

  return (
    <section id="pricing" className="py-24 sm:py-32 bg-[#f5f5f7] text-[#1d1d1f] border-t border-[#e0e0e0]">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-[#1d1d1f]">
            Simple, Transparent Plans.
          </h2>
          <p className="text-lg text-[#7a7a7a]">
            Choose the right tier to accelerate your learning journey.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className={`bg-white border rounded-3xl p-8 flex flex-col justify-between relative ${
                plan.popular ? 'border-[#0066cc] shadow-[0_20px_50px_rgba(0,102,204,0.08)]' : 'border-[#e0e0e0]'
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-[#0066cc] text-white text-[11px] font-semibold uppercase tracking-wider">
                  Most Popular
                </span>
              )}

              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-[#1d1d1f]">{plan.name}</h3>
                  <p className="text-xs text-[#7a7a7a] mt-1">{plan.description}</p>
                </div>

                <div className="flex items-baseline gap-1">
                  <span className="text-4xl sm:text-5xl font-semibold text-[#1d1d1f]">{plan.price}</span>
                  <span className="text-xs font-medium text-[#7a7a7a]">/{plan.period}</span>
                </div>

                <ul className="space-y-3 pt-6 border-t border-[#e0e0e0] text-xs sm:text-sm text-[#1d1d1f]">
                  {plan.features.map((feat, i) => (
                    <li key={i} className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-[#0066cc] shrink-0" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-8">
                <Link
                  to="/login"
                  className={`block text-center w-full py-3 rounded-full text-sm font-medium transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0066cc] ${
                    plan.popular
                      ? 'bg-[#0066cc] text-white hover:bg-[#0077ed]'
                      : 'bg-[#f5f5f7] text-[#1d1d1f] hover:bg-[#e0e0e0]'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
