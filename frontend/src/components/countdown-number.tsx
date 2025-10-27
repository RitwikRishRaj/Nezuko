"use client"

import React, { useEffect, useState } from "react"
import NumberFlow from "@number-flow/react"
import { motion } from "framer-motion"

const MotionNumberFlow = motion.create(NumberFlow)

interface CountdownProps {
  endDate: Date
  startDate?: Date
  className?: string
  autoStart?: boolean
}

interface TimeLeft {
  hours: number
  minutes: number
  seconds: number
}

export default function AnimatedNumberCountdown({
  endDate,
  startDate,
  className,
  autoStart = false
}: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    hours: 0,
    minutes: 0,
    seconds: 0,
  })
  const [isRunning, setIsRunning] = useState(autoStart)

  // Calculate time left whenever endDate changes
  useEffect(() => {
    const calculateTimeLeft = () => {
      const start = startDate ? new Date(startDate) : new Date()
      const end = new Date(endDate)
      const difference = end.getTime() - start.getTime()

      if (difference > 0) {
        const totalHours = Math.floor(difference / (1000 * 60 * 60))
        const hours = totalHours % 24
        const minutes = Math.floor((difference / (1000 * 60)) % 60)
        const seconds = Math.floor((difference / 1000) % 60)

        setTimeLeft({ hours, minutes, seconds })
      } else {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 })
      }
    }

    // Only run the interval if countdown is running
    if (isRunning) {
      calculateTimeLeft()
      const timer = setInterval(calculateTimeLeft, 1000)
      return () => clearInterval(timer)
    } else {
      // Just calculate once if not running
      calculateTimeLeft()
    }
  }, [endDate, startDate, isRunning])
  
  // Expose a method to start the countdown
  const startCountdown = () => {
    setIsRunning(true)
  }
  
  // Expose a method to stop the countdown
  const stopCountdown = () => {
    setIsRunning(false)
  }
  
  // Expose a method to reset the countdown
  const resetCountdown = () => {
    setTimeLeft({ hours: 0, minutes: 0, seconds: 0 })
    setIsRunning(false)
  }

  return (
    <div className={`flex items-center justify-center gap-3 ${className}`}>
      <div className="flex flex-col items-center">
        <MotionNumberFlow
          value={timeLeft.hours}
          className="text-5xl font-semibold tracking-tighter"
          format={{ minimumIntegerDigits: 2 }}
        />
        <span className="text-sm text-gray-500">Hours</span>
      </div>
      <div className="text-2xl font-bold">:</div>
      <div className="flex flex-col items-center">
        <MotionNumberFlow
          value={timeLeft.minutes}
          className="text-5xl font-semibold tracking-tighter"
          format={{ minimumIntegerDigits: 2 }}
        />
        <span className="text-sm text-gray-500">Minutes</span>
      </div>
      <div className="text-2xl font-bold">:</div>
      <div className="flex flex-col items-center">
        <MotionNumberFlow
          value={timeLeft.seconds}
          className="text-5xl font-semibold tracking-tighter"
          format={{ minimumIntegerDigits: 2 }}
        />
        <span className="text-sm text-gray-500">Seconds</span>
      </div>
    </div>
  )
}
