export type Conversation = {
  id: string
  members: string[] // [uid1, uid2]
  lastMessageText?: string
  lastMessageAt?: number // ms timestamp
}

export type Message = {
  id: string
  conversationId: string
  senderId: string
  text: string
  createdAt: number // ms timestamp
  seenBy?: string[]
}
