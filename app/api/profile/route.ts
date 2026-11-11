import { auth, currentUser } from '@clerk/nextjs/server'
import { del, put } from '@vercel/blob'
import { Pool } from 'pg'
import { NextResponse } from 'next/server'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const MAX_AVATAR_BYTES = 2 * 1024 * 1024
const allowedImageTypes = new Map([
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
  ['image/gif', 'gif'],
])

function profileAvatarUrl(pathname: string | null) {
  return pathname ? `/api/profile/avatar?pathname=${encodeURIComponent(pathname)}` : null
}

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [result, clerkUser] = await Promise.all([
    pool.query(
      'SELECT display_name, avatar_path FROM public.user_profiles WHERE clerk_user_id = $1',
      [userId],
    ),
    currentUser(),
  ])
  const profile = result.rows[0]
  return NextResponse.json({
    name: profile?.display_name || clerkUser?.fullName || clerkUser?.username || clerkUser?.firstName || 'You',
    image: profileAvatarUrl(profile?.avatar_path ?? null) || clerkUser?.imageUrl || null,
  })
}

export async function POST(request: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await request.formData()
  const name = String(formData.get('name') ?? '').trim().replace(/\s+/g, ' ').slice(0, 24)
  if (!name) return NextResponse.json({ error: 'Enter a display name.' }, { status: 400 })

  const fileValue = formData.get('avatar')
  const file = fileValue instanceof File && fileValue.size > 0 ? fileValue : null
  if (file && (!allowedImageTypes.has(file.type) || file.size > MAX_AVATAR_BYTES)) {
    return NextResponse.json({ error: 'Choose a PNG, JPEG, WebP, or GIF image under 2 MB.' }, { status: 400 })
  }

  const existing = await pool.query(
    'SELECT avatar_path FROM public.user_profiles WHERE clerk_user_id = $1',
    [userId],
  )
  let avatarPath: string | null = existing.rows[0]?.avatar_path ?? null
  let uploadedPath: string | null = null

  if (file) {
    const extension = allowedImageTypes.get(file.type)!
    uploadedPath = `avatars/${userId}/${crypto.randomUUID()}.${extension}`
    await put(uploadedPath, file, {
      access: 'private',
      addRandomSuffix: false,
      contentType: file.type,
    })
    avatarPath = uploadedPath
  }

  try {
    await pool.query(
      `INSERT INTO public.user_profiles (clerk_user_id, display_name, avatar_path, updated_at)
       VALUES ($1, $2, $3, now())
       ON CONFLICT (clerk_user_id) DO UPDATE SET
         display_name = EXCLUDED.display_name,
         avatar_path = EXCLUDED.avatar_path,
         updated_at = now()`,
      [userId, name, avatarPath],
    )
  } catch (error) {
    if (uploadedPath) await del(uploadedPath).catch(() => undefined)
    throw error
  }

  const oldPath = existing.rows[0]?.avatar_path
  if (uploadedPath && oldPath && oldPath !== uploadedPath) await del(oldPath).catch(() => undefined)
  return NextResponse.json({ name, image: profileAvatarUrl(avatarPath) })
}
