import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  role: text("role").notNull().default("organizer"), // organizer, admin
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const polls = pgTable("polls", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  organizerId: integer("organizer_id").notNull().references(() => users.id),
  options: text("options").array().notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  isAnonymous: boolean("is_anonymous").default(true).notNull(),
  allowMultiple: boolean("allow_multiple").default(false).notNull(),
  publicKey: text("public_key").notNull(),
  privateKey: text("private_key").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const eligibleVoters = pgTable("eligible_voters", {
  id: serial("id").primaryKey(),
  pollId: integer("poll_id").notNull().references(() => polls.id),
  email: text("email").notNull(),
  token: text("token").notNull().unique(),
  hasVoted: boolean("has_voted").default(false).notNull(),
  votedAt: timestamp("voted_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const voteLog = pgTable("vote_log", {
  id: serial("id").primaryKey(),
  pollId: integer("poll_id").notNull().references(() => polls.id),
  voterToken: text("voter_token").notNull(),
  voteChoices: text("vote_choices").array().notNull(),
  previousHash: text("previous_hash"),
  currentHash: text("current_hash").notNull(),
  signature: text("signature").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  sequenceNumber: integer("sequence_number").notNull(),
});

export const pollResults = pgTable("poll_results", {
  id: serial("id").primaryKey(),
  pollId: integer("poll_id").notNull().references(() => polls.id),
  results: jsonb("results").$type<Record<string, number>>().notNull(),
  totalVotes: integer("total_votes").notNull(),
  verificationHash: text("verification_hash").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  polls: many(polls),
}));

export const pollsRelations = relations(polls, ({ one, many }) => ({
  organizer: one(users, { fields: [polls.organizerId], references: [users.id] }),
  eligibleVoters: many(eligibleVoters),
  voteLog: many(voteLog),
  results: many(pollResults),
}));

export const eligibleVotersRelations = relations(eligibleVoters, ({ one }) => ({
  poll: one(polls, { fields: [eligibleVoters.pollId], references: [polls.id] }),
}));

export const voteLogRelations = relations(voteLog, ({ one }) => ({
  poll: one(polls, { fields: [voteLog.pollId], references: [polls.id] }),
}));

export const pollResultsRelations = relations(pollResults, ({ one }) => ({
  poll: one(polls, { fields: [pollResults.pollId], references: [polls.id] }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  role: true,
});

export const insertPollSchema = createInsertSchema(polls).omit({
  id: true,
  createdAt: true,
  publicKey: true,
  privateKey: true,
});

export const insertEligibleVoterSchema = createInsertSchema(eligibleVoters).omit({
  id: true,
  createdAt: true,
  token: true,
  hasVoted: true,
  votedAt: true,
});

export const insertVoteLogSchema = createInsertSchema(voteLog).omit({
  id: true,
  timestamp: true,
  currentHash: true,
  signature: true,
  sequenceNumber: true,
});

export const voteSubmissionSchema = z.object({
  token: z.string().min(1),
  choices: z.array(z.string()).min(1),
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Poll = typeof polls.$inferSelect;
export type InsertPoll = z.infer<typeof insertPollSchema>;
export type EligibleVoter = typeof eligibleVoters.$inferSelect;
export type InsertEligibleVoter = z.infer<typeof insertEligibleVoterSchema>;
export type VoteLog = typeof voteLog.$inferSelect;
export type InsertVoteLog = z.infer<typeof insertVoteLogSchema>;
export type PollResults = typeof pollResults.$inferSelect;
export type VoteSubmission = z.infer<typeof voteSubmissionSchema>;
