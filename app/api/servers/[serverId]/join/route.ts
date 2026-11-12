import { auth } from '@clerk/nextjs/server'
import { and, eq, isNull } from 'drizzle-orm'
import { NextResponse } from 'next/server'
import { isUuid } from '@/lib/community/access'
import { db } from '@/lib/db'
import { communityServerMembers, communityServers } from '@/lib/db/schema'

export async function POST(_request: Request, { params }: { params: Promise<{ serverId: string }> }) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Sign in to join a server.' }, { status: 401 })

  const { serverId } = await params
  if (!isUuid(serverId)) return NextResponse.json({ error: 'Invalid server.' }, { status: 400 })

  const [server] = await db.select({ id: communityServers.id })
    .from(communityServers)
    .where(and(eq(communityServers.id, serverId), isNull(communityServers.deletedAt)))
    .limit(1)
  if (!server) return NextResponse.json({ error: 'Server not found.' }, { status: 404 })

  await db.insert(communityServerMembers)
    .values({ serverId, clerkUserId: userId })
    .onConflictDoNothing()

  return NextResponse.json({ joined: true })
}
