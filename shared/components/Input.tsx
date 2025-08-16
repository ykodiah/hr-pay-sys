"use client"

import type React from "react"

export interface InputProps {
  label?: string
  placeholder?: string
  value?: string
  defaultValue?: string
  type?: "text" | "email" | "password" | "number" | "tel"
  disabled?: boolean
  required?: boolean
  error?: string
  helperText?: string
  className?: string
  style?: any
  onChange?: (value: string) => void
  onChangeText?: (text: string) => void
}

const inputStyles = {
  base: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors",
  error: "border-red-500 focus:ring-red-500",
  disabled: "bg-gray-50 text-gray-500 cursor-not-allowed",
}

export function Input({
  label,
  placeholder,
  value,
  defaultValue,
  type = "text",
  disabled = false,
  required = false,
  error,
  helperText,
  className = "",
  style,
  onChange,
  onChangeText,
  ...props
}: InputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    onChange?.(newValue)
    onChangeText?.(newValue)
  }

  const inputClass = [
    inputStyles.base,
    error ? inputStyles.error : "",
    disabled ? inputStyles.disabled : "",
    className,
  ].join(" ")

  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        defaultValue={defaultValue}
        disabled={disabled}
        required={required}
        className={inputClass}
        style={style}
        onChange={handleChange}
        {...props}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      {helperText && !error && <p className="text-sm text-gray-500">{helperText}</p>}
    </div>
  )
}
