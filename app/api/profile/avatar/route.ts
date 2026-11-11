import { auth } from '@clerk/nextjs/server'
import { get } from '@vercel/blob'
import { Pool } from 'pg'
import { NextRequest, NextResponse } from 'next/server'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

export async function GET(request: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const pathname = request.nextUrl.searchParams.get('pathname')
  if (!pathname || !pathname.startsWith('avatars/')) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const profile = await pool.query(
    'SELECT 1 FROM public.user_profiles WHERE avatar_path = $1 LIMIT 1',
    [pathname],
  )
  if (!profile.rowCount) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const blob = await get(pathname, { access: 'private' })
  if (!blob || blob.statusCode === 304 || !blob.blob.contentType.startsWith('image/')) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  return new NextResponse(blob.stream, {
    headers: {
      'Content-Type': blob.blob.contentType,
      'Cache-Control': 'private, no-cache',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
