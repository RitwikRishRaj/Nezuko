import type { Metadata } from "next"
import { Analytics } from "@vercel/analytics/next"
import "../arena/globals.css"

export const metadata: Metadata = {
  title: "Problem Tracker",
  description: "Track your coding problems and progress",
  generator: "v0.app",
}

export default function ArenaLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {children}
      <Analytics />
    </>
  )
}
