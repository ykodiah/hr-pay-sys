import type React from "react"

export interface CardProps {
  children: React.ReactNode
  className?: string
  style?: any
  padding?: "none" | "sm" | "md" | "lg"
  shadow?: "none" | "sm" | "md" | "lg"
}

const cardStyles = {
  base: "bg-white rounded-lg border border-gray-200",
  padding: {
    none: "",
    sm: "p-3",
    md: "p-4",
    lg: "p-6",
  },
  shadow: {
    none: "",
    sm: "shadow-sm",
    md: "shadow-md",
    lg: "shadow-lg",
  },
}

export function Card({ children, className = "", style, padding = "md", shadow = "sm", ...props }: CardProps) {
  const cardClass = [cardStyles.base, cardStyles.padding[padding], cardStyles.shadow[shadow], className].join(" ")

  return (
    <div className={cardClass} style={style} {...props}>
      {children}
    </div>
  )
}

export function CardHeader({ children, className = "", ...props }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`border-b border-gray-200 pb-3 mb-4 ${className}`} {...props}>
      {children}
    </div>
  )
}

export function CardTitle({ children, className = "", ...props }: { children: React.ReactNode; className?: string }) {
  return (
    <h3 className={`text-lg font-semibold text-gray-900 ${className}`} {...props}>
      {children}
    </h3>
  )
}

export function CardContent({ children, className = "", ...props }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={className} {...props}>
      {children}
    </div>
  )
}
