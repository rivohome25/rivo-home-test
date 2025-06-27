/**
 * ReportHero Component - Hero section for the RivoReport page
 * 
 * Modern, engaging hero showcasing RivoReport with split layout,
 * interactive elements, and authentic report preview.
 */

"use client"

import { motion } from "framer-motion"
import { ChevronDown, FileText, Shield, TrendingUp, Clock, Award, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export function ReportHero() {
  const features = [
    { icon: Shield, label: "Planned Verification", value: "Multi-Level" },
    { icon: FileText, label: "Detailed Reports", value: "Complete" },
    { icon: TrendingUp, label: "Health Tracking", value: "Coming Soon" },
    { icon: Clock, label: "Report Generation", value: "Planned" }
  ]

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50 to-rivo-light/20">
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 2 }}
            className="absolute top-20 left-10 w-72 h-72 bg-rivo-base/10 rounded-full blur-3xl"
          />
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 2, delay: 0.5 }}
            className="absolute bottom-20 right-10 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl"
          />
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 2, delay: 1 }}
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-yellow-300/5 rounded-full blur-3xl"
          />
        </div>
        
        {/* Grid Pattern */}
        <div 
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%23000000' stroke-width='1'%3E%3Cpath d='M0 0h60v60H0z'/%3E%3C/g%3E%3C/svg%3E")`
          }}
        />
      </div>

      <div className="container relative z-10 px-4 py-20">
        {/* Future Availability Notice */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-800 px-4 py-2 rounded-full text-sm font-medium">
            <Info className="h-4 w-4" />
            RivoReport is currently in development - Join our waitlist for early access
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 items-center min-h-[80vh]">
          {/* Left Column - Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="space-y-8"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="inline-flex items-center gap-2 bg-rivo-base/10 text-rivo-dark px-4 py-2 rounded-full text-sm font-medium"
            >
              <Award className="h-4 w-4" />
              Future Home Documentation Platform
            </motion.div>

            {/* Main Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="text-5xl lg:text-7xl font-bold text-gray-900 leading-relaxed"
            >
              Your Home's{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-rivo-base to-rivo-dark">
                Future
              </span>
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-amber-600">
                Health Report
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="text-xl text-gray-600 leading-relaxed max-w-lg"
            >
              RivoReport is designed to provide comprehensive property documentation that will tell your home's complete story. 
              From maintenance history to future planning, everything you'll need in one place.
            </motion.p>



            {/* Feature Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.9 }}
              className="grid grid-cols-2 lg:grid-cols-4 gap-8 pt-8"
            >
              {features.map((feature, index) => (
                <motion.div
                  key={feature.label}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 1 + index * 0.1 }}
                  className="text-center"
                >
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-rivo-light/20 rounded-lg mb-2">
                    <feature.icon className="h-6 w-6 text-rivo-dark" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{feature.value}</div>
                  <div className="text-sm text-gray-600">{feature.label}</div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* Right Column - Authentic Rivo Report Preview */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="relative"
          >
            {/* Main Report Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, rotateY: 10 }}
              animate={{ opacity: 1, scale: 1, rotateY: 0 }}
              transition={{ duration: 1, delay: 0.6 }}
              className="relative z-10"
            >
              <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-2xl max-w-md mx-auto">
                <CardContent className="p-6">
                  <div className="space-y-4 relative">
                    {/* Demo Watermarks */}
                    <div className="absolute inset-0 pointer-events-none">
                      <div className="absolute top-8 left-4 text-blue-200 text-xs font-bold transform -rotate-12 opacity-30">
                        CONCEPT PREVIEW
                      </div>
                      <div className="absolute top-20 right-4 text-red-200 text-xs font-bold transform rotate-12 opacity-30">
                        IN DEVELOPMENT
                      </div>
                      <div className="absolute bottom-16 left-8 text-gray-200 text-xs font-bold transform -rotate-6 opacity-30">
                        SAMPLE DESIGN
                      </div>
                    </div>

                    {/* Header */}
                    <div className="text-center border-b pb-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-xs text-blue-600">© RIVOHOME 2025</div>
                        <div className="bg-orange-200 text-orange-800 px-2 py-1 rounded text-xs font-bold">
                  
                        </div>
                      </div>
                      <h3 className="text-lg font-bold text-blue-600 mb-1">
                        RivoReport - Future Property Documentation
                      </h3>
                      <div className="text-sm space-y-1">
                        <div><span className="font-medium">Sample Property:</span> 1247 Maple Grove Drive, Orlando, FL, 32801</div>
                        <div><span className="font-medium">Planned Rivo ID:</span> RIV-FL-32801-CONCEPT</div>
                        <div><span className="font-medium">Concept Report ID:</span> RIV-RPT-PREVIEW</div>
                        <div><span className="font-medium">Design Date:</span> December 2024</div>
                      </div>
                    </div>

                    {/* Summary Snapshot */}
                    <div>
                      <h4 className="font-bold text-blue-600 mb-3">Summary Snapshot</h4>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <div className="font-medium">Home Health Score:</div>
                          <div className="text-green-600 font-bold">B+ (97/100)</div>
                        </div>
                        <div>
                          <div className="font-medium">Self-Reported:</div>
                          <div>0</div>
                        </div>
                        <div>
                          <div className="font-medium">Verified Tasks:</div>
                          <div>2</div>
                        </div>
                        <div>
                          <div className="font-medium">Overdue:</div>
                          <div>0</div>
                        </div>
                        <div>
                          <div className="font-medium">Verified External Tasks:</div>
                          <div>0</div>
                        </div>
                        <div className="col-span-2">
                          <div className="font-medium">DIY with Upload:</div>
                          <div>1</div>
                        </div>
                        <div className="col-span-2 pt-2 border-t">
                          <div className="font-medium">% of Tasks Verified: <span className="text-green-600">67%</span></div>
                          <div className="text-sm text-gray-600 mt-1">
                            <span className="font-medium">Next Maintenance Due:</span> Change Air filter <span className="text-red-600">(June 2025)</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Ownership Timeline */}
                    <div>
                      <h4 className="font-bold text-blue-600 mb-2">Ownership Timeline</h4>
                      <div className="border rounded">
                        <div className="grid grid-cols-3 text-xs font-medium border-b bg-gray-50 p-2">
                          <div>Owner</div>
                          <div>Date Range</div>
                          <div>Notes</div>
                        </div>
                        <div className="grid grid-cols-3 text-xs p-2">
                          <div className="text-gray-600">-</div>
                          <div>2025-06-11 - Present</div>
                          <div>Report Initiator</div>
                        </div>
                      </div>
                    </div>

                    {/* Maintenance History Preview */}
                    <div>
                      <h4 className="font-bold text-blue-600 mb-2">Maintenance History</h4>
                      <div className="border rounded text-xs">
                        <div className="grid grid-cols-6 font-medium border-b bg-gray-50 p-2">
                          <div>Date</div>
                          <div>Task</div>
                          <div>Status</div>
                          <div>Source</div>
                          <div>Notes</div>
                          <div>Owner</div>
                        </div>
                        <div className="p-2 text-center text-gray-500 border-b">
                          <div className="bg-yellow-100 text-yellow-800 p-1 rounded text-xs">
                            SAMPLE DATA
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="text-center pt-3 border-t">
                      <div className="text-xs text-gray-600 mb-2">
                        This is a sample report. Sign up to get your real property report!
                      </div>
                      <div className="text-xs text-blue-600 font-medium">
                        UNAUTHORIZED USE PROHIBITED
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Floating Elements */}
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 1.5 }}
              className="absolute -top-4 -right-4 bg-green-500 text-white p-3 rounded-full shadow-lg z-20"
            >
              <Shield className="h-6 w-6" />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 1.7 }}
              className="absolute -bottom-4 -left-4 bg-blue-500 text-white p-3 rounded-full shadow-lg z-20"
            >
              <TrendingUp className="h-6 w-6" />
            </motion.div>

            {/* Background Cards */}
            <motion.div
              initial={{ opacity: 0, y: 20, rotateX: -10 }}
              animate={{ opacity: 0.3, y: 0, rotateX: 0 }}
              transition={{ duration: 1, delay: 0.8 }}
              className="absolute top-8 right-8 w-64 h-32 bg-white rounded-lg shadow-lg -z-10"
            />
            <motion.div
              initial={{ opacity: 0, y: 30, rotateX: -15 }}
              animate={{ opacity: 0.2, y: 0, rotateX: 0 }}
              transition={{ duration: 1, delay: 1 }}
              className="absolute top-16 right-16 w-64 h-32 bg-white rounded-lg shadow-lg -z-20"
            />
          </motion.div>
        </div>
        
        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 2, repeat: Infinity, repeatType: "reverse" }}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        >
          <ChevronDown className="h-8 w-8 text-gray-400" />
        </motion.div>
      </div>
    </section>
  )
} 