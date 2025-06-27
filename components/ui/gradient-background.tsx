"use client"

import { motion, MotionProps } from "framer-motion"
import { ReactNode } from "react"

interface GradientBackgroundProps extends MotionProps {
  children: ReactNode
  className?: string
  variant?: "default" | "light" // "dark" variant removed temporarily
  animated?: boolean
}

export function GradientBackground({
  children,
  className = "",
  variant = "default",
  animated = true,
  ...motionProps
}: GradientBackgroundProps) {
  // Calculate gradient opacity based on variant
  const gradientStyle = {
    default: {
      backgroundImage: "linear-gradient(135deg, #53C1D0 0%, #1D9DB7 50%, #126EA0 100%)",
      color: "white",
    },
    light: {
      backgroundImage: "linear-gradient(135deg, rgba(83, 193, 208, 0.1) 0%, rgba(29, 157, 183, 0.1) 50%, rgba(18, 110, 160, 0.1) 100%)",
      color: "#1F2937",
    },
    // Dark mode support planned for future release
    /* 
    dark: {
      backgroundImage: "linear-gradient(135deg, #1D9DB7 0%, #126EA0 100%)",
      color: "white", 
    },
    */
  }

  // If not animated, render a simple div
  if (!animated) {
    return (
      <div
        className={className}
        style={{
          ...gradientStyle[variant as keyof typeof gradientStyle],
          backgroundSize: "100% 100%",
        }}
      >
        {children}
      </div>
    )
  }

  // Render animated gradient
  return (
    <motion.div
      className={className}
      initial={{ backgroundPosition: "0% 50%" }}
      animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
      transition={{
        duration: 20,
        ease: "easeInOut",
        repeat: Infinity,
        repeatType: "loop",
      }}
      style={{
        ...gradientStyle[variant as keyof typeof gradientStyle],
        backgroundSize: "200% 200%",
      }}
      {...motionProps}
    >
      {children}
    </motion.div>
  )
} 