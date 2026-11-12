import { auth } from '@clerk/nextjs/server'
import { get } from '@vercel/blob'
import { and, eq, isNull } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import { isUuid } from '@/lib/community/access'
import { db } from '@/lib/db'
import { communityServers } from '@/lib/db/schema'

export const runtime = 'nodejs'

export async function GET(request: NextRequest, { params }: { params: Promise<{ serverId: string }> }) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 })

  const { serverId } = await params
  if (!isUuid(serverId)) return NextResponse.json({ error: 'Invalid server.' }, { status: 400 })

  const [server] = await db.select({ imagePath: communityServers.imagePath })
    .from(communityServers)
    .where(and(eq(communityServers.id, serverId), isNull(communityServers.deletedAt)))
    .limit(1)
  if (!server?.imagePath) return NextResponse.json({ error: 'Server picture not found.' }, { status: 404 })

  const result = await get(server.imagePath, {
    access: 'private',
    ifNoneMatch: request.headers.get('if-none-match') ?? undefined,
  })
  if (!result) return NextResponse.json({ error: 'Server picture not found.' }, { status: 404 })
  if (result.statusCode === 304) {
    return new NextResponse(null, {
      status: 304,
      headers: { ETag: result.blob.etag, 'Cache-Control': 'private, no-cache' },
    })
  }

  return new NextResponse(result.stream, {
    headers: {
      'Content-Type': result.blob.contentType,
      ETag: result.blob.etag,
      'Cache-Control': 'private, no-cache',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
