"use client"

import Image from "next/image"
import { motion } from "framer-motion"

export function AboutMission() {
  return (
    <section className="section">
      <div className="container">
        <div className="grid gap-12 lg:grid-cols-2 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Our Mission</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              At RivoHome, we believe that maintaining your home shouldn't be complicated or stressful. Our platform is
              designed to simplify home maintenance through smart technology and a network of trusted service providers.
            </p>
            <p className="mt-4 text-lg text-muted-foreground">
              We're building a future where homeowners never have to worry about forgetting important maintenance tasks
              or searching for reliable service providers. With RivoHome, everything you need to maintain your home is
              at your fingertips.
            </p>
            
            <motion.div 
              className="mt-8 p-6 bg-gray-50 rounded-lg border-l-4 border-rivo-base"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <p className="text-lg italic text-gray-700">
                "Rivo started with a simple realization: there's no easy way to stay on top of your home. Life gets busy, tasks get missed, and small issues become big problems. With the help of some brilliant minds, I created Rivo to change that—to make maintenance feel manageable, not overwhelming."
              </p>
              <p className="mt-3 text-rivo-dark font-medium">
                — Founder, RivoHome
              </p>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Image
              src="/RivoHome_Mission_Image.jpg"
              alt="RivoHome Mission - Simplifying home maintenance"
              width={600}
              height={600}
              className="rounded-lg shadow-lg"
            />
          </motion.div>
        </div>
      </div>
    </section>
  )
}

