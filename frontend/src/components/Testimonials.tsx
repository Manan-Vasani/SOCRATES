import React from 'react'
import { motion } from 'framer-motion'
import { Quote } from 'lucide-react'

export default function Testimonials() {
  const testimonials = [
    {
      quote: "SOCRATES didn't just give me the answer to compiler optimization problems; the Socratic AI forced me to understand the underlying memory graph. My exam score jumped from B to A+.",
      name: "Hannah Lin",
      role: "Computer Science Major, UC Berkeley",
      image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200",
    },
    {
      quote: "Combining 20 minutes of Socratic AI preparation with 1-on-1 human tutoring cut my studying time in half. It is by far the most refined educational tool I have ever used.",
      name: "Julian Vance",
      role: "Applied Math Student, Columbia",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200",
    },
  ]

  return (
    <section className="py-24 sm:py-32 bg-[#f5f5f7] text-[#1d1d1f] border-t border-[#e0e0e0]">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-[#1d1d1f]">
            Student Success.
          </h2>
          <p className="text-lg text-[#7a7a7a]">
            Hear how learners around the world master difficult subjects.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
          {testimonials.map((t, index) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: index * 0.15 }}
              className="bg-white border border-[#e0e0e0] rounded-3xl p-8 sm:p-10 flex flex-col justify-between"
            >
              <div className="space-y-6">
                <Quote className="w-8 h-8 text-[#0066cc]" />
                <p className="text-lg sm:text-xl font-normal text-[#1d1d1f] leading-relaxed italic">
                  "{t.quote}"
                </p>
              </div>

              <div className="flex items-center gap-4 pt-8 mt-8 border-t border-[#e0e0e0]">
                <img 
                  src={t.image} 
                  alt={t.name} 
                  className="w-12 h-12 rounded-full object-cover border border-[#e0e0e0]"
                />
                <div>
                  <h4 className="text-base font-semibold text-[#1d1d1f]">{t.name}</h4>
                  <p className="text-xs text-[#7a7a7a] font-medium">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
