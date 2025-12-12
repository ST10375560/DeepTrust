/**
 * AI Service for DeepTrust
 * Handles deepfake detection using HuggingFace Inference API
 */

import { HfInference } from '@huggingface/inference';

// Initialize HuggingFace client
const hf = process.env.HUGGINGFACE_API_KEY
  ? new HfInference(process.env.HUGGINGFACE_API_KEY)
  : null;

// AI Models for different content types
const MODELS = {
  image: {
    primary: 'umm-maybe/AI-image-detector',
    fallback: 'Organika/sdxl-detector',
  },
  // Future: video, audio models
};

// Configuration
const CONFIG = {
  // Timeout for AI requests (30 seconds)
  timeout: 30000,
  // Retry attempts for failed requests
  maxRetries: 2,
  // Confidence threshold for classification
  confidenceThreshold: 0.7,
};

/**
 * Sleep utility for retry delays
 * @param {number} ms - Milliseconds to sleep
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Analyze image for AI-generated content
 * @param {Buffer} imageBuffer - Image file buffer
 * @param {object} options - Analysis options
 * @param {boolean} options.useFallback - Whether to use fallback model if primary fails
 * @returns {Promise<object>} Analysis result
 */
async function analyzeImage(imageBuffer, options = { useFallback: true }) {
  if (!hf) {
    throw new Error('HuggingFace API key not configured');
  }

  const errors = [];
  let result = null;

  // Try primary model first
  try {
    console.log('🤖 [AI] Analyzing image with primary model...');
    result = await analyzeWithModel(MODELS.image.primary, imageBuffer);
  } catch (error) {
    console.warn(`⚠️ [AI] Primary model failed: ${error.message}`);
    errors.push({ model: MODELS.image.primary, error: error.message });
  }

  // Try fallback model if primary failed and fallback is enabled
  if (!result && options.useFallback) {
    try {
      console.log('🤖 [AI] Trying fallback model...');
      result = await analyzeWithModel(MODELS.image.fallback, imageBuffer);
    } catch (error) {
      console.error(`❌ [AI] Fallback model failed: ${error.message}`);
      errors.push({ model: MODELS.image.fallback, error: error.message });
    }
  }

  if (!result) {
    throw new Error(`All AI models failed: ${errors.map(e => `${e.model}: ${e.error}`).join(', ')}`);
  }

  return result;
}

/**
 * Analyze image with a specific HuggingFace model
 * @param {string} modelId - HuggingFace model ID
 * @param {Buffer} imageBuffer - Image buffer
 * @returns {Promise<object>} Parsed analysis result
 */
async function analyzeWithModel(modelId, imageBuffer) {
  // Convert buffer to base64 for API
  const base64Image = imageBuffer.toString('base64');
  const dataUrl = `data:image/jpeg;base64,${base64Image}`;

  // Call HuggingFace Inference API with timeout
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('AI request timeout')), CONFIG.timeout);
  });

  const analysisPromise = hf.imageClassification({
    model: modelId,
    data: dataUrl,
  });

  const response = await Promise.race([analysisPromise, timeoutPromise]);

  // Parse response based on model
  if (modelId === 'umm-maybe/AI-image-detector') {
    return parseUMMModelResponse(response);
  } else if (modelId === 'Organika/sdxl-detector') {
    return parseOrganikaModelResponse(response);
  } else {
    throw new Error(`Unsupported model: ${modelId}`);
  }
}

/**
 * Parse response from umm-maybe/AI-image-detector
 * @param {Array} response - HuggingFace API response
 * @returns {object} Standardized analysis result
 */
function parseUMMModelResponse(response) {
  // Find AI-generated and Real probabilities
  const aiScore = response.find(item => item.label.toLowerCase().includes('ai'))?.score || 0;
  const realScore = response.find(item => item.label.toLowerCase().includes('real'))?.score || 0;

  // Normalize scores (they should add up to ~1.0)
  const totalScore = aiScore + realScore;
  const normalizedAiScore = totalScore > 0 ? aiScore / totalScore : 0.5;
  const normalizedRealScore = totalScore > 0 ? realScore / totalScore : 0.5;

  return {
    trustScore: Math.round(normalizedRealScore * 100), // 0-100 scale
    confidence: Math.max(normalizedAiScore, normalizedRealScore), // Higher is more confident
    isAIGenerated: normalizedAiScore > normalizedRealScore,
    analysis: {
      aiProbability: normalizedAiScore,
      realProbability: normalizedRealScore,
      modelUsed: 'umm-maybe/AI-image-detector',
      rawResponse: response,
    },
  };
}

/**
 * Parse response from Organika/sdxl-detector
 * @param {Array} response - HuggingFace API response
 * @returns {object} Standardized analysis result
 */
function parseOrganikaModelResponse(response) {
  // This model might have different label structure
  // Adapt based on actual response format when testing
  const aiScore = response.find(item => item.label.toLowerCase().includes('ai') || item.label.toLowerCase().includes('fake'))?.score || 0;
  const realScore = response.find(item => item.label.toLowerCase().includes('real') || item.label.toLowerCase().includes('authentic'))?.score || 0;

  const totalScore = aiScore + realScore;
  const normalizedAiScore = totalScore > 0 ? aiScore / totalScore : 0.5;
  const normalizedRealScore = totalScore > 0 ? realScore / totalScore : 0.5;

  return {
    trustScore: Math.round(normalizedRealScore * 100),
    confidence: Math.max(normalizedAiScore, normalizedRealScore),
    isAIGenerated: normalizedAiScore > normalizedRealScore,
    analysis: {
      aiProbability: normalizedAiScore,
      realProbability: normalizedRealScore,
      modelUsed: 'Organika/sdxl-detector',
      rawResponse: response,
    },
  };
}

/**
 * Calculate TrustScore from analysis result
 * @param {object} analysis - AI analysis result
 * @returns {object} TrustScore object
 */
function calculateTrustScore(analysis) {
  const { trustScore, confidence, isAIGenerated } = analysis;

  // Adjust score based on confidence
  let adjustedScore = trustScore;
  if (confidence < CONFIG.confidenceThreshold) {
    // Low confidence - reduce score towards neutral
    const adjustment = (CONFIG.confidenceThreshold - confidence) * 0.5;
    adjustedScore = trustScore * (1 - adjustment) + 50 * adjustment;
  }

  return {
    score: Math.round(Math.max(0, Math.min(100, adjustedScore))),
    confidence: Math.round(confidence * 100),
    factors: {
      aiProbability: analysis.analysis.aiProbability,
      realProbability: analysis.analysis.realProbability,
      modelConfidence: confidence,
    },
  };
}

/**
 * Full verification pipeline: analyze content and calculate trust score
 * @param {Buffer} contentBuffer - Content buffer
 * @param {string} contentType - 'image', 'video', or 'audio'
 * @returns {Promise<object>} Complete analysis result
 */
async function verifyContent(contentBuffer, contentType) {
  try {
    console.log(`🔍 [AI] Starting ${contentType} verification...`);

    let analysis;
    if (contentType === 'image') {
      analysis = await analyzeImage(contentBuffer);
    } else {
      throw new Error(`Content type '${contentType}' not yet supported`);
    }

    const trustScore = calculateTrustScore(analysis);

    console.log(`✅ [AI] Verification complete: score=${trustScore.score}, confidence=${trustScore.confidence}%`);

    return {
      success: true,
      trustScore,
      analysis: analysis.analysis,
      timestamp: new Date().toISOString(),
    };

  } catch (error) {
    console.error(`❌ [AI] Verification failed: ${error.message}`);

    // Return fallback result for demo stability
    return {
      success: false,
      error: error.message,
      trustScore: {
        score: 50, // Neutral score
        confidence: 0,
        factors: {
          aiProbability: 0.5,
          realProbability: 0.5,
          modelConfidence: 0,
        },
      },
      analysis: {
        modelUsed: 'none',
        error: error.message,
      },
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Check if AI service is properly configured
 * @returns {boolean} True if service is ready
 */
function isConfigured() {
  return !!hf;
}

/**
 * Get service status information
 * @returns {object} Service status
 */
function getStatus() {
  return {
    configured: isConfigured(),
    models: {
      image: MODELS.image,
    },
    config: {
      timeout: CONFIG.timeout,
      maxRetries: CONFIG.maxRetries,
      confidenceThreshold: CONFIG.confidenceThreshold,
    },
  };
}

// Export functions
export {
  analyzeImage,
  verifyContent,
  calculateTrustScore,
  isConfigured,
  getStatus,
  CONFIG as AI_CONFIG,
};


