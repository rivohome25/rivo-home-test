"use client"

import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import { GradientButton } from "@/components/ui/gradient-button"

export function ProviderHero() {
  return (
    <section className="section overflow-hidden">
      <div className="container">
        <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">Partner with RivoHome</h1>
            <p className="mt-4 text-lg text-muted-foreground md:text-xl">
              Join our network of trusted service providers and connect with homeowners looking for your expertise. Grow
              your business with our smart home maintenance platform.
            </p>
            <div className="mt-8">
              <GradientButton variant="primary" size="lg">
                <Link href="#contact-form">Apply to Join</Link>
              </GradientButton>
            </div>
          </motion.div>

          <motion.div
            className="relative mx-auto w-full max-w-md lg:max-w-none"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="relative">
              <Image
                src="/rivohome-provider.png"
                alt="Service provider changing HVAC filter - RivoHome connects homeowners with professional service providers"
                width={600}
                height={600}
                className="rounded-lg shadow-xl object-cover"
                priority
              />
              <div className="absolute -bottom-6 -left-6 h-64 w-64 rounded-full bg-primary/20 blur-3xl"></div>
              <div className="absolute -right-6 -top-6 h-64 w-64 rounded-full bg-primary/20 blur-3xl"></div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

