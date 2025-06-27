"use client"

import { motion } from "framer-motion"
import { UserPlus, CheckCircle, Calendar, Star } from "lucide-react"

const steps = [
  {
    icon: <UserPlus className="h-8 w-8" />,
    title: "Create your profile",
    description: "Sign up and create your professional profile with your services, service area, and availability.",
  },
  {
    icon: <CheckCircle className="h-8 w-8" />,
    title: "Get verified",
    description: "Complete our verification process to build trust with potential customers.",
  },
  {
    icon: <Calendar className="h-8 w-8" />,
    title: "Manage bookings",
    description: "Receive booking requests and manage your schedule through our platform.",
  },
  {
    icon: <Star className="h-8 w-8" />,
    title: "Build your reputation",
    description: "Collect reviews from satisfied customers to enhance your profile and attract more business.",
  },
]

export function ProviderSteps() {
  return (
    <section className="section">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">How It Works</h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Getting started with RivoHome is simple. Follow these steps to join our network of trusted providers.
          </p>
        </motion.div>

        <div className="mt-16 relative">
          {/* Vertical line for desktop */}
          <div className="absolute left-1/2 top-0 h-full w-1 -translate-x-1/2 bg-muted md:block hidden"></div>

          <div className="space-y-16 relative">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`md:flex items-center gap-8 ${index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"}`}
              >
                <div className={`flex-1 ${index % 2 !== 0 ? "md:text-right" : ""}`}>
                  <h3 className="text-xl font-medium">{step.title}</h3>
                  <p className="mt-2 text-muted-foreground">{step.description}</p>
                </div>

                {/* Circle with number for desktop */}
                <div className="hidden md:flex items-center justify-center">
                  <div className="relative flex h-16 w-16 items-center justify-center rounded-full border-4 border-primary bg-background">
                    <span className="text-xl font-bold text-primary">{index + 1}</span>
                  </div>
                </div>

                <div className="flex-1 md:block hidden">
                  <div
                    className={`inline-flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary ${index % 2 === 0 ? "ml-auto" : "mr-auto"}`}
                  >
                    {step.icon}
                  </div>
                </div>

                {/* Mobile version */}
                <div className="flex md:hidden mt-4 items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <span className="font-bold">{index + 1}</span>
                  </div>
                  <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                    {step.icon}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

