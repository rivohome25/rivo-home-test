"use client"

import { useState } from "react"
import Image from "next/image"
import { motion } from "framer-motion"
import { ChevronLeft, ChevronRight, Quote } from "lucide-react"
import { Button } from "@/components/ui/button"

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
  {
    id: 4,
    quote:
      "The document storage feature is a game-changer. I needed my water heater warranty info at 10 PM on a Sunday, and it was right there in the app. RivoHome has simplified my life in ways I didn't expect.",
    name: "David Williams",
    title: "Homeowner for 15+ years",
    image: "/placeholder.svg?height=100&width=100",
  },
]

export function TestimonialSection() {
  const [currentIndex, setCurrentIndex] = useState(0)

  const nextTestimonial = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % testimonials.length)
  }

  const prevTestimonial = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + testimonials.length) % testimonials.length)
  }

  return (
    <section className="section bg-accent overflow-hidden">
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

        {/* Desktop Layout - Grid */}
        <div className="hidden md:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {testimonials.map((testimonial, index) => (
            <TestimonialCard key={testimonial.id} testimonial={testimonial} index={index} />
          ))}
        </div>

        {/* Mobile Layout - Carousel */}
        <div className="md:hidden">
          <div className="relative">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.3 }}
            >
              <div className="bg-background rounded-lg p-6 shadow-sm">
                <div className="mb-4 text-primary">
                  <Quote className="h-8 w-8" />
                </div>
                <p className="mb-6 italic text-muted-foreground">"{testimonials[currentIndex].quote}"</p>
                <div className="flex items-center">
                  <Image
                    src={testimonials[currentIndex].image || "/placeholder.svg"}
                    alt={testimonials[currentIndex].name}
                    width={50}
                    height={50}
                    className="rounded-full mr-4"
                  />
                  <div>
                    <h4 className="font-medium">{testimonials[currentIndex].name}</h4>
                    <p className="text-sm text-muted-foreground">{testimonials[currentIndex].title}</p>
                  </div>
                </div>
              </div>
            </motion.div>

            <div className="flex justify-center mt-6 space-x-2">
              <Button variant="outline" size="icon" onClick={prevTestimonial} className="h-8 w-8 rounded-full">
                <ChevronLeft className="h-4 w-4" />
                <span className="sr-only">Previous</span>
              </Button>
              {testimonials.map((_, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentIndex(index)}
                  className={`h-2 w-2 rounded-full p-0 ${index === currentIndex ? "bg-primary" : "bg-muted"}`}
                >
                  <span className="sr-only">Go to slide {index + 1}</span>
                </Button>
              ))}
              <Button variant="outline" size="icon" onClick={nextTestimonial} className="h-8 w-8 rounded-full">
                <ChevronRight className="h-4 w-4" />
                <span className="sr-only">Next</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

interface TestimonialCardProps {
  testimonial: {
    id: number
    quote: string
    name: string
    title: string
    image: string
  }
  index: number
}

function TestimonialCard({ testimonial, index }: TestimonialCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="bg-background rounded-lg p-6 shadow-sm h-full flex flex-col"
    >
      <div className="mb-4 text-primary">
        <Quote className="h-8 w-8" />
      </div>
      <p className="mb-6 flex-grow italic text-muted-foreground">"{testimonial.quote}"</p>
      <div className="flex items-center">
        <Image
          src={testimonial.image || "/placeholder.svg"}
          alt={testimonial.name}
          width={50}
          height={50}
          className="rounded-full mr-4"
        />
        <div>
          <h4 className="font-medium">{testimonial.name}</h4>
          <p className="text-sm text-muted-foreground">{testimonial.title}</p>
        </div>
      </div>
    </motion.div>
  )
}

