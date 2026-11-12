import { auth, currentUser } from '@clerk/nextjs/server'
import { and, asc, eq, isNull } from 'drizzle-orm'
import { NextResponse } from 'next/server'
import { isUuid } from '@/lib/community/access'
import { db } from '@/lib/db'
import { chatMessages, communityChannels, communityServerChannels, communityServerMembers, communityServers, userProfiles } from '@/lib/db/schema'
import { sql } from 'drizzle-orm'

const messageFields = {
  id: chatMessages.id,
  userId: chatMessages.clerkUserId,
  name: chatMessages.displayName,
  initials: sql<string>`left(${chatMessages.displayName}, 1)`,
  color: chatMessages.avatarColor,
  text: chatMessages.message,
  time: sql<string>`to_char(${chatMessages.createdAt}, 'Mon DD, YYYY at HH12:MI AM')`,
  avatarUrl: chatMessages.avatarUrl,
}

function validChannelName(channel: string) {
  return channel.length > 0 && channel.length <= 40
}

export async function GET(request: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const params = new URL(request.url).searchParams
  const channelName = params.get('channel')?.trim() || 'general'
  const serverId = params.get('serverId')
  const serverChannelId = params.get('serverChannelId')
  if (!validChannelName(channelName)) return NextResponse.json({ error: 'Invalid channel.' }, { status: 400 })

  if (serverId || serverChannelId) {
    if (!serverId || !serverChannelId || !isUuid(serverId) || !isUuid(serverChannelId)) {
      return NextResponse.json({ error: 'Invalid server channel.' }, { status: 400 })
    }
    const [activeServer] = await db.select({ id: communityServers.id })
      .from(communityServers)
      .where(and(eq(communityServers.id, serverId), isNull(communityServers.deletedAt)))
      .limit(1)
    if (!activeServer) return NextResponse.json({ error: 'Server not found.' }, { status: 404 })
    const [membership] = await db.select({ serverId: communityServerMembers.serverId })
      .from(communityServerMembers)
      .where(and(eq(communityServerMembers.serverId, serverId), eq(communityServerMembers.clerkUserId, userId)))
      .limit(1)
    if (!membership) return NextResponse.json({ error: 'Join this server to read its channels.' }, { status: 403 })

    const [serverChannel] = await db.select({ id: communityServerChannels.id })
      .from(communityServerChannels)
      .where(and(
        eq(communityServerChannels.id, serverChannelId),
        eq(communityServerChannels.serverId, serverId),
        eq(communityServerChannels.name, channelName),
        eq(communityServerChannels.channelType, 'text'),
      ))
      .limit(1)
    if (!serverChannel) return NextResponse.json({ error: 'Text channel not found.' }, { status: 404 })

    const messages = await db.select(messageFields)
      .from(chatMessages)
      .where(and(eq(chatMessages.serverId, serverId), eq(chatMessages.serverChannelId, serverChannelId)))
      .orderBy(asc(chatMessages.createdAt))
      .limit(200)
    return NextResponse.json({ messages })
  }

  if (channelName !== 'general') {
    const [allowed] = await db.select({ id: communityChannels.id })
      .from(communityChannels)
      .where(and(eq(communityChannels.channelType, 'text'), eq(communityChannels.name, channelName)))
      .limit(1)
    if (!allowed) return NextResponse.json({ error: 'Text channel not found.' }, { status: 404 })
  }

  const messages = await db.select(messageFields)
    .from(chatMessages)
    .where(and(eq(chatMessages.channel, channelName), isNull(chatMessages.serverId)))
    .orderBy(asc(chatMessages.createdAt))
    .limit(200)
  return NextResponse.json({ messages })
}

export async function POST(request: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => null) as {
    message?: string
    channel?: string
    serverId?: string | null
    serverChannelId?: string | null
    avatarColor?: string
  } | null
  const message = typeof body?.message === 'string' ? body.message.trim() : ''
  if (!message || message.length > 2000) return NextResponse.json({ error: 'Message must be between 1 and 2000 characters.' }, { status: 400 })

  const channelName = typeof body?.channel === 'string' ? body.channel.trim() : 'general'
  if (!validChannelName(channelName)) return NextResponse.json({ error: 'Invalid channel.' }, { status: 400 })

  const serverId = typeof body?.serverId === 'string' ? body.serverId : null
  const serverChannelId = typeof body?.serverChannelId === 'string' ? body.serverChannelId : null
  if (serverId || serverChannelId) {
    if (!serverId || !serverChannelId || !isUuid(serverId) || !isUuid(serverChannelId)) {
      return NextResponse.json({ error: 'Invalid server channel.' }, { status: 400 })
    }
    const [activeServer] = await db.select({ id: communityServers.id })
      .from(communityServers)
      .where(and(eq(communityServers.id, serverId), isNull(communityServers.deletedAt)))
      .limit(1)
    if (!activeServer) return NextResponse.json({ error: 'Server not found.' }, { status: 404 })
    const [membership] = await db.select({ serverId: communityServerMembers.serverId })
      .from(communityServerMembers)
      .where(and(eq(communityServerMembers.serverId, serverId), eq(communityServerMembers.clerkUserId, userId)))
      .limit(1)
    if (!membership) return NextResponse.json({ error: 'Join this server to post in its channels.' }, { status: 403 })

    const [serverChannel] = await db.select({ id: communityServerChannels.id })
      .from(communityServerChannels)
      .where(and(
        eq(communityServerChannels.id, serverChannelId),
        eq(communityServerChannels.serverId, serverId),
        eq(communityServerChannels.name, channelName),
        eq(communityServerChannels.channelType, 'text'),
      ))
      .limit(1)
    if (!serverChannel) return NextResponse.json({ error: 'Text channel not found.' }, { status: 404 })
  } else if (channelName !== 'general') {
    const [allowed] = await db.select({ id: communityChannels.id })
      .from(communityChannels)
      .where(and(eq(communityChannels.channelType, 'text'), eq(communityChannels.name, channelName)))
      .limit(1)
    if (!allowed) return NextResponse.json({ error: 'Text channel not found.' }, { status: 404 })
  }

  const user = await currentUser()
  const [savedProfile] = await db.select({ displayName: userProfiles.displayName, avatarPath: userProfiles.avatarPath })
    .from(userProfiles)
    .where(eq(userProfiles.clerkUserId, userId))
    .limit(1)
  const displayName = savedProfile?.displayName || user?.fullName || user?.username || user?.firstName || 'You'
  const avatarUrl = savedProfile?.avatarPath
    ? `/api/profile/avatar?pathname=${encodeURIComponent(savedProfile.avatarPath)}`
    : user?.imageUrl || null
  const avatarColor = typeof body?.avatarColor === 'string' && /^#[0-9a-f]{6}$/i.test(body.avatarColor) ? body.avatarColor : '#5865f2'

  const [savedMessage] = await db.insert(chatMessages).values({
    clerkUserId: userId,
    message,
    displayName,
    avatarUrl,
    avatarColor,
    channel: channelName,
    serverId,
    serverChannelId,
  }).returning(messageFields)

  return NextResponse.json({ message: savedMessage }, { status: 201 })
}
