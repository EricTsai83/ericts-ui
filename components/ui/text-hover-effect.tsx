"use client"

import { motion } from "motion/react"
import * as React from "react"

import { cn } from "@/lib/utils"

type GradientStop = {
  offset: string
  color: string
}

export type TextHoverEffectProps = {
  text: string
  duration?: number
  width?: string | number
  height?: string | number
  fontSize?: string
  className?: string
  svgClassName?: string
  textClassName?: string
  gradientStops?: GradientStop[]
}

const defaultGradientStops: GradientStop[] = [
  { offset: "0%", color: "#eab308" },
  { offset: "25%", color: "#ef4444" },
  { offset: "50%", color: "#3b82f6" },
  { offset: "75%", color: "#06b6d4" },
  { offset: "100%", color: "#8b5cf6" },
]

function toCssSize(value: string | number) {
  return typeof value === "number" ? `${value}px` : value
}

export function TextHoverEffect({
  text,
  duration = 0,
  width = "100%",
  height = "100%",
  fontSize = "text-7xl",
  className,
  svgClassName,
  textClassName,
  gradientStops = defaultGradientStops,
}: TextHoverEffectProps) {
  const svgRef = React.useRef<SVGSVGElement>(null)
  const id = React.useId()
  const [hovered, setHovered] = React.useState(false)
  const [maskPosition, setMaskPosition] = React.useState({
    cx: "50%",
    cy: "50%",
  })

  const gradientId = `${id}-text-gradient`
  const maskGradientId = `${id}-reveal-mask`
  const maskId = `${id}-text-mask`

  function handleMouseMove(event: React.MouseEvent<SVGSVGElement>) {
    const svg = svgRef.current

    if (!svg) {
      return
    }

    const rect = svg.getBoundingClientRect()

    setMaskPosition({
      cx: `${((event.clientX - rect.left) / rect.width) * 100}%`,
      cy: `${((event.clientY - rect.top) / rect.height) * 100}%`,
    })
  }

  const sharedTextClassName = cn(
    "fill-transparent font-[helvetica] font-bold",
    fontSize,
    textClassName
  )

  return (
    <div
      className={cn("inline-block", className)}
      style={{
        width: toCssSize(width),
        height: toCssSize(height),
      }}
    >
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        xmlns="http://www.w3.org/2000/svg"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onMouseMove={handleMouseMove}
        className={cn("select-none", svgClassName)}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id={gradientId} gradientUnits="userSpaceOnUse">
            {hovered &&
              gradientStops.map((stop) => (
                <stop
                  key={`${stop.offset}-${stop.color}`}
                  offset={stop.offset}
                  stopColor={stop.color}
                />
              ))}
          </linearGradient>

          <motion.radialGradient
            id={maskGradientId}
            gradientUnits="userSpaceOnUse"
            r="20%"
            initial={{ cx: "50%", cy: "50%" }}
            animate={maskPosition}
            transition={{ duration, ease: "easeOut" }}
          >
            <stop offset="0%" stopColor="white" />
            <stop offset="100%" stopColor="black" />
          </motion.radialGradient>
          <mask id={maskId}>
            <rect
              x="0"
              y="0"
              width="100%"
              height="100%"
              fill={`url(#${maskGradientId})`}
            />
          </mask>
        </defs>
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dominantBaseline="middle"
          strokeWidth="0.3"
          className={cn(
            sharedTextClassName,
            "stroke-neutral-200 dark:stroke-neutral-800"
          )}
          style={{ opacity: hovered ? 0.7 : 0 }}
        >
          {text}
        </text>
        <motion.text
          x="50%"
          y="50%"
          textAnchor="middle"
          dominantBaseline="middle"
          strokeWidth="1.3"
          className={cn(
            sharedTextClassName,
            "stroke-neutral-200 dark:stroke-neutral-800"
          )}
          initial={{ strokeDashoffset: 1000, strokeDasharray: 1000 }}
          animate={{
            strokeDashoffset: 0,
            strokeDasharray: 1000,
          }}
          transition={{
            duration: 4,
            ease: "easeInOut",
          }}
        >
          {text}
        </motion.text>
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dominantBaseline="middle"
          stroke={`url(#${gradientId})`}
          strokeWidth="0.7"
          mask={`url(#${maskId})`}
          className={sharedTextClassName}
        >
          {text}
        </text>
      </svg>
    </div>
  )
}
