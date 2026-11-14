import { auth, currentUser } from '@clerk/nextjs/server'
import { and, eq, sql } from 'drizzle-orm'
import { NextResponse } from 'next/server'
import { isUuid } from '@/lib/community/access'
import { db } from '@/lib/db'
import { chatMessages } from '@/lib/db/schema'

async function isOwner() {
  const user = await currentUser()
  return user?.primaryEmailAddress?.emailAddress?.toLowerCase() === 'darrylpeoples227@gmail.com'
}

function isModerated(message: string) {
  return /\bmessage\b/i.test(message)
}

async function readBody(request: Request): Promise<Record<string, unknown> | null> {
  const body = await request.json().catch(() => null)
  return body && typeof body === 'object' && !Array.isArray(body)
    ? body as Record<string, unknown>
    : null
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  if (!isUuid(id)) return NextResponse.json({ error: 'Invalid message.' }, { status: 400 })

  const body = await readBody(request)
  const message = typeof body?.message === 'string' ? body.message.trim() : ''
  if (!message || message.length > 2000) {
    return NextResponse.json({ error: 'Message must be between 1 and 2000 characters.' }, { status: 400 })
  }
  if (isModerated(message)) return NextResponse.json({ error: 'That word is blocked by message moderation.' }, { status: 400 })

  const [updated] = await db.update(chatMessages)
    .set({ message })
    .where(and(eq(chatMessages.id, id), eq(chatMessages.clerkUserId, userId)))
    .returning({
      id: chatMessages.id,
      text: chatMessages.message,
      time: sql<string>`to_char(${chatMessages.createdAt}, 'Mon DD, YYYY at HH12:MI AM')`,
    })
  if (!updated) return NextResponse.json({ error: 'Message not found or not yours to edit.' }, { status: 404 })
  return NextResponse.json({ message: updated })
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  if (!isUuid(id)) return NextResponse.json({ error: 'Invalid message.' }, { status: 400 })

  const owner = await isOwner()
  const predicate = owner
    ? eq(chatMessages.id, id)
    : and(eq(chatMessages.id, id), eq(chatMessages.clerkUserId, userId))
  const [deleted] = await db.delete(chatMessages).where(predicate).returning({ id: chatMessages.id })
  if (!deleted) return NextResponse.json({ error: 'Message not found or not allowed.' }, { status: 404 })
  return NextResponse.json({ deleted: true, id: deleted.id })
}
