"use client"

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"

export function ProviderHeroSection() {
  return (
    <section className="section overflow-hidden">
      <div className="container">
        <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">Partner with RivoHome</h1>
            <p className="mt-4 text-lg text-muted-foreground md:text-xl">
              Connect with homeowners in your area, get more leads, and grow your business with our smart home
              maintenance platform.
            </p>
            <div className="mt-8">
              <Button asChild size="lg" className="rounded-full px-8">
                <Link href="#newsletter">Get Early Access</Link>
              </Button>
            </div>
          </motion.div>

          <motion.div
            className="relative mx-auto w-full max-w-md lg:max-w-none"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Image
              src="/placeholder.svg?height=600&width=600"
              alt="Service provider using RivoHome"
              width={600}
              height={600}
              className="rounded-lg shadow-xl"
              priority
            />
            <div className="absolute -bottom-6 -left-6 h-64 w-64 rounded-full bg-primary/20 blur-3xl"></div>
            <div className="absolute -right-6 -top-6 h-64 w-64 rounded-full bg-primary/20 blur-3xl"></div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

