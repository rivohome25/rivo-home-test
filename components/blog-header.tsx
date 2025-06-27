"use client"

import { motion } from "framer-motion"

export function BlogHeader() {
  return (
    <section className="section bg-accent">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Home Maintenance Resources</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Expert tips, guides, and advice to help you maintain your home and avoid costly repairs.
          </p>
        </motion.div>
      </div>
    </section>
  )
}

