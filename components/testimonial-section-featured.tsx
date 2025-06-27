"use client"

import Image from "next/image"
import { motion, useScroll, useTransform } from "framer-motion"
import { useRef } from "react"
import { Star } from "lucide-react"

// Sample testimonial data
const featuredTestimonial = {
  quote:
    "RivoHome has completely changed how I manage my home maintenance. The reminders are perfectly timed, and I love having all my home documents in one place. I've already saved hundreds by catching issues early!",
  name: "Jessica Chen",
  title: "Homeowner in Seattle",
  image: "/placeholder.svg?height=200&width=200",
  rating: 5,
}

const otherTestimonials = [
  {
    id: 1,
    quote:
      "As a new homeowner, I was overwhelmed by all the maintenance tasks. RivoHome made it simple with clear schedules and easy-to-follow guides.",
    name: "Marcus Johnson",
    title: "First-time Homeowner",
    image: "/placeholder.svg?height=100&width=100",
    rating: 5,
  },
  {
    id: 2,
    quote:
      "I used to forget important maintenance tasks until something broke. With RivoHome, I'm finally proactive about home care.",
    name: "Sophia Rodriguez",
    title: "Condo Owner in Chicago",
    image: "/placeholder.svg?height=100&width=100",
    rating: 5,
  },
  {
    id: 3,
    quote:
      "The document storage feature is a game-changer. I needed my water heater warranty info at 10 PM on a Sunday, and it was right there in the app.",
    name: "David Williams",
    title: "Homeowner for 15+ years",
    image: "/placeholder.svg?height=100&width=100",
    rating: 5,
  },
]

export function TestimonialSectionFeatured() {
  const sectionRef = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  })

  const y = useTransform(scrollYProgress, [0, 1], [50, -50])

  return (
    <section ref={sectionRef} className="section bg-white overflow-hidden">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-rivo-text">Trusted by Homeowners</h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-rivo-subtext">
            See what our early users have to say about their experience with RivoHome.
          </p>
        </motion.div>

        <div className="grid gap-8 lg:grid-cols-3">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-2 rounded-lg bg-rivo-skyBg p-8 shadow-sm"
          >
            <div className="flex items-center space-x-1 mb-4">
              {[...Array(featuredTestimonial.rating)].map((_, i) => (
                <Star key={i} className="h-5 w-5 fill-rivo-blue text-rivo-blue" />
              ))}
            </div>
            <p className="text-xl mb-6 text-rivo-subtext">"{featuredTestimonial.quote}"</p>
            <div className="flex items-center">
              <Image
                src={featuredTestimonial.image || "/placeholder.svg"}
                alt={featuredTestimonial.name}
                width={80}
                height={80}
                className="rounded-full mr-4 border-2 border-rivo-blue/20"
              />
              <div>
                <h4 className="text-lg font-medium text-rivo-text">{featuredTestimonial.name}</h4>
                <p className="text-rivo-subtext">{featuredTestimonial.title}</p>
              </div>
            </div>
          </motion.div>

          <div className="space-y-6">
            {otherTestimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 * (index + 1) }}
                style={{ y: index % 2 === 0 ? y : undefined }}
                className="rounded-lg bg-white p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300"
              >
                <div className="flex items-center space-x-1 mb-3">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-rivo-blue text-rivo-blue" />
                  ))}
                </div>
                <p className="mb-4 text-sm text-rivo-subtext">"{testimonial.quote}"</p>
                <div className="flex items-center">
                  <Image
                    src={testimonial.image || "/placeholder.svg"}
                    alt={testimonial.name}
                    width={40}
                    height={40}
                    className="rounded-full mr-3"
                  />
                  <div>
                    <h4 className="text-sm font-medium text-rivo-text">{testimonial.name}</h4>
                    <p className="text-xs text-rivo-subtext">{testimonial.title}</p>
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

