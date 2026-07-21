import React, { useEffect, useState, useRef } from 'react'
import { motion, useInView } from 'framer-motion'

interface StatItemProps {
  numericValue: number
  suffix: string
  label: string
}

function CounterStat({ numericValue, suffix, label }: StatItemProps) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-50px' })
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (isInView) {
      let start = 0
      const duration = 2000 // 2 seconds
      const stepTime = 30
      const steps = duration / stepTime
      const increment = numericValue / steps

      const timer = setInterval(() => {
        start += increment
        if (start >= numericValue) {
          setCount(numericValue)
          clearInterval(timer)
        } else {
          setCount(Math.floor(start))
        }
      }, stepTime)

      return () => clearInterval(timer)
    }
  }, [isInView, numericValue])

  return (
    <div ref={ref} className="text-center space-y-2">
      <div className="text-4xl sm:text-6xl lg:text-7xl font-semibold tracking-tight text-[#1d1d1f]">
        {count.toLocaleString()}{suffix}
      </div>
      <div className="text-sm sm:text-base font-medium text-[#7a7a7a]">
        {label}
      </div>
    </div>
  )
}

export default function Stats() {
  const statsData = [
    { numericValue: 50, suffix: 'K+', label: 'Students' },
    { numericValue: 10, suffix: 'K+', label: 'Sessions' },
    { numericValue: 2, suffix: 'K+', label: 'Tutors' },
    { numericValue: 95, suffix: '%', label: 'Satisfaction' },
  ]

  return (
    <section className="py-24 sm:py-32 bg-white text-[#1d1d1f]">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12">
          {statsData.map((stat, i) => (
            <CounterStat 
              key={i} 
              numericValue={stat.numericValue} 
              suffix={stat.suffix} 
              label={stat.label} 
            />
          ))}
        </div>
      </div>
    </section>
  )
}
