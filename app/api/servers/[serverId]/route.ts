import { auth } from '@clerk/nextjs/server'
import { and, asc, eq, isNull } from 'drizzle-orm'
import { NextResponse } from 'next/server'
import { getCommunityActor, isCommunityStaff, isUuid, serverRemovalReasons } from '@/lib/community/access'
import { db } from '@/lib/db'
import { communityServerChannels, communityServerMembers, communityServers } from '@/lib/db/schema'

export async function GET(_request: Request, { params }: { params: Promise<{ serverId: string }> }) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Sign in to open this server.' }, { status: 401 })

  const { serverId } = await params
  if (!isUuid(serverId)) return NextResponse.json({ error: 'Invalid server.' }, { status: 400 })

  const [server] = await db.select({
    id: communityServers.id,
    name: communityServers.name,
    createdBy: communityServers.createdBy,
    imagePath: communityServers.imagePath,
  }).from(communityServers).where(and(eq(communityServers.id, serverId), isNull(communityServers.deletedAt))).limit(1)
  if (!server) return NextResponse.json({ error: 'Server not found.' }, { status: 404 })

  const [membership] = await db.select({ serverId: communityServerMembers.serverId })
    .from(communityServerMembers)
    .where(and(eq(communityServerMembers.serverId, serverId), eq(communityServerMembers.clerkUserId, userId)))
    .limit(1)
  if (!membership) return NextResponse.json({ error: 'Join this server before opening it.' }, { status: 403 })

  const channels = await db.select({
    id: communityServerChannels.id,
    name: communityServerChannels.name,
    type: communityServerChannels.channelType,
  }).from(communityServerChannels)
    .where(eq(communityServerChannels.serverId, serverId))
    .orderBy(asc(communityServerChannels.createdAt))

  return NextResponse.json({ server: {
    id: server.id,
    name: server.name,
    createdBy: server.createdBy,
    imageUrl: server.imagePath ? `/api/servers/${server.id}/image` : null,
    canManage: server.createdBy === userId,
  }, channels })
}

export async function DELETE(request: Request, { params }: { params: Promise<{ serverId: string }> }) {
  const actor = await getCommunityActor()
  if (!actor) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 })
  if (!isCommunityStaff(actor)) return NextResponse.json({ error: 'Admin, developer, or owner access required.' }, { status: 403 })

  const { serverId } = await params
  if (!isUuid(serverId)) return NextResponse.json({ error: 'Invalid server.' }, { status: 400 })

  const body = await request.json().catch(() => null) as { reason?: string } | null
  if (!body?.reason || !serverRemovalReasons.includes(body.reason as typeof serverRemovalReasons[number])) {
    return NextResponse.json({ error: 'Choose an approved reason before deleting this server.' }, { status: 400 })
  }

  const [deleted] = await db.update(communityServers).set({
    deletedAt: new Date(),
    deletedBy: actor.userId,
    deletionReason: body.reason,
    updatedAt: new Date(),
  }).where(and(eq(communityServers.id, serverId), isNull(communityServers.deletedAt))).returning({ id: communityServers.id })
  if (!deleted) return NextResponse.json({ error: 'Server not found or already removed.' }, { status: 404 })
  return NextResponse.json({ ok: true, reason: body.reason })
}
