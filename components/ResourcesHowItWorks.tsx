"use client"

import { motion } from "framer-motion"
import Image from "next/image"

export function ResourcesHowItWorks() {
  return (
    <section className="py-20 bg-white">
      <div className="container px-4 md:px-8 mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-3xl md:text-4xl font-bold text-gray-900 mb-12 text-center md:text-left"
        >
          How It Works
        </motion.h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - How It Works Content */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="space-y-8"
          >
            {/* Step 1 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              whileHover={{ y: -5 }}
              className="flex gap-4"
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-rivo-base text-white flex items-center justify-center font-bold">
                1
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Sign Up & Connect</h3>
                <p className="text-gray-600">
                  Create your account and connect your home. We'll help you set up your maintenance profile.
                </p>
              </div>
            </motion.div>

            {/* Step 2 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              whileHover={{ y: -5 }}
              className="flex gap-4"
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-rivo-base text-white flex items-center justify-center font-bold">
                2
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Get Smart Reminders</h3>
                <p className="text-gray-600">
                  Receive personalized maintenance reminders based on your home's needs and schedule.
                </p>
              </div>
            </motion.div>

            {/* Step 3 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              whileHover={{ y: -5 }}
              className="flex gap-4"
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-rivo-base text-white flex items-center justify-center font-bold">
                3
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Book & Manage</h3>
                <p className="text-gray-600">
                  Easily book service providers, track maintenance history, and store important documents.
                </p>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Column - Laptop Image */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="relative flex items-center justify-center"
          >
            <div className="relative w-full max-w-2xl mx-auto">
              <motion.div
                initial={{ scale: 0.95 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
              >
                <Image
                  src="/rivohome-laptop.png"
                  alt="RivoHome Dashboard on Laptop"
                  width={800}
                  height={600}
                  className="w-full h-auto object-contain"
                  priority
                />
              </motion.div>
              {/* Decorative elements */}
              <div className="absolute -bottom-6 -left-6 h-32 w-32 rounded-full bg-rivo-light/20 blur-3xl"></div>
              <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-rivo-base/20 blur-3xl"></div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
} 