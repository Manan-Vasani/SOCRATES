import React from 'react'
import { motion } from 'framer-motion'
import { Star, Award, Calendar } from 'lucide-react'

export default function Tutors() {
  const tutors = [
    {
      name: 'Dr. Evelyn Reed',
      subject: 'Algorithms & Data Structures',
      experience: '8+ yrs exp • Stanford PhD',
      rating: '4.98',
      reviews: '142 sessions',
      image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400',
    },
    {
      name: 'Marcus Chen',
      subject: 'Linear Algebra & AI Foundations',
      experience: '6+ yrs exp • MIT Alum',
      rating: '4.95',
      reviews: '98 sessions',
      image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400',
    },
    {
      name: 'Sophia Williams',
      subject: 'Quantum Mechanics & Physics',
      experience: '10+ yrs exp • Cambridge Postdoc',
      rating: '5.0',
      reviews: '210 sessions',
      image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=400',
    },
  ]

  return (
    <section id="tutors" className="py-24 sm:py-32 bg-[#f5f5f7] text-[#1d1d1f] border-t border-[#e0e0e0]">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-[#1d1d1f]">
            Featured Tutors.
          </h2>
          <p className="text-base sm:text-lg text-[#7a7a7a]">
            Vetted world-class educators, researchers, and industry specialists.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {tutors.map((tutor, index) => (
            <motion.div
              key={tutor.name}
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="bg-white border border-[#e0e0e0] rounded-3xl p-6 flex flex-col justify-between hover:border-[#0066cc]/40 transition-all"
            >
              <div>
                <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden mb-6 bg-[#f5f5f7]">
                  <img 
                    src={tutor.image} 
                    alt={tutor.name} 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-semibold text-[#1d1d1f] flex items-center gap-1 border border-[#e0e0e0]">
                    <Star className="w-3.5 h-3.5 fill-[#0066cc] text-[#0066cc]" />
                    <span>{tutor.rating}</span>
                  </div>
                </div>

                <h3 className="text-xl font-semibold text-[#1d1d1f]">
                  {tutor.name}
                </h3>
                <p className="text-sm font-medium text-[#0066cc] mt-1">
                  {tutor.subject}
                </p>

                <div className="flex items-center gap-2 text-xs text-[#7a7a7a] mt-3">
                  <Award className="w-3.5 h-3.5" />
                  <span>{tutor.experience}</span>
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-[#e0e0e0] flex items-center justify-between">
                <span className="text-xs text-[#7a7a7a] font-medium">{tutor.reviews}</span>
                <button 
                  type="button"
                  className="px-4 py-2 rounded-full bg-[#0066cc] text-white text-xs font-medium hover:bg-[#0077ed] transition-colors cursor-pointer"
                >
                  Book Session
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
