"use client"

import { motion } from "framer-motion"
import { Home, Bell, ClipboardCheck, BarChart3 } from "lucide-react"
import { Button } from "./ui/button"

const features = [
  {
    title: "Set Up Your Home Profile",
    description: "Input your home details, including age, size, and specific systems. Customize your maintenance preferences and frequency.",
    icon: <Home className="h-8 w-8 text-white" />,
  },
  {
    title: "Receive Automated Reminders",
    description: "Get timely notifications for upcoming maintenance tasks. Choose how you want to be reminded – email, SMS, or push notifications.",
    icon: <Bell className="h-8 w-8 text-white" />,
  },
  {
    title: "Complete Maintenance Tasks",
    description: "Follow our guided process to complete tasks yourself or easily connect with vetted professionals through our platform.",
    icon: <ClipboardCheck className="h-8 w-8 text-white" />,
  },
  {
    title: "Track And Improve",
    description: "Log completed tasks, view your home's maintenance history, and get insights to improve your home care routine over time.",
    icon: <BarChart3 className="h-8 w-8 text-white" />,
  },
];

export function HowItWorksFeatureGrid() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

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
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">How It Works</h2>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="flex flex-col items-center text-center p-8 rounded-lg border border-gray-200 shadow-sm"
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
            >
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-r from-rivo-light to-rivo-dark">
                {feature.icon}
              </div>
              <h3 className="mb-4 text-xl font-bold text-gray-900">{feature.title}</h3>
              <p className="mb-8 text-gray-600">{feature.description}</p>
              <Button
                className="bg-rivo-dark hover:bg-rivo-dark/90 text-white"
              >
                Upgrade To Access
              </Button>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
} 