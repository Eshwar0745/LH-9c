"use client"

import { useEffect, useRef } from "react"
import type { Message } from "@/lib/chat-types"
import { cn } from "@/lib/utils"

type Props = {
  messages: Message[] | null
  currentUid?: string
}

export function MessageList({ messages, currentUid }: Props) {
  const bottomRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
  }, [messages?.length])

  return (
    <div className="flex-1 overflow-y-auto p-4">
      {!messages && <div className="text-sm text-muted-foreground">Loading messages...</div>}
      {messages?.map((m) => {
        const mine = m.senderId === currentUid
        return (
          <div key={m.id} className={cn("mb-3 flex", mine ? "justify-end" : "justify-start")}>
            <div
              className={cn(
                "max-w-[80%] rounded-md px-3 py-2 text-sm",
                mine ? "bg-blue-600 text-white" : "bg-muted text-foreground",
              )}
            >
              <p className="whitespace-pre-wrap text-pretty">{m.text}</p>
              <div className={cn("mt-1 text-[10px]", mine ? "text-blue-100" : "text-muted-foreground")}>
                {new Date(m.createdAt).toLocaleTimeString()}
              </div>
            </div>
          </div>
        )
      })}
      <div ref={bottomRef} />
    </div>
  )
}
