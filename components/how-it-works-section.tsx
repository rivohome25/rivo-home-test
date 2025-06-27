"use client"

import { motion } from "framer-motion"
import { Bell, Calendar, FileText, Users } from "lucide-react"

const steps = [
  {
    icon: <Bell className="h-8 w-8" />,
    title: "Get Reminders",
    description: "Receive timely notifications for all your home maintenance tasks.",
  },
  {
    icon: <Calendar className="h-8 w-8" />,
    title: "Book Professionals",
    description: "Easily connect with local, trusted service providers.",
  },
  {
    icon: <FileText className="h-8 w-8" />,
    title: "Save Records",
    description: "Store all your home documents securely in one place.",
  },
]

export function HowItWorksSection() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  }

  return (
    <section className="section bg-rivo-skyBg">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-rivo-text">How It Works</h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-rivo-subtext">
            RivoHome makes home maintenance simple and stress-free.
          </p>
        </motion.div>

        <motion.div
          className="mt-12 grid gap-8 md:grid-cols-3"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {steps.map((step, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="flex flex-col items-center text-center"
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
            >
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-rivo-blue text-white shadow-lg">
                {step.icon}
              </div>
              <h3 className="mb-2 text-xl font-medium text-rivo-text">{step.title}</h3>
              <p className="text-rivo-subtext">{step.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

