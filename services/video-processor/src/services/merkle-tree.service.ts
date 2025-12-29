/**
 * Merkle Tree Service
 * Generates frame-level Merkle trees for forensic-grade video verification
 *
 * This allows proving specific frames haven't been tampered with without
 * downloading and verifying the entire video.
 */

import { createHash } from 'crypto';
import { mkdir, readdir, unlink, rmdir } from 'fs/promises';
import { join } from 'path';
import ffmpeg from 'fluent-ffmpeg';

export interface MerkleNode {
  level: number;
  index: number;
  hash: string;
  frameNumber?: number;
  frameTimestampMs?: number;
  leftChildIndex?: number;
  rightChildIndex?: number;
}

export interface MerkleTree {
  rootHash: string;
  depth: number;
  totalFrames: number;
  frameIntervalMs: number;
  durationMs: number;
  nodes: MerkleNode[];
  hashAlgorithm: string;
}

export interface MerkleProof {
  frameNumber: number;
  frameHash: string;
  frameTimestampMs: number;
  proof: Array<{
    hash: string;
    position: 'left' | 'right';
    level: number;
  }>;
  rootHash: string;
}

// Frame sampling configuration based on video duration
const SAMPLING_CONFIG = {
  SHORT: { maxDuration: 30, intervalMs: 1000, maxFrames: 30 },
  MEDIUM: { maxDuration: 300, intervalMs: 2000, maxFrames: 150 },
  LONG: { maxDuration: 1800, intervalMs: 5000, maxFrames: 360 },
  VERY_LONG: { maxDuration: Infinity, intervalMs: 10000, maxFrames: 500 },
};

/**
 * Get frame sampling configuration based on video duration
 */
function getSamplingConfig(durationSeconds: number): { intervalMs: number; maxFrames: number } {
  if (durationSeconds <= SAMPLING_CONFIG.SHORT.maxDuration) {
    return { intervalMs: SAMPLING_CONFIG.SHORT.intervalMs, maxFrames: SAMPLING_CONFIG.SHORT.maxFrames };
  } else if (durationSeconds <= SAMPLING_CONFIG.MEDIUM.maxDuration) {
    return { intervalMs: SAMPLING_CONFIG.MEDIUM.intervalMs, maxFrames: SAMPLING_CONFIG.MEDIUM.maxFrames };
  } else if (durationSeconds <= SAMPLING_CONFIG.LONG.maxDuration) {
    return { intervalMs: SAMPLING_CONFIG.LONG.intervalMs, maxFrames: SAMPLING_CONFIG.LONG.maxFrames };
  } else {
    return { intervalMs: SAMPLING_CONFIG.VERY_LONG.intervalMs, maxFrames: SAMPLING_CONFIG.VERY_LONG.maxFrames };
  }
}

/**
 * Extract frames from video at specified interval
 */
async function extractFramesForMerkle(
  videoPath: string,
  outputDir: string,
  intervalMs: number,
  maxFrames: number
): Promise<Array<{ path: string; timestampMs: number; frameNumber: number }>> {
  await mkdir(outputDir, { recursive: true });

  // Get video duration
  const duration = await new Promise<number>((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (err, data) => {
      if (err) reject(err);
      else resolve((data.format.duration || 0) * 1000);
    });
  });

  const frames: Array<{ path: string; timestampMs: number; frameNumber: number }> = [];
  const intervalSeconds = intervalMs / 1000;

  // Calculate number of frames to extract
  let frameCount = Math.ceil(duration / intervalMs);
  if (frameCount > maxFrames) {
    frameCount = maxFrames;
  }

  // Extract frames using FFmpeg
  await new Promise<void>((resolve, reject) => {
    ffmpeg(videoPath)
      .outputOptions([
        `-vf fps=1/${intervalSeconds}`,
        '-frames:v', frameCount.toString(),
        '-vsync vfr',
      ])
      .output(join(outputDir, 'frame_%04d.jpg'))
      .on('end', resolve)
      .on('error', reject)
      .run();
  });

  // Read extracted frames
  const files = (await readdir(outputDir)).filter((f) => f.startsWith('frame_'));
  files.sort();

  for (let i = 0; i < files.length; i++) {
    frames.push({
      path: join(outputDir, files[i]),
      timestampMs: i * intervalMs,
      frameNumber: i,
    });
  }

  return frames;
}

/**
 * Compute SHA-256 hash of a frame file
 */
async function hashFrame(framePath: string): Promise<string> {
  const { readFile } = await import('fs/promises');
  const data = await readFile(framePath);
  return createHash('sha256').update(data).digest('hex');
}

/**
 * Compute hash of two child hashes (for internal nodes)
 */
function hashPair(left: string, right: string): string {
  return createHash('sha256').update(left + right).digest('hex');
}

/**
 * Build Merkle tree from leaf hashes
 */
function buildTree(leafHashes: string[], frameTimestamps: number[]): MerkleTree {
  if (leafHashes.length === 0) {
    throw new Error('Cannot build Merkle tree with no leaves');
  }

  const nodes: MerkleNode[] = [];
  let currentLevel: string[] = [...leafHashes];
  let levelIndex = 0;
  let nodeIndex = 0;

  // Add leaf nodes
  for (let i = 0; i < leafHashes.length; i++) {
    nodes.push({
      level: 0,
      index: nodeIndex++,
      hash: leafHashes[i],
      frameNumber: i,
      frameTimestampMs: frameTimestamps[i],
    });
  }

  // Build internal nodes
  while (currentLevel.length > 1) {
    const nextLevel: string[] = [];
    const nextLevelNodes: MerkleNode[] = [];

    for (let i = 0; i < currentLevel.length; i += 2) {
      const left = currentLevel[i];
      const right = i + 1 < currentLevel.length ? currentLevel[i + 1] : left; // Duplicate last if odd

      const parentHash = hashPair(left, right);
      nextLevel.push(parentHash);

      nextLevelNodes.push({
        level: levelIndex + 1,
        index: nodeIndex++,
        hash: parentHash,
        leftChildIndex: i,
        rightChildIndex: i + 1 < currentLevel.length ? i + 1 : i,
      });
    }

    nodes.push(...nextLevelNodes);
    currentLevel = nextLevel;
    levelIndex++;
  }

  const depth = levelIndex;
  const rootHash = currentLevel[0];

  return {
    rootHash,
    depth,
    totalFrames: leafHashes.length,
    frameIntervalMs: 0, // Will be set by caller
    durationMs: 0, // Will be set by caller
    nodes,
    hashAlgorithm: 'sha256',
  };
}

/**
 * Generate Merkle tree for a video
 */
export async function generateMerkleTree(
  videoPath: string,
  videoId: string,
  durationSeconds: number
): Promise<MerkleTree> {
  const tempDir = `/tmp/vidchain/merkle_${videoId}_${Date.now()}`;

  try {
    // Get sampling configuration
    const { intervalMs, maxFrames } = getSamplingConfig(durationSeconds);

    // Extract frames
    console.log(`[${videoId}] Extracting frames for Merkle tree (interval: ${intervalMs}ms)...`);
    const frames = await extractFramesForMerkle(videoPath, tempDir, intervalMs, maxFrames);
    console.log(`[${videoId}] Extracted ${frames.length} frames`);

    if (frames.length === 0) {
      throw new Error('No frames extracted from video');
    }

    // Hash each frame
    console.log(`[${videoId}] Hashing frames...`);
    const leafHashes: string[] = [];
    const timestamps: number[] = [];

    for (const frame of frames) {
      const hash = await hashFrame(frame.path);
      leafHashes.push(hash);
      timestamps.push(frame.timestampMs);
    }

    // Build tree
    console.log(`[${videoId}] Building Merkle tree...`);
    const tree = buildTree(leafHashes, timestamps);
    tree.frameIntervalMs = intervalMs;
    tree.durationMs = durationSeconds * 1000;

    console.log(`[${videoId}] Merkle tree complete. Root: ${tree.rootHash}, Depth: ${tree.depth}`);

    return tree;
  } finally {
    // Cleanup
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
 * Generate proof for a specific frame
 */
export function generateProof(tree: MerkleTree, frameNumber: number): MerkleProof {
  if (frameNumber < 0 || frameNumber >= tree.totalFrames) {
    throw new Error(`Frame number ${frameNumber} out of range (0-${tree.totalFrames - 1})`);
  }

  // Find leaf node
  const leafNode = tree.nodes.find(
    (n) => n.level === 0 && n.frameNumber === frameNumber
  );

  if (!leafNode) {
    throw new Error(`Leaf node for frame ${frameNumber} not found`);
  }

  const proof: MerkleProof['proof'] = [];
  let currentIndex = frameNumber;
  let currentLevel = 0;

  // Walk up the tree collecting siblings
  while (currentLevel < tree.depth) {
    const isLeft = currentIndex % 2 === 0;
    const siblingIndex = isLeft ? currentIndex + 1 : currentIndex - 1;

    // Find sibling at this level
    const levelNodes = tree.nodes.filter((n) => n.level === currentLevel);
    const sibling = levelNodes[siblingIndex] || levelNodes[currentIndex]; // Use self if no sibling

    proof.push({
      hash: sibling.hash,
      position: isLeft ? 'right' : 'left',
      level: currentLevel,
    });

    currentIndex = Math.floor(currentIndex / 2);
    currentLevel++;
  }

  return {
    frameNumber,
    frameHash: leafNode.hash,
    frameTimestampMs: leafNode.frameTimestampMs || 0,
    proof,
    rootHash: tree.rootHash,
  };
}

/**
 * Verify a Merkle proof
 */
export function verifyProof(proof: MerkleProof): boolean {
  let currentHash = proof.frameHash;

  for (const step of proof.proof) {
    if (step.position === 'left') {
      currentHash = hashPair(step.hash, currentHash);
    } else {
      currentHash = hashPair(currentHash, step.hash);
    }
  }

  return currentHash === proof.rootHash;
}

/**
 * Compare two Merkle trees to find modified frames
 */
export function compareTrees(
  tree1: MerkleTree,
  tree2: MerkleTree
): {
  identical: boolean;
  modifiedFrames: number[];
  addedFrames: number[];
  removedFrames: number[];
} {
  if (tree1.rootHash === tree2.rootHash) {
    return {
      identical: true,
      modifiedFrames: [],
      addedFrames: [],
      removedFrames: [],
    };
  }

  const modifiedFrames: number[] = [];
  const addedFrames: number[] = [];
  const removedFrames: number[] = [];

  // Compare leaf nodes
  const leaves1 = tree1.nodes.filter((n) => n.level === 0);
  const leaves2 = tree2.nodes.filter((n) => n.level === 0);

  const maxFrames = Math.max(leaves1.length, leaves2.length);

  for (let i = 0; i < maxFrames; i++) {
    const leaf1 = leaves1[i];
    const leaf2 = leaves2[i];

    if (leaf1 && leaf2) {
      if (leaf1.hash !== leaf2.hash) {
        modifiedFrames.push(i);
      }
    } else if (leaf1 && !leaf2) {
      removedFrames.push(i);
    } else if (!leaf1 && leaf2) {
      addedFrames.push(i);
    }
  }

  return {
    identical: false,
    modifiedFrames,
    addedFrames,
    removedFrames,
  };
}

/**
 * Serialize tree for storage (compact format)
 */
export function serializeTree(tree: MerkleTree): string {
  return JSON.stringify({
    r: tree.rootHash,
    d: tree.depth,
    f: tree.totalFrames,
    i: tree.frameIntervalMs,
    t: tree.durationMs,
    a: tree.hashAlgorithm,
    n: tree.nodes.map((n) => ({
      l: n.level,
      x: n.index,
      h: n.hash,
      fn: n.frameNumber,
      ft: n.frameTimestampMs,
      lc: n.leftChildIndex,
      rc: n.rightChildIndex,
    })),
  });
}

/**
 * Deserialize tree from storage
 */
export function deserializeTree(data: string): MerkleTree {
  const parsed = JSON.parse(data);
  return {
    rootHash: parsed.r,
    depth: parsed.d,
    totalFrames: parsed.f,
    frameIntervalMs: parsed.i,
    durationMs: parsed.t,
    hashAlgorithm: parsed.a,
    nodes: parsed.n.map((n: Record<string, unknown>) => ({
      level: n.l,
      index: n.x,
      hash: n.h,
      frameNumber: n.fn,
      frameTimestampMs: n.ft,
      leftChildIndex: n.lc,
      rightChildIndex: n.rc,
    })),
  };
}
