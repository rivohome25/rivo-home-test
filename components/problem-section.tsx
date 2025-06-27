"use client"

import { motion } from "framer-motion"
import { CalendarClock, Users, FolderLock, PlayCircle, Tag, Gift } from "lucide-react"

const needs = [
  {
    title: "Smart Reminders",
    description: "Automated, personalized tasks and seasonal alerts.",
    icon: <CalendarClock className="h-6 w-6 text-indigo-600" aria-hidden="true" role="img" />,
  },
  {
    title: "Book Trusted Professionals",
    description: "Verified service providers with upfront pricing.",
    icon: <Users className="h-6 w-6 text-indigo-600" aria-hidden="true" role="img" />,
  },
  {
    title: "Store Your Docs",
    description: "Securely organize your home warranties and receipts.",
    icon: <FolderLock className="h-6 w-6 text-indigo-600" aria-hidden="true" role="img" />,
  },
  {
    title: "DIY Video Library",
    description: "Access step-by-step guides for small maintenance jobs.",
    icon: <PlayCircle className="h-6 w-6 text-indigo-600" aria-hidden="true" role="img" />,
  },
  {
    title: "Discounted Services",
    description: "Unlock exclusive pricing on repairs and services.",
    icon: <Tag className="h-6 w-6 text-indigo-600" aria-hidden="true" role="img" />,
  },
  {
    title: "Referral Rewards",
    description: "Invite friends and earn perks instantly.",
    icon: <Gift className="h-6 w-6 text-indigo-600" aria-hidden="true" role="img" />,
  },
]

export function ProblemSection() {
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
    <section className="section bg-white py-16">
      <div className="container px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-rivo-text">Common Homeowner Needs</h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-rivo-subtext">
            These are the most common needs RivoHome helps homeowners solve.
          </p>
        </motion.div>

        <motion.div
          className="mt-12 grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {needs.map((need, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="rounded-xl bg-white p-6 shadow-sm border border-gray-200 hover:shadow-md transition-all duration-300"
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
            >
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100">
                {need.icon}
              </div>
              <h3 className="mb-2 text-lg font-semibold text-rivo-text">{need.title}</h3>
              <p className="text-sm text-gray-600">{need.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

