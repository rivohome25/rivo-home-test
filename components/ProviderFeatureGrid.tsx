"use client"

import { motion } from "framer-motion"
import { Briefcase, Tag, Repeat, CalendarCheck, Users, Star } from "lucide-react"

const benefits = [
  {
    title: "Qualified Leads Only",
    description: "We vet homeowners so you get real jobs — not just clicks.",
    icon: <Briefcase className="h-6 w-6 text-rivo-light" />,
  },
  {
    title: "Flexible Pricing",
    description: "Choose pay-per-lead or monthly plans depending on what works for you.",
    icon: <Tag className="h-6 w-6 text-rivo-base" />,
  },
  {
    title: "Fewer Competitors Per Job",
    description: "We limit how many providers get each request.",
    icon: <Users className="h-6 w-6 text-rivo-dark" />,
  },
  {
    title: "Recurring Clients",
    description: "Get customers who return for seasonal or future jobs.",
    icon: <Repeat className="h-6 w-6 text-rivo-light" />,
  },
  {
    title: "Easy Scheduling",
    description: "Let customers book your availability instantly.",
    icon: <CalendarCheck className="h-6 w-6 text-rivo-base" />,
  },
  {
    title: "Review Visibility",
    description: "Stand out with verified reviews and trust-building badges.",
    icon: <Star className="h-6 w-6 text-rivo-dark" />,
  },
]

export function ProviderFeatureGrid() {
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
    <section className="py-16 bg-gray-50">
      <div className="container px-4 md:px-6 mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900">
            Key Features
          </h2>
          <p className="mt-4 text-xl text-gray-600 max-w-2xl mx-auto">
            Designed to support service providers with qualified leads, tools, and flexible pricing.
          </p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {benefits.map((benefit, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="bg-white rounded-xl p-6 shadow-sm border-l-4 border-rivo-base hover:shadow-md transition-shadow duration-300 flex flex-col items-center text-center"
            >
              <div className="mb-4 h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
                {benefit.icon}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{benefit.title}</h3>
              <p className="text-sm text-gray-600">{benefit.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
} 