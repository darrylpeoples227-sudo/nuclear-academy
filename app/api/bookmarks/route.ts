import { auth } from '@clerk/nextjs/server'
import { Pool } from 'pg'
import { NextResponse } from 'next/server'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const result = await pool.query(
    `SELECT id, name, url, icon FROM public.user_bookmarks
     WHERE clerk_user_id = $1 ORDER BY created_at ASC LIMIT 10`,
    [userId],
  )
  return NextResponse.json({ bookmarks: result.rows })
}

export async function POST(request: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const name = typeof body.name === 'string' ? body.name.trim().slice(0, 120) : ''
  const url = typeof body.url === 'string' ? body.url.trim() : ''
  const icon = typeof body.icon === 'string' ? body.icon.trim().slice(0, 2048) : ''
  let parsedUrl: URL
  try {
    parsedUrl = new URL(url)
  } catch {
    return NextResponse.json({ error: 'Enter a valid bookmark URL.' }, { status: 400 })
  }
  if (!name || !['http:', 'https:'].includes(parsedUrl.protocol)) {
    return NextResponse.json({ error: 'Bookmark name and a valid HTTP or HTTPS URL are required.' }, { status: 400 })
  }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1, 0))', [userId])
    const existing = await client.query(
      `SELECT id, name, url, icon FROM public.user_bookmarks
       WHERE clerk_user_id = $1 AND url = $2 LIMIT 1`,
      [userId, parsedUrl.toString()],
    )
    if (existing.rowCount) {
      await client.query('COMMIT')
      return NextResponse.json({ bookmark: existing.rows[0], existing: true })
    }
    const count = await client.query(
      'SELECT count(*)::int AS total FROM public.user_bookmarks WHERE clerk_user_id = $1',
      [userId],
    )
    if (count.rows[0].total >= 10) {
      await client.query('ROLLBACK')
      return NextResponse.json({ error: 'You can save up to 10 bookmarks.' }, { status: 409 })
    }
    const inserted = await client.query(
      `INSERT INTO public.user_bookmarks (clerk_user_id, name, url, icon)
       VALUES ($1, $2, $3, $4) RETURNING id, name, url, icon`,
      [userId, name, parsedUrl.toString(), icon],
    )
    await client.query('COMMIT')
    return NextResponse.json({ bookmark: inserted.rows[0] }, { status: 201 })
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

export async function DELETE(request: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const url = searchParams.get('url')
  if (!url) return NextResponse.json({ error: 'Bookmark URL is required.' }, { status: 400 })

  await pool.query(
    'DELETE FROM public.user_bookmarks WHERE clerk_user_id = $1 AND url = $2',
    [userId, url],
  )
  return NextResponse.json({ success: true })
}
