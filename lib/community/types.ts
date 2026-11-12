export type ServerChannel = {
  id: string
  name: string
  type: 'text' | 'voice'
}

export type CommunityServer = {
  id: string
  name: string
  createdBy: string
  imageUrl: string | null
  joined: boolean
}

export type ManagedCommunityServer = CommunityServer & {
  channelCount: number
}
