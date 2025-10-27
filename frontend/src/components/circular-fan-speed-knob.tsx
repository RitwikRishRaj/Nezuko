"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

// Define the shape of each option
interface RadialSelectorOption {
  value: string
  label: string
}

// Define the component's props for reusability
export interface RadialSelectorProps {
  options: RadialSelectorOption[]
  name: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  className?: string
}

const RadialSelector = React.forwardRef<HTMLDivElement, RadialSelectorProps>(
  ({ options, name, defaultValue, onValueChange, className, ...props }, ref) => {
    // State to manage the currently selected value
    const [selectedValue, setSelectedValue] = React.useState(
      defaultValue ?? (options.length > 0 ? options[0].value : ""),
    )

    // Find the index of the selected option to calculate rotation
    const selectedIndex = React.useMemo(() => {
      const index = options.findIndex((opt) => opt.value === selectedValue)
      return index === -1 ? 0 : index
    }, [selectedValue, options])

    // Calculate the rotation degrees for the indicator dot
    const rotation = selectedIndex * (360 / options.length)

    const handleSelect = (value: string) => {
      setSelectedValue(value)
      if (onValueChange) {
        onValueChange(value)
      }
    }

    // Calculate the rotation for each label
    const getLabelRotation = (index: number) => {
      return index * (360 / options.length)
    }

    return (
      <div
        ref={ref}
        className={cn(
          "relative w-60 h-60 rounded-full select-none",
          "flex items-center justify-center",
          "shadow-inner-lg dark:shadow-inner-xl",
          "border-2 border-gray-700",
          className,
        )}
        style={{
          background: `radial-gradient(circle at 30% 30%, #1a1a1a, #1a1a1a 40%, rgba(0, 0, 0, 0.3) 70%, rgba(0, 0, 0, 0.5))`,
        }}
        role="radiogroup"
        {...props}
      >
        {/* Inner decorative circles for depth */}
        <div
          className="absolute w-[92%] h-[92%] rounded-full shadow-lg"
          style={{
            background: `radial-gradient(circle at 35% 35%, #2a2a2a, #2a2a2a 50%, rgba(0, 0, 0, 0.3))`,
          }}
        />
        <div className="absolute w-[60%] h-[60%] rounded-full bg-gray-900 border-2 border-gray-600 shadow-inner-md" />
        <div
          className="absolute w-[50%] h-[50%] rounded-full"
          style={{
            background: `radial-gradient(circle at 40% 40%, #0a0a0a, #1a1a1a 60%, rgba(0, 0, 0, 0.2))`,
          }}
        />

        {/* Smoother Indicator Dot with enhanced animation */}
        <div
          className="absolute top-1/2 left-1/2 w-1/2 h-2.5 -translate-y-1/2 origin-left"
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: 'transform 600ms cubic-bezier(0.34, 1.56, 0.64, 1)',
            willChange: 'transform',
          }}
        >
          <div 
            className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white transition-all duration-300"
            style={{
              boxShadow: '0 0 0 0px rgba(255,255,255,0.3)',
            }}
          />
        </div>

        {/* Dynamic Options */}
        {options.map((option, index) => {
          const labelRotation = getLabelRotation(index)
          return (
            <label
              key={option.value}
              className="absolute top-1/2 left-1/2 w-1/2 h-20 -translate-y-1/2 origin-left flex items-center"
              style={{ transform: `rotate(${labelRotation}deg)` }}
            >
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={selectedValue === option.value}
                onChange={() => handleSelect(option.value)}
                className="sr-only"
              />
              <span
                className="absolute right-3 text-xl font-bold cursor-pointer text-white/95 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] transition-all duration-300 hover:text-white hover:scale-110"
                style={{
                  transform: `rotate(${-labelRotation}deg)`,
                  transition: 'color 0.3s ease, transform 0.3s ease, text-shadow 0.3s ease',
                  textShadow: selectedValue === option.value ? '0 0 10px rgba(255,255,255,0.8)' : 'none',
                  fontSize: '1.25rem',
                  lineHeight: '1.75rem'
                }}
              >
                {option.label}
              </span>
            </label>
          )
        })}
      </div>
    )
  },
)

RadialSelector.displayName = "RadialSelector"

export { RadialSelector }
