"use client"

import { cn } from "@/lib/utils"
import type { Conversation } from "@/lib/chat-types"
import { Button } from "@/components/ui/button"

type Props = {
  conversations: Conversation[] | null
  activeId?: string
  onSelect: (id: string) => void
}

export function ConversationList({ conversations, activeId, onSelect }: Props) {
  if (!conversations) {
    return <div className="p-4 text-sm text-muted-foreground">Loading conversations...</div>
  }

  if (conversations.length === 0) {
    return <div className="p-4 text-sm text-muted-foreground">No conversations yet.</div>
  }

  return (
    <ul className="flex flex-col divide-y">
      {conversations.map((c) => (
        <li key={c.id}>
          <Button
            variant={c.id === activeId ? "default" : "ghost"}
            className={cn(
              "w-full justify-start rounded-none",
              c.id === activeId ? "bg-blue-600 hover:bg-blue-600 text-white" : "",
            )}
            onClick={() => onSelect(c.id)}
            aria-current={c.id === activeId ? "true" : "false"}
          >
            <span className="truncate text-pretty">{c.lastMessageText || "New conversation"}</span>
            <span className="ml-auto text-xs text-muted-foreground">
              {c.lastMessageAt ? new Date(c.lastMessageAt).toLocaleTimeString() : ""}
            </span>
          </Button>
        </li>
      ))}
    </ul>
  )
}
