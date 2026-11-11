import { auth, currentUser } from '@clerk/nextjs/server'
import { Pool } from 'pg'
import { NextResponse } from 'next/server'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const OWNER_EMAIL = 'darrylpeoples227@gmail.com'

async function isOwner() {
  const user = await currentUser()
  return user?.primaryEmailAddress?.emailAddress?.toLowerCase() === OWNER_EMAIL
}

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const result = await pool.query(
    `SELECT id, name, channel_type AS type
     FROM public.community_channels ORDER BY created_at ASC`,
  )
  return NextResponse.json({ channels: result.rows })
}

export async function POST(request: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!(await isOwner())) return NextResponse.json({ error: 'Owner access required.' }, { status: 403 })

  const body = await request.json()
  const name = typeof body.name === 'string' ? body.name.trim().replace(/\s+/g, ' ').slice(0, 32) : ''
  const type = body.type
  if (!name || !['text', 'voice'].includes(type)) {
    return NextResponse.json({ error: 'Enter a channel name and choose text or voice.' }, { status: 400 })
  }
  if ((type === 'text' && name.toLowerCase() === 'general') || (type === 'voice' && name.toLowerCase() === 'study room')) {
    return NextResponse.json({ error: 'That name is already reserved.' }, { status: 409 })
  }

  try {
    const result = await pool.query(
      `INSERT INTO public.community_channels (name, channel_type, created_by)
       VALUES ($1, $2, $3) RETURNING id, name, channel_type AS type`,
      [name, type, userId],
    )
    return NextResponse.json({ channel: result.rows[0] }, { status: 201 })
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === '23505') {
      return NextResponse.json({ error: 'A channel with that name already exists in this category.' }, { status: 409 })
    }
    throw error
  }
}
