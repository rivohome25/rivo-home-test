"use client"

import { motion } from "framer-motion"
import { Button } from "./ui/button"
import { FileText, Users, FolderArchive } from "lucide-react"

export function PremiumFeatures() {
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
    <section className="py-20 bg-gray-50">
      <div className="container px-4 md:px-8 mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Premium Features</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Upgrade your RivoHome experience with these advanced features.
          </p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {/* DIY Tutorials Card */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col items-center text-center p-8 rounded-lg border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow"
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
          >
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-rivo-light to-rivo-dark">
              <FileText className="h-8 w-8 text-white" />
            </div>
            <h3 className="mb-4 text-xl font-bold text-gray-900">DIY Tutorials</h3>
            <p className="mb-8 text-gray-600">
              Access a library of step-by-step tutorials for common home maintenance tasks. Save money and learn new skills.
            </p>
            <Button
              className="bg-gradient-to-r from-rivo-light to-rivo-dark hover:from-rivo-light/90 hover:to-rivo-dark/90 text-white"
            >
              Upgrade To Access
            </Button>
          </motion.div>

          {/* Service Provider Access Card */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col items-center text-center p-8 rounded-lg border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow"
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
          >
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-rivo-light to-rivo-dark">
              <Users className="h-8 w-8 text-white" />
            </div>
            <h3 className="mb-4 text-xl font-bold text-gray-900">Service Provider Access</h3>
            <p className="mb-8 text-gray-600">
              Connect with vetted local service providers for tasks beyond your expertise. Get quick, reliable help when needed.
            </p>
            <Button
              className="bg-gradient-to-r from-rivo-light to-rivo-dark hover:from-rivo-light/90 hover:to-rivo-dark/90 text-white"
            >
              Upgrade To Access
            </Button>
          </motion.div>

          {/* Document Storage Card */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col items-center text-center p-8 rounded-lg border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow"
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
          >
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-rivo-light to-rivo-dark">
              <FolderArchive className="h-8 w-8 text-white" />
            </div>
            <h3 className="mb-4 text-xl font-bold text-gray-900">Document Storage</h3>
            <p className="mb-8 text-gray-600">
              Securely store and organize important home-related documents. Access warranties, manuals, and receipts anytime.
            </p>
            <Button
              className="bg-gradient-to-r from-rivo-light to-rivo-dark hover:from-rivo-light/90 hover:to-rivo-dark/90 text-white"
            >
              Upgrade To Access
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
} 