import { users, polls, eligibleVoters, voteLog, pollResults, type User, type InsertUser, type Poll, type InsertPoll, type EligibleVoter, type InsertEligibleVoter, type VoteLog, type InsertVoteLog, type PollResults } from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql, and } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Poll methods
  getAllPolls(): Promise<Poll[]>;
  getPoll(id: number): Promise<Poll | undefined>;
  createPoll(poll: InsertPoll & { publicKey: string; privateKey: string }): Promise<Poll>;

  // Eligible voter methods
  addEligibleVoter(voter: InsertEligibleVoter & { token: string }): Promise<EligibleVoter>;
  getEligibleVoterByToken(token: string): Promise<EligibleVoter | undefined>;
  markVoterAsVoted(voterId: number): Promise<void>;

  // Vote log methods
  addVoteToLog(vote: InsertVoteLog & { currentHash: string; signature: string; sequenceNumber: number }): Promise<VoteLog>;
  getVoteLog(pollId: number): Promise<VoteLog[]>;
  getVoteCount(pollId: number): Promise<number>;
  getLastVote(pollId: number): Promise<VoteLog | undefined>;

  // Results methods
  getPollResults(pollId: number): Promise<PollResults | undefined>;
  savePollResults(results: { pollId: number; results: Record<string, number>; totalVotes: number; verificationHash: string }): Promise<PollResults>;

  // Dashboard stats
  getDashboardStats(): Promise<{
    activePolls: number;
    totalVoters: number;
    verifiedVotes: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getAllPolls(): Promise<Poll[]> {
    const pollsData = await db
      .select()
      .from(polls)
      .orderBy(desc(polls.createdAt));
    
    // Add vote counts separately to maintain type safety
    const pollsWithCounts = await Promise.all(
      pollsData.map(async (poll) => {
        const votesCount = await this.getVoteCount(poll.id);
        const [eligibleVotersResult] = await db
          .select({ count: sql<number>`COUNT(*)::int` })
          .from(eligibleVoters)
          .where(eq(eligibleVoters.pollId, poll.id));
        
        return {
          ...poll,
          votesCount,
          eligibleVotersCount: eligibleVotersResult?.count || 0,
        };
      })
    );
    
    return pollsWithCounts as any;
  }

  async getPoll(id: number): Promise<Poll | undefined> {
    const [poll] = await db.select().from(polls).where(eq(polls.id, id));
    return poll || undefined;
  }

  async createPoll(pollData: InsertPoll & { publicKey: string; privateKey: string }): Promise<Poll> {
    const [poll] = await db
      .insert(polls)
      .values(pollData)
      .returning();
    return poll;
  }

  async addEligibleVoter(voterData: InsertEligibleVoter & { token: string }): Promise<EligibleVoter> {
    const [voter] = await db
      .insert(eligibleVoters)
      .values(voterData)
      .returning();
    return voter;
  }

  async getEligibleVoterByToken(token: string): Promise<EligibleVoter | undefined> {
    const [voter] = await db
      .select()
      .from(eligibleVoters)
      .where(eq(eligibleVoters.token, token));
    return voter || undefined;
  }

  async markVoterAsVoted(voterId: number): Promise<void> {
    await db
      .update(eligibleVoters)
      .set({ 
        hasVoted: true, 
        votedAt: new Date() 
      })
      .where(eq(eligibleVoters.id, voterId));
  }

  async addVoteToLog(voteData: InsertVoteLog & { currentHash: string; signature: string; sequenceNumber: number }): Promise<VoteLog> {
    const [vote] = await db
      .insert(voteLog)
      .values(voteData)
      .returning();
    return vote;
  }

  async getVoteLog(pollId: number): Promise<VoteLog[]> {
    return await db
      .select()
      .from(voteLog)
      .where(eq(voteLog.pollId, pollId))
      .orderBy(voteLog.sequenceNumber);
  }

  async getVoteCount(pollId: number): Promise<number> {
    const [result] = await db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(voteLog)
      .where(eq(voteLog.pollId, pollId));
    return result?.count || 0;
  }

  async getLastVote(pollId: number): Promise<VoteLog | undefined> {
    const [vote] = await db
      .select()
      .from(voteLog)
      .where(eq(voteLog.pollId, pollId))
      .orderBy(desc(voteLog.sequenceNumber))
      .limit(1);
    return vote || undefined;
  }

  async getPollResults(pollId: number): Promise<PollResults | undefined> {
    const [results] = await db
      .select()
      .from(pollResults)
      .where(eq(pollResults.pollId, pollId))
      .orderBy(desc(pollResults.createdAt))
      .limit(1);
    return results || undefined;
  }

  async savePollResults(resultsData: { pollId: number; results: Record<string, number>; totalVotes: number; verificationHash: string }): Promise<PollResults> {
    const [results] = await db
      .insert(pollResults)
      .values(resultsData)
      .returning();
    return results;
  }

  async getDashboardStats(): Promise<{
    activePolls: number;
    totalVoters: number;
    verifiedVotes: number;
  }> {
    const now = new Date();
    
    const [activePollsResult] = await db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(polls)
      .where(
        and(
          eq(polls.isActive, true),
          sql`${polls.endDate} > ${now}`
        )
      );

    const [totalVotersResult] = await db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(eligibleVoters);

    const [verifiedVotesResult] = await db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(voteLog);

    return {
      activePolls: activePollsResult?.count || 0,
      totalVoters: totalVotersResult?.count || 0,
      verifiedVotes: verifiedVotesResult?.count || 0,
    };
  }
}

export const storage = new DatabaseStorage();
