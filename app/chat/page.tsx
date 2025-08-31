"use client"

import { useEffect, useMemo, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useConversations } from "@/hooks/use-conversations"
import { useMessages } from "@/hooks/use-messages"
import { ConversationList } from "@/components/chat/conversation-list"
import { MessageList } from "@/components/chat/message-list"
import { MessageComposer } from "@/components/chat/message-composer"
import { useAuth } from "@/hooks/use-auth"
import { getOrCreateConversation, sendMessage } from "@/lib/chat-helpers"
import { Input } from "@/components/ui/input"

export default function ChatPage() {
  const router = useRouter()
  const search = useSearchParams()
  const { user } = useAuth()
  const { conversations } = useConversations()
  const [activeId, setActiveId] = useState<string | undefined>(undefined)
  const { messages } = useMessages(activeId)

  // Bootstrap with ?to=<uid> to start a new chat
  useEffect(() => {
    const to = search?.get("to")
    async function start() {
      if (!user?.uid || !to) return
      const id = await getOrCreateConversation(user.uid, to)
      setActiveId(id)
      // remove query param after creating conversation
      router.replace("/chat")
    }
    start()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, user?.uid])

  const sortedConvos = useMemo(() => {
    if (!conversations) return null
    return [...conversations].sort((a, b) => (b.lastMessageAt || 0) - (a.lastMessageAt || 0))
  }, [conversations])

  if (!user) {
    return (
      <main className="container mx-auto p-4">
        <Card className="p-6">
          <h1 className="text-xl font-semibold text-balance mb-2">Messages</h1>
          <p className="text-sm text-muted-foreground">Please sign in to use chat.</p>
        </Card>
      </main>
    )
  }

  return (
    <main className="container mx-auto p-0 md:p-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="md:col-span-1 flex flex-col">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold text-balance">Conversations</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            <ConversationList conversations={sortedConvos} activeId={activeId} onSelect={setActiveId} />
          </div>
          <div className="p-3 border-t">
            <StartNew />
          </div>
        </Card>

        <Card className="md:col-span-2 flex min-h-[60vh] flex-col">
          <div className="p-4 border-b flex items-center justify-between">
            <h2 className="text-lg font-semibold text-balance">Messages</h2>
            <div />
          </div>
          <MessageList messages={messages} currentUid={user.uid} />
          <MessageComposer
            disabled={!activeId}
            onSend={async (text) => {
              if (!activeId || !user?.uid) return
              await sendMessage(activeId, user.uid, text)
            }}
          />
        </Card>
      </div>
    </main>
  )
}

function StartNew() {
  const [otherUid, setOtherUid] = useState("")
  const { user } = useAuth()

  async function handleStart() {
    if (!user?.uid || !otherUid.trim()) return
    const id = await getOrCreateConversation(user.uid, otherUid.trim())
    // naive navigation by setting location hash to force selection in the UI (MVP)
    window.location.href = "/chat" // keep it simple, thread selection stays client-side
  }

  return (
    <div className="flex items-center gap-2">
      <Input
        value={otherUid}
        onChange={(e) => setOtherUid(e.target.value)}
        placeholder="Recipient UID"
        aria-label="Recipient UID"
      />
      <Button onClick={handleStart} className="bg-blue-600 hover:bg-blue-700">
        Start
      </Button>
    </div>
  )
}
