"use client"

import { motion } from "framer-motion"
import { GradientButton } from "@/components/ui/gradient-button"

export function JoinProviderCTA() {
  return (
    <section className="py-16 bg-white">
      <div className="container px-4 md:px-6 mx-auto">
        <motion.div
          className="max-w-2xl mx-auto text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900 mb-4">
            Ready to Start Getting More Qualified Leads?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Join RivoHome's growing network of verified service providers.
          </p>
          <GradientButton
            variant="primary"
            size="lg"
            onClick={() => {
              const target = document.querySelector('#contact-form');
              if (target) {
                window.scrollTo({
                  top: (target as HTMLElement).offsetTop,
                  behavior: 'smooth',
                });
              }
            }}
          >
            Join the Network
          </GradientButton>
        </motion.div>
      </div>
    </section>
  )
} 