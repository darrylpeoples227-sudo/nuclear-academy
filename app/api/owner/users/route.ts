import { auth, clerkClient } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const OWNER_EMAIL = 'darrylpeoples227@gmail.com'

async function requireOwner() {
  const { userId } = await auth()
  if (!userId) return { error: NextResponse.json({ error: 'Sign in required.' }, { status: 401 }) }
  const user = await clerkClient.users.getUser(userId)
  const email = user.emailAddresses.find((item) => item.id === user.primaryEmailAddressId)?.emailAddress
  if (email?.toLowerCase() !== OWNER_EMAIL) return { error: NextResponse.json({ error: 'Owner access required.' }, { status: 403 }) }
  return { user }
}

export async function GET() {
  const result = await requireOwner()
  if ('error' in result) return result.error
  const users = await clerkClient.users.getUserList({ limit: 100, orderBy: '-created_at' })
  return NextResponse.json(users.data.map((user) => ({
    id: user.id,
    email: user.emailAddresses.find((item) => item.id === user.primaryEmailAddressId)?.emailAddress ?? 'No email',
    name: [user.firstName, user.lastName].filter(Boolean).join(' ') || user.username || 'Member',
    role: (user.publicMetadata.role as string | undefined) ?? 'member',
    status: (user.publicMetadata.status as string | undefined) ?? 'active',
    timeoutUntil: (user.publicMetadata.timeoutUntil as string | undefined) ?? null,
  })))
}

export async function PATCH(request: Request) {
  const result = await requireOwner()
  if ('error' in result) return result.error
  const body = await request.json() as { userId?: string; action?: string; role?: string; timeoutMinutes?: number }
  if (!body.userId || !body.action) return NextResponse.json({ error: 'Missing moderation action.' }, { status: 400 })
  const target = await clerkClient.users.getUser(body.userId)
  const currentMetadata = target.publicMetadata ?? {}
  const updates: Record<string, unknown> = { ...currentMetadata }
  if (body.action === 'ban') updates.status = 'banned'
  if (body.action === 'unban') updates.status = 'active'
  if (body.action === 'timeout') updates.timeoutUntil = new Date(Date.now() + Math.max(1, Math.min(body.timeoutMinutes ?? 10, 1440)) * 60_000).toISOString()
  if (body.action === 'untimeout') updates.timeoutUntil = null
  if (body.action === 'rank' && body.role) updates.role = body.role
  if (body.action === 'unrank') updates.role = 'member'
  await clerkClient.users.updateUser(body.userId, { publicMetadata: updates })
  return NextResponse.json({ ok: true })
}
