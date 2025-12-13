/**
 * DeepTrust API Client
 * Connects frontend to the DeepTrust backend server
 */

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Types
export interface VerificationResult {
  success: boolean;
  id: string;
  contentHash: string;
  originalFilename: string;
  fileType: string;
  fileSize: number;
  trustScore: number;
  confidence: number;
  isAIGenerated: boolean;
  status: 'verified' | 'suspicious' | 'fake';
  analysis: {
    aiProbability: number;
    realProbability: number;
    modelUsed: string;
  };
  metadataCid: string;
  metadataUrl?: string;
  blockchainProof: {
    txHash: string;
    blockNumber: number;
    verificationId?: number;
    isMock: boolean;
    explorerUrl?: string | null;
  };
  timestamp: string;
}

export interface HealthStatus {
  status: string;
  timestamp: string;
  services: {
    server: boolean;
    blockchain: {
      configured: boolean;
      healthy: boolean;
    };
    ai: {
      configured: boolean;
    };
    ipfs: {
      configured: boolean;
    };
  };
}

export interface UploadResult {
  success: boolean;
  contentHash: string;
  fileType: {
    mime: string;
    ext: string;
  };
  originalName: string;
  size: number;
}

export interface HistoryResponse {
  count: number;
  returned: number;
  verifications: VerificationResult[];
}

export interface ApiError {
  success: false;
  error: string;
  step?: string;
}

/**
 * DeepTrust API Client Class
 */
class DeepTrustAPIClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Verify a file - the main verification endpoint
   * @param file - File to verify
   * @param onProgress - Optional progress callback
   */
  async verifyFile(
    file: File,
    onProgress?: (stage: string, progress: number) => void
  ): Promise<VerificationResult> {
    onProgress?.('uploading', 10);

    const formData = new FormData();
    formData.append('file', file);

    try {
      onProgress?.('processing', 30);

      const response = await fetch(`${this.baseUrl}/api/verify`, {
        method: 'POST',
        body: formData,
      });

      onProgress?.('analyzing', 60);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Verification failed');
      }

      onProgress?.('complete', 100);

      return data as VerificationResult;
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Cannot connect to server. Please ensure the backend is running.');
      }
      throw error;
    }
  }

  /**
   * Upload a file for testing (without full verification)
   */
  async uploadFile(file: File): Promise<UploadResult> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${this.baseUrl}/api/upload`, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Upload failed');
    }

    return data as UploadResult;
  }

  /**
   * Look up a verification by content hash
   */
  async getVerification(contentHash: string): Promise<VerificationResult | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/verify/${contentHash}`);

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error('Lookup failed');
      }

      return await response.json();
    } catch {
      return null;
    }
  }

  /**
   * Get verification history
   */
  async getHistory(limit: number = 50): Promise<HistoryResponse> {
    const response = await fetch(`${this.baseUrl}/api/history?limit=${limit}`);

    if (!response.ok) {
      throw new Error('Failed to fetch history');
    }

    return await response.json();
  }

  /**
   * Check server health
   */
  async checkHealth(): Promise<HealthStatus> {
    const response = await fetch(`${this.baseUrl}/api/health`);

    if (!response.ok) {
      throw new Error('Health check failed');
    }

    return await response.json();
  }

  /**
   * Check if server is reachable
   */
  async isServerOnline(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const api = new DeepTrustAPIClient();

// Export class for custom instances
export { DeepTrustAPIClient };


