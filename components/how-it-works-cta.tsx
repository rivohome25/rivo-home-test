"use client"

import { motion } from "framer-motion"
import { Button } from "./ui/button"
import Image from "next/image"
import Link from "next/link"

export function HowItWorksCTA() {
  return (
    <section className="py-20 bg-gray-50">
      <div className="container px-4 md:px-8 mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {/* Left column - Text content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Ready To Simplify Your Home Maintenance?
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Join RivoHome today and experience how easy home maintenance can be. Start your journey to a well-maintained home now.
            </p>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link href="/#notify-section">
                <Button
                  className="bg-gradient-to-r from-rivo-light to-rivo-dark hover:from-rivo-light/90 hover:to-rivo-dark/90 text-white px-8 py-6 rounded-full font-medium"
                  size="lg"
                >
                  Get Started Now
                </Button>
              </Link>
            </motion.div>
          </motion.div>

          {/* Right column - Image with decorative elements */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="relative rounded-lg overflow-hidden shadow-xl">
              <Image
                src="/resource-stock2.png"
                alt="Home with RivoHome maintenance system"
                width={600}
                height={400}
                className="w-full h-auto"
                priority
              />
            </div>
            
            {/* Decorative elements */}
            <motion.div 
              className="absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-rivo-light/20 z-0 blur-xl"
              animate={{ scale: [1, 1.1, 1], opacity: [0.7, 0.9, 0.7] }}
              transition={{ duration: 6, repeat: Infinity, repeatType: "reverse" }}
            />
            <motion.div 
              className="absolute -top-6 -right-6 h-24 w-24 rounded-full bg-rivo-dark/20 z-0 blur-xl"
              animate={{ scale: [1, 1.2, 1], opacity: [0.7, 0.8, 0.7] }}
              transition={{ duration: 5, repeat: Infinity, repeatType: "reverse" }}
            />
          </motion.div>
        </div>
      </div>
    </section>
  )
} 