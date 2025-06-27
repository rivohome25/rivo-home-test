"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { ContactFormModal } from "@/components/ContactFormModal"

// FAQ data
const faqs = [
  {
    question: "How does RivoHome help me maintain my home?",
    answer:
      "RivoHome provides personalized maintenance schedules based on your home's specific systems and appliances. You'll receive timely reminders for routine tasks, step-by-step guides for DIY maintenance, and easy access to service providers when you need professional help. All your home's maintenance history and documents are stored securely in one place.",
  },
  {
    question: "Is RivoHome available in my area?",
    answer:
      "RivoHome's maintenance tracking and document storage features are available nationwide. Our service provider network is currently available in select metropolitan areas and expanding rapidly. Sign up for our waitlist, and we'll notify you when service providers in your area join our platform.",
  },
  {
    question: "How much does RivoHome cost?",
    answer:
      "RivoHome will offer both free and premium subscription options. The free plan includes basic maintenance reminders and limited document storage. Premium plans will include advanced features like unlimited document storage, priority booking with service providers, detailed maintenance history tracking, and customized maintenance schedules. Specific pricing will be announced closer to our official launch.",
  },
  {
    question: "How do I become a service provider on RivoHome?",
    answer:
      "Service providers can apply to join our network through the 'For Providers' section of our website. We verify all providers through a thorough screening process that includes license verification, insurance checks, and review of customer testimonials. Once approved, you'll receive leads from homeowners in your service area and can manage your bookings through our platform.",
  },
  {
    question: "Can I store my home warranty and appliance manuals in RivoHome?",
    answer:
      "Yes! RivoHome provides secure cloud storage for all your important home documents, including warranties, manuals, receipts, and service records. You can organize documents by room or system, making them easy to find when you need them. Premium users receive unlimited document storage.",
  },
  {
    question: "When will RivoHome officially launch?",
    answer:
      "RivoHome is currently in beta testing with a limited number of users. We're planning for a full public launch in the coming months. Join our waitlist to be among the first to access the platform when it becomes available and to receive updates on our progress.",
  },
]

export function FAQSectionAlt() {
  const [isContactModalOpen, setIsContactModalOpen] = useState(false)

  return (
    <section className="py-16 md:py-24">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Find answers to common questions about RivoHome and our services.
          </p>
        </motion.div>

        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="space-y-6"
          >
            {/* FAQ Items */}
            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                How do I get started with RivoHome?
              </h3>
              <p className="text-gray-600">
                Getting started is easy! Simply sign up for our waitlist, and we'll notify you when RivoHome is available in your area. You'll be able to download the app and start managing your home maintenance right away.
              </p>
            </div>

            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                What if I need help?
              </h3>
              <p className="text-gray-600">
                Our support team is here to help! If you have any questions or need assistance, please don't hesitate to 
                <button
                  onClick={() => setIsContactModalOpen(true)}
                  className="text-rivo-base hover:text-rivo-dark font-medium ml-1"
                >
                  contact our support team
                </button>
                .
              </p>
            </div>

            {/* More FAQ items... */}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-12 text-center"
          >
            <p className="text-gray-600 mb-4">
              Still have questions? 
              <button
                onClick={() => setIsContactModalOpen(true)}
                className="text-rivo-base hover:text-rivo-dark font-medium ml-1"
              >
                Contact our support team
              </button>
              for assistance.
            </p>
          </motion.div>
        </div>
      </div>

      <ContactFormModal 
        isOpen={isContactModalOpen} 
        onClose={() => setIsContactModalOpen(false)} 
      />
    </section>
  )
}

