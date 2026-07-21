import React from 'react'
import Navbar from '../components/Navbar'
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
import Footer from '../components/Footer'

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-[#1d1d1f] font-sans flex flex-col selection:bg-[#0066cc]/10 selection:text-[#0066cc]">
      {/* 1. Navbar */}
      <Navbar />

      <main className="flex-grow">
        {/* 2. Hero Section */}
        <Hero />

        {/* 3. Why SOCRATES */}
        <WhySocrates />

        {/* 4. Learn Your Way */}
        <LearningJourney />

        {/* 5. AI Tutor Showcase */}
        <AITutor />

        {/* 6. How It Works */}
        <HowItWorks />

        {/* 7. Explore Learning Categories */}
        <Categories />

        {/* 8. Featured Tutors */}
        <Tutors />

        {/* 9. Peer Study Rooms */}
        <StudyRooms />

        {/* 10. Student Success */}
        <Testimonials />

        {/* 11. Learning Statistics */}
        <Stats />

        {/* 12. Pricing Preview */}
        <PricingPreview />

        {/* 13. FAQ */}
        <FAQ />

        {/* 14. Final CTA */}
        <CTA />
      </main>

      {/* 15. Footer */}
      <Footer />
    </div>
  )
}
