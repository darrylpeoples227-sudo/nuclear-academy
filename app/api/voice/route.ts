import { auth, currentUser } from '@clerk/nextjs/server'
import { and, asc, eq, gt, isNull, lt } from 'drizzle-orm'
import { NextResponse } from 'next/server'
import { isUuid } from '@/lib/community/access'
import { db } from '@/lib/db'
import {
  communityServerChannels,
  communityServerMembers,
  communityServers,
  communityChannels,
  userProfiles,
  voiceParticipants,
  voiceSignals,
} from '@/lib/db/schema'

export const dynamic = 'force-dynamic'

const presenceWindowMs = 15_000
const signalWindowMs = 5 * 60_000
const maxSignalPayloadLength = 16_000

type RoomInput = {
  channel?: unknown
  channelId?: unknown
  serverId?: unknown
  serverChannelId?: unknown
}

type RoomResult = { roomKey: string } | { error: string; status: number }

function stringValue(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

async function resolveRoom(input: RoomInput, userId: string): Promise<RoomResult> {
  const serverId = stringValue(input.serverId)
  const serverChannelId = stringValue(input.serverChannelId)
  if (serverId || serverChannelId) {
    if (!serverId || !serverChannelId || !isUuid(serverId) || !isUuid(serverChannelId)) {
      return { error: 'Invalid voice channel.', status: 400 }
    }

    const [server] = await db.select({ id: communityServers.id })
      .from(communityServers)
      .where(and(eq(communityServers.id, serverId), isNull(communityServers.deletedAt)))
      .limit(1)
    if (!server) return { error: 'Server not found.', status: 404 }

    const [membership] = await db.select({ serverId: communityServerMembers.serverId })
      .from(communityServerMembers)
      .where(and(eq(communityServerMembers.serverId, serverId), eq(communityServerMembers.clerkUserId, userId)))
      .limit(1)
    if (!membership) return { error: 'Join this server to use its voice channels.', status: 403 }

    const [channel] = await db.select({ id: communityServerChannels.id })
      .from(communityServerChannels)
      .where(and(
        eq(communityServerChannels.id, serverChannelId),
        eq(communityServerChannels.serverId, serverId),
        eq(communityServerChannels.channelType, 'voice'),
      ))
      .limit(1)
    if (!channel) return { error: 'Voice channel not found.', status: 404 }
    return { roomKey: `server:${serverId}:${serverChannelId}` }
  }

  const channelId = stringValue(input.channelId)
  if (channelId) {
    if (!isUuid(channelId)) return { error: 'Invalid voice channel.', status: 400 }
    const [channel] = await db.select({ id: communityChannels.id })
      .from(communityChannels)
      .where(and(eq(communityChannels.id, channelId), eq(communityChannels.channelType, 'voice')))
      .limit(1)
    if (!channel) return { error: 'Voice channel not found.', status: 404 }
    return { roomKey: `global:${channelId}` }
  }

  if (stringValue(input.channel).toLowerCase() === 'study room') return { roomKey: 'global:study-room' }
  return { error: 'Choose a valid voice channel.', status: 400 }
}

function isRoomError(result: RoomResult): result is { error: string; status: number } {
  return 'error' in result
}


async function readJson(request: Request): Promise<Record<string, unknown> | null> {
  const contentLength = Number(request.headers.get('content-length') || 0)
  if (contentLength > maxSignalPayloadLength + 4_000) return null
  const body = await request.json().catch(() => null)
  if (!body || typeof body !== 'object' || Array.isArray(body)) return null
  const encoded = JSON.stringify(body)
  if (!encoded || encoded.length > maxSignalPayloadLength + 4_000) return null
  return body as Record<string, unknown>
}

export async function GET(request: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 })

  const params = new URL(request.url).searchParams
  const room = await resolveRoom({
    channel: params.get('channel'),
    channelId: params.get('channelId'),
    serverId: params.get('serverId'),
    serverChannelId: params.get('serverChannelId'),
  }, userId)
  if (isRoomError(room)) return NextResponse.json({ error: room.error }, { status: room.status })
  const roomKey = room.roomKey
  const now = Date.now()

  await db.delete(voiceSignals).where(and(
    eq(voiceSignals.roomKey, roomKey),
    lt(voiceSignals.createdAt, new Date(now - signalWindowMs)),
  ))

  const [participants, signals] = await Promise.all([
    db.select({
      userId: voiceParticipants.clerkUserId,
      name: voiceParticipants.displayName,
      avatarUrl: voiceParticipants.avatarUrl,
      muted: voiceParticipants.muted,
    })
      .from(voiceParticipants)
      .where(and(eq(voiceParticipants.roomKey, roomKey), gt(voiceParticipants.lastSeenAt, new Date(now - presenceWindowMs))))
      .orderBy(asc(voiceParticipants.displayName)),
    db.select({
      id: voiceSignals.id,
      fromUserId: voiceSignals.fromUserId,
      signalType: voiceSignals.signalType,
      payload: voiceSignals.payload,
    })
      .from(voiceSignals)
      .where(and(
        eq(voiceSignals.roomKey, roomKey),
        eq(voiceSignals.toUserId, userId),
        gt(voiceSignals.createdAt, new Date(now - signalWindowMs)),
      ))
      .orderBy(asc(voiceSignals.createdAt))
      .limit(250),
  ])

  return NextResponse.json({ participants, signals })
}

export async function PUT(request: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 })
  const body = await readJson(request)
  if (!body) return NextResponse.json({ error: 'Invalid voice presence update.' }, { status: 400 })

  const room = await resolveRoom(body, userId)
  if (isRoomError(room)) return NextResponse.json({ error: room.error }, { status: room.status })

  const [user, profile] = await Promise.all([
    currentUser(),
    db.select({ displayName: userProfiles.displayName, avatarPath: userProfiles.avatarPath })
      .from(userProfiles)
      .where(eq(userProfiles.clerkUserId, userId))
      .limit(1)
      .then((rows) => rows[0]),
  ])
  const displayName = (profile?.displayName || user?.fullName || user?.username || user?.firstName || 'Member').slice(0, 64)
  const avatarUrl = profile?.avatarPath
    ? `/api/profile/avatar?pathname=${encodeURIComponent(profile.avatarPath)}`
    : user?.imageUrl || null

  await db.insert(voiceParticipants).values({
    roomKey: room.roomKey,
    clerkUserId: userId,
    displayName,
    avatarUrl,
    muted: body.muted === true,
    lastSeenAt: new Date(),
  }).onConflictDoUpdate({
    target: [voiceParticipants.roomKey, voiceParticipants.clerkUserId],
    set: {
      displayName,
      avatarUrl,
      muted: body.muted === true,
      lastSeenAt: new Date(),
    },
  })

  await db.delete(voiceParticipants).where(and(
    eq(voiceParticipants.roomKey, room.roomKey),
    lt(voiceParticipants.lastSeenAt, new Date(Date.now() - presenceWindowMs)),
  ))
  return NextResponse.json({ ok: true })
}

export async function DELETE(request: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 })
  const body = await readJson(request)
  if (!body) return NextResponse.json({ error: 'Invalid voice room.' }, { status: 400 })

  const room = await resolveRoom(body, userId)
  if (isRoomError(room)) return NextResponse.json({ error: room.error }, { status: room.status })

  await db.delete(voiceParticipants).where(and(
    eq(voiceParticipants.roomKey, room.roomKey),
    eq(voiceParticipants.clerkUserId, userId),
  ))
  return NextResponse.json({ ok: true })
}

export async function POST(request: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 })
  const body = await readJson(request)
  if (!body) return NextResponse.json({ error: 'Invalid voice signal.' }, { status: 400 })

  const room = await resolveRoom(body, userId)
  if (isRoomError(room)) return NextResponse.json({ error: room.error }, { status: room.status })

  const toUserId = stringValue(body.toUserId)
  const signalType = stringValue(body.signalType)
  const payload = body.payload
  if (!toUserId || toUserId.length > 128 || toUserId === userId) {
    return NextResponse.json({ error: 'Choose a valid participant.' }, { status: 400 })
  }
  if (!['offer', 'answer', 'candidate'].includes(signalType)) {
    return NextResponse.json({ error: 'Unsupported voice signal.' }, { status: 400 })
  }
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return NextResponse.json({ error: 'Invalid voice signal payload.' }, { status: 400 })
  }
  const payloadText = JSON.stringify(payload)
  if (!payloadText || payloadText.length > maxSignalPayloadLength) {
    return NextResponse.json({ error: 'Voice signal payload is too large.' }, { status: 413 })
  }

  const now = new Date()
  const [sender, recipient] = await Promise.all([
    db.select({ userId: voiceParticipants.clerkUserId })
      .from(voiceParticipants)
      .where(and(
        eq(voiceParticipants.roomKey, room.roomKey),
        eq(voiceParticipants.clerkUserId, userId),
        gt(voiceParticipants.lastSeenAt, new Date(Date.now() - presenceWindowMs)),
      ))
      .limit(1)
      .then((rows) => rows[0]),
    db.select({ userId: voiceParticipants.clerkUserId })
      .from(voiceParticipants)
      .where(and(
        eq(voiceParticipants.roomKey, room.roomKey),
        eq(voiceParticipants.clerkUserId, toUserId),
        gt(voiceParticipants.lastSeenAt, new Date(Date.now() - presenceWindowMs)),
      ))
      .limit(1)
      .then((rows) => rows[0]),
  ])
  if (!sender || !recipient) return NextResponse.json({ error: 'Both participants must be in the same voice room.' }, { status: 409 })

  await db.insert(voiceSignals).values({
    roomKey: room.roomKey,
    toUserId,
    fromUserId: userId,
    signalType,
    payload: payload as Record<string, unknown>,
    createdAt: now,
  })
  return NextResponse.json({ ok: true }, { status: 201 })
}
