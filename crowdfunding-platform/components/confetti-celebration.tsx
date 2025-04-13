"use client"

import { useEffect, useState } from "react"

type ConfettiCelebrationProps = {
  show: boolean
  onComplete?: () => void  // Add this back
}

export default function ConfettiCelebration({ show, onComplete }: ConfettiCelebrationProps) {
  const [isVisible, setIsVisible] = useState(false)
  
  const duration = 3000 // Default duration in milliseconds

  useEffect(() => {
    if (show) {
      setIsVisible(true)
      const timer = setTimeout(() => {
        setIsVisible(false)
        // Call onComplete when animation is done
        if (onComplete) onComplete()
      }, duration)
      
      return () => clearTimeout(timer)
    }
    
    return () => {}
  }, [show, duration, onComplete])

  if (!isVisible) return null

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      <div className="confetti confetti-1 confetti-square"></div>
      <div className="confetti confetti-2"></div>
      <div className="confetti confetti-3 confetti-rectangle"></div>
      <div className="confetti confetti-4"></div>
      <div className="confetti confetti-5 confetti-square"></div>
      <div className="confetti confetti-6"></div>
      <div className="confetti confetti-7 confetti-rectangle"></div>
      <div className="confetti confetti-8"></div>
      <div className="confetti confetti-9 confetti-square"></div>
    </div>
  )
}
