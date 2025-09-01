"use client"

import { useEffect, useState } from "react"
import { subscribeConversations } from "@/lib/chat-helpers"
import type { Conversation } from "@/lib/chat-types"
import { useAuth } from "@/hooks/use-auth"

export function useConversations() {
  const { user } = useAuth()
  const [convos, setConvos] = useState<Conversation[] | null>(null)

  useEffect(() => {
    if (!user?.uid) return
    const unsub = subscribeConversations(user.uid, setConvos)
    return () => unsub && unsub()
  }, [user?.uid])

  return { conversations: convos, loading: !convos && !!user, hasUser: !!user }
}
