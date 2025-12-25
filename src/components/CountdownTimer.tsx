'use client'

import { useState, useEffect } from 'react'

interface CountdownTimerProps {
  targetDate: Date
}

export default function CountdownTimer({ targetDate }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    expired: false
  })
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    const calculateTimeLeft = () => {
      const now = new Date().getTime()
      const target = targetDate.getTime()
      const difference = target - now

      if (difference <= 0) {
        return {
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          expired: true
        }
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((difference % (1000 * 60)) / 1000),
        expired: false
      }
    }

    // Calculate immediately
    setTimeLeft(calculateTimeLeft())

    // Update every second
    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft())
    }, 1000)

    return () => clearInterval(interval)
  }, [targetDate, mounted])

  if (!mounted) {
    return (
      <div className="mt-4 mb-6">
        <p className="text-sm sm:text-base text-gray-600 mb-3 font-bold">
          Election ends in: | ચૂંટણી પૂરી થાય છે:
        </p>
        <div className="flex items-center justify-center gap-2 sm:gap-4">
          <div className="bg-white rounded-lg shadow-md px-3 sm:px-4 py-2 sm:py-3 min-w-[60px] sm:min-w-[70px]">
            <div className="text-2xl sm:text-3xl font-bold text-blue-600">--</div>
            <div className="text-xs sm:text-sm text-gray-500 mt-1">Days</div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-gray-400">:</div>
          <div className="bg-white rounded-lg shadow-md px-3 sm:px-4 py-2 sm:py-3 min-w-[60px] sm:min-w-[70px]">
            <div className="text-2xl sm:text-3xl font-bold text-blue-600">--</div>
            <div className="text-xs sm:text-sm text-gray-500 mt-1">Hours</div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-gray-400">:</div>
          <div className="bg-white rounded-lg shadow-md px-3 sm:px-4 py-2 sm:py-3 min-w-[60px] sm:min-w-[70px]">
            <div className="text-2xl sm:text-3xl font-bold text-blue-600">--</div>
            <div className="text-xs sm:text-sm text-gray-500 mt-1">Minutes</div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-gray-400">:</div>
          <div className="bg-white rounded-lg shadow-md px-3 sm:px-4 py-2 sm:py-3 min-w-[60px] sm:min-w-[70px]">
            <div className="text-2xl sm:text-3xl font-bold text-blue-600">--</div>
            <div className="text-xs sm:text-sm text-gray-500 mt-1">Seconds</div>
          </div>
        </div>
        <p className="text-xs sm:text-sm text-gray-500 mt-3">
          11:59 PM IST, 31st December 2025
        </p>
      </div>
    )
  }

  if (timeLeft.expired) {
    return null
  }

  return (
    <div className="mt-4 mb-6">
      <p className="text-sm sm:text-base text-gray-600 mb-3 font-bold">
        Election ends in: | ચૂંટણી પૂરી થાય છે:
      </p>
      <div className="flex items-center justify-center gap-2 sm:gap-4">
        <div className="bg-white rounded-lg shadow-md px-3 sm:px-4 py-2 sm:py-3 min-w-[60px] sm:min-w-[70px]">
          <div className="text-2xl sm:text-3xl font-bold text-blue-600">
            {timeLeft.days.toString().padStart(2, '0')}
          </div>
          <div className="text-xs sm:text-sm text-gray-500 mt-1">Days</div>
        </div>
        <div className="text-2xl sm:text-3xl font-bold text-gray-400">:</div>
        <div className="bg-white rounded-lg shadow-md px-3 sm:px-4 py-2 sm:py-3 min-w-[60px] sm:min-w-[70px]">
          <div className="text-2xl sm:text-3xl font-bold text-blue-600">
            {timeLeft.hours.toString().padStart(2, '0')}
          </div>
          <div className="text-xs sm:text-sm text-gray-500 mt-1">Hours</div>
        </div>
        <div className="text-2xl sm:text-3xl font-bold text-gray-400">:</div>
        <div className="bg-white rounded-lg shadow-md px-3 sm:px-4 py-2 sm:py-3 min-w-[60px] sm:min-w-[70px]">
          <div className="text-2xl sm:text-3xl font-bold text-blue-600">
            {timeLeft.minutes.toString().padStart(2, '0')}
          </div>
          <div className="text-xs sm:text-sm text-gray-500 mt-1">Minutes</div>
        </div>
        <div className="text-2xl sm:text-3xl font-bold text-gray-400">:</div>
        <div className="bg-white rounded-lg shadow-md px-3 sm:px-4 py-2 sm:py-3 min-w-[60px] sm:min-w-[70px]">
          <div className="text-2xl sm:text-3xl font-bold text-blue-600">
            {timeLeft.seconds.toString().padStart(2, '0')}
          </div>
          <div className="text-xs sm:text-sm text-gray-500 mt-1">Seconds</div>
        </div>
      </div>
      <p className="text-xs sm:text-sm text-gray-500 mt-3">
        11:59 PM IST, 31st December 2025
      </p>
    </div>
  )
}

