"use client"

import { motion } from "framer-motion"
import { 
  Clock, 
  CreditCard, 
  ShieldCheck, 
  StarIcon, 
  MessageSquare, 
  Users 
} from "lucide-react"

const features = [
  {
    icon: Users,
    title: "Qualified Leads Only",
    description: "We vet home owners so you get real jobs—not just clicks."
  },
  {
    icon: CreditCard,
    title: "Flexible Pricing",
    description: "Choose pay-per-lead or monthly plans depending on what works for you."
  },
  {
    icon: ShieldCheck,
    title: "Fewer Competitors Per Job",
    description: "No lead overload. We limit how many providers get each request."
  },
  {
    icon: StarIcon,
    title: "Recurring Clients",
    description: "Win customers who return seasonally or for future projects."
  },
  {
    icon: Clock,
    title: "Easy Scheduling",
    description: "Let customers book your available time slots instantly."
  },
  {
    icon: MessageSquare,
    title: "Review Visibility",
    description: "Stand out with verified reviews and trust-building badges."
  }
]

export function ProviderFeatures() {
  return (
    <section id="provider-features" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <motion.h2 
            className="text-3xl md:text-4xl font-bold text-gray-900 mb-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            Everything You Need to Succeed
          </motion.h2>
          <motion.p 
            className="text-lg text-gray-600 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Our platform gives you powerful tools to grow your business and delight your customers
          </motion.p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.1 * index }}
            >
              <div className="w-12 h-12 rounded-full bg-rivo-light/20 text-rivo-base flex items-center justify-center mb-4">
                <feature.icon className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-rivo-dark">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
} 