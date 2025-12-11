"use client"

import React, { useEffect, useState } from "react"
import NumberFlow from "@number-flow/react"

interface AnimatedNumberCounterProps {
  value?: number;
  onChange?: (value: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
}

export default function AnimatedNumberCounter({ 
  value: controlledValue, 
  onChange,
  min = 0,
  max = 100,
  disabled = false
}: AnimatedNumberCounterProps = {}) {
  const [internalCount, setInternalCount] = useState(controlledValue ?? 1)
  const [flashColor, setFlashColor] = useState<"up" | "down" | null>(null)

  const count = controlledValue ?? internalCount;

  const handleIncrement = () => {
    if (disabled) return;
    const newValue = Math.min(max, count + 1);
    if (onChange) {
      onChange(newValue);
    } else {
      setInternalCount(newValue);
    }
    setFlashColor("up")
  }

  const handleDecrement = () => {
    if (disabled) return;
    const newValue = Math.max(min, count - 1);
    if (onChange) {
      onChange(newValue);
    } else {
      setInternalCount(newValue);
    }
    setFlashColor("down")
  }

  useEffect(() => {
    if (flashColor) {
      const timer = setTimeout(() => {
        setFlashColor(null)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [flashColor])

  return (
    <div
      className={`flex items-center gap-1.5 rounded-xl transition-colors duration-300 ${
        flashColor === "up"
          ? "andung"
          : flashColor === "down"
          ? "text-red-500"
          : ""
      }`}
    >
      <button
        onClick={handleIncrement}
        disabled={disabled}
        className={`flex size-9 items-center justify-center rounded-md text-xl font-bold transition-colors duration-300 outline-none ${
          disabled ? 'cursor-not-allowed opacity-50' : 'hover:bg-white/10'
        }`}
      >
        <span className={`transition-colors text-base ${
          disabled ? 'text-gray-500' : 'text-green-600 hover:text-green-500'
        }`}>+</span>
      </button>

      <div className={`text-4xl w-10 text-center font-medium ${disabled ? 'opacity-50' : ''}`}>
        <NumberFlow
          value={count}
          className={`${
            disabled 
              ? "text-gray-500" 
              : flashColor === "up" 
                ? "text-green-500" 
                : flashColor === "down" 
                  ? "text-red-500" 
                  : "text-white"
          }`}
        />
      </div>

      <button
        onClick={handleDecrement}
        disabled={disabled}
        className={`flex size-9 items-center justify-center rounded-md text-xl font-bold transition-colors duration-300 outline-none ${
          disabled ? 'cursor-not-allowed opacity-50' : 'hover:bg-white/10'
        }`}
      >
        <span className={`transition-colors text-base ${
          disabled ? 'text-gray-500' : 'text-red-600 hover:text-red-500'
        }`}>-</span>
      </button>
    </div>
  )
}
