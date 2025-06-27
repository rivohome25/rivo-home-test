"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { ClipboardCheck } from "lucide-react"
import { GradientButton } from "@/components/ui/gradient-button"
import { DownloadChecklistModal } from "@/components/download-checklist-modal"

export function MaintenanceChecklistSection() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl mx-auto text-center"
        >
          <div className="mb-8 inline-flex h-16 w-16 items-center justify-center rounded-full bg-rivo-light/10">
            <ClipboardCheck className="h-8 w-8 text-rivo-base" />
          </div>
          
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            The Essential Home Maintenance Checklist
          </h2>
          
          <p className="text-lg text-gray-600 mb-8">
            We've created region-specific maintenance checklists tailored to your local climate and conditions. Select your region from our six regional options covering all US states, download your customized checklist, and start tackling home maintenance with confidence.
          </p>

          <GradientButton 
            variant="primary" 
            size="lg"
            onClick={() => setIsModalOpen(true)}
          >
            Get the Checklist
          </GradientButton>
        </motion.div>
      </div>
      
      <DownloadChecklistModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </section>
  )
} 