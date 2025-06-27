"use client"

import { motion } from "framer-motion"
import { ReactNode } from "react"

interface GradientButtonProps {
  children: ReactNode
  className?: string
  onClick?: () => void
  variant?: "primary" | "secondary" | "outline"
  size?: "sm" | "md" | "lg"
  disabled?: boolean
  type?: "button" | "submit" | "reset"
  asChild?: boolean
}

export function GradientButton({
  children,
  className = "",
  onClick,
  variant = "primary",
  size = "md",
  disabled = false,
  type = "button",
}: GradientButtonProps) {
  // Define button styles based on variant
  const buttonStyles = {
    primary: "text-white",
    secondary: "bg-white text-rivo-dark hover:bg-white/90",
    outline: "bg-transparent border-2 border-white text-white hover:bg-white/10",
  }

  // Define button sizes
  const sizeStyles = {
    sm: "px-4 py-1.5 text-sm",
    md: "px-6 py-2",
    lg: "px-8 py-3 text-lg",
  }

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      whileHover={{ scale: disabled ? 1 : 1.05 }}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
      className={`font-medium rounded-full transition-all duration-300 ${sizeStyles[size]} ${
        buttonStyles[variant]
      } ${
        disabled ? "opacity-50 cursor-not-allowed" : "btn-hover-effect"
      } ${className}`}
      style={
        variant === "primary"
          ? {
              background: "linear-gradient(135deg, #53C1D0 0%, #1D9DB7 50%, #126EA0 100%)",
            }
          : {}
      }
    >
      {children}
    </motion.button>
  )
} 