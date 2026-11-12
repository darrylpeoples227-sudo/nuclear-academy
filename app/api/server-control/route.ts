import { and, count, desc, eq, isNull } from 'drizzle-orm'
import { NextResponse } from 'next/server'
import { getCommunityActor, isCommunityStaff } from '@/lib/community/access'
import { db } from '@/lib/db'
import { communityServerChannels, communityServerMembers, communityServers } from '@/lib/db/schema'

export async function GET() {
  const actor = await getCommunityActor()
  if (!actor) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 })
  if (!isCommunityStaff(actor)) return NextResponse.json({ error: 'Admin, developer, or owner access required.' }, { status: 403 })

  const rows = await db.select({
    id: communityServers.id,
    name: communityServers.name,
    createdBy: communityServers.createdBy,
    imagePath: communityServers.imagePath,
    joinedByStaff: communityServerMembers.serverId,
    channelCount: count(communityServerChannels.id),
  })
    .from(communityServers)
    .leftJoin(communityServerMembers, and(
      eq(communityServerMembers.serverId, communityServers.id),
      eq(communityServerMembers.clerkUserId, actor.userId),
    ))
    .leftJoin(communityServerChannels, eq(communityServerChannels.serverId, communityServers.id))
    .where(isNull(communityServers.deletedAt))
    .groupBy(communityServers.id, communityServerMembers.serverId)
    .orderBy(desc(communityServers.createdAt))
    .limit(200)

  return NextResponse.json({ servers: rows.map((server) => ({
    id: server.id,
    name: server.name,
    createdBy: server.createdBy,
    imageUrl: server.imagePath ? `/api/servers/${server.id}/image` : null,
    joined: server.joinedByStaff !== null,
    channelCount: server.channelCount,
  })) })
}
