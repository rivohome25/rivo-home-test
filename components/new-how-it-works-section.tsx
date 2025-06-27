"use client"

import { motion } from "framer-motion"

const steps = [
  {
    title: "Set Up Your Home Profile",
    description: "Input your home details and customize your maintenance preferences.",
  },
  {
    title: "Receive Automated Reminders",
    description: "Get timely notifications for upcoming maintenance tasks.",
  },
  {
    title: "Maintain Your Home With Ease",
    description: "Complete tasks yourself or hire professionals through our platform.",
  },
]

export function NewHowItWorksSection() {
  return (
    <section className="bg-gray-50 py-16">
      <div className="max-w-6xl mx-auto px-4 text-center">
        <h2 className="text-3xl font-bold mb-10 text-rivo-dark">How It Works</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="flex flex-col items-center"
            >
              <div className="w-12 h-12 rounded-full bg-rivo-base text-white text-xl font-bold flex items-center justify-center mb-4">
                {index + 1}
              </div>
              <h3 className="font-semibold text-lg mb-2 text-rivo-dark">{step.title}</h3>
              <p className="text-sm text-rivo-dark/80">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
} 