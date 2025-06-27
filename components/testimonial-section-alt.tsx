"use client"

import Image from "next/image"
import { motion } from "framer-motion"
import { Quote } from "lucide-react"

// Sample testimonial data
const testimonials = [
  {
    id: 1,
    quote:
      "RivoHome has completely changed how I manage my home maintenance. The reminders are perfectly timed, and I love having all my home documents in one place. I've already saved hundreds by catching issues early!",
    name: "Jessica Chen",
    title: "Homeowner in Seattle",
    image: "/placeholder.svg?height=100&width=100",
  },
  {
    id: 2,
    quote:
      "As a new homeowner, I was overwhelmed by all the maintenance tasks. RivoHome made it simple with clear schedules and easy-to-follow guides. Their service provider network saved me when my HVAC needed urgent repair.",
    name: "Marcus Johnson",
    title: "First-time Homeowner",
    image: "/placeholder.svg?height=100&width=100",
  },
  {
    id: 3,
    quote:
      "I used to forget important maintenance tasks until something broke. With RivoHome, I'm finally proactive about home care. The app is intuitive, and the reminders are helpful without being annoying.",
    name: "Sophia Rodriguez",
    title: "Condo Owner in Chicago",
    image: "/placeholder.svg?height=100&width=100",
  },
]

export function TestimonialSectionAlt() {
  return (
    <section className="section">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">What Our Users Say</h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Hear from our early adopters about how RivoHome has transformed their home maintenance experience.
          </p>
        </motion.div>

        <div className="grid gap-8 md:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="relative rounded-lg bg-accent p-8"
            >
              <div className="absolute -top-4 left-8 text-primary bg-background rounded-full p-2">
                <Quote className="h-6 w-6" />
              </div>
              <p className="mt-4 mb-6 text-muted-foreground">"{testimonial.quote}"</p>
              <div className="flex items-center">
                <Image
                  src={testimonial.image || "/placeholder.svg"}
                  alt={testimonial.name}
                  width={60}
                  height={60}
                  className="rounded-full mr-4 border-2 border-background"
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

