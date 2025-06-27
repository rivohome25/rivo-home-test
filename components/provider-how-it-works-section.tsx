"use client"

import { motion } from "framer-motion"
import { UserPlus, MessageSquare, Calendar, CheckCircle } from "lucide-react"

const steps = [
  {
    icon: <UserPlus className="h-8 w-8" />,
    title: "Create Your Profile",
    description: "Sign up and create your service provider profile with your specialties and service area.",
  },
  {
    icon: <MessageSquare className="h-8 w-8" />,
    title: "Get Matched",
    description: "We'll connect you with homeowners in your area who need your services.",
  },
  {
    icon: <Calendar className="h-8 w-8" />,
    title: "Manage Bookings",
    description: "Accept bookings and manage your schedule through our easy-to-use platform.",
  },
  {
    icon: <CheckCircle className="h-8 w-8" />,
    title: "Grow Your Business",
    description: "Build your reputation with reviews and grow your customer base.",
  },
]

export function ProviderHowItWorksSection() {
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
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">How It Works For Providers</h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Getting started with RivoHome is easy. Here's how you can join our network and start growing your business.
          </p>
        </motion.div>

        <div className="mt-16 relative">
          <div className="absolute left-1/2 top-0 h-full w-1 -translate-x-1/2 bg-muted md:block hidden"></div>

          <div className="space-y-12 relative">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`md:flex items-center gap-8 ${index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse text-right"}`}
              >
                <div className={`flex-1 ${index % 2 !== 0 ? "md:text-right" : ""}`}>
                  <h3 className="text-xl font-medium">{step.title}</h3>
                  <p className="mt-2 text-muted-foreground">{step.description}</p>
                </div>

                <div className="hidden md:flex items-center justify-center">
                  <div className="relative flex h-12 w-12 items-center justify-center rounded-full border border-muted bg-background">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      {index + 1}
                    </div>
                  </div>
                </div>

                <div className="flex-1 md:block hidden">
                  <div
                    className={`inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary ${index % 2 === 0 ? "ml-auto" : "mr-auto"}`}
                  >
                    {step.icon}
                  </div>
                </div>

                <div className="flex md:hidden mt-4 items-center gap-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    {index + 1}
                  </div>
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
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

