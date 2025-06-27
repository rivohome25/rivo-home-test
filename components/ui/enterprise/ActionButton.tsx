'use client'

import { useState } from 'react'
import { RiLoader4Line } from 'react-icons/ri'

interface ActionButtonProps {
  children: React.ReactNode
  icon?: React.ReactNode
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  disabled?: boolean
  badge?: {
    count?: number
    status?: 'success' | 'warning' | 'error' | 'info'
    pulse?: boolean
  }
  onClick?: () => void
  className?: string
  fullWidth?: boolean
}

export default function ActionButton({
  children,
  icon,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  badge,
  onClick,
  className = '',
  fullWidth = false
}: ActionButtonProps) {
  const [isPressed, setIsPressed] = useState(false)

  const baseClasses = 'relative inline-flex items-center justify-center font-medium rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 overflow-hidden group'

  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg'
  }

  const variantClasses = {
    primary: 'enterprise-btn-primary focus:ring-rivo-500',
    secondary: 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 hover:border-slate-400 shadow-sm hover:shadow-md focus:ring-slate-500',
    success: 'enterprise-btn-success focus:ring-enterprise-success-500',
    warning: 'enterprise-btn-warning focus:ring-enterprise-warning-500',
    error: 'bg-enterprise-error-600 text-white hover:bg-enterprise-error-700 shadow-lg hover:shadow-xl focus:ring-enterprise-error-500',
    ghost: 'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus:ring-slate-500'
  }

  const getBadgeClasses = (status?: string) => {
    const baseClasses = 'absolute -top-1 -right-1 inline-flex items-center justify-center rounded-full text-xs font-medium min-w-[1.25rem] h-5 px-1'
    
    switch (status) {
      case 'success':
        return `${baseClasses} bg-enterprise-success-500 text-white`
      case 'warning':
        return `${baseClasses} bg-enterprise-warning-500 text-white`
      case 'error':
        return `${baseClasses} bg-enterprise-error-500 text-white`
      case 'info':
        return `${baseClasses} bg-enterprise-info-500 text-white`
      default:
        return `${baseClasses} bg-slate-500 text-white`
    }
  }

  const handleMouseDown = () => setIsPressed(true)
  const handleMouseUp = () => setIsPressed(false)
  const handleMouseLeave = () => setIsPressed(false)

  const buttonClasses = `
    ${baseClasses}
    ${sizeClasses[size]}
    ${variantClasses[variant]}
    ${fullWidth ? 'w-full' : ''}
    ${disabled || loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
    ${isPressed ? 'scale-[0.98]' : ''}
    ${className}
  `

  return (
    <button
      className={buttonClasses}
      onClick={onClick}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      disabled={disabled || loading}
    >
      {/* Shimmer effect for primary buttons */}
      {variant === 'primary' && !disabled && !loading && (
        <div className="absolute inset-0 -top-[1px] -bottom-[1px] opacity-0 group-hover:opacity-100 transition-opacity duration-500">
          <div className="shimmer absolute inset-0 rounded-xl"></div>
        </div>
      )}

      {/* Content container */}
      <div className="relative flex items-center justify-center space-x-2">
        {loading ? (
          <RiLoader4Line className="w-5 h-5 animate-spin" />
        ) : (
          icon && <div className="flex-shrink-0">{icon}</div>
        )}
        <span>{children}</span>
      </div>

      {/* Badge */}
      {badge && (badge.count || badge.status) && (
        <div className={`${getBadgeClasses(badge.status)} ${badge.pulse ? 'animate-pulse' : ''}`}>
          {badge.count ? (
            badge.count > 99 ? '99+' : badge.count
          ) : (
            <div className="w-2 h-2 rounded-full bg-current"></div>
          )}
        </div>
      )}

      {/* Ripple effect for secondary and ghost buttons */}
      {(variant === 'secondary' || variant === 'ghost') && (
        <div className="absolute inset-0 overflow-hidden rounded-xl">
          <div className="absolute inset-0 bg-current opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
        </div>
      )}
    </button>
  )
} 