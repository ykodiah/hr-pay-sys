interface LogoProps {
  className?: string
  size?: "sm" | "md" | "lg" | "xl"
  variant?: "full" | "icon" | "text"
}

export function Logo({ className = "", size = "md", variant = "full" }: LogoProps) {
  const sizeClasses = {
    sm: "h-8",
    md: "h-10",
    lg: "h-12",
    xl: "h-16",
  }

  const textSizeClasses = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl",
    xl: "text-3xl",
  }

  if (variant === "icon") {
    return (
      <div className={`${sizeClasses[size]} ${className} flex items-center justify-center`}>
        <div className="relative">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-lg">A</span>
          </div>
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 rounded-full flex items-center justify-center">
            <span className="text-xs font-bold text-emerald-800">HR</span>
          </div>
        </div>
      </div>
    )
  }

  if (variant === "text") {
    return <span className={`${textSizeClasses[size]} font-bold text-emerald-600 ${className}`}>AkwaabaHRPay</span>
  }

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      <div className="relative">
        <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg">
          <span className="text-white font-bold text-lg">A</span>
        </div>
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 rounded-full flex items-center justify-center">
          <span className="text-xs font-bold text-emerald-800">HR</span>
        </div>
      </div>
      <div className="flex flex-col">
        <span className={`${textSizeClasses[size]} font-bold text-emerald-600 leading-tight`}>AkwaabaHRPay</span>
        <span className="text-xs text-emerald-500 -mt-1">Ghana HR & Payroll</span>
      </div>
    </div>
  )
}

export default Logo
