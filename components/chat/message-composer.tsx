"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type Props = {
  disabled?: boolean
  onSend: (text: string) => Promise<void> | void
}

export function MessageComposer({ disabled, onSend }: Props) {
  const [text, setText] = useState("")

  async function handleSend() {
    const t = text.trim()
    if (!t) return
    await onSend(t)
    setText("")
  }

  return (
    <div className="border-t p-3">
      <div className="flex items-center gap-2">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault()
              handleSend()
            }
          }}
          placeholder="Type a message..."
          disabled={disabled}
          aria-label="Message"
        />
        <Button onClick={handleSend} disabled={disabled} className="bg-orange-500 hover:bg-orange-600">
          Send
        </Button>
      </div>
    </div>
  )
}
