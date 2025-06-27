"use client"

import { motion } from "framer-motion"
import { useEffect, useState } from "react"

interface SilentLoadingScreenProps {
  isLoading: boolean
}

export function SilentLoadingScreen({ isLoading }: SilentLoadingScreenProps) {
  const [show, setShow] = useState(true)

  // Start fadeout when isLoading becomes false
  useEffect(() => {
    if (!isLoading) {
      const timer = setTimeout(() => {
        setShow(false)
      }, 800) // Match this with the transition duration
      return () => clearTimeout(timer)
    }
  }, [isLoading])

  if (!show) return null

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-rivo-light via-rivo-base to-rivo-dark"
      initial={{ opacity: 1 }}
      animate={{ opacity: isLoading ? 1 : 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      <motion.div 
        className="flex gap-3 items-end justify-center h-16"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        {/* Equalizer bars - updated with taller, thicker bars and smoother animation */}
        {[0.8, 1.0, 0.7, 0.9, 0.6].map((height, i) => (
          <motion.div
            key={i}
            className="w-3 bg-[#126EA0]/90 rounded-full origin-bottom"
            style={{ height: `${height * 40}px` }}
            animate={{
              scaleY: [0.6, 1.2, 0.6],
            }}
            transition={{
              duration: 1.2,
              ease: "easeInOut",
              repeat: Infinity,
              delay: i * 0.15,
            }}
          />
        ))}
      </motion.div>
    </motion.div>
  )
} 