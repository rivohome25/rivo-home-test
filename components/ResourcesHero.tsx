"use client"

import { motion } from "framer-motion"

export function ResourcesHero() {
  return (
    <section 
      className="pt-28 pb-16 md:pt-36 md:pb-24 overflow-hidden bg-gradient-to-br from-rivo-light via-rivo-base to-rivo-dark"
      style={{
        backgroundSize: "200% 200%",
        animation: "gradientShift 10s ease infinite"
      }}
    >
      <div className="container px-4 md:px-6 mx-auto">
        <motion.div
          className="max-w-3xl mx-auto text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-6">
            RivoHome Resources
          </h1>
          <p className="text-xl text-white/90 mb-8">
            Find answers, guides, and tips to make the most of your home maintenance journey.
          </p>
        </motion.div>
      </div>
    </section>
  )
} 