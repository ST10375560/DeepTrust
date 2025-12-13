/**
 * AI Detection Service for DeepTrust
 * Handles deepfake/AI-generated content detection using HuggingFace models
 */

import { HfInference } from '@huggingface/inference';

// Configuration
const CONFIG = {
  // Primary model for AI-generated image detection
  primaryModel: 'umm-maybe/AI-image-detector',
  // Fallback model if primary fails
  fallbackModel: 'Organika/sdxl-detector',
  // Maximum retries for API calls
  maxRetries: 3,
  // Delay between retries (ms)
  retryDelay: 1000,
  // Request timeout (ms)
  timeout: 30000,
};

// Initialize HuggingFace client
let hfClient = null;

/**
 * Initialize the HuggingFace client
 * @returns {HfInference|null}
 */
function getClient() {
  if (!hfClient) {
    const apiKey = process.env.HUGGINGFACE_API_KEY;
    if (!apiKey) {
      console.warn('⚠️ [AI] HUGGINGFACE_API_KEY not set - AI detection will use mock results');
      return null;
    }
    hfClient = new HfInference(apiKey);
    console.log('✅ [AI] HuggingFace client initialized');
  }
  return hfClient;
}

/**
 * Sleep utility for retry delays
 * @param {number} ms - Milliseconds to sleep
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Call HuggingFace image classification with retry logic
 * @param {Buffer} imageBuffer - Image data as buffer
 * @param {string} model - Model ID to use
 * @param {number} attempt - Current attempt number
 * @returns {Promise<Array>} Classification results
 */
async function classifyWithRetry(imageBuffer, model, attempt = 1) {
  const client = getClient();
  if (!client) {
    throw new Error('HuggingFace client not initialized');
  }

  try {
    console.log(`🤖 [AI] Calling model ${model} (attempt ${attempt}/${CONFIG.maxRetries})`);
    
    const result = await client.imageClassification({
      model,
      data: imageBuffer,
    });

    return result;
  } catch (error) {
    console.error(`❌ [AI] Model ${model} failed:`, error.message);

    // Check if we should retry
    if (attempt < CONFIG.maxRetries) {
      // Retry on rate limits or temporary errors
      if (error.message.includes('rate') || error.message.includes('503') || error.message.includes('timeout')) {
        console.log(`⏳ [AI] Retrying in ${CONFIG.retryDelay}ms...`);
        await sleep(CONFIG.retryDelay * attempt); // Exponential backoff
        return classifyWithRetry(imageBuffer, model, attempt + 1);
      }
    }

    throw error;
  }
}

/**
 * Parse classification results into standardized format
 * @param {Array} results - Raw classification results from HuggingFace
 * @param {string} modelUsed - Model ID that was used
 * @returns {Object} Parsed analysis result
 */
function parseClassificationResults(results, modelUsed) {
  // Results are typically [{label: "artificial", score: 0.95}, {label: "human", score: 0.05}]
  // or [{label: "AI", score: 0.8}, {label: "Real", score: 0.2}]
  
  let aiScore = 0;
  let realScore = 0;

  for (const result of results) {
    const label = result.label.toLowerCase();
    const score = result.score;

    // Match various label formats
    if (label.includes('artificial') || label.includes('ai') || label.includes('fake') || label.includes('generated')) {
      aiScore = Math.max(aiScore, score);
    } else if (label.includes('human') || label.includes('real') || label.includes('authentic') || label.includes('natural')) {
      realScore = Math.max(realScore, score);
    }
  }

  // Normalize scores if they don't add up properly
  const total = aiScore + realScore;
  if (total > 0 && Math.abs(total - 1) > 0.01) {
    aiScore = aiScore / total;
    realScore = realScore / total;
  }

  // If we only got one score, infer the other
  if (aiScore > 0 && realScore === 0) {
    realScore = 1 - aiScore;
  } else if (realScore > 0 && aiScore === 0) {
    aiScore = 1 - realScore;
  }

  return {
    aiProbability: Math.round(aiScore * 100) / 100,
    realProbability: Math.round(realScore * 100) / 100,
    modelUsed,
    rawResults: results,
  };
}

/**
 * Calculate TrustScore from AI analysis
 * Higher score = more likely to be authentic/real
 * @param {Object} analysis - Parsed analysis results
 * @returns {Object} TrustScore object
 */
function calculateTrustScore(analysis) {
  // TrustScore is based on realProbability (higher = more trustworthy)
  const trustScore = Math.round(analysis.realProbability * 100);
  
  // Confidence is based on how decisive the result is
  // If scores are close to 50/50, confidence is low
  const scoreDifference = Math.abs(analysis.aiProbability - analysis.realProbability);
  const confidence = Math.round(50 + (scoreDifference * 50));

  return {
    score: trustScore,
    confidence,
    isAIGenerated: analysis.aiProbability > 0.5,
  };
}

/**
 * Determine verification status from trust score
 * @param {number} trustScore - Score from 0-100
 * @returns {string} Status: 'verified', 'suspicious', or 'fake'
 */
function determineStatus(trustScore) {
  if (trustScore >= 80) return 'verified';
  if (trustScore >= 50) return 'suspicious';
  return 'fake';
}

/**
 * Analyze an image for AI-generated content
 * @param {Buffer} imageBuffer - Image data as buffer
 * @returns {Promise<Object>} Analysis result with trustScore, confidence, and detailed analysis
 */
async function analyzeImage(imageBuffer) {
  const client = getClient();

  // If no API key, return mock results
  if (!client) {
    console.log('⚠️ [AI] Using mock analysis (no API key configured)');
    return generateMockAnalysis();
  }

  let results = null;
  let modelUsed = CONFIG.primaryModel;

  // Try primary model first
  try {
    results = await classifyWithRetry(imageBuffer, CONFIG.primaryModel);
  } catch (primaryError) {
    console.warn(`⚠️ [AI] Primary model failed, trying fallback: ${primaryError.message}`);

    // Try fallback model
    try {
      modelUsed = CONFIG.fallbackModel;
      results = await classifyWithRetry(imageBuffer, CONFIG.fallbackModel);
    } catch (fallbackError) {
      console.error(`❌ [AI] All models failed: ${fallbackError.message}`);
      
      // Return mock results as last resort
      console.log('⚠️ [AI] Falling back to mock analysis');
      return generateMockAnalysis('fallback-mock');
    }
  }

  // Parse results
  const analysis = parseClassificationResults(results, modelUsed);
  const trustScore = calculateTrustScore(analysis);
  const status = determineStatus(trustScore.score);

  console.log(`✅ [AI] Analysis complete: trustScore=${trustScore.score}, isAI=${trustScore.isAIGenerated}`);

  return {
    trustScore: trustScore.score,
    confidence: trustScore.confidence,
    isAIGenerated: trustScore.isAIGenerated,
    status,
    analysis: {
      aiProbability: analysis.aiProbability,
      realProbability: analysis.realProbability,
      modelUsed: analysis.modelUsed,
    },
    timestamp: new Date().toISOString(),
  };
}

/**
 * Generate mock analysis results for testing/fallback
 * @param {string} reason - Reason for using mock
 * @returns {Object} Mock analysis result
 */
function generateMockAnalysis(reason = 'no-api-key') {
  // Generate somewhat realistic mock scores
  const aiProbability = Math.random() * 0.4; // Bias toward real (0-40% AI probability)
  const realProbability = 1 - aiProbability;
  const trustScore = Math.round(realProbability * 100);
  const confidence = Math.round(50 + (Math.abs(aiProbability - realProbability) * 50));

  return {
    trustScore,
    confidence,
    isAIGenerated: aiProbability > 0.5,
    status: determineStatus(trustScore),
    analysis: {
      aiProbability: Math.round(aiProbability * 100) / 100,
      realProbability: Math.round(realProbability * 100) / 100,
      modelUsed: `mock-${reason}`,
    },
    timestamp: new Date().toISOString(),
    isMock: true,
  };
}

/**
 * Check if AI service is properly configured
 * @returns {boolean}
 */
function isConfigured() {
  return !!process.env.HUGGINGFACE_API_KEY;
}

// Export functions
export {
  analyzeImage,
  generateMockAnalysis,
  isConfigured,
  CONFIG as AI_CONFIG,
};


