"use client"

import { motion } from "framer-motion"

export function RoleSwitcher({
  role,
  onChange,
}: { role: "customer" | "provider"; onChange: (r: "customer" | "provider") => void }) {
  const idx = role === "customer" ? 0 : 1
  return (
    <div className="relative grid grid-cols-2 rounded-full border bg-background text-sm">
      <button type="button" onClick={() => onChange("customer")} className="py-2 rounded-full z-10 focus:outline-none">
        Customer
      </button>
      <button type="button" onClick={() => onChange("provider")} className="py-2 rounded-full z-10 focus:outline-none">
        Provider
      </button>
      <motion.span
        className="absolute top-0 bottom-0 w-1/2 rounded-full bg-blue-600/10"
        initial={false}
        animate={{ left: idx === 0 ? "0%" : "50%" }}
        transition={{ type: "spring", stiffness: 380, damping: 30 }}
      />
      <motion.span
        className="absolute top-1 bottom-1 w-[calc(50%-6px)] left-[3px] rounded-full bg-white dark:bg-neutral-900 border"
        initial={false}
        animate={{ left: idx === 0 ? "3px" : "calc(50% + 3px)" }}
        transition={{ type: "spring", stiffness: 380, damping: 30 }}
      />
    </div>
  )
}
