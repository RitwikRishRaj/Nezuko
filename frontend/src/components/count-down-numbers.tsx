"use client"

import React, { useEffect, useState } from "react"
import NumberFlow from "@number-flow/react"

export default function AnimatedNumberCounter() {
  const [count, setCount] = useState(0)
  const [flashColor, setFlashColor] = useState<"up" | "down" | null>(null)

  const handleIncrement = () => {
    setCount((prev) => prev + 1)
    setFlashColor("up")
  }

  const handleDecrement = () => {
    setCount((prev) => Math.max(0, prev - 1))
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
        className="flex size-9 items-center justify-center rounded-md text-xl font-bold transition-colors duration-300 hover:bg-white/10 outline-none"
      >
        <span className="text-green-600 hover:text-green-500 transition-colors text-base">+</span>
      </button>

      <div className="text-4xl w-10 text-center font-medium">
        <NumberFlow
          value={count}
          className={`${flashColor === "up" ? "text-green-500" : flashColor === "down" ? "text-red-500" : "text-white"}`}
        />
      </div>

      <button
        onClick={handleDecrement}
        className="flex size-9 items-center justify-center rounded-md text-xl font-bold transition-colors duration-300 hover:bg-white/10 outline-none"
      >
        <span className="text-red-600 hover:text-red-500 transition-colors text-base">-</span>
      </button>
    </div>
  )
}
