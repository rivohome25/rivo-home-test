"use client"

import { motion } from "framer-motion"
import Image from "next/image"
import Link from "next/link"
import { GradientButton } from "@/components/ui/gradient-button"

export function ProviderHero() {
  return (
    <section className="pt-32 pb-20">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 items-center gap-12 px-6">
        {/* Left Column - Text Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900 mb-6">
            Grow Your Business With RivoHome
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Connect with Homeowners looking for trusted professionals like you. Less time chasing leads, More time doing great work.
          </p>
          <GradientButton variant="primary" size="lg" onClick={() => {
            const target = document.querySelector('#provider-cta');
            if (target) {
              window.scrollTo({
                top: (target as HTMLElement).offsetTop,
                behavior: 'smooth',
              });
            }
          }}>
            Join the Network
          </GradientButton>
        </motion.div>

        {/* Right Column - Image with animated decorative elements */}
        <motion.div 
          className="relative h-[400px] w-full flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          {/* Main image */}
          <motion.div 
            className="relative z-10"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <Image 
              src="/rivohome-provider.png" 
              alt="Service provider growing their business with RivoHome" 
              width={400}
              height={400}
              className="object-cover rounded-lg shadow-xl"
              priority
            />
          </motion.div>
          
          {/* Decorative animated circles */}
          <motion.div 
            className="absolute top-10 right-10 h-20 w-20 rounded-full bg-rivo-light/20 z-0"
            animate={{ y: [0, -15, 0], x: [0, 10, 0] }}
            transition={{ duration: 5, repeat: Infinity, repeatType: "reverse" }}
          />
          <motion.div 
            className="absolute bottom-20 left-10 h-32 w-32 rounded-full bg-rivo-base/15 z-0"
            animate={{ y: [0, 15, 0], x: [0, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, repeatType: "reverse" }}
          />
          <motion.div 
            className="absolute top-1/3 left-1/4 h-16 w-16 rounded-full bg-rivo-dark/10 z-0"
            animate={{ y: [0, 10, 0], x: [0, -15, 0] }}
            transition={{ duration: 6, repeat: Infinity, repeatType: "reverse" }}
          />
        </motion.div>
      </div>
    </section>
  )
} 