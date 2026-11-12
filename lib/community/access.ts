import { auth, clerkClient } from '@clerk/nextjs/server'

import { serverRemovalReasons } from './constants'

export { serverRemovalReasons }

const OWNER_EMAIL = 'darrylpeoples227@gmail.com'

export type CommunityActor = {
  userId: string
  role: string
  isOwner: boolean
}

export async function getCommunityActor(): Promise<CommunityActor | null> {
  const { userId } = await auth()
  if (!userId) return null

  const client = await clerkClient()
  const user = await client.users.getUser(userId)
  const primaryEmail = user.emailAddresses.find((item) => item.id === user.primaryEmailAddressId)?.emailAddress

  return {
    userId,
    role: typeof user.publicMetadata.role === 'string' ? user.publicMetadata.role.toLowerCase() : 'member',
    isOwner: primaryEmail?.toLowerCase() === OWNER_EMAIL,
  }
}

export function isCommunityStaff(actor: CommunityActor) {
  return actor.isOwner || actor.role === 'admin' || actor.role === 'developer'
}

export function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}
