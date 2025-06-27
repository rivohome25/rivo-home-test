"use client"

import Link from "next/link"
import { ArrowLeft, Twitter, Linkedin } from "lucide-react"
import { motion } from "framer-motion"
import { GradientBackground } from "@/components/ui/gradient-background"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"

export default function SuccessPage() {
  const [confetti, setConfetti] = useState<{ x: number; y: number; size: number; color: string }[]>([])

  // Create confetti effect on mount
  useEffect(() => {
    const colors = ["#4AB5A8", "#2775A6", "#FFFFFF", "#E8F5FF", "#B2DFDC"]
    const newConfetti = []
    
    for (let i = 0; i < 100; i++) {
      newConfetti.push({
        x: Math.random() * 100, // random x position (0-100%)
        y: Math.random() * 100, // random y position (0-100%)
        size: Math.random() * 1 + 0.2, // random size (0.2-1.2rem)
        color: colors[Math.floor(Math.random() * colors.length)] // random color from our array
      })
    }
    
    setConfetti(newConfetti)
  }, [])

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1,
        delayChildren: 0.3
      } 
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { type: "spring", stiffness: 100 }
    }
  }

  // Handler for social sharing
  const handleShare = (platform: string) => {
    const url = window.location.origin
    const text = "I just signed up for the RivoHome waitlist. Join me to get early access!"
    
    if (platform === 'twitter') {
      window.open(`https://x.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, '_blank')
    } else if (platform === 'linkedin') {
      window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank')
    }
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Confetti animation */}
      <div className="absolute inset-0 pointer-events-none">
        {confetti.map((particle, index) => (
          <motion.div
            key={index}
            className="absolute rounded-full"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: `${particle.size}rem`,
              height: `${particle.size}rem`,
              backgroundColor: particle.color,
            }}
            initial={{ opacity: 0, y: -20 }}
            animate={{ 
              opacity: [0, 1, 0],
              y: [0, 100],
              x: (i) => i % 2 === 0 ? [0, 20, -20, 0] : [0, -20, 20, 0]
            }}
            transition={{ 
              duration: Math.random() * 4 + 3, // 3-7 seconds
              ease: "easeOut",
              repeat: Infinity,
              delay: Math.random() * 2
            }}
          />
        ))}
      </div>

      <GradientBackground className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-xl">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="text-center"
          >
            <motion.div variants={itemVariants} className="mb-12">
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 100, delay: 0.2 }}
                className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-8"
              >
                <div className="text-3xl">🎉</div>
              </motion.div>
            </motion.div>

            <motion.h1 
              variants={itemVariants} 
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6"
            >
              You're on the list!
            </motion.h1>

            <motion.p 
              variants={itemVariants} 
              className="text-xl text-white/90 mb-12"
            >
              We'll keep you updated on launch news and beta invites.
            </motion.p>
            
            <motion.div 
              variants={itemVariants}
              className="flex justify-center space-x-6 mb-12"
            >
              <button
                onClick={() => handleShare('twitter')}
                className="bg-white/10 hover:bg-white/20 text-white rounded-full p-3 transition-colors"
                aria-label="Share on Twitter"
              >
                <Twitter className="h-6 w-6" />
              </button>
              <button
                onClick={() => handleShare('linkedin')}
                className="bg-white/10 hover:bg-white/20 text-white rounded-full p-3 transition-colors"
                aria-label="Share on LinkedIn"
              >
                <Linkedin className="h-6 w-6" />
              </button>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Link href="/">
                <Button
                  className="bg-white text-rivo-teal hover:bg-white/90 flex items-center gap-2 px-6 py-2 rounded-full transition-colors mx-auto"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Return to homepage
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </GradientBackground>
    </div>
  )
} 