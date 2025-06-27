"use client"

import { motion } from "framer-motion"
import { Button } from "./ui/button"
import { Check, Calendar } from "lucide-react"

export function CoreFeatures() {
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
    <section className="py-20 bg-white">
      <div className="container px-4 md:px-8 mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">RivoHome Features</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Our innovative platform offers powerful tools to streamline your home maintenance experience.
          </p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {/* Task Automation Card */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col items-center text-center p-8 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
          >
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-rivo-light to-rivo-dark">
              <Check className="h-8 w-8 text-white" />
            </div>
            <h3 className="mb-4 text-xl font-bold text-gray-900">Task Automation</h3>
            <p className="mb-8 text-gray-600">
              Set up recurring tasks and let our system handle the reminders. Never forget about important maintenance tasks again.
            </p>
            <Button
              className="bg-white border border-rivo-dark text-rivo-dark hover:bg-rivo-dark hover:text-white transition-colors"
              variant="outline"
            >
              Learn More
            </Button>
          </motion.div>

          {/* Maintenance Calendar Card */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col items-center text-center p-8 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
          >
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-rivo-light to-rivo-dark">
              <Calendar className="h-8 w-8 text-white" />
            </div>
            <h3 className="mb-4 text-xl font-bold text-gray-900">Maintenance Calendar</h3>
            <p className="mb-8 text-gray-600">
              View all your upcoming home maintenance tasks at a glance. Stay on top of your home care schedule effortlessly.
            </p>
            <Button
              className="bg-white border border-rivo-dark text-rivo-dark hover:bg-rivo-dark hover:text-white transition-colors"
              variant="outline"
            >
              Learn More
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
} 