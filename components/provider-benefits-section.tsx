"use client"

import { motion } from "framer-motion"
import { Calendar, DollarSign, Users, TrendingUp } from "lucide-react"

const benefits = [
  {
    icon: <Users className="h-8 w-8" />,
    title: "More Leads",
    description: "Connect with homeowners actively looking for your services in your area.",
  },
  {
    icon: <Calendar className="h-8 w-8" />,
    title: "Easy Bookings",
    description: "Manage your schedule and appointments all in one place.",
  },
  {
    icon: <DollarSign className="h-8 w-8" />,
    title: "Increased Revenue",
    description: "Grow your business with a steady stream of qualified leads.",
  },
  {
    icon: <TrendingUp className="h-8 w-8" />,
    title: "Enhanced Visibility",
    description: "Stand out from the competition with a verified provider profile.",
  },
]

export function ProviderBenefitsSection() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  }

  return (
    <section className="section bg-accent">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Provider Benefits</h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Join our network of trusted service providers and grow your business with RivoHome.
          </p>
        </motion.div>

        <motion.div
          className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {benefits.map((benefit, index) => (
            <motion.div key={index} variants={itemVariants} className="rounded-lg bg-background p-6 shadow-sm">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                {benefit.icon}
              </div>
              <h3 className="mb-2 text-lg font-medium">{benefit.title}</h3>
              <p className="text-muted-foreground">{benefit.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

