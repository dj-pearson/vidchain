/**
 * Perceptual Hashing Service
 * Implements multiple perceptual hash algorithms for video duplicate detection
 *
 * Algorithms:
 * - pHash (Perceptual Hash): DCT-based, robust against scaling and compression
 * - dHash (Difference Hash): Gradient-based, fast and effective
 * - aHash (Average Hash): Simple average-based, good for basic matching
 */

import { createCanvas, loadImage, Image } from 'canvas';
import { mkdir, readdir, unlink, rmdir } from 'fs/promises';
import { join } from 'path';
import type {
  PerceptualHashData,
  FrameHash,
  DuplicateCheckResult,
  DuplicateMatch,
} from '../types/metadata.js';
import { extractKeyFrames, extractFFprobeMetadata } from './metadata-extraction.service.js';

// Hash configuration
const HASH_SIZE = 8; // 8x8 = 64 bits
const PHASH_SIZE = 32; // DCT input size
const COLOR_HISTOGRAM_BINS = 64;

// Duplicate detection thresholds
const THRESHOLDS = {
  EXACT_MATCH: 0,
  HIGH_SIMILARITY: 5,
  MEDIUM_SIMILARITY: 10,
  LOW_SIMILARITY: 15,
  BLOCK: 3,
  WARN: 10,
};

/**
 * Compute perceptual hash (pHash) using DCT
 * Most robust against scaling, compression, and minor edits
 */
export async function computePHash(imagePath: string): Promise<string> {
  const image = await loadImage(imagePath);
  const canvas = createCanvas(PHASH_SIZE, PHASH_SIZE);
  const ctx = canvas.getContext('2d');

  // Convert to grayscale and resize
  ctx.drawImage(image, 0, 0, PHASH_SIZE, PHASH_SIZE);
  const imageData = ctx.getImageData(0, 0, PHASH_SIZE, PHASH_SIZE);
  const grayscale = toGrayscale(imageData.data, PHASH_SIZE, PHASH_SIZE);

  // Apply 2D DCT
  const dct = dct2d(grayscale, PHASH_SIZE);

  // Extract low-frequency 8x8 block (excluding DC component)
  const lowFreq: number[] = [];
  for (let y = 0; y < HASH_SIZE; y++) {
    for (let x = 0; x < HASH_SIZE; x++) {
      if (x === 0 && y === 0) continue; // Skip DC component
      lowFreq.push(dct[y * PHASH_SIZE + x]);
    }
  }

  // Compute median
  const sorted = [...lowFreq].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];

  // Generate hash
  let hash = '';
  for (let y = 0; y < HASH_SIZE; y++) {
    for (let x = 0; x < HASH_SIZE; x++) {
      if (x === 0 && y === 0) {
        hash += '0'; // DC component always 0
      } else {
        hash += dct[y * PHASH_SIZE + x] > median ? '1' : '0';
      }
    }
  }

  return binaryToHex(hash);
}

/**
 * Compute difference hash (dHash)
 * Based on gradient direction, fast and effective
 */
export async function computeDHash(imagePath: string): Promise<string> {
  const image = await loadImage(imagePath);
  const canvas = createCanvas(HASH_SIZE + 1, HASH_SIZE);
  const ctx = canvas.getContext('2d');

  // Resize to 9x8 (one extra column for gradient)
  ctx.drawImage(image, 0, 0, HASH_SIZE + 1, HASH_SIZE);
  const imageData = ctx.getImageData(0, 0, HASH_SIZE + 1, HASH_SIZE);
  const grayscale = toGrayscale(imageData.data, HASH_SIZE + 1, HASH_SIZE);

  // Compute horizontal gradient
  let hash = '';
  for (let y = 0; y < HASH_SIZE; y++) {
    for (let x = 0; x < HASH_SIZE; x++) {
      const left = grayscale[y * (HASH_SIZE + 1) + x];
      const right = grayscale[y * (HASH_SIZE + 1) + x + 1];
      hash += left < right ? '1' : '0';
    }
  }

  return binaryToHex(hash);
}

/**
 * Compute average hash (aHash)
 * Simple but effective for basic matching
 */
export async function computeAHash(imagePath: string): Promise<string> {
  const image = await loadImage(imagePath);
  const canvas = createCanvas(HASH_SIZE, HASH_SIZE);
  const ctx = canvas.getContext('2d');

  // Resize to 8x8
  ctx.drawImage(image, 0, 0, HASH_SIZE, HASH_SIZE);
  const imageData = ctx.getImageData(0, 0, HASH_SIZE, HASH_SIZE);
  const grayscale = toGrayscale(imageData.data, HASH_SIZE, HASH_SIZE);

  // Compute average
  const avg = grayscale.reduce((sum, val) => sum + val, 0) / grayscale.length;

  // Generate hash
  let hash = '';
  for (const val of grayscale) {
    hash += val >= avg ? '1' : '0';
  }

  return binaryToHex(hash);
}

/**
 * Compute color histogram for additional matching
 */
export async function computeColorHistogram(imagePath: string): Promise<number[]> {
  const image = await loadImage(imagePath);
  const canvas = createCanvas(64, 64); // Sample at 64x64
  const ctx = canvas.getContext('2d');

  ctx.drawImage(image, 0, 0, 64, 64);
  const imageData = ctx.getImageData(0, 0, 64, 64);
  const data = imageData.data;

  // Initialize histogram bins for RGB channels
  const histogram = new Array(COLOR_HISTOGRAM_BINS * 3).fill(0);
  const binSize = 256 / (COLOR_HISTOGRAM_BINS / 3);

  for (let i = 0; i < data.length; i += 4) {
    const r = Math.floor(data[i] / binSize);
    const g = Math.floor(data[i + 1] / binSize);
    const b = Math.floor(data[i + 2] / binSize);

    histogram[r]++;
    histogram[COLOR_HISTOGRAM_BINS / 3 + g]++;
    histogram[(COLOR_HISTOGRAM_BINS / 3) * 2 + b]++;
  }

  // Normalize
  const total = data.length / 4;
  return histogram.map((v) => v / total);
}

/**
 * Compute all perceptual hashes for a video
 */
export async function computeVideoHashes(
  videoPath: string,
  videoId: string
): Promise<PerceptualHashData> {
  // Create temp directory for frames
  const tempDir = `/tmp/vidchain/phash_${videoId}_${Date.now()}`;
  await mkdir(tempDir, { recursive: true });

  try {
    // Extract key frames
    const frames = await extractKeyFrames(videoPath, tempDir, 5);

    // Compute hashes for each frame
    const frameHashes: FrameHash[] = [];
    const allPHashes: string[] = [];
    const allDHashes: string[] = [];

    for (const frame of frames) {
      const phash = await computePHash(frame.path);
      const dhash = await computeDHash(frame.path);

      frameHashes.push({
        timestamp: frame.timestamp,
        phash,
        dhash,
      });

      allPHashes.push(phash);
      allDHashes.push(dhash);
    }

    // Use median frame for primary hashes (most representative)
    const midIndex = Math.floor(frames.length / 2);
    const primaryFrame = frames[midIndex];

    const phash = await computePHash(primaryFrame.path);
    const dhash = await computeDHash(primaryFrame.path);
    const ahash = await computeAHash(primaryFrame.path);
    const colorHistogram = await computeColorHistogram(primaryFrame.path);

    return {
      phash,
      dhash,
      ahash,
      frameHashes,
      colorHistogram,
    };
  } finally {
    // Cleanup temp files
    try {
      const files = await readdir(tempDir);
      await Promise.all(files.map((f) => unlink(join(tempDir, f))));
      await rmdir(tempDir);
    } catch {
      // Ignore cleanup errors
    }
  }
}

/**
 * Calculate Hamming distance between two hex hashes
 */
export function hammingDistance(hash1: string, hash2: string): number {
  if (hash1.length !== hash2.length) {
    throw new Error('Hash lengths must match');
  }

  let distance = 0;
  const bin1 = hexToBinary(hash1);
  const bin2 = hexToBinary(hash2);

  for (let i = 0; i < bin1.length; i++) {
    if (bin1[i] !== bin2[i]) {
      distance++;
    }
  }

  return distance;
}

/**
 * Calculate similarity score (0-1) from Hamming distance
 */
export function hashSimilarity(hash1: string, hash2: string): number {
  const distance = hammingDistance(hash1, hash2);
  const maxDistance = hash1.length * 4; // Each hex char = 4 bits
  return 1 - distance / maxDistance;
}

/**
 * Check for duplicates against existing videos
 */
export async function checkForDuplicates(
  newHashes: PerceptualHashData,
  sha256Hash: string,
  existingHashes: Array<{
    verificationId: string;
    videoId: string;
    sha256Hash: string;
    phash: string;
    dhash?: string;
    creatorName?: string;
  }>
): Promise<DuplicateCheckResult> {
  const matches: DuplicateMatch[] = [];

  for (const existing of existingHashes) {
    // Check exact SHA-256 match first
    if (existing.sha256Hash === sha256Hash) {
      matches.push({
        verificationId: existing.verificationId,
        videoId: existing.videoId,
        hashType: 'sha256',
        similarity: 1.0,
        distance: 0,
      });
      continue;
    }

    // Check pHash similarity
    const pHashDistance = hammingDistance(newHashes.phash, existing.phash);
    const pHashSimilarity = hashSimilarity(newHashes.phash, existing.phash);

    if (pHashDistance <= THRESHOLDS.LOW_SIMILARITY) {
      matches.push({
        verificationId: existing.verificationId,
        videoId: existing.videoId,
        hashType: 'phash',
        similarity: pHashSimilarity,
        distance: pHashDistance,
      });
    }

    // Check dHash if available
    if (existing.dhash && newHashes.dhash) {
      const dHashDistance = hammingDistance(newHashes.dhash, existing.dhash);
      const dHashSimilarity = hashSimilarity(newHashes.dhash, existing.dhash);

      if (dHashDistance <= THRESHOLDS.LOW_SIMILARITY) {
        matches.push({
          verificationId: existing.verificationId,
          videoId: existing.videoId,
          hashType: 'dhash',
          similarity: dHashSimilarity,
          distance: dHashDistance,
        });
      }
    }
  }

  // Deduplicate matches by verification ID, keeping highest similarity
  const uniqueMatches = new Map<string, DuplicateMatch>();
  for (const match of matches) {
    const existing = uniqueMatches.get(match.verificationId);
    if (!existing || match.similarity > existing.similarity) {
      uniqueMatches.set(match.verificationId, match);
    }
  }

  const finalMatches = Array.from(uniqueMatches.values()).sort(
    (a, b) => b.similarity - a.similarity
  );

  // Determine recommendation
  let recommendation: 'allow' | 'warn' | 'block' = 'allow';
  let confidence = 0;

  if (finalMatches.length > 0) {
    const bestMatch = finalMatches[0];
    confidence = bestMatch.similarity;

    if (bestMatch.hashType === 'sha256') {
      recommendation = 'block';
    } else if (bestMatch.distance !== undefined) {
      if (bestMatch.distance <= THRESHOLDS.BLOCK) {
        recommendation = 'block';
      } else if (bestMatch.distance <= THRESHOLDS.WARN) {
        recommendation = 'warn';
      }
    }
  }

  // Get original video info if duplicate found
  const original = finalMatches[0];
  const originalInfo = existingHashes.find(
    (h) => h.verificationId === original?.verificationId
  );

  return {
    isDuplicate: finalMatches.length > 0 && recommendation !== 'allow',
    confidence,
    originalVerificationId: original?.verificationId,
    originalVideoId: original?.videoId,
    originalCreatorName: originalInfo?.creatorName,
    matches: finalMatches,
    recommendation,
  };
}

/**
 * Compare two videos for similarity
 */
export async function compareVideos(
  video1Path: string,
  video2Path: string
): Promise<{
  similarity: number;
  isSameVideo: boolean;
  details: {
    phashDistance: number;
    dhashDistance: number;
    ahashDistance: number;
    histogramSimilarity: number;
  };
}> {
  const [hashes1, hashes2] = await Promise.all([
    computeVideoHashes(video1Path, 'compare_1'),
    computeVideoHashes(video2Path, 'compare_2'),
  ]);

  const phashDistance = hammingDistance(hashes1.phash, hashes2.phash);
  const dhashDistance = hammingDistance(hashes1.dhash, hashes2.dhash);
  const ahashDistance = hammingDistance(hashes1.ahash, hashes2.ahash);

  // Histogram cosine similarity
  const histogramSimilarity = cosineSimilarity(
    hashes1.colorHistogram,
    hashes2.colorHistogram
  );

  // Weighted average similarity
  const phashSim = hashSimilarity(hashes1.phash, hashes2.phash);
  const dhashSim = hashSimilarity(hashes1.dhash, hashes2.dhash);
  const ahashSim = hashSimilarity(hashes1.ahash, hashes2.ahash);

  const similarity =
    phashSim * 0.4 + dhashSim * 0.3 + ahashSim * 0.1 + histogramSimilarity * 0.2;

  return {
    similarity,
    isSameVideo: phashDistance <= THRESHOLDS.BLOCK,
    details: {
      phashDistance,
      dhashDistance,
      ahashDistance,
      histogramSimilarity,
    },
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Convert RGBA image data to grayscale array
 */
function toGrayscale(data: Uint8ClampedArray, width: number, height: number): number[] {
  const grayscale: number[] = [];

  for (let i = 0; i < data.length; i += 4) {
    // Luminance formula
    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    grayscale.push(gray);
  }

  return grayscale;
}

/**
 * 2D Discrete Cosine Transform
 */
function dct2d(input: number[], size: number): number[] {
  const output = new Array(size * size).fill(0);

  // Pre-compute cosine values
  const cosines: number[][] = [];
  for (let i = 0; i < size; i++) {
    cosines[i] = [];
    for (let j = 0; j < size; j++) {
      cosines[i][j] = Math.cos(((2 * j + 1) * i * Math.PI) / (2 * size));
    }
  }

  // DCT-II
  for (let u = 0; u < size; u++) {
    for (let v = 0; v < size; v++) {
      let sum = 0;
      for (let x = 0; x < size; x++) {
        for (let y = 0; y < size; y++) {
          sum += input[y * size + x] * cosines[u][x] * cosines[v][y];
        }
      }

      const cu = u === 0 ? 1 / Math.sqrt(2) : 1;
      const cv = v === 0 ? 1 / Math.sqrt(2) : 1;
      output[v * size + u] = (2 / size) * cu * cv * sum;
    }
  }

  return output;
}

/**
 * Convert binary string to hex
 */
function binaryToHex(binary: string): string {
  let hex = '';
  for (let i = 0; i < binary.length; i += 4) {
    const chunk = binary.substr(i, 4);
    hex += parseInt(chunk, 2).toString(16);
  }
  return hex;
}

/**
 * Convert hex string to binary
 */
function hexToBinary(hex: string): string {
  let binary = '';
  for (const char of hex) {
    binary += parseInt(char, 16).toString(2).padStart(4, '0');
  }
  return binary;
}

/**
 * Cosine similarity between two vectors
 */
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vector lengths must match');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}
