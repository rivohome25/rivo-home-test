"use client"

import { motion } from "framer-motion"
import Image from "next/image"

export function HowItWorksHero() {
  return (
    <section className="py-20 md:py-24 overflow-hidden bg-gradient-to-r from-rivo-light via-rivo-base to-rivo-dark">
      <div className="container px-4 md:px-8 mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {/* Left Column - Text */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
              How RivoHome Works
            </h1>
            <p className="text-xl text-white/90 mb-8">
              RivoHome simplifies your home maintenance routine in four easy steps. Here's how our platform helps you keep your home in top shape year round.
            </p>
          </motion.div>

          {/* Right Column - Image with animations */}
          <motion.div 
            className="relative h-[400px] w-full flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            {/* Main circular image */}
            <div className="relative h-[300px] w-[300px] md:h-[360px] md:w-[360px] rounded-full overflow-hidden border-4 border-white/30 z-10">
              <Image 
                src="/resource-stock1.png" 
                alt="Modern house with RivoHome maintenance system" 
                fill 
                className="object-cover"
                priority
              />
            </div>
            
            {/* Decorative elements */}
            <motion.div 
              className="absolute top-0 right-0 h-16 w-16 rounded-full bg-rivo-light/70 z-0"
              animate={{ y: [0, -15, 0], x: [0, 10, 0] }}
              transition={{ duration: 5, repeat: Infinity, repeatType: "reverse" }}
            />
            <motion.div 
              className="absolute bottom-10 left-10 h-10 w-10 rounded-full bg-rivo-base/60 z-0"
              animate={{ y: [0, 15, 0], x: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, repeatType: "reverse" }}
            />
            <motion.div 
              className="absolute top-1/3 left-0 h-12 w-12 rounded-full bg-rivo-dark/50 z-0"
              animate={{ y: [0, 10, 0], x: [0, -15, 0] }}
              transition={{ duration: 6, repeat: Infinity, repeatType: "reverse" }}
            />
          </motion.div>
        </div>
      </div>
    </section>
  )
} 