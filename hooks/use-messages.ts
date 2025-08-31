"use client"

import { useEffect, useState } from "react"
import { subscribeMessages } from "@/lib/chat-helpers"
import type { Message } from "@/lib/chat-types"

export function useMessages(conversationId?: string) {
  const [messages, setMessages] = useState<Message[] | null>(null)
  useEffect(() => {
    if (!conversationId) return
    const unsub = subscribeMessages(conversationId, setMessages)
    return () => unsub && unsub()
  }, [conversationId])
  return { messages, loading: !messages && !!conversationId }
}
