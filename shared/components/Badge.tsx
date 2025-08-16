import type React from "react"

export interface BadgeProps {
  variant?: "default" | "success" | "warning" | "error" | "info"
  size?: "sm" | "md" | "lg"
  children: React.ReactNode
  className?: string
  style?: any
}

const badgeStyles = {
  base: "inline-flex items-center font-medium rounded-full",
  variants: {
    default: "bg-gray-100 text-gray-800",
    success: "bg-emerald-100 text-emerald-800",
    warning: "bg-yellow-100 text-yellow-800",
    error: "bg-red-100 text-red-800",
    info: "bg-blue-100 text-blue-800",
  },
  sizes: {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-sm",
    lg: "px-3 py-1.5 text-base",
  },
}

export function Badge({ variant = "default", size = "md", children, className = "", style, ...props }: BadgeProps) {
  const badgeClass = [badgeStyles.base, badgeStyles.variants[variant], badgeStyles.sizes[size], className].join(" ")

  return (
    <span className={badgeClass} style={style} {...props}>
      {children}
    </span>
  )
}
