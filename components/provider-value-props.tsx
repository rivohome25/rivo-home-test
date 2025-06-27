"use client"

import { motion } from "framer-motion"
import { Search, Calendar, TrendingUp } from "lucide-react"

const valueProps = [
  {
    icon: <Search className="h-10 w-10" />,
    title: "Get discovered by local homeowners",
    description:
      "Connect with homeowners in your area who are actively looking for your services. Our platform matches you with the right customers at the right time.",
  },
  {
    icon: <Calendar className="h-10 w-10" />,
    title: "Simplified booking tools",
    description:
      "Manage your appointments, schedule, and client communications all in one place with our easy-to-use booking system.",
  },
  {
    icon: <TrendingUp className="h-10 w-10" />,
    title: "Grow your business",
    description:
      "Increase your customer base, build your reputation with reviews, and expand your service offerings to boost your revenue.",
  },
]

export function ProviderValueProps() {
  return null
}

