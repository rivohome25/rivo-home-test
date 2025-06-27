"use client"

import { motion } from "framer-motion"
import { useEffect, useState } from "react"

interface LoadingScreenProps {
  isLoading: boolean
}

export function LoadingScreen({ isLoading }: LoadingScreenProps) {
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
      <div className="flex flex-col items-center justify-center px-4 text-center">
        <div className="mb-10 sm:mb-12 flex flex-col gap-1">
          <motion.h2 
            className="text-xl sm:text-2xl md:text-3xl font-bold text-white leading-snug"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Welcome To RivoHome.
          </motion.h2>
          <motion.h2 
            className="text-xl sm:text-2xl md:text-3xl font-bold text-white leading-snug"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            Our Content Is Loading
          </motion.h2>
          <motion.h2 
            className="text-xl sm:text-2xl md:text-3xl font-bold text-white leading-snug"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            And Will Be Up Shortly.
          </motion.h2>
        </div>

        <motion.div 
          className="flex gap-3 items-end justify-center h-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          {/* Equalizer bars - updated with taller, thicker bars and smoother animation */}
          {[0.8, 1.0, 0.7, 0.9, 0.6].map((height, i) => (
            <motion.div
              key={i}
              className="w-2 bg-[#126EA0]/90 rounded-full origin-bottom"
              style={{ height: `${height * 24}px` }}
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
      </div>
    </motion.div>
  )
} 