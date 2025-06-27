"use client"

import { motion } from "framer-motion"
import Link from "next/link"

export function NewHeroSection() {
  return (
    <section className="py-16 md:py-24 overflow-hidden bg-gradient-to-br from-rivo-light via-rivo-base to-rivo-dark">
      <div className="container px-4 md:px-6 mx-auto">
        <motion.div
          className="max-w-3xl mx-auto text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white mb-6">
            Welcome To RivoHome
          </h1>
          <p className="text-xl md:text-2xl text-white/90 mb-8 mx-auto max-w-2xl">
            Simplify your home maintenance with automated tasks, secure document storage, and 
            connections with trusted professionals – all in one place.
          </p>
          <motion.div 
            className="flex justify-center"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
          >
            <a
              href="#notify-section"
              className="inline-flex h-12 items-center justify-center rounded-full bg-white text-rivo-dark font-semibold px-8 py-3 shadow hover:bg-blue-100 transition-all duration-300"
              onClick={(e) => {
                e.preventDefault();
                const element = document.getElementById('notify-section');
                if (element) {
                  const headerOffset = 80;
                  const elementPosition = element.getBoundingClientRect().top;
                  const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                  
                  window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                  });
                }
              }}
            >
              Join the Waitlist
            </a>
          </motion.div>
          
          {/* Decorative elements */}
          <div className="relative mt-12 h-24 w-full">
            <motion.div 
              className="absolute top-0 right-1/4 h-16 w-16 rounded-full bg-rivo-light/30 z-0"
              animate={{ y: [0, -15, 0], x: [0, 10, 0] }}
              transition={{ duration: 5, repeat: Infinity, repeatType: "reverse" }}
            />
            <motion.div 
              className="absolute bottom-0 left-1/4 h-10 w-10 rounded-full bg-rivo-base/30 z-0"
              animate={{ y: [0, 15, 0], x: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, repeatType: "reverse" }}
            />
            <motion.div 
              className="absolute top-1/3 left-1/2 h-12 w-12 rounded-full bg-rivo-dark/30 z-0"
              animate={{ y: [0, 10, 0], x: [0, -15, 0] }}
              transition={{ duration: 6, repeat: Infinity, repeatType: "reverse" }}
            />
          </div>
        </motion.div>
      </div>
    </section>
  )
} 