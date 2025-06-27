"use client"

import Image from "next/image"
import Link from "next/link"
import { motion } from "framer-motion"
import { GradientBackground } from "@/components/ui/gradient-background"
import { GradientButton } from "@/components/ui/gradient-button"

export function HeroSection() {
  return (
    <GradientBackground 
      className="section pt-32 overflow-hidden"
    >
      <div className="container">
        <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl text-white">
              Never Forget Home Maintenance Again
            </h1>
            <p className="mt-4 text-lg text-white/90 md:text-xl">
              Stay on top of your home maintenance with smart reminders, easy service provider bookings, and secure
              document storage.
            </p>
            <div className="mt-8">
              <GradientButton
                variant="primary"
                size="lg"
                onClick={() => {
                  const element = document.getElementById("newsletter")
                  if (element) {
                    element.scrollIntoView({ behavior: "smooth" })
                  }
                }}
              >
                Join the Waitlist
              </GradientButton>
            </div>
          </motion.div>

          <motion.div
            className="relative mx-auto w-full max-w-md lg:max-w-lg"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="relative overflow-hidden rounded-lg shadow-xl">
              <Image
                src="/rivohome-homepage-hero.png"
                alt="HVAC filter maintenance - RivoHome helps you stay on top of home maintenance"
                width={600}
                height={600}
                className="w-full h-auto object-contain"
                priority
              />
            </div>
            <div className="absolute -bottom-6 -left-6 h-64 w-64 rounded-full bg-white/20 blur-3xl"></div>
            <div className="absolute -right-6 -top-6 h-64 w-64 rounded-full bg-white/20 blur-3xl"></div>
          </motion.div>
        </div>
      </div>
    </GradientBackground>
  )
}

