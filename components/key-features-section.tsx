"use client"

import { motion } from "framer-motion"
import { BellRing, Users, FileBox, Play, Sparkles, Gift, Calendar } from "lucide-react"

const features = [
  {
    title: "Smart Reminders",
    description: "Automated, personalized tasks and seasonal alerts.",
    icon: BellRing,
  },
  {
    title: "Book Trusted Professionals",
    description: "Verified service providers with upfront pricing.",
    icon: Users,
    highlighted: true,
  },
  {
    title: "Store Your Docs",
    description: "Securely organize your home warranties and receipts.",
    icon: FileBox,
  },
  {
    title: "DIY Video Library",
    description: "Access step-by-step guides for small maintenance jobs.",
    icon: Play,
  },
  {
    title: "Discounted Services",
    description: "Unlock exclusive pricing on repairs and services.",
    icon: Sparkles,
  },
  {
    title: "Referral Rewards",
    description: "Invite friends and earn perks instantly.",
    icon: Gift,
  },
]

export function KeyFeaturesSection() {
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

  const highlightedVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { 
        duration: 0.6,
        type: "spring",
        stiffness: 300,
        delay: 0.1
      } 
    },
  }

  return (
    <section className="py-20 bg-white">
      <div className="container px-4 md:px-6 mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900">
            Key Features for Homeowners
          </h2>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mt-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={feature.highlighted ? highlightedVariants : itemVariants}
              className="group transition-all duration-300 ease-in-out rounded-xl p-6 border border-gray-200 bg-white hover:bg-rivo-base hover:shadow-md"
              whileHover={feature.highlighted ? { scale: 1.03 } : { scale: 1.02 }}
            >
              <div className="mb-4 h-12 w-12 rounded-full bg-rivo-light/10 flex items-center justify-center transition duration-300 group-hover:bg-white/20">
                {feature.icon && (
                  <feature.icon 
                    className="h-6 w-6 text-rivo-base transition duration-300 group-hover:text-white"
                  />
                )}
              </div>
              <h3 className="text-lg font-bold mb-2 text-gray-900 transition duration-300 group-hover:text-white">
                {feature.title || "Feature"}
              </h3>
              <p className="text-sm text-gray-500 transition duration-300 group-hover:text-white/90">
                {feature.description || "Description"}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
} 