import { auth, currentUser } from '@clerk/nextjs/server'
import { Pool } from 'pg'
import { NextResponse } from 'next/server'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

export async function GET(request: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const channel = new URL(request.url).searchParams.get('channel')?.trim() || 'general'
  if (channel.length > 32) return NextResponse.json({ error: 'Invalid channel.' }, { status: 400 })

  const result = await pool.query(
    `SELECT id, display_name AS name, LEFT(display_name, 1) AS initials,
      avatar_color AS color, message AS text,
      to_char(created_at, 'Mon DD, YYYY at HH12:MI AM') AS time,
      avatar_url AS "avatarUrl"
     FROM public.chat_messages
     WHERE channel = $1
     ORDER BY created_at ASC
     LIMIT 200`,
    [channel],
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
  const savedProfile = await pool.query(
    'SELECT display_name, avatar_path FROM public.user_profiles WHERE clerk_user_id = $1',
    [userId],
  )
  const displayName = savedProfile.rows[0]?.display_name || user?.fullName || user?.username || user?.firstName || 'You'
  const avatarPath = savedProfile.rows[0]?.avatar_path as string | null | undefined
  const avatarUrl = avatarPath
    ? `/api/profile/avatar?pathname=${encodeURIComponent(avatarPath)}`
    : user?.imageUrl || null
  const avatarColor = typeof body.avatarColor === 'string' && /^#[0-9a-f]{6}$/i.test(body.avatarColor) ? body.avatarColor : '#5865f2'
  const channel = typeof body.channel === 'string' ? body.channel.trim() : 'general'
  if (!channel || channel.length > 32) return NextResponse.json({ error: 'Invalid channel.' }, { status: 400 })
  if (channel !== 'general') {
    const allowed = await pool.query(
      "SELECT 1 FROM public.community_channels WHERE channel_type = 'text' AND name = $1",
      [channel],
    )
    if (!allowed.rowCount) return NextResponse.json({ error: 'Text channel not found.' }, { status: 404 })
  }

  const result = await pool.query(
    `INSERT INTO public.chat_messages (clerk_user_id, message, display_name, avatar_url, avatar_color, channel)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, display_name AS name, LEFT(display_name, 1) AS initials,
       avatar_color AS color, message AS text,
       to_char(created_at, 'Mon DD, YYYY at HH12:MI AM') AS time,
       avatar_url AS "avatarUrl"`,
    [userId, message, displayName, avatarUrl, avatarColor, channel],
  )
  return NextResponse.json({ message: result.rows[0] }, { status: 201 })
}
