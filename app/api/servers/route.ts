import { auth } from '@clerk/nextjs/server'
import { del, put } from '@vercel/blob'
import { and, desc, eq, isNull } from 'drizzle-orm'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { communityServerChannels, communityServerMembers, communityServers } from '@/lib/db/schema'

export const runtime = 'nodejs'

const MAX_SERVER_IMAGE_BYTES = 5 * 1024 * 1024
const ALLOWED_SERVER_IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif'])

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Sign in to view servers.' }, { status: 401 })

  const rows = await db.select({
    id: communityServers.id,
    name: communityServers.name,
    createdBy: communityServers.createdBy,
    imagePath: communityServers.imagePath,
    memberId: communityServerMembers.clerkUserId,
  })
    .from(communityServers)
    .leftJoin(communityServerMembers, and(
      eq(communityServerMembers.serverId, communityServers.id),
      eq(communityServerMembers.clerkUserId, userId),
    ))
    .where(isNull(communityServers.deletedAt))
    .orderBy(desc(communityServers.createdAt))
    .limit(200)

  return NextResponse.json({ servers: rows.map((server) => ({
    id: server.id,
    name: server.name,
    createdBy: server.createdBy,
    imageUrl: server.imagePath ? `/api/servers/${server.id}/image` : null,
    joined: server.memberId !== null,
  })) })
}

export async function POST(request: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Sign in to create a server.' }, { status: 401 })

  const formData = await request.formData()
  const name = String(formData.get('name') ?? '').trim().replace(/\s+/g, ' ')
  if (name.length < 2 || name.length > 40) {
    return NextResponse.json({ error: 'Server names must be between 2 and 40 characters.' }, { status: 400 })
  }

  const imageValue = formData.get('image')
  let imageFile: File | null = null
  if (imageValue instanceof File && imageValue.size > 0) {
    if (!ALLOWED_SERVER_IMAGE_TYPES.has(imageValue.type)) {
      return NextResponse.json({ error: 'Use a PNG, JPEG, WebP, or GIF server picture.' }, { status: 400 })
    }
    if (imageValue.size > MAX_SERVER_IMAGE_BYTES) {
      return NextResponse.json({ error: 'Server pictures must be 5 MB or smaller.' }, { status: 400 })
    }
    imageFile = imageValue
  }

  let uploadedUrl: string | null = null
  let imagePath: string | null = null
  try {
    if (imageFile) {
      const blob = await put(`community-servers/${userId}/${crypto.randomUUID()}`, imageFile, {
        access: 'private',
        contentType: imageFile.type,
      })
      uploadedUrl = blob.url
      imagePath = blob.pathname
    }

    const server = await db.transaction(async (transaction) => {
      const [created] = await transaction.insert(communityServers).values({
        name,
        imagePath,
        createdBy: userId,
      }).returning({ id: communityServers.id, name: communityServers.name })

      await transaction.insert(communityServerChannels).values([
        { serverId: created.id, name: 'general', channelType: 'text', createdBy: userId },
        { serverId: created.id, name: 'Study Room', channelType: 'voice', createdBy: userId },
      ])
      await transaction.insert(communityServerMembers).values({ serverId: created.id, clerkUserId: userId })
      return created
    })

    return NextResponse.json({ server: {
      ...server,
      createdBy: userId,
      imageUrl: imagePath ? `/api/servers/${server.id}/image` : null,
      joined: true,
    } }, { status: 201 })
  } catch (error) {
    if (uploadedUrl) await del(uploadedUrl).catch(() => undefined)
    throw error
  }
}
