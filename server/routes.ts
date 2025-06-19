import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertPollSchema, voteSubmissionSchema, insertEligibleVoterSchema } from "@shared/schema";
import { CryptoService } from "./crypto";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all polls for organizer dashboard
  app.get("/api/polls", async (req, res) => {
    try {
      const polls = await storage.getAllPolls();
      res.json(polls);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch polls" });
    }
  });

  // Get specific poll details
  app.get("/api/polls/:id", async (req, res) => {
    try {
      const pollId = parseInt(req.params.id);
      const poll = await storage.getPoll(pollId);
      
      if (!poll) {
        return res.status(404).json({ message: "Poll not found" });
      }
      
      res.json(poll);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch poll" });
    }
  });

  // Create new poll
  app.post("/api/polls", async (req, res) => {
    try {
      const validatedData = insertPollSchema.parse(req.body);
      
      // Generate cryptographic key pair for this poll
      const { publicKey, privateKey } = CryptoService.generateKeyPair();
      
      const pollData = {
        ...validatedData,
        publicKey,
        privateKey,
        organizerId: 1, // TODO: Get from authentication
      };
      
      const poll = await storage.createPoll(pollData);
      
      // Process eligible voters if provided
      if (req.body.eligibleVoters && Array.isArray(req.body.eligibleVoters)) {
        for (const email of req.body.eligibleVoters) {
          const token = CryptoService.generateToken();
          await storage.addEligibleVoter({
            pollId: poll.id,
            email,
            token,
          });
        }
      }
      
      res.json(poll);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid poll data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create poll" });
    }
  });

  // Get poll for voting (by token)
  app.get("/api/vote/:token", async (req, res) => {
    try {
      const { token } = req.params;
      const voter = await storage.getEligibleVoterByToken(token);
      
      if (!voter) {
        return res.status(404).json({ message: "Invalid voting token" });
      }
      
      if (voter.hasVoted) {
        return res.status(400).json({ message: "Vote already cast" });
      }
      
      const poll = await storage.getPoll(voter.pollId);
      if (!poll) {
        return res.status(404).json({ message: "Poll not found" });
      }
      
      // Check if poll is active
      const now = new Date();
      if (now < new Date(poll.startDate) || now > new Date(poll.endDate)) {
        return res.status(400).json({ message: "Poll is not currently active" });
      }
      
      // Return poll data without private key
      const { privateKey, ...pollData } = poll;
      res.json({ poll: pollData, voter: { email: voter.email } });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch voting data" });
    }
  });

  // Submit vote
  app.post("/api/vote", async (req, res) => {
    try {
      const validatedData = voteSubmissionSchema.parse(req.body);
      const { token, choices } = validatedData;
      
      const voter = await storage.getEligibleVoterByToken(token);
      if (!voter) {
        return res.status(404).json({ message: "Invalid voting token" });
      }
      
      if (voter.hasVoted) {
        return res.status(400).json({ message: "Vote already cast" });
      }
      
      const poll = await storage.getPoll(voter.pollId);
      if (!poll) {
        return res.status(404).json({ message: "Poll not found" });
      }
      
      // Check if poll is active
      const now = new Date();
      if (now < new Date(poll.startDate) || now > new Date(poll.endDate)) {
        return res.status(400).json({ message: "Poll is not currently active" });
      }
      
      // Validate choices against poll options
      const invalidChoices = choices.filter(choice => !poll.options.includes(choice));
      if (invalidChoices.length > 0) {
        return res.status(400).json({ message: "Invalid vote choices" });
      }
      
      // Check multiple choice restriction
      if (!poll.allowMultiple && choices.length > 1) {
        return res.status(400).json({ message: "Multiple choices not allowed for this poll" });
      }
      
      // Get current vote log for hash chain
      const currentVoteCount = await storage.getVoteCount(poll.id);
      const previousVote = currentVoteCount > 0 ? await storage.getLastVote(poll.id) : null;
      
      // Create vote log entry
      const sequenceNumber = currentVoteCount + 1;
      const previousHash = previousVote?.currentHash || null;
      const currentHash = CryptoService.createVoteHash(
        poll.id,
        token,
        choices,
        previousHash,
        sequenceNumber
      );
      
      // Create vote data for signing
      const voteData = {
        pollId: poll.id,
        voterToken: token,
        choices,
        previousHash,
        currentHash,
        sequenceNumber,
        timestamp: new Date().toISOString(),
      };
      
      const signature = CryptoService.signData(JSON.stringify(voteData), poll.privateKey);
      
      // Store vote in log
      await storage.addVoteToLog({
        pollId: poll.id,
        voterToken: token,
        voteChoices: choices,
        previousHash,
        currentHash,
        signature,
        sequenceNumber,
      });
      
      // Mark voter as voted
      await storage.markVoterAsVoted(voter.id);
      
      res.json({ message: "Vote recorded successfully", voteHash: currentHash });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid vote data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to record vote" });
    }
  });

  // Get poll results
  app.get("/api/polls/:id/results", async (req, res) => {
    try {
      const pollId = parseInt(req.params.id);
      const poll = await storage.getPoll(pollId);
      
      if (!poll) {
        return res.status(404).json({ message: "Poll not found" });
      }
      
      // Check if poll has ended
      const now = new Date();
      if (now < new Date(poll.endDate)) {
        return res.status(400).json({ message: "Poll is still active" });
      }
      
      const results = await storage.getPollResults(pollId);
      if (results) {
        return res.json(results);
      }
      
      // Calculate results if not cached
      const voteLog = await storage.getVoteLog(pollId);
      const tallyCounts: Record<string, number> = {};
      
      // Initialize counts
      poll.options.forEach(option => {
        tallyCounts[option] = 0;
      });
      
      // Count votes
      voteLog.forEach(vote => {
        vote.voteChoices.forEach(choice => {
          if (tallyCounts.hasOwnProperty(choice)) {
            tallyCounts[choice]++;
          }
        });
      });
      
      const totalVotes = voteLog.length;
      const verificationHash = CryptoService.hashData(JSON.stringify({
        pollId,
        results: tallyCounts,
        totalVotes,
        timestamp: new Date().toISOString(),
      }));
      
      const newResults = await storage.savePollResults({
        pollId,
        results: tallyCounts,
        totalVotes,
        verificationHash,
      });
      
      res.json(newResults);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch results" });
    }
  });

  // Get vote log for verification
  app.get("/api/polls/:id/log", async (req, res) => {
    try {
      const pollId = parseInt(req.params.id);
      const poll = await storage.getPoll(pollId);
      
      if (!poll) {
        return res.status(404).json({ message: "Poll not found" });
      }
      
      const voteLog = await storage.getVoteLog(pollId);
      
      // Return log without private information
      const publicLog = voteLog.map(vote => ({
        id: vote.id,
        pollId: vote.pollId,
        voteChoices: vote.voteChoices,
        previousHash: vote.previousHash,
        currentHash: vote.currentHash,
        signature: vote.signature,
        timestamp: vote.timestamp,
        sequenceNumber: vote.sequenceNumber,
      }));
      
      res.json({
        log: publicLog,
        publicKey: poll.publicKey,
        pollId: poll.id,
        pollTitle: poll.title,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch vote log" });
    }
  });

  // Verify vote log integrity
  app.post("/api/verify", async (req, res) => {
    try {
      const { log, publicKey } = req.body;
      
      if (!log || !publicKey) {
        return res.status(400).json({ message: "Log and public key required" });
      }
      
      // Verify hash chain integrity
      const chainValid = CryptoService.verifyHashChain(log);
      
      // Verify signatures
      let signaturesValid = true;
      for (const vote of log) {
        const voteData = {
          pollId: vote.pollId,
          voterToken: vote.voterToken || "anonymous",
          choices: vote.voteChoices,
          previousHash: vote.previousHash,
          currentHash: vote.currentHash,
          sequenceNumber: vote.sequenceNumber,
          timestamp: vote.timestamp,
        };
        
        const isValid = CryptoService.verifySignature(
          JSON.stringify(voteData),
          vote.signature,
          publicKey
        );
        
        if (!isValid) {
          signaturesValid = false;
          break;
        }
      }
      
      // Calculate tally
      const tally: Record<string, number> = {};
      log.forEach((vote: any) => {
        vote.voteChoices.forEach((choice: string) => {
          tally[choice] = (tally[choice] || 0) + 1;
        });
      });
      
      res.json({
        chainIntegrityValid: chainValid,
        signaturesValid,
        tally,
        totalVotes: log.length,
        verificationTimestamp: new Date().toISOString(),
      });
    } catch (error) {
      res.status(500).json({ message: "Verification failed" });
    }
  });

  // Get dashboard stats
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
