/**
 * File Service for DeepTrust
 * Handles file validation, hashing, and temporary storage management
 */

import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { fileTypeFromBuffer } from 'file-type';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const CONFIG = {
  maxFileSize: 50 * 1024 * 1024, // 50MB
  uploadDir: path.join(__dirname, '../uploads'),
  allowedMimeTypes: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'video/mp4',
    'video/webm',
    'audio/mpeg',
    'audio/wav',
    'audio/mp3',
  ],
  // Cleanup files older than this (in milliseconds)
  cleanupAge: 60 * 60 * 1000, // 1 hour
};

/**
 * Ensure the uploads directory exists
 */
async function ensureUploadDir() {
  try {
    await fs.access(CONFIG.uploadDir);
  } catch {
    await fs.mkdir(CONFIG.uploadDir, { recursive: true });
    console.log('📁 [FILE] Created uploads directory');
  }
}

/**
 * Validate file by checking MIME type and magic bytes
 * @param {Buffer} buffer - File buffer
 * @param {string} originalMimeType - MIME type from upload header
 * @returns {Promise<{valid: boolean, detectedType: object|null, error: string|null}>}
 */
async function validateFile(buffer, originalMimeType) {
  // Check file size
  if (buffer.length > CONFIG.maxFileSize) {
    return {
      valid: false,
      detectedType: null,
      error: `File too large. Maximum size is ${CONFIG.maxFileSize / (1024 * 1024)}MB`,
    };
  }

  // Check magic bytes to detect actual file type
  const detectedType = await fileTypeFromBuffer(buffer);
  
  if (!detectedType) {
    return {
      valid: false,
      detectedType: null,
      error: 'Could not determine file type from content',
    };
  }

  // Verify the detected MIME type is allowed
  if (!CONFIG.allowedMimeTypes.includes(detectedType.mime)) {
    return {
      valid: false,
      detectedType,
      error: `File type '${detectedType.mime}' is not allowed. Supported types: ${CONFIG.allowedMimeTypes.join(', ')}`,
    };
  }

  // Optional: warn if declared MIME doesn't match detected
  if (originalMimeType && originalMimeType !== detectedType.mime) {
    console.warn(`⚠️ [FILE] MIME mismatch: declared=${originalMimeType}, detected=${detectedType.mime}`);
  }

  return {
    valid: true,
    detectedType,
    error: null,
  };
}

/**
 * Generate SHA-256 hash of file content
 * @param {Buffer} buffer - File buffer
 * @returns {string} Hex-encoded SHA-256 hash
 */
function hashContent(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

/**
 * Save file to temporary storage
 * @param {Buffer} buffer - File buffer
 * @param {string} contentHash - SHA-256 hash of content
 * @param {string} extension - File extension
 * @returns {Promise<string>} Path to saved file
 */
async function saveTemporaryFile(buffer, contentHash, extension) {
  await ensureUploadDir();
  
  const filename = `${contentHash}_${Date.now()}.${extension}`;
  const filepath = path.join(CONFIG.uploadDir, filename);
  
  await fs.writeFile(filepath, buffer);
  console.log(`📁 [FILE] Saved temporary file: ${filename}`);
  
  return filepath;
}

/**
 * Delete a temporary file
 * @param {string} filepath - Path to file
 */
async function deleteTemporaryFile(filepath) {
  try {
    await fs.unlink(filepath);
    console.log(`🗑️ [FILE] Deleted temporary file: ${path.basename(filepath)}`);
  } catch (error) {
    console.warn(`⚠️ [FILE] Could not delete file: ${error.message}`);
  }
}

/**
 * Clean up old temporary files
 * @returns {Promise<number>} Number of files cleaned up
 */
async function cleanupOldFiles() {
  try {
    await ensureUploadDir();
    const files = await fs.readdir(CONFIG.uploadDir);
    const now = Date.now();
    let cleaned = 0;

    for (const file of files) {
      const filepath = path.join(CONFIG.uploadDir, file);
      const stats = await fs.stat(filepath);
      const age = now - stats.mtimeMs;

      if (age > CONFIG.cleanupAge) {
        await fs.unlink(filepath);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`🧹 [FILE] Cleaned up ${cleaned} old file(s)`);
    }

    return cleaned;
  } catch (error) {
    console.error(`❌ [FILE] Cleanup error: ${error.message}`);
    return 0;
  }
}

/**
 * Process an uploaded file - validate, hash, and optionally save
 * @param {Buffer} buffer - File buffer
 * @param {string} originalMimeType - MIME type from upload
 * @param {object} options - Processing options
 * @param {boolean} options.saveFile - Whether to save the file temporarily
 * @returns {Promise<{success: boolean, contentHash: string|null, filePath: string|null, fileType: object|null, error: string|null}>}
 */
async function processUploadedFile(buffer, originalMimeType, options = { saveFile: true }) {
  // Validate file
  const validation = await validateFile(buffer, originalMimeType);
  
  if (!validation.valid) {
    return {
      success: false,
      contentHash: null,
      filePath: null,
      fileType: null,
      error: validation.error,
    };
  }

  // Generate content hash
  const contentHash = hashContent(buffer);

  // Optionally save file
  let filePath = null;
  if (options.saveFile) {
    filePath = await saveTemporaryFile(buffer, contentHash, validation.detectedType.ext);
  }

  return {
    success: true,
    contentHash,
    filePath,
    fileType: validation.detectedType,
    error: null,
  };
}

/**
 * Read a file and return its buffer
 * @param {string} filepath - Path to file
 * @returns {Promise<Buffer>}
 */
async function readFileBuffer(filepath) {
  return await fs.readFile(filepath);
}

// Start periodic cleanup (every 30 minutes)
setInterval(cleanupOldFiles, 30 * 60 * 1000);

// Export functions
export {
  validateFile,
  hashContent,
  saveTemporaryFile,
  deleteTemporaryFile,
  cleanupOldFiles,
  processUploadedFile,
  readFileBuffer,
  ensureUploadDir,
  CONFIG as FILE_CONFIG,
};
