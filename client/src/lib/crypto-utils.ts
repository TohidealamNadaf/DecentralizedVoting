import CryptoJS from 'crypto-js';

export class ClientCrypto {
  static hashData(data: string): string {
    return CryptoJS.SHA256(data).toString();
  }

  static verifyHashChain(voteLog: any[]): boolean {
    if (voteLog.length === 0) return true;
    
    // Sort by sequence number
    const sortedLog = voteLog.sort((a, b) => a.sequenceNumber - b.sequenceNumber);
    
    for (let i = 0; i < sortedLog.length; i++) {
      const currentVote = sortedLog[i];
      const expectedPreviousHash = i === 0 ? null : sortedLog[i - 1].currentHash;
      
      if (currentVote.previousHash !== expectedPreviousHash) {
        return false;
      }
      
      // Verify current hash
      const voteData = {
        pollId: currentVote.pollId,
        voterToken: currentVote.voterToken || "anonymous",
        choices: currentVote.voteChoices,
        previousHash: currentVote.previousHash,
        sequenceNumber: currentVote.sequenceNumber,
      };
      
      const expectedHash = this.hashData(JSON.stringify(voteData));
      if (currentVote.currentHash !== expectedHash) {
        return false;
      }
    }
    
    return true;
  }

  static calculateTally(voteLog: any[]): Record<string, number> {
    const tally: Record<string, number> = {};
    
    voteLog.forEach(vote => {
      vote.voteChoices.forEach((choice: string) => {
        tally[choice] = (tally[choice] || 0) + 1;
      });
    });
    
    return tally;
  }
}
