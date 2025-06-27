"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { GradientBackground } from "@/components/ui/gradient-background"
import { GradientButton } from "@/components/ui/gradient-button"

export function ProviderCTASection() {
  return (
    <section className="section">
      <div className="container">
        <GradientBackground
          className="rounded-2xl p-8 text-white md:p-12 lg:p-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.3 }}
        >
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Are You a Service Provider?</h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg">
              Join our network of trusted professionals and connect with homeowners in your area.
            </p>
            <div className="mt-8">
              <GradientButton
                variant="secondary"
                size="lg"
                onClick={() => {
                  window.location.href = "/providers"
                }}
              >
                Partner with RivoHome
              </GradientButton>
            </div>
          </div>
        </GradientBackground>
      </div>
    </section>
  )
}

