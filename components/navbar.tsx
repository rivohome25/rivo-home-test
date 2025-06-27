"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { Menu, X, ChevronDown } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { GradientBackground } from "@/components/ui/gradient-background"
import { GradientButton } from "@/components/ui/gradient-button"
import { ContactFormModal } from "@/components/ContactFormModal"

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [isContactModalOpen, setIsContactModalOpen] = useState(false)
  const [resourcesDropdownOpen, setResourcesDropdownOpen] = useState(false)
  const pathname = usePathname()
  
  // Determine if we're on a page with a light background where we need dark text
  const isProvidersPage = pathname === "/providers"
  const isResourcesPage = pathname === "/resources"
  const isDIYLibraryPage = pathname === "/resources/diy-library"
  const isPricingPage = pathname === "/resources/pricing"
  const isRivoReportPage = pathname === "/rivoreport"
  const isAboutPage = pathname === "/about"
  const isLightBackgroundPage = isProvidersPage || isResourcesPage || isAboutPage || isDIYLibraryPage || isPricingPage || isRivoReportPage

  // Handle scroll events
  useEffect(() => {
    const handleScroll = () => {
      const offset = window.scrollY
      if (offset > 50) {
        setScrolled(true)
      } else {
        setScrolled(false)
      }
    }

    // Add scroll event listener
    window.addEventListener("scroll", handleScroll)

    // Clean up
    return () => {
      window.removeEventListener("scroll", handleScroll)
    }
  }, [])

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMenuOpen(false)
    setResourcesDropdownOpen(false)
  }, [pathname])

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }

    return () => {
      document.body.style.overflow = "unset"
    }
  }, [isMenuOpen])

  // Smooth scroll to section when clicking on anchor links
  const handleAnchorClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith("#")) {
      e.preventDefault()
      const element = document.getElementById(href.substring(1))
      if (element) {
        element.scrollIntoView({ behavior: "smooth" })
        setIsMenuOpen(false)
      }
    }
  }

  const isActive = (path: string) => pathname === path || pathname?.startsWith(path + '/')

  // On providers page or when scrolled, use a background
  // Make resources page navbar transparent to let the hero gradient flow through
  // Keep navbar solid on RivoReport page for readability
  const navbarBackground = scrolled 
    ? "nav-scrolled" 
    : isProvidersPage && !scrolled
      ? "bg-gradient-to-r from-rivo-light via-rivo-base to-rivo-dark"
      : isResourcesPage && !scrolled
        ? "bg-transparent" // Make transparent for resources page
        : isRivoReportPage
          ? "nav-scrolled" // Keep solid background on RivoReport page
          : "nav-transparent"

  // Toggle the resources dropdown
  const toggleResourcesDropdown = () => {
    setResourcesDropdownOpen(!resourcesDropdownOpen)
  }

  return (
    <motion.header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${navbarBackground}`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      style={{
        backgroundSize: isProvidersPage && !scrolled ? "200% 200%" : "",
        animation: isProvidersPage && !scrolled ? "gradientShift 10s ease infinite" : ""
      }}
    >
      <div className="container flex h-20 items-center justify-between">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.2 }}>
          <Link href="/" className="flex items-center" onClick={() => setIsMenuOpen(false)}>
            <Image 
              src="/RivoHome-logo-transparent.png" 
              alt="RivoHome Logo" 
              width={136} 
              height={136} 
              className="object-contain"
            />
          </Link>
        </motion.div>

        {/* Desktop Navigation */}
        <motion.nav
          className="hidden md:flex md:items-center md:space-x-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3, staggerChildren: 0.1 }}
        >
          <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5 }}>
            <Link href="/" className={`nav-link ${isActive("/") ? "active" : ""}`} onClick={() => setIsMenuOpen(false)}>
              Home
            </Link>
          </motion.div>

          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Link href="/providers" className={`nav-link ${isActive("/providers") ? "active" : ""}`} onClick={() => setIsMenuOpen(false)}>
              Providers
            </Link>
          </motion.div>
          
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="relative flex items-center"
          >
            <div 
              className={`nav-link flex items-center cursor-pointer ${isActive("/resources") ? "active" : ""}`}
              onClick={toggleResourcesDropdown}
              aria-expanded={resourcesDropdownOpen}
              aria-haspopup="true"
            >
              <span className="flex items-center">
                Resources
                <ChevronDown 
                  className={`ml-1 h-4 w-4 transition-transform ${resourcesDropdownOpen ? 'rotate-180' : ''}`} 
                  aria-hidden="true" 
                />
              </span>
            </div>
            
            {/* Resources Dropdown Menu */}
            <AnimatePresence>
              {resourcesDropdownOpen && (
                <motion.div 
                  className="absolute top-full left-0 mt-1 w-48 rounded-md bg-white shadow-lg py-1 z-20 border border-gray-200"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <Link 
                    href="/resources" 
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    onClick={() => setResourcesDropdownOpen(false)}
                  >
                    Resources Home
                  </Link>
                  <Link 
                    href="/resources/pricing" 
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    onClick={() => setResourcesDropdownOpen(false)}
                  >
                    Pricing
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.25 }}
          >
            <Link href="/rivoreport" className={`nav-link ${isActive("/rivoreport") ? "active" : ""}`} onClick={() => setIsMenuOpen(false)}>
              RivoReport
            </Link>
          </motion.div>

          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Link href="/about" className={`nav-link ${isActive("/about") ? "active" : ""}`} onClick={() => setIsMenuOpen(false)}>
              About
            </Link>
          </motion.div>

          {/* Sign In/Sign Up Buttons */}
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex items-center space-x-4"
          >
            <Link 
              href="/sign-in" 
              className="text-rivo-base hover:text-rivo-dark transition font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              Sign In
            </Link>
            <Link 
              href="/sign-up" 
              className="bg-rivo-base text-white px-4 py-2 rounded-md hover:bg-rivo-dark transition"
              onClick={() => setIsMenuOpen(false)}
            >
              Sign Up
            </Link>
          </motion.div>

          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.35 }}
          >
            <button
              onClick={() => setIsContactModalOpen(true)}
              className="bg-rivo-base text-white px-4 py-2 rounded-md hover:bg-rivo-dark transition"
            >
              Contact Us
            </button>
          </motion.div>
        </motion.nav>

        {/* Mobile Menu Button */}
        <motion.button
          className="inline-flex items-center justify-center md:hidden"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          whileTap={{ scale: 0.9 }}
        >
          <span className="sr-only">Open main menu</span>
          {isMenuOpen ? <X className={`h-6 w-6 ${scrolled ? 'text-white' : 'text-rivo-text'}`} /> : <Menu className={`h-6 w-6 ${scrolled ? 'text-white' : 'text-rivo-text'}`} />}
        </motion.button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <GradientBackground
            className="fixed inset-0 top-20 z-40 md:hidden flex flex-col"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "calc(100vh - 5rem)" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <div className="container flex flex-col space-y-6 py-8">
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="flex items-center gap-1 mb-2"
              >
                <Link href="/" className="flex items-center" onClick={() => setIsMenuOpen(false)}>
                  <Image 
                    src="/RivoHome-logo-transparent.png" 
                    alt="RivoHome Logo" 
                    width={110} 
                    height={110} 
                    className="object-contain"
                  />
                </Link>
              </motion.div>

              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                <Link href="/" className={`text-xl font-medium text-white`} onClick={() => setIsMenuOpen(false)}>
                  Home
                </Link>
              </motion.div>

              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.2 }}
              >
                <Link href="/providers" className={`text-xl font-medium text-white`} onClick={() => setIsMenuOpen(false)}>
                  Providers
                </Link>
              </motion.div>
              
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.3 }}
                className="flex flex-col"
              >
                <div className="flex items-center justify-between">
                  <Link href="/resources" className={`text-xl font-medium text-white`} onClick={() => setIsMenuOpen(false)}>
                    Resources
                  </Link>
                  <button 
                    onClick={() => setResourcesDropdownOpen(!resourcesDropdownOpen)}
                    className="text-white p-1"
                    aria-label="Toggle resources menu"
                  >
                    <ChevronDown className={`h-5 w-5 transition-transform ${resourcesDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                </div>
                
                {/* Mobile Resources Dropdown */}
                <AnimatePresence>
                  {resourcesDropdownOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden pl-4 mt-2 space-y-2"
                    >
                      <Link 
                        href="/resources/pricing" 
                        className="block text-md text-white/90 hover:text-white transition-colors"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Pricing
                      </Link>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
              
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.35 }}
              >
                <Link href="/rivoreport" className={`text-xl font-medium text-white`} onClick={() => setIsMenuOpen(false)}>
                  RivoReport
                </Link>
              </motion.div>
              
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.4 }}
              >
                <Link href="/about" className={`text-xl font-medium text-white`} onClick={() => setIsMenuOpen(false)}>
                  About
                </Link>
              </motion.div>
              
              {/* Mobile Sign In/Sign Up */}
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.4 }}
                className="flex flex-col space-y-4"
              >
                <Link 
                  href="/sign-in" 
                  className="text-xl font-medium text-white"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sign In
                </Link>
                <Link 
                  href="/sign-up" 
                  className="text-xl font-medium text-white"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sign Up
                </Link>
              </motion.div>
              
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.45 }}
              >
                <button
                  onClick={() => setIsContactModalOpen(true)}
                  className="bg-rivo-base text-white px-4 py-2 rounded-md hover:bg-rivo-dark transition"
                >
                  Contact Us
                </button>
              </motion.div>
            </div>
          </GradientBackground>
        )}
      </AnimatePresence>

      <ContactFormModal 
        isOpen={isContactModalOpen} 
        onClose={() => setIsContactModalOpen(false)} 
      />
    </motion.header>
  )
}

