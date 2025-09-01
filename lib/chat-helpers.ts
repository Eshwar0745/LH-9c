import { getDb } from "./firebase-chat"
import {
  addDoc,
  collection,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
  getDoc,
} from "firebase/firestore"
import type { Conversation, Message } from "./chat-types"

const CONV = "conversations"

function tsToMs(ts?: any): number | undefined {
  if (!ts) return undefined
  if (typeof ts === "number") return ts
  if (ts instanceof Timestamp) return ts.toMillis()
  if (ts.toMillis) return ts.toMillis()
  return undefined
}

export async function getOrCreateConversation(a: string, b: string): Promise<string> {
  const db = getDb()
  const members = [a, b].sort()
  const q = query(collection(db, CONV), where("members", "==", members), limit(1))
  const snap = await getDocs(q)
  if (!snap.empty) return snap.docs[0].id

  const ref = await addDoc(collection(db, CONV), {
    members,
    lastMessageText: "",
    lastMessageAt: serverTimestamp(),
  })
  return ref.id
}

export async function sendMessage(conversationId: string, senderId: string, text: string) {
  const db = getDb()
  const messagesRef = collection(doc(db, CONV, conversationId), "messages")
  await addDoc(messagesRef, {
    conversationId,
    senderId,
    text,
    createdAt: serverTimestamp(),
    seenBy: [senderId],
  })
  await updateDoc(doc(db, CONV, conversationId), {
    lastMessageText: text,
    lastMessageAt: serverTimestamp(),
  })
}

export async function markSeen(conversationId: string, uid: string) {
  const db = getDb()
  const messagesRef = collection(doc(db, CONV, conversationId), "messages")
  // For simplicity we don't mark all individually here (costly).
  // Clients should track unread client-side and update lastSeen if needed.
  return // no-op for MVP
}

export async function getConversation(conversationId: string): Promise<Conversation | null> {
  const db = getDb()
  const d = await getDoc(doc(db, CONV, conversationId))
  if (!d.exists()) return null
  const data = d.data()
  return {
    id: d.id,
    members: data.members || [],
    lastMessageText: data.lastMessageText,
    lastMessageAt: tsToMs(data.lastMessageAt),
  }
}

export function subscribeConversations(uid: string, cb: (convos: Conversation[]) => void) {
  const db = getDb()
  const q1 = query(collection(db, CONV), where("members", "array-contains", uid), orderBy("lastMessageAt", "desc"))
  return onSnapshot(q1, (snap) => {
    const list: Conversation[] = snap.docs.map((d) => {
      const data = d.data()
      return {
        id: d.id,
        members: data.members || [],
        lastMessageText: data.lastMessageText,
        lastMessageAt: tsToMs(data.lastMessageAt),
      }
    })
    cb(list)
  })
}

export function subscribeMessages(conversationId: string, cb: (msgs: Message[]) => void) {
  const db = getDb()
  const msgsRef = collection(doc(db, CONV, conversationId), "messages")
  const q1 = query(msgsRef, orderBy("createdAt", "asc"))
  return onSnapshot(q1, (snap) => {
    const list: Message[] = snap.docs.map((d) => {
      const data = d.data()
      return {
        id: d.id,
        conversationId: data.conversationId || conversationId,
        senderId: data.senderId,
        text: data.text,
        createdAt: tsToMs(data.createdAt) || Date.now(),
        seenBy: data.seenBy || [],
      }
    })
    cb(list)
  })
}
