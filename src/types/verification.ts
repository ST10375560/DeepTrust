export interface VerificationRequest {
  content: File;
  contentType: "image" | "video" | "audio";
  timestamp: string;
}

export interface AIAnalysis {
  visual: number;
  temporal: number;
  audio: number;
  metadata: number;
}

export interface TrustScore {
  score: number;
  confidence: number;
  factors: AIAnalysis;
}

export interface BlockchainProof {
  hash: string;
  txId: string;
  timestamp: string;
  blockNumber: number;
  network: string;
}

export interface VerificationResult {
  id: string;
  trustScore: TrustScore;
  status: "verified" | "suspicious" | "fake";
  blockchainProof: BlockchainProof;
  analysis: AIAnalysis;
  createdAt: string;
}

export interface SmartContractScaffold {
  contractAddress: string;
  abi: any[];
  methods: {
    storeVerification: (hash: string, score: number) => Promise<string>;
    getVerification: (id: string) => Promise<VerificationResult>;
    updateVerification: (id: string, data: Partial<VerificationResult>) => Promise<boolean>;
  };
}
