/**
 * ReportFeatures Component - Showcases key features of RivoReport
 * 
 * Highlights the main features and benefits of the comprehensive
 * home inspection reports including automation, tracking, and insights.
 */

"use client"

import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { 
  Calendar, 
  FileText, 
  Bell, 
  TrendingUp, 
  Shield, 
  Clock,
  CheckCircle,
  BarChart3
} from "lucide-react"

const features = [
  {
    icon: FileText,
    title: "Detailed Maintenance Reports",
    description: "Comprehensive documentation of your home's maintenance history with photos, verification levels, and task completion records.",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/20"
  },
  {
    icon: Calendar,
    title: "Smart Maintenance Scheduling",
    description: "Automated reminders and scheduling for regular maintenance tasks based on your home's specific needs and systems.",
    color: "text-green-500",
    bgColor: "bg-green-500/10",
    borderColor: "border-green-500/20"
  },
  {
    icon: Bell,
    title: "Priority Alerts",
    description: "Instant notifications for urgent issues that need immediate attention to prevent costly damage.",
    color: "text-red-500",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/20"
  },
  {
    icon: TrendingUp,
    title: "Home Health Tracking",
    description: "Monitor your home's overall condition over time with detailed analytics and improvement recommendations.",
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/20"
  },
  {
    icon: Shield,
    title: "Preventive Care Plans",
    description: "Proactive maintenance strategies designed to prevent problems before they become expensive repairs.",
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
    borderColor: "border-orange-500/20"
  },
  {
    icon: BarChart3,
    title: "Cost Analysis & Budgeting",
    description: "Detailed cost breakdowns and budget planning tools to help you manage home maintenance expenses effectively.",
    color: "text-indigo-500",
    bgColor: "bg-indigo-500/10",
    borderColor: "border-indigo-500/20"
  }
]

export function ReportFeatures() {
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
            Everything You Need to Know About Your Home
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            RivoReport provides comprehensive insights and actionable recommendations 
            to keep your home in perfect condition year-round.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <Card className={`h-full hover:shadow-lg transition-all duration-300 border-2 ${feature.borderColor} ${feature.bgColor}`}>
                <CardContent className="p-6">
                  <div className={`inline-flex p-3 rounded-lg ${feature.bgColor} mb-4`}>
                    <feature.icon className={`h-6 w-6 ${feature.color}`} />
                  </div>
                  
                  <h3 className="text-xl font-semibold text-rivo-text mb-3">
                    {feature.title}
                  </h3>
                  
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          viewport={{ once: true }}
          className="mt-20 bg-gradient-to-r from-rivo-light via-rivo-base to-rivo-dark rounded-2xl p-8 md:p-12"
        >
          <div className="text-center mb-12">
            <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">
              The Future of Home Maintenance
            </h3>
            <p className="text-xl text-white/90">
              RivoReport is designed to revolutionize how homeowners track and maintain their properties
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div className="text-white">
              <div className="text-4xl md:text-5xl font-bold mb-2 text-yellow-300">4</div>
              <div className="text-lg opacity-90">Verification Levels</div>
            </div>
            <div className="text-white">
              <div className="text-4xl md:text-5xl font-bold mb-2 text-yellow-300">Instant</div>
              <div className="text-lg opacity-90">Report Generation</div>
            </div>
            <div className="text-white">
              <div className="text-4xl md:text-5xl font-bold mb-2 text-yellow-300">Lifetime</div>
              <div className="text-lg opacity-90">Property History</div>
            </div>
            <div className="text-white">
              <div className="text-4xl md:text-5xl font-bold mb-2 text-yellow-300">100%</div>
              <div className="text-lg opacity-90">Secure & Verified</div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
} 