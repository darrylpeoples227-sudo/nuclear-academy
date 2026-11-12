import { pgTable, primaryKey, text, timestamp, uuid } from 'drizzle-orm/pg-core'

export const communityServers = pgTable('community_servers', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  imagePath: text('image_path'),
  createdBy: text('created_by').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  deletedBy: text('deleted_by'),
  deletionReason: text('deletion_reason'),
})

export const communityServerChannels = pgTable('community_server_channels', {
  id: uuid('id').defaultRandom().primaryKey(),
  serverId: uuid('server_id').notNull(),
  name: text('name').notNull(),
  channelType: text('channel_type').notNull(),
  createdBy: text('created_by').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const communityServerMembers = pgTable('community_server_members', {
  serverId: uuid('server_id').notNull(),
  clerkUserId: text('clerk_user_id').notNull(),
  joinedAt: timestamp('joined_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [primaryKey({ columns: [table.serverId, table.clerkUserId] })])

export const communityChannels = pgTable('community_channels', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  channelType: text('channel_type').notNull(),
  createdBy: text('created_by').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const userProfiles = pgTable('user_profiles', {
  clerkUserId: text('clerk_user_id').primaryKey(),
  displayName: text('display_name'),
  avatarPath: text('avatar_path'),
  updatedAt: timestamp('updated_at', { withTimezone: true }),
})

export const chatMessages = pgTable('chat_messages', {
  id: uuid('id').defaultRandom().primaryKey(),
  clerkUserId: text('clerk_user_id').notNull(),
  channel: text('channel').notNull().default('general'),
  message: text('message').notNull(),
  displayName: text('display_name').notNull(),
  avatarUrl: text('avatar_url'),
  avatarColor: text('avatar_color').notNull().default('#5865f2'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  serverId: uuid('server_id'),
  serverChannelId: uuid('server_channel_id'),
})
