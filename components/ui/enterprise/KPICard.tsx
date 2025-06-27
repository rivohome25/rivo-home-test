'use client'

import { useEffect, useState } from 'react'
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon, MinusIcon } from '@heroicons/react/24/outline'

interface KPICardProps {
  title: string
  value: number | string
  change?: number
  trend?: 'up' | 'down' | 'neutral'
  icon?: React.ReactNode
  prefix?: string
  suffix?: string
  loading?: boolean
  className?: string
  color?: 'primary' | 'success' | 'warning' | 'error' | 'info'
}

const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}

const useAnimatedCounter = (value: number, duration: number = 800) => {
  const [count, setCount] = useState(0)

  useEffect(() => {
    let startTimestamp: number
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp
      const progress = Math.min((timestamp - startTimestamp) / duration, 1)
      
      // Easing function for smooth animation
      const easeOutCubic = 1 - Math.pow(1 - progress, 3)
      setCount(Math.floor(easeOutCubic * value))
      
      if (progress < 1) {
        window.requestAnimationFrame(step)
      }
    }
    window.requestAnimationFrame(step)
  }, [value, duration])

  return count
}

export default function KPICard({
  title,
  value,
  change,
  trend,
  icon,
  prefix = '',
  suffix = '',
  loading = false,
  className = '',
  color = 'primary'
}: KPICardProps) {
  const numericValue = typeof value === 'number' ? value : 0
  const animatedValue = useAnimatedCounter(numericValue)
  const displayValue = typeof value === 'number' ? animatedValue : value

  const colorClasses = {
    primary: 'border-rivo-200 bg-gradient-to-br from-rivo-50 to-white',
    success: 'border-enterprise-success-200 bg-gradient-to-br from-enterprise-success-50 to-white',
    warning: 'border-enterprise-warning-200 bg-gradient-to-br from-enterprise-warning-50 to-white',
    error: 'border-enterprise-error-200 bg-gradient-to-br from-enterprise-error-50 to-white',
    info: 'border-enterprise-info-200 bg-gradient-to-br from-enterprise-info-50 to-white',
  }

  const iconColorClasses = {
    primary: 'text-rivo-600',
    success: 'text-enterprise-success-600',
    warning: 'text-enterprise-warning-600',
    error: 'text-enterprise-error-600',
    info: 'text-enterprise-info-600',
  }

  if (loading) {
    return (
      <div className={`enterprise-kpi-card ${className}`}>
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-4">
            <div className="skeleton-text w-24"></div>
            <div className="w-8 h-8 bg-slate-200 rounded-lg"></div>
          </div>
          <div className="skeleton-title w-20 mb-2"></div>
          <div className="skeleton-text w-16"></div>
        </div>
      </div>
    )
  }

  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <ArrowTrendingUpIcon className="w-4 h-4" />
      case 'down':
        return <ArrowTrendingDownIcon className="w-4 h-4" />
      default:
        return <MinusIcon className="w-4 h-4" />
    }
  }

  const getTrendClass = () => {
    switch (trend) {
      case 'up':
        return 'trend-up'
      case 'down':
        return 'trend-down'
      default:
        return 'trend-neutral'
    }
  }

  return (
    <div className={`enterprise-kpi-card group ${colorClasses[color]} ${className}`}>
      {/* Header with title and icon */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-slate-600 group-hover:text-slate-700 transition-colors">
          {title}
        </h3>
        {icon && (
          <div className={`p-2 rounded-lg bg-white/50 ${iconColorClasses[color]} group-hover:scale-110 transition-transform`}>
            {icon}
          </div>
        )}
      </div>

      {/* Main value */}
      <div className="mb-3">
        <div className="metric-counter text-slate-900 leading-none">
          {prefix}
          {typeof displayValue === 'number' ? formatNumber(displayValue) : displayValue}
          {suffix}
        </div>
      </div>

      {/* Trend indicator */}
      {change !== undefined && (
        <div className={`flex items-center space-x-1 ${getTrendClass()}`}>
          {getTrendIcon()}
          <span className="text-sm font-medium">
            {Math.abs(change)}%
          </span>
          <span className="text-xs text-slate-500">
            vs last period
          </span>
        </div>
      )}

      {/* Hover glow effect */}
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        <div className={`absolute inset-0 rounded-2xl ${color === 'primary' ? 'shadow-rivo-glow' : ''}`}></div>
      </div>
    </div>
  )
} 