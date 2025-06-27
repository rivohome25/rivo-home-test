"use client"

import { motion } from "framer-motion"
import { Star } from "lucide-react"
import Image from "next/image"

const testimonials = [
  {
    quote:
      "Since joining RivoHome, my HVAC business has seen a 30% increase in new customers. The platform makes it easy to manage bookings and communicate with clients.",
    name: "Michael Johnson",
    title: "HVAC Specialist",
    avatar: "/placeholder.svg?height=80&width=80",
  },
  {
    quote:
      "As a plumber, I've tried many platforms to find new clients. RivoHome has been the most effective by far, connecting me with homeowners who actually need my services.",
    name: "Sarah Williams",
    title: "Master Plumber",
    avatar: "/placeholder.svg?height=80&width=80",
  },
  {
    quote:
      "The scheduling system is a game-changer. I can manage all my appointments in one place and my customers love the reminder system.",
    name: "David Chen",
    title: "Electrician",
    avatar: "/placeholder.svg?height=80&width=80",
  },
]

export function ProviderTrustSection() {
  return (
    <section className="section bg-accent">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Trusted by Service Providers</h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Hear what other service providers have to say about their experience with RivoHome.
          </p>
        </motion.div>

        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="rounded-lg bg-background p-6 shadow-sm"
            >
              <div className="flex items-center space-x-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-primary text-primary" />
                ))}
              </div>
              <p className="mb-6 text-muted-foreground">"{testimonial.quote}"</p>
              <div className="flex items-center">
                <Image
                  src={testimonial.avatar || "/placeholder.svg"}
                  alt={testimonial.name}
                  width={48}
                  height={48}
                  className="rounded-full mr-4"
                />
                <div>
                  <h4 className="font-medium">{testimonial.name}</h4>
                  <p className="text-sm text-muted-foreground">{testimonial.title}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

