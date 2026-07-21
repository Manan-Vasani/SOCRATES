import React from 'react'
import { motion } from 'framer-motion'
import { 
  Code2, 
  Calculator, 
  Terminal, 
  Cpu, 
  BarChart3, 
  Briefcase, 
  Palette, 
  Wrench 
} from 'lucide-react'

export default function Categories() {
  const categories = [
    { title: 'Computer Science', count: '140+ Tutors', icon: Code2 },
    { title: 'Mathematics', count: '210+ Tutors', icon: Calculator },
    { title: 'Programming', count: '320+ Tutors', icon: Terminal },
    { title: 'Artificial Intelligence', count: '95+ Tutors', icon: Cpu },
    { title: 'Data Science', count: '180+ Tutors', icon: BarChart3 },
    { title: 'Business', count: '110+ Tutors', icon: Briefcase },
    { title: 'UI/UX Design', count: '85+ Tutors', icon: Palette },
    { title: 'Engineering', count: '160+ Tutors', icon: Wrench },
  ]

  return (
    <section className="py-24 sm:py-32 bg-white text-[#1d1d1f]">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-[#1d1d1f]">
            Explore Categories.
          </h2>
          <p className="text-base sm:text-lg text-[#7a7a7a]">
            Dive deep into specialized disciplines with certified academic tutors and AI models.
          </p>
        </div>

        {/* Responsive Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((cat, index) => {
            const Icon = cat.icon
            return (
              <motion.div
                key={cat.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
                whileHover={{ y: -4 }}
                className="bg-white border border-[#e0e0e0] rounded-2xl p-6 flex flex-col justify-between hover:border-[#0066cc]/40 hover:shadow-sm transition-all cursor-pointer group"
              >
                <div className="w-12 h-12 rounded-xl bg-[#f5f5f7] flex items-center justify-center text-[#1d1d1f] group-hover:bg-[#0066cc] group-hover:text-white transition-colors mb-6">
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[#1d1d1f] group-hover:text-[#0066cc] transition-colors">
                    {cat.title}
                  </h3>
                  <p className="text-xs text-[#7a7a7a] mt-1 font-medium">
                    {cat.count}
                  </p>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
