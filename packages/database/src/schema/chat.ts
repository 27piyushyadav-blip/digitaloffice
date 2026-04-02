import { pgTable, uuid, text, timestamp, boolean, varchar, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { client, expert } from './users';
import { organizationProfile } from './organizations';

// Conversations table
export const conversations = pgTable('conversations', {
  id: uuid('id').primaryKey().defaultRandom(),
  type: varchar('type', { enum: ['expert', 'organization'] }).notNull(),
  clientId: uuid('client_id').notNull().references(() => client.id, { onDelete: 'cascade' }),
  expertId: uuid('expert_id').references(() => expert.id, { onDelete: 'cascade' }),
  organizationId: uuid('organization_id').references(() => organizationProfile.id, { onDelete: 'cascade' }),
  status: varchar('status', { enum: ['active', 'archived', 'closed'] }).default('active').notNull(),
  lastMessageAt: timestamp('last_message_at').defaultNow(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  clientIdIdx: index('idx_conversation_client_id').on(table.clientId),
  expertIdIdx: index('idx_conversation_expert_id').on(table.expertId),
  organizationIdIdx: index('idx_conversation_organization_id').on(table.organizationId),
}));

// Messages table
export const messages = pgTable('messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  conversationId: uuid('conversation_id').notNull().references(() => conversations.id, { onDelete: 'cascade' }),
  senderId: uuid('sender_id').notNull(), // Remove reference to allow both client and expert
  senderType: varchar('sender_type', { enum: ['client', 'expert', 'organization'] }).notNull(),
  recipientId: uuid('recipient_id').notNull(),
  recipientType: varchar('recipient_type', { enum: ['client', 'expert', 'organization'] }).notNull(),
  content: text('content').notNull(),
  messageType: varchar('message_type', { enum: ['text', 'file', 'image', 'system'] }).default('text').notNull(),
  fileUrl: text('file_url'),
  fileName: text('file_name'),
  isRead: boolean('is_read').default(false).notNull(),
  readAt: timestamp('read_at'),
  isEdited: boolean('is_edited').default(false).notNull(),
  editedAt: timestamp('edited_at'),
  isDeleted: boolean('is_deleted').default(false).notNull(),
  deletedAt: timestamp('deleted_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  conversationIdIdx: index('idx_message_conversation_id').on(table.conversationId),
  senderIdIdx: index('idx_message_sender_id').on(table.senderId),
  recipientIdIdx: index('idx_message_recipient_id').on(table.recipientId),
  createdAtIdx: index('idx_message_created_at').on(table.createdAt),
}));

// Conversation participants table (for organization chats with multiple experts)
export const conversationParticipants = pgTable('conversation_participants', {
  id: uuid('id').primaryKey().defaultRandom(),
  conversationId: uuid('conversation_id').notNull().references(() => conversations.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => expert.id, { onDelete: 'cascade' }),
  role: varchar('role', { enum: ['participant', 'admin', 'moderator'] }).default('participant').notNull(),
  joinedAt: timestamp('joined_at').defaultNow().notNull(),
  lastReadAt: timestamp('last_read_at'),
  isActive: boolean('is_active').default(true).notNull(),
}, (table) => ({
  conversationIdIdx: index('idx_participant_conversation_id').on(table.conversationId),
  userIdIdx: index('idx_participant_user_id').on(table.userId),
}));

// Typing indicators table
export const typingIndicators = pgTable('typing_indicators', {
  id: uuid('id').primaryKey().defaultRandom(),
  conversationId: uuid('conversation_id').notNull().references(() => conversations.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull(), // Remove reference to allow all user types
  userType: varchar('user_type', { enum: ['client', 'expert', 'organization'] }).notNull(),
  isTyping: boolean('is_typing').default(true).notNull(),
  startedAt: timestamp('started_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  conversationIdIdx: index('idx_typing_conversation_id').on(table.conversationId),
  userIdIdx: index('idx_typing_user_id').on(table.userId),
}));

// Relations
export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  client: one(client, {
    fields: [conversations.clientId],
    references: [client.id],
  }),
  expert: one(expert, {
    fields: [conversations.expertId],
    references: [expert.id],
  }),
  organization: one(organizationProfile, {
    fields: [conversations.organizationId],
    references: [organizationProfile.id],
  }),
  messages: many(messages),
  participants: many(conversationParticipants),
  typingIndicators: many(typingIndicators),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
  sender: one(client, {
    fields: [messages.senderId],
    references: [client.id],
  }),
}));

export const conversationParticipantsRelations = relations(conversationParticipants, ({ one }) => ({
  conversation: one(conversations, {
    fields: [conversationParticipants.conversationId],
    references: [conversations.id],
  }),
  user: one(expert, {
    fields: [conversationParticipants.userId],
    references: [expert.id],
  }),
}));

export const typingIndicatorsRelations = relations(typingIndicators, ({ one }) => ({
  conversation: one(conversations, {
    fields: [typingIndicators.conversationId],
    references: [conversations.id],
  }),
  user: one(client, {
    fields: [typingIndicators.userId],
    references: [client.id],
  }),
}));

// Types
export type Conversation = typeof conversations.$inferSelect;
export type NewConversation = typeof conversations.$inferInsert;

export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;

export type ConversationParticipant = typeof conversationParticipants.$inferSelect;
export type NewConversationParticipant = typeof conversationParticipants.$inferInsert;

export type TypingIndicator = typeof typingIndicators.$inferSelect;
export type NewTypingIndicator = typeof typingIndicators.$inferInsert;
