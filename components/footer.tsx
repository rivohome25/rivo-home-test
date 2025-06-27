"use client"

import Link from "next/link"
import { Mail, Twitter, Instagram, Linkedin, MessageCircle } from "lucide-react"
import { motion } from "framer-motion"
import { GradientBackground } from "@/components/ui/gradient-background"
import Image from "next/image"
import { ContactFormModal } from "@/components/ContactFormModal"
import { useState } from "react"

export function Footer() {
  const currentYear = new Date().getFullYear()
  const [isContactModalOpen, setIsContactModalOpen] = useState(false)

  // Animation variants for staggered children
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5 }
    }
  }

  const socialIconVariants = {
    hover: { 
      scale: 1.15, 
      boxShadow: "0 0 12px rgba(255, 255, 255, 0.5)",
      transition: { duration: 0.2 }
    }
  }

  return (
    <>
      <GradientBackground className="border-t border-white/10" animated={true}>
        <div className="container py-12 md:py-16">
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 md:gap-8"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={containerVariants}
          >
            {/* Brand Column */}
            <motion.div className="space-y-4 flex flex-col" variants={itemVariants}>
              <div className="h-[28px] mb-1 flex items-center">
                <Link href="/" className="inline-block">
                  <Image src="/RivoHome-logo-transparent.png" alt="RivoHome Logo" width={120} height={30} className="h-[24px] w-auto" />
                </Link>
              </div>
              <p className="text-sm text-white">
                Simplify your home maintenance with smart reminders and trusted service providers.
              </p>
              
              {/* Social Media Icons */}
              <div className="flex space-x-4 pt-2">
                <motion.a 
                  href="https://www.instagram.com/rivohome/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                  whileHover="hover" 
                  variants={socialIconVariants}
                >
                  <Instagram size={16} />
                </motion.a>
                <motion.a 
                  href="https://x.com/TheOnlyRivoHQ" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                  whileHover="hover" 
                  variants={socialIconVariants}
                >
                  <Twitter size={16} />
                </motion.a>
                <motion.a 
                  href="https://www.linkedin.com/company/rivohomeofficial" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                  whileHover="hover" 
                  variants={socialIconVariants}
                >
                  <Linkedin size={16} />
                </motion.a>
              </div>
            </motion.div>

            {/* Navigation Column */}
            <motion.div className="space-y-5" variants={itemVariants}>
              <h3 className="text-base font-medium text-white h-[28px] flex items-center">Navigation</h3>
              <ul className="space-y-3">
                <li>
                  <Link 
                    href="/" 
                    className="text-sm text-white/80 hover:text-white transition-colors relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-white hover:after:w-full after:transition-all"
                  >
                    Home
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/providers" 
                    className="text-sm text-white/80 hover:text-white transition-colors relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-white hover:after:w-full after:transition-all"
                  >
                    Providers
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/resources" 
                    className="text-sm text-white/80 hover:text-white transition-colors relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-white hover:after:w-full after:transition-all"
                  >
                    Resources
                  </Link>
                </li>
              </ul>
            </motion.div>

            {/* Company Column */}
            <motion.div className="space-y-5" variants={itemVariants}>
              <h3 className="text-base font-medium text-white h-[28px] flex items-center">Company</h3>
              <ul className="space-y-3">
                <li>
                  <Link 
                    href="/about" 
                    className="text-sm text-white/80 hover:text-white transition-colors relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-white hover:after:w-full after:transition-all"
                  >
                    About
                  </Link>
                </li>
                <li>
                  <button
                    onClick={() => setIsContactModalOpen(true)}
                    className="text-sm text-white/80 hover:text-white transition-colors relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-white hover:after:w-full after:transition-all"
                  >
                    Contact
                  </button>
                </li>
              </ul>
            </motion.div>

            {/* Legal and Contact Column */}
            <motion.div className="space-y-5" variants={itemVariants}>
              <div>
                <h3 className="text-base font-medium text-white h-[28px] flex items-center">Legal</h3>
                <ul className="space-y-3 mt-5">
                  <li>
                    <Link 
                      href="/privacy" 
                      className="text-sm text-white/80 hover:text-white transition-colors relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-white hover:after:w-full after:transition-all"
                    >
                      Privacy Policy
                    </Link>
                  </li>
                  <li>
                    <Link 
                      href="/terms" 
                      className="text-sm text-white/80 hover:text-white transition-colors relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-white hover:after:w-full after:transition-all"
                    >
                      Terms of Service
                    </Link>
                  </li>
                </ul>
              </div>

              <div className="pt-6 md:pt-10">
                <h3 className="text-base font-medium text-white flex items-center gap-2">
                  <MessageCircle size={16} className="text-white/80" />
                  Have a question? Let's talk.
                </h3>
                <button
                  onClick={() => setIsContactModalOpen(true)}
                  className="mt-3 text-sm text-white inline-flex items-center space-x-2 border-b border-white/20 hover:border-white transition-colors py-1"
                >
                  <Mail className="h-4 w-4" />
                  <span>Contact Us</span>
                </button>
              </div>
            </motion.div>
          </motion.div>

          {/* Bottom section with copyright */}
          <motion.div
            className="mt-16 pt-6 border-t border-white/10 text-center"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <p className="text-sm text-white/60">
              &copy; {currentYear} RivoHome. All rights reserved.
            </p>
          </motion.div>
        </div>
      </GradientBackground>
      <ContactFormModal isOpen={isContactModalOpen} onClose={() => setIsContactModalOpen(false)} />
    </>
  )
}

