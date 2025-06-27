/**
 * RivoReportHowItWorks Component - Explains how the planned RivoReport process will work
 * 
 * Shows the envisioned step-by-step process of getting a RivoReport and how it's
 * designed to integrate with RivoHome's maintenance platform.
 */

"use client"

import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { 
  Home, 
  Search, 
  FileText, 
  Calendar,
  Bell,
  TrendingUp,
  ArrowRight,
  CheckCircle,
  Users
} from "lucide-react"

const steps = [
  {
    step: "01",
    icon: Home,
    title: "Connect Your Property",
    description: "Register your property through the RivoHome platform with details like address, square footage, and key systems to establish your property profile.",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/20"
  },
  {
    step: "02", 
    icon: Calendar,
    title: "Track Maintenance Activities",
    description: "Use RivoHome's platform to schedule and complete maintenance tasks through our verified service provider network or document your own DIY efforts.",
    color: "text-green-500",
    bgColor: "bg-green-500/10", 
    borderColor: "border-green-500/20"
  },
  {
    step: "03",
    icon: Search,
    title: "Planned Verification System",
    description: "RivoReport will be designed to track maintenance completion through multiple verification methods, building a comprehensive activity history.",
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/20"
  },
  {
    step: "04",
    icon: FileText,
    title: "Generate Your RivoReport", 
    description: "When available, access comprehensive property reports showing maintenance history, activity timeline, and care documentation from your RivoHome account.",
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
    borderColor: "border-orange-500/20"
  },
  {
    step: "05",
    icon: Bell,
    title: "Share & Document",
    description: "The planned system will allow you to generate shareable documentation for real estate transactions, insurance, or contractor consultations.",
    color: "text-red-500",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/20"
  },
  {
    step: "06",
    icon: TrendingUp,
    title: "Build Property History",
    description: "RivoReport is designed to accumulate valuable maintenance documentation over time, creating a comprehensive care record for your property.",
    color: "text-indigo-500",
    bgColor: "bg-indigo-500/10",
    borderColor: "border-indigo-500/20"
  }
]

const benefits = [
  "Will integrate with RivoHome's verified service provider network",
  "Designed to support property value through documented maintenance history", 
  "Planned to track property care activities with multiple verification levels",
  "Will generate shareable documentation for real estate and insurance purposes",
  "Designed to create comprehensive maintenance records over time"
]

export function RivoReportHowItWorks() {
  return (
    <section className="py-20 bg-gray-50">
      <div className="container px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-rivo-text mb-6">
            How RivoReport Will Work
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Discover how the planned RivoReport feature will integrate with RivoHome's maintenance platform to create 
            comprehensive property documentation, designed to support property value and buyer confidence.
          </p>
        </motion.div>

        {/* Steps Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {steps.map((step, index) => (
            <motion.div
              key={step.step}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="relative"
            >
              <Card className={`h-full hover:shadow-lg transition-all duration-300 border-2 ${step.borderColor} ${step.bgColor}`}>
                <CardContent className="p-6">
                  {/* Step Number */}
                  <div className="flex items-center justify-between mb-4">
                    <span className={`text-2xl font-bold ${step.color} opacity-60`}>
                      {step.step}
                    </span>
                    <div className={`inline-flex p-3 rounded-lg ${step.bgColor}`}>
                      <step.icon className={`h-6 w-6 ${step.color}`} />
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-semibold text-rivo-text mb-3">
                    {step.title}
                  </h3>
                  
                  <p className="text-gray-600 leading-relaxed">
                    {step.description}
                  </p>
                </CardContent>
              </Card>

              {/* Arrow connector for larger screens */}
              {index < steps.length - 1 && (index + 1) % 3 !== 0 && (
                <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                  <ArrowRight className="h-8 w-8 text-gray-300" />
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Benefits Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          viewport={{ once: true }}
          className="bg-gradient-to-r from-rivo-light via-rivo-base to-rivo-dark rounded-2xl p-8 md:p-12"
        >
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div className="text-white">
              <h3 className="text-3xl md:text-4xl font-bold mb-6">
                Why We're Building RivoReport
              </h3>
              <p className="text-xl text-white/90 mb-8">
                RivoReport is planned as an extension of RivoHome's maintenance platform, designed to create valuable 
                property documentation that connects maintenance activities with long-term property care.
              </p>
              
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <motion.div
                    key={benefit}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className="flex items-center gap-3"
                  >
                    <CheckCircle className="h-5 w-5 text-yellow-300 flex-shrink-0" />
                    <span className="text-white/90">{benefit}</span>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Planned Features Stats */}
            <div className="grid grid-cols-2 gap-6 text-center">
              <div className="text-white">
                <div className="text-4xl md:text-5xl font-bold mb-2 text-yellow-300">
                  <Users className="h-12 w-12 mx-auto mb-2" />
                </div>
                <div className="text-lg opacity-90">Integrated Service Network</div>
              </div>
              <div className="text-white">
                <div className="text-4xl md:text-5xl font-bold mb-2 text-yellow-300">Future</div>
                <div className="text-lg opacity-90">Report Generation</div>
              </div>
              <div className="text-white">
                <div className="text-4xl md:text-5xl font-bold mb-2 text-yellow-300">Planned</div>
                <div className="text-lg opacity-90">Property Documentation</div>
              </div>
              <div className="text-white">
                <div className="text-4xl md:text-5xl font-bold mb-2 text-yellow-300">Multi-Level</div>
                <div className="text-lg opacity-90">Verification System</div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
} 