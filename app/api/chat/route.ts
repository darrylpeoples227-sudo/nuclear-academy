import { auth, currentUser } from '@clerk/nextjs/server'
import { Pool } from 'pg'
import { NextResponse } from 'next/server'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const result = await pool.query(
    `SELECT id, display_name AS name, LEFT(display_name, 1) AS initials,
      avatar_color AS color, message AS text,
      to_char(created_at, 'Mon DD, YYYY at HH12:MI AM') AS time,
      avatar_url AS "avatarUrl"
     FROM public.chat_messages
     WHERE clerk_user_id = $1 OR channel = 'general'
     ORDER BY created_at ASC
     LIMIT 200`,
    [userId],
  )
  return NextResponse.json({ messages: result.rows })
}

export async function POST(request: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const message = typeof body.message === 'string' ? body.message.trim() : ''
  if (!message || message.length > 2000) return NextResponse.json({ error: 'Message must be between 1 and 2000 characters.' }, { status: 400 })

  const user = await currentUser()
  const displayName = user?.fullName || user?.username || user?.firstName || 'You'
  const avatarUrl = user?.imageUrl || (typeof body.avatarUrl === 'string' && body.avatarUrl.startsWith('data:image/') ? body.avatarUrl : null)
  const avatarColor = typeof body.avatarColor === 'string' && /^#[0-9a-f]{6}$/i.test(body.avatarColor) ? body.avatarColor : '#5865f2'

  const result = await pool.query(
    `INSERT INTO public.chat_messages (clerk_user_id, message, display_name, avatar_url, avatar_color)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, display_name AS name, LEFT(display_name, 1) AS initials,
       avatar_color AS color, message AS text,
       to_char(created_at, 'Mon DD, YYYY at HH12:MI AM') AS time,
       avatar_url AS "avatarUrl"`,
    [userId, message, displayName, avatarUrl, avatarColor],
  )
  return NextResponse.json({ message: result.rows[0] }, { status: 201 })
}
