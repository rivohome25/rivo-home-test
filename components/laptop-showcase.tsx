"use client"

import { motion } from "framer-motion"
import Image from "next/image"

export function LaptopShowcase() {
  return (
    <section className="py-16 bg-white overflow-hidden">
      <div className="container px-4 md:px-6 mx-auto">
        <motion.div
          className="relative w-full max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <div className="relative overflow-hidden rounded-lg shadow-xl">
            <Image
              src="/rivohome-laptop.png"
              alt="RivoHome application dashboard on laptop"
              width={1200}
              height={800}
              className="w-full h-auto object-contain"
              priority
            />
          </div>
          
          {/* Decorative glow effects */}
          <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-rivo-light/20 blur-3xl"></div>
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-rivo-base/20 blur-3xl"></div>
        </motion.div>
      </div>
    </section>
  )
} 