"use client"

import { motion } from "motion/react"
import * as React from "react"

import { cn } from "@/lib/utils"

type GradientStop = {
  offset: string
  color: string
}

const viewBox = {
  width: 300,
  height: 100,
  centerX: 150,
  centerY: 50,
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
  height = 100,
  fontSize = "text-7xl",
  className,
  svgClassName,
  textClassName,
  gradientStops = defaultGradientStops,
}: TextHoverEffectProps) {
  const svgRef = React.useRef<SVGSVGElement>(null)
  const id = React.useId().replace(/:/g, "")
  const [hovered, setHovered] = React.useState(false)
  const [maskPosition, setMaskPosition] = React.useState({
    cx: viewBox.centerX,
    cy: viewBox.centerY,
  })

  const gradientId = `${id}-text-gradient`
  const maskGradientId = `${id}-reveal-mask`
  const maskId = `${id}-text-mask`

  function getPointerPosition(event: React.PointerEvent<SVGSVGElement>) {
    const svg = svgRef.current

    if (!svg) {
      return null
    }

    const point = svg.createSVGPoint()

    point.x = event.clientX
    point.y = event.clientY

    const screenCtm = svg.getScreenCTM()

    if (screenCtm) {
      const svgPoint = point.matrixTransform(screenCtm.inverse())

      return {
        x: svgPoint.x,
        y: svgPoint.y,
      }
    }

    const rect = svg.getBoundingClientRect()

    return {
      x: ((event.clientX - rect.left) / rect.width) * viewBox.width,
      y: ((event.clientY - rect.top) / rect.height) * viewBox.height,
    }
  }

  function handlePointerMove(event: React.PointerEvent<SVGSVGElement>) {
    const pointerPosition = getPointerPosition(event)

    if (!pointerPosition) {
      return
    }

    setMaskPosition({
      cx: Math.min(Math.max(pointerPosition.x, 0), viewBox.width),
      cy: Math.min(Math.max(pointerPosition.y, 0), viewBox.height),
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
        viewBox={`0 0 ${viewBox.width} ${viewBox.height}`}
        xmlns="http://www.w3.org/2000/svg"
        onPointerEnter={(event) => {
          setHovered(true)
          handlePointerMove(event)
        }}
        onPointerLeave={() => {
          setHovered(false)
          setMaskPosition({
            cx: viewBox.centerX,
            cy: viewBox.centerY,
          })
        }}
        onPointerMove={handlePointerMove}
        className={cn("select-none", svgClassName)}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient
            id={gradientId}
            x1="0"
            y1="0"
            x2={viewBox.width}
            y2="0"
            gradientUnits="userSpaceOnUse"
          >
            {gradientStops.map((stop) => (
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
            r={hovered ? 28 : 0}
            initial={{
              cx: viewBox.centerX,
              cy: viewBox.centerY,
            }}
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
          x={viewBox.centerX}
          y={viewBox.centerY}
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
          x={viewBox.centerX}
          y={viewBox.centerY}
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
          x={viewBox.centerX}
          y={viewBox.centerY}
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
