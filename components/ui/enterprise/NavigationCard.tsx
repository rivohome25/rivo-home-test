'use client'

import Link from 'next/link'
import { useState } from 'react'
import { RiArrowRightSLine } from 'react-icons/ri'

interface NavigationCardProps {
  title: string
  description: string
  href: string
  icon: React.ReactNode
  badge?: {
    count?: number
    label?: string
    status?: 'success' | 'warning' | 'error' | 'info'
    pulse?: boolean
  }
  stats?: {
    label: string
    value: string | number
    trend?: 'up' | 'down' | 'neutral'
  }[]
  preview?: {
    title: string
    items: string[]
  }
  className?: string
  disabled?: boolean
}

export default function NavigationCard({
  title,
  description,
  href,
  icon,
  badge,
  stats,
  preview,
  className = '',
  disabled = false
}: NavigationCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  const getBadgeClasses = (status?: string) => {
    const baseClasses = 'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium'
    
    switch (status) {
      case 'success':
        return `${baseClasses} enterprise-badge-success`
      case 'warning':
        return `${baseClasses} enterprise-badge-warning`
      case 'error':
        return `${baseClasses} enterprise-badge-error`
      case 'info':
        return `${baseClasses} enterprise-badge-info`
      default:
        return `${baseClasses} bg-slate-100 text-slate-700`
    }
  }

  const content = (
    <div 
      className={`enterprise-nav-card ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      onMouseEnter={() => !disabled && setIsHovered(true)}
      onMouseLeave={() => !disabled && setIsHovered(false)}
    >
      {/* Card Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0 p-3 rounded-xl bg-rivo-50 text-rivo-600 group-hover:bg-rivo-100 group-hover:scale-110 transition-all duration-300">
            {icon}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-slate-900 group-hover:text-rivo-700 transition-colors">
              {title}
            </h3>
            {badge && (
              <div className={`inline-flex items-center mt-1 ${getBadgeClasses(badge.status)} ${badge.pulse ? 'animate-pulse' : ''}`}>
                {badge.count !== undefined && (
                  <span className="mr-1">{badge.count}</span>
                )}
                {badge.label}
              </div>
            )}
          </div>
        </div>
        
        <RiArrowRightSLine className="w-5 h-5 text-slate-400 group-hover:text-rivo-600 group-hover:translate-x-1 transition-all duration-300" />
      </div>

      {/* Description */}
      <p className="text-slate-600 mb-4 group-hover:text-slate-700 transition-colors">
        {description}
      </p>

      {/* Stats */}
      {stats && stats.length > 0 && (
        <div className="flex items-center space-x-4 mb-4">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-lg font-semibold text-slate-900">
                {stat.value}
              </div>
              <div className="text-xs text-slate-500">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Hover Preview */}
      {preview && isHovered && (
        <div className="border-t border-slate-100 pt-4 animate-fade-in">
          <div className="text-sm font-medium text-slate-700 mb-2">
            {preview.title}
          </div>
          <div className="space-y-1">
            {preview.items.slice(0, 3).map((item, index) => (
              <div key={index} className="text-sm text-slate-600 flex items-center">
                <div className="w-1.5 h-1.5 rounded-full bg-rivo-400 mr-2"></div>
                {item}
              </div>
            ))}
            {preview.items.length > 3 && (
              <div className="text-xs text-slate-500 pl-3.5">
                +{preview.items.length - 3} more...
              </div>
            )}
          </div>
        </div>
      )}

      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-rivo-50/50 to-transparent"></div>
      </div>
    </div>
  )

  if (disabled) {
    return content
  }

  return (
    <Link href={href} className="block">
      {content}
    </Link>
  )
} 