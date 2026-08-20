import React from 'react'
import Hero from '../components/Hero'
import WhySocrates from '../components/WhySocrates'
import LearningJourney from '../components/LearningJourney'
import AITutor from '../components/AITutor'
import HowItWorks from '../components/HowItWorks'
import Categories from '../components/Categories'
import Tutors from '../components/Tutors'
import StudyRooms from '../components/StudyRooms'
import Testimonials from '../components/Testimonials'
import Stats from '../components/Stats'
import PricingPreview from '../components/PricingPreview'
import FAQ from '../components/FAQ'
import CTA from '../components/CTA'

export default function Home() {
  return (
    <div className="bg-white text-[#1d1d1f] font-sans selection:bg-[#0066cc]/10 selection:text-[#0066cc]">
      <main className="flex-grow">
        {/* 1. Hero Section */}
        <Hero />

        {/* 2. Why SOCRATES */}
        <WhySocrates />

        {/* 3. Learn Your Way */}
        <LearningJourney />

        {/* 4. AI Tutor Showcase */}
        <AITutor />

        {/* 5. How It Works */}
        <HowItWorks />

        {/* 6. Explore Learning Categories */}
        <Categories />

        {/* 7. Featured Tutors */}
        <Tutors />

        {/* 8. Peer Study Rooms */}
        <StudyRooms />

        {/* 9. Testimonials & Peer Reviews */}
        <Testimonials />

        {/* 10. Learning Statistics */}
        <Stats />

        {/* 11. Pricing Preview */}
        <PricingPreview />

        {/* 12. FAQ */}
        <FAQ />

        {/* 13. Final CTA */}
        <CTA />
      </main>
    </div>
  )
}
