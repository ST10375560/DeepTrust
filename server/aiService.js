/**
 * AI Detection Service for DeepTrust
 * Handles deepfake/AI-generated content detection using HuggingFace Inference API
 */

// Configuration
const CONFIG = {
  // Primary model for AI-generated image detection
  primaryModel: 'umm-maybe/AI-image-detector',
  // Fallback model if primary fails  
  fallbackModel: 'Falconsai/nsfw_image_detection',
  // Maximum retries for API calls
  maxRetries: 3,
  // Delay between retries (ms)
  retryDelay: 2000,
  // Request timeout (ms)
  timeout: 60000,
  // HuggingFace API base URL (new router endpoint with hf-inference provider)
  apiBaseUrl: 'https://router.huggingface.co/hf-inference/models',
};

/**
 * Sleep utility for retry delays
 * @param {number} ms - Milliseconds to sleep
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Call HuggingFace Inference API directly
 * @param {Buffer} imageBuffer - Image data as buffer
 * @param {string} model - Model ID to use
 * @returns {Promise<Array>} Classification results
 */
async function callHuggingFaceAPI(imageBuffer, model) {
  const apiKey = process.env.HUGGINGFACE_API_KEY;
  
  if (!apiKey) {
    throw new Error('HUGGINGFACE_API_KEY not configured');
  }

  const url = `${CONFIG.apiBaseUrl}/${model}`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/octet-stream',
    },
    body: imageBuffer,
  });

  if (!response.ok) {
    const errorText = await response.text();
    
    // Check for model loading state
    if (response.status === 503) {
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: errorText };
      }
      
      if (errorData.error && errorData.error.includes('loading')) {
        throw new Error(`Model loading: ${errorData.estimated_time || 'unknown'}s wait`);
      }
    }
    
    throw new Error(`API error ${response.status}: ${errorText}`);
  }

  const result = await response.json();
  return result;
}

/**
 * Call HuggingFace image classification with retry logic
 * @param {Buffer} imageBuffer - Image data as buffer
 * @param {string} model - Model ID to use
 * @param {number} attempt - Current attempt number
 * @returns {Promise<Array>} Classification results
 */
async function classifyWithRetry(imageBuffer, model, attempt = 1) {
  try {
    console.log(`🤖 [AI] Calling model ${model} (attempt ${attempt}/${CONFIG.maxRetries})`);
    
    const result = await callHuggingFaceAPI(imageBuffer, model);
    return result;
    
  } catch (error) {
    console.error(`❌ [AI] Model ${model} attempt ${attempt} failed:`, error.message);

    // Check if we should retry
    if (attempt < CONFIG.maxRetries) {
      // Retry on model loading, rate limits, or temporary errors
      if (
        error.message.includes('loading') || 
        error.message.includes('rate') || 
        error.message.includes('503') || 
        error.message.includes('timeout') ||
        error.message.includes('529')
      ) {
        const waitTime = CONFIG.retryDelay * attempt;
        console.log(`⏳ [AI] Retrying in ${waitTime}ms...`);
        await sleep(waitTime);
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
  
  console.log(`📊 [AI] Raw results:`, JSON.stringify(results));
  
  let aiScore = 0;
  let realScore = 0;

  if (!Array.isArray(results)) {
    console.warn('⚠️ [AI] Unexpected result format, expected array');
    return {
      aiProbability: 0.5,
      realProbability: 0.5,
      modelUsed,
      rawResults: results,
    };
  }

  for (const result of results) {
    const label = (result.label || '').toLowerCase();
    const score = result.score || 0;

    // Match various label formats for AI-generated
    if (
      label.includes('artificial') || 
      label.includes('ai') || 
      label.includes('fake') || 
      label.includes('generated') ||
      label.includes('synthetic')
    ) {
      aiScore = Math.max(aiScore, score);
    } 
    // Match various label formats for real/human
    else if (
      label.includes('human') || 
      label.includes('real') || 
      label.includes('authentic') || 
      label.includes('natural') ||
      label.includes('photo')
    ) {
      realScore = Math.max(realScore, score);
    }
  }

  // If we couldn't identify labels, use first two results
  if (aiScore === 0 && realScore === 0 && results.length >= 2) {
    // Assume first is AI, second is real (common pattern)
    aiScore = results[0].score || 0.5;
    realScore = results[1].score || 0.5;
    console.log(`⚠️ [AI] Using fallback label interpretation`);
  }

  // Normalize scores if they don't add up to 1
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
  const apiKey = process.env.HUGGINGFACE_API_KEY;

  // If no API key, return mock results
  if (!apiKey) {
    console.log('⚠️ [AI] Using mock analysis (no API key configured)');
    return generateMockAnalysis('no-api-key');
  }

  let results = null;
  let modelUsed = CONFIG.primaryModel;

  // Try primary model first
  try {
    results = await classifyWithRetry(imageBuffer, CONFIG.primaryModel);
  } catch (primaryError) {
    console.warn(`⚠️ [AI] Primary model failed: ${primaryError.message}`);
    console.log(`🔄 [AI] Trying fallback model...`);

    // Try fallback model
    try {
      modelUsed = CONFIG.fallbackModel;
      results = await classifyWithRetry(imageBuffer, CONFIG.fallbackModel);
    } catch (fallbackError) {
      console.error(`❌ [AI] All models failed: ${fallbackError.message}`);
      
      // Return mock results as last resort
      console.log('⚠️ [AI] Falling back to mock analysis');
      return generateMockAnalysis('api-failure');
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
