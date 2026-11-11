import { auth, currentUser } from '@clerk/nextjs/server'
import { Pool } from 'pg'
import { NextResponse } from 'next/server'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const OWNER_EMAIL = 'darrylpeoples227@gmail.com'
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

async function isOwner() {
  const user = await currentUser()
  return user?.primaryEmailAddress?.emailAddress?.toLowerCase() === OWNER_EMAIL
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  if (!UUID_PATTERN.test(id)) return NextResponse.json({ error: 'Invalid message.' }, { status: 400 })

  const body = await request.json()
  const message = typeof body.message === 'string' ? body.message.trim() : ''
  if (!message || message.length > 2000) {
    return NextResponse.json({ error: 'Message must be between 1 and 2000 characters.' }, { status: 400 })
  }

  const result = await pool.query(
    `UPDATE public.chat_messages SET message = $1
     WHERE id = $2 AND clerk_user_id = $3
     RETURNING id, clerk_user_id AS "userId", message AS text,
       to_char(created_at, 'Mon DD, YYYY at HH12:MI AM') AS time`,
    [message, id, userId],
  )
  if (!result.rowCount) return NextResponse.json({ error: 'Message not found or not yours to edit.' }, { status: 404 })
  return NextResponse.json({ message: result.rows[0] })
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  if (!UUID_PATTERN.test(id)) return NextResponse.json({ error: 'Invalid message.' }, { status: 400 })

  const owner = await isOwner()
  const result = await pool.query(
    `DELETE FROM public.chat_messages
     WHERE id = $1 AND (clerk_user_id = $2 OR $3::boolean)
     RETURNING id`,
    [id, userId, owner],
  )
  if (!result.rowCount) return NextResponse.json({ error: 'Message not found or not allowed.' }, { status: 404 })
  return NextResponse.json({ deleted: true, id })
}
