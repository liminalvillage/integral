/**
 * INTEGRAL: Utility Functions
 * Hash chains, ID generation, and common utilities
 */

import { createHash } from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import type { LedgerEntry } from '../types/index.js';

// ============================================================================
// ID GENERATION
// ============================================================================

/**
 * Generate a unique ID with optional prefix
 */
export function generateId(prefix?: string): string {
  const uuid = uuidv4();
  return prefix ? `${prefix}_${uuid}` : uuid;
}

/**
 * Generate a short ID for display purposes
 */
export function generateShortId(): string {
  return uuidv4().split('-')[0];
}

// ============================================================================
// HASH CHAIN UTILITIES
// ============================================================================

/**
 * Create a stable JSON string for hashing (sorted keys)
 */
export function stableJson(obj: unknown): string {
  return JSON.stringify(obj, (_, value) => {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return Object.keys(value)
        .sort()
        .reduce((sorted: Record<string, unknown>, key) => {
          sorted[key] = value[key];
          return sorted;
        }, {});
    }
    return value;
  });
}

/**
 * Compute SHA256 hash of data
 */
export function sha256(data: string): string {
  return createHash('sha256').update(data).digest('hex');
}

/**
 * Compute entry hash for ledger entry
 * entry_hash = SHA256(stable_json(payload) + prev_hash)
 */
export function computeEntryHash(payload: unknown, prevHash: string): string {
  const payloadJson = stableJson(payload);
  return sha256(payloadJson + prevHash);
}

/**
 * Genesis hash for the first entry in a chain
 */
export const GENESIS_HASH = sha256('INTEGRAL_GENESIS');

/**
 * Verify hash chain integrity
 */
export function verifyHashChain(entries: LedgerEntry[]): boolean {
  if (entries.length === 0) return true;

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const expectedPrevHash = i === 0 ? GENESIS_HASH : entries[i - 1].entryHash;

    if (entry.prevHash !== expectedPrevHash) {
      return false;
    }

    // Verify entry hash
    const { entryHash, prevHash, ...payload } = entry;
    const computedHash = computeEntryHash(payload, prevHash);
    if (computedHash !== entryHash) {
      return false;
    }
  }

  return true;
}

/**
 * Create a new ledger entry with proper hash chaining
 */
export function createLedgerEntry(
  entryType: string,
  nodeId: string,
  details: Record<string, unknown>,
  prevHash: string,
  memberId?: string,
  relatedIds: Record<string, string> = {}
): LedgerEntry {
  const id = generateId('entry');
  const timestamp = new Date();

  const payload = {
    id,
    timestamp,
    entryType,
    nodeId,
    memberId,
    relatedIds,
    details,
  };

  const entryHash = computeEntryHash(payload, prevHash);

  return {
    ...payload,
    prevHash,
    entryHash,
  };
}

// ============================================================================
// MATH UTILITIES
// ============================================================================

/**
 * Clamp a value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Normalize a value to 0-1 range
 */
export function normalize(value: number, min: number, max: number): number {
  if (max === min) return 0.5;
  return clamp((value - min) / (max - min), 0, 1);
}

/**
 * Compute weighted average
 */
export function weightedAverage(
  values: number[],
  weights: number[]
): number {
  if (values.length !== weights.length || values.length === 0) {
    return 0;
  }

  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  if (totalWeight === 0) return 0;

  const weightedSum = values.reduce((sum, v, i) => sum + v * weights[i], 0);
  return weightedSum / totalWeight;
}

/**
 * Compute Herfindahl concentration index
 * H = Σ sᵢ² where sᵢ are market shares
 */
export function herfindahlIndex(shares: number[]): number {
  return shares.reduce((sum, s) => sum + s * s, 0);
}

// ============================================================================
// DATE UTILITIES
// ============================================================================

/**
 * Get days between two dates
 */
export function daysBetween(start: Date, end: Date): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  return (end.getTime() - start.getTime()) / msPerDay;
}

/**
 * Add days to a date
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

// ============================================================================
// SUPPORT LEVEL UTILITIES
// ============================================================================

import type { SupportLevel } from '../types/index.js';

/**
 * Convert SupportLevel to numeric value
 */
export function supportLevelToNumber(level: SupportLevel): number {
  const mapping: Record<SupportLevel, number> = {
    strong_support: 1.0,
    support: 0.5,
    neutral: 0.0,
    concern: -0.5,
    block: -1.0,
  };
  return mapping[level];
}

// ============================================================================
// SKILL TIER UTILITIES
// ============================================================================

import type { SkillTier } from '../types/index.js';

/**
 * Default skill tier weights
 */
export const DEFAULT_SKILL_WEIGHTS: Record<SkillTier, number> = {
  low: 1.0,
  medium: 1.2,
  high: 1.5,
  expert: 1.8,
};

// ============================================================================
// EVENT EMITTER BASE
// ============================================================================

import { EventEmitter } from 'eventemitter3';

export class TypedEventEmitter<T extends Record<string, unknown[]>> extends EventEmitter {
  emit<K extends keyof T>(event: K, ...args: T[K]): boolean {
    return super.emit(event as string, ...args);
  }

  on<K extends keyof T>(event: K, listener: (...args: T[K]) => void): this {
    return super.on(event as string, listener as (...args: unknown[]) => void);
  }

  off<K extends keyof T>(event: K, listener: (...args: T[K]) => void): this {
    return super.off(event as string, listener as (...args: unknown[]) => void);
  }
}
