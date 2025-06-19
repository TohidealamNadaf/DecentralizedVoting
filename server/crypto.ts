import crypto from 'crypto';

export class CryptoService {
  static generateKeyPair(): { publicKey: string; privateKey: string } {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('ec', {
      namedCurve: 'secp256k1',
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });
    
    return { publicKey, privateKey };
  }

  static hashData(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  static signData(data: string, privateKey: string): string {
    const sign = crypto.createSign('SHA256');
    sign.update(data);
    return sign.sign(privateKey, 'base64');
  }

  static verifySignature(data: string, signature: string, publicKey: string): boolean {
    try {
      const verify = crypto.createVerify('SHA256');
      verify.update(data);
      return verify.verify(publicKey, signature, 'base64');
    } catch (error) {
      return false;
    }
  }

  static generateToken(): string {
    return crypto.randomUUID();
  }

  static createVoteHash(pollId: number, voterToken: string, choices: string[], previousHash: string | null, sequenceNumber: number): string {
    const voteData = {
      pollId,
      voterToken,
      choices: choices.sort(), // Sort for consistency
      previousHash,
      sequenceNumber,
      timestamp: new Date().toISOString(),
    };
    
    return this.hashData(JSON.stringify(voteData));
  }

  static createChainHash(currentVoteData: any, previousHash: string | null): string {
    const chainData = {
      ...currentVoteData,
      previousHash,
    };
    
    return this.hashData(JSON.stringify(chainData));
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
        voterToken: currentVote.voterToken,
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
}
