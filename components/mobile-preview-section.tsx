"use client"

import Image from "next/image"
import { motion, useScroll, useTransform } from "framer-motion"
import { useRef } from "react"

export function MobilePreviewSection() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  })

  const y = useTransform(scrollYProgress, [0, 1], [50, -50])

  return (
    <section ref={sectionRef} className="section bg-white overflow-hidden">
      <div className="container">
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-rivo-text">
              Manage Your Home From Anywhere
            </h2>
            <p className="mt-4 text-lg text-rivo-subtext">
              The RivoHome app puts all your home maintenance needs at your fingertips. Track maintenance schedules,
              find service providers, and store important documents all in one place.
            </p>
            <ul className="mt-6 space-y-3">
              <li className="flex items-center">
                <div className="mr-2 h-2 w-2 rounded-full bg-rivo-blue"></div>
                <span className="text-rivo-text">Intuitive dashboard for all your home systems</span>
              </li>
              <li className="flex items-center">
                <div className="mr-2 h-2 w-2 rounded-full bg-rivo-blue"></div>
                <span className="text-rivo-text">Smart notifications based on your home's needs</span>
              </li>
              <li className="flex items-center">
                <div className="mr-2 h-2 w-2 rounded-full bg-rivo-blue"></div>
                <span className="text-rivo-text">Secure document storage for warranties and manuals</span>
              </li>
              <li className="flex items-center">
                <div className="mr-2 h-2 w-2 rounded-full bg-rivo-blue"></div>
                <span className="text-rivo-text">One-tap booking with trusted service providers</span>
              </li>
            </ul>
          </motion.div>

          <motion.div className="relative mx-auto w-full max-w-lg" style={{ y }}>
            <div className="relative overflow-hidden rounded-lg shadow-xl">
              <Image
                src="/rivohome-laptop.png"
                alt="RivoHome application on laptop"
                width={700}
                height={500}
                className="w-full h-auto object-contain"
                priority
              />
            </div>
            <div className="absolute -bottom-6 -left-6 h-64 w-64 rounded-full bg-rivo-blue/20 blur-3xl"></div>
            <div className="absolute -right-6 -top-6 h-64 w-64 rounded-full bg-rivo-blue/20 blur-3xl"></div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

