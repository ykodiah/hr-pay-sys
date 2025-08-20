export interface AvatarProps {
  src?: string
  alt?: string
  initials?: string
  size?: "sm" | "md" | "lg" | "xl"
  className?: string
  style?: any
}

const avatarStyles = {
  base: "inline-flex items-center justify-center rounded-full bg-emerald-100 text-emerald-700 font-medium",
  sizes: {
    sm: "w-8 h-8 text-sm",
    md: "w-10 h-10 text-base",
    lg: "w-12 h-12 text-lg",
    xl: "w-16 h-16 text-xl",
  },
}

export function Avatar({ src, alt, initials, size = "md", className = "", style, ...props }: AvatarProps) {
  const avatarClass = [avatarStyles.base, avatarStyles.sizes[size], className].join(" ")

  if (src) {
    return (
      <img
        src={src || "/placeholder.svg"}
        alt={alt}
        className={`${avatarClass} object-cover`}
        style={style}
        {...props}
      />
    )
  }

  return (
    <div className={avatarClass} style={style} {...props}>
      {initials || "?"}
    </div>
  )
}
