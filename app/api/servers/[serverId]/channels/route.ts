import { auth } from '@clerk/nextjs/server'
import { and, eq, isNull, sql } from 'drizzle-orm'
import { NextResponse } from 'next/server'
import { isUuid } from '@/lib/community/access'
import { db } from '@/lib/db'
import { communityServerChannels, communityServers } from '@/lib/db/schema'

export async function POST(request: Request, { params }: { params: Promise<{ serverId: string }> }) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 })

  const { serverId } = await params
  if (!isUuid(serverId)) return NextResponse.json({ error: 'Invalid server.' }, { status: 400 })

  const [server] = await db.select({ createdBy: communityServers.createdBy })
    .from(communityServers)
    .where(and(eq(communityServers.id, serverId), isNull(communityServers.deletedAt)))
    .limit(1)
  if (!server) return NextResponse.json({ error: 'Server not found.' }, { status: 404 })
  if (server.createdBy !== userId) return NextResponse.json({ error: 'Only the server creator can add channels.' }, { status: 403 })

  const body = await request.json().catch(() => null) as { name?: string; type?: string } | null
  const name = typeof body?.name === 'string' ? body.name.trim().replace(/\s+/g, ' ') : ''
  const type = body?.type
  if (name.length < 2 || name.length > 40 || (type !== 'text' && type !== 'voice')) {
    return NextResponse.json({ error: 'Enter a channel name between 2 and 40 characters and choose text or voice.' }, { status: 400 })
  }

  const [existing] = await db.select({ id: communityServerChannels.id })
    .from(communityServerChannels)
    .where(and(
      eq(communityServerChannels.serverId, serverId),
      eq(communityServerChannels.channelType, type),
      sql`lower(${communityServerChannels.name}) = ${name.toLowerCase()}`,
    ))
    .limit(1)
  if (existing) return NextResponse.json({ error: 'A channel with that name already exists in this category.' }, { status: 409 })

  const [channel] = await db.insert(communityServerChannels).values({
    serverId,
    name,
    channelType: type,
    createdBy: userId,
  }).returning({ id: communityServerChannels.id, name: communityServerChannels.name, type: communityServerChannels.channelType })

  return NextResponse.json({ channel }, { status: 201 })
}
