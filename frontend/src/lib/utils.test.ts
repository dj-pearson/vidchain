import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  cn,
  formatFileSize,
  formatDuration,
  formatRelativeTime,
  formatDate,
  formatDateTime,
  truncate,
  truncateHash,
  isValidEmail,
  isValidEthAddress,
  generateId,
  copyToClipboard,
  getStatusColor,
  getStatusBadgeVariant,
  formatConfidence,
  getIpfsUrl,
  getExplorerUrl,
} from './utils';

// ── cn ──────────────────────────────────────────────────────────

describe('cn', () => {
  it('merges simple class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('handles conditional classes', () => {
    expect(cn('base', false && 'hidden', 'visible')).toBe('base visible');
  });

  it('merges conflicting Tailwind classes (last wins)', () => {
    expect(cn('p-4', 'p-2')).toBe('p-2');
  });

  it('handles undefined and null inputs', () => {
    expect(cn('a', undefined, null, 'b')).toBe('a b');
  });

  it('returns empty string for no inputs', () => {
    expect(cn()).toBe('');
  });
});

// ── formatFileSize ──────────────────────────────────────────────

describe('formatFileSize', () => {
  it('returns "0 Bytes" for 0', () => {
    expect(formatFileSize(0)).toBe('0 Bytes');
  });

  it('formats bytes', () => {
    expect(formatFileSize(500)).toBe('500 Bytes');
  });

  it('formats kilobytes', () => {
    expect(formatFileSize(1024)).toBe('1 KB');
  });

  it('formats megabytes', () => {
    expect(formatFileSize(1048576)).toBe('1 MB');
  });

  it('formats gigabytes', () => {
    expect(formatFileSize(1073741824)).toBe('1 GB');
  });

  it('formats fractional sizes', () => {
    expect(formatFileSize(1536)).toBe('1.5 KB');
  });

  it('formats terabytes', () => {
    expect(formatFileSize(1099511627776)).toBe('1 TB');
  });
});

// ── formatDuration ──────────────────────────────────────────────

describe('formatDuration', () => {
  it('formats 0 seconds', () => {
    expect(formatDuration(0)).toBe('0:00');
  });

  it('formats seconds only', () => {
    expect(formatDuration(45)).toBe('0:45');
  });

  it('formats minutes and seconds', () => {
    expect(formatDuration(65)).toBe('1:05');
  });

  it('formats hours, minutes, and seconds', () => {
    expect(formatDuration(3661)).toBe('1:01:01');
  });

  it('pads minutes and seconds when hours present', () => {
    expect(formatDuration(3600)).toBe('1:00:00');
  });
});

// ── formatRelativeTime ──────────────────────────────────────────

describe('formatRelativeTime', () => {
  it('returns "just now" for less than 60 seconds ago', () => {
    const now = new Date();
    expect(formatRelativeTime(now)).toBe('just now');
  });

  it('returns minutes ago', () => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
    expect(formatRelativeTime(fiveMinAgo)).toBe('5m ago');
  });

  it('returns hours ago', () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    expect(formatRelativeTime(twoHoursAgo)).toBe('2h ago');
  });

  it('returns days ago', () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    expect(formatRelativeTime(threeDaysAgo)).toBe('3d ago');
  });

  it('returns formatted date for more than a week ago', () => {
    const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    const expected = twoWeeksAgo.toLocaleDateString();
    expect(formatRelativeTime(twoWeeksAgo)).toBe(expected);
  });

  it('accepts string dates', () => {
    const now = new Date().toISOString();
    expect(formatRelativeTime(now)).toBe('just now');
  });
});

// ── formatDate ──────────────────────────────────────────────────

describe('formatDate', () => {
  it('formats a date string', () => {
    const result = formatDate('2024-01-15T00:00:00Z');
    expect(result).toContain('Jan');
    expect(result).toContain('2024');
    expect(result).toContain('15');
  });

  it('formats a Date object', () => {
    const date = new Date(2024, 0, 15);
    const result = formatDate(date);
    expect(result).toContain('Jan');
    expect(result).toContain('15');
    expect(result).toContain('2024');
  });
});

// ── formatDateTime ──────────────────────────────────────────────

describe('formatDateTime', () => {
  it('includes date and time components', () => {
    const result = formatDateTime('2024-06-15T14:30:00Z');
    expect(result).toContain('Jun');
    expect(result).toContain('2024');
    expect(result).toContain('15');
  });

  it('formats a Date object', () => {
    const date = new Date(2024, 5, 15, 14, 30);
    const result = formatDateTime(date);
    expect(result).toContain('Jun');
    expect(result).toContain('15');
  });
});

// ── truncate ────────────────────────────────────────────────────

describe('truncate', () => {
  it('returns original string if shorter than limit', () => {
    expect(truncate('hello', 10)).toBe('hello');
  });

  it('returns original string if exactly at limit', () => {
    expect(truncate('hello', 5)).toBe('hello');
  });

  it('truncates and adds ellipsis', () => {
    expect(truncate('hello world', 5)).toBe('hello...');
  });

  it('handles empty string', () => {
    expect(truncate('', 5)).toBe('');
  });
});

// ── truncateHash ────────────────────────────────────────────────

describe('truncateHash', () => {
  it('truncates long hashes with default params', () => {
    const hash = '0x1234567890abcdef1234567890abcdef12345678';
    expect(truncateHash(hash)).toBe('0x1234...5678');
  });

  it('returns short hash unchanged', () => {
    expect(truncateHash('0x1234')).toBe('0x1234');
  });

  it('supports custom start and end chars', () => {
    const hash = '0x1234567890abcdef1234567890abcdef12345678';
    expect(truncateHash(hash, 4, 6)).toBe('0x12...345678');
  });

  it('returns hash unchanged if length equals startChars + endChars', () => {
    expect(truncateHash('0x12345678', 6, 4)).toBe('0x12345678');
  });
});

// ── isValidEmail ────────────────────────────────────────────────

describe('isValidEmail', () => {
  it('accepts valid email addresses', () => {
    expect(isValidEmail('user@example.com')).toBe(true);
    expect(isValidEmail('test.name@domain.co.uk')).toBe(true);
    expect(isValidEmail('user+tag@example.com')).toBe(true);
  });

  it('rejects invalid email addresses', () => {
    expect(isValidEmail('')).toBe(false);
    expect(isValidEmail('notanemail')).toBe(false);
    expect(isValidEmail('@domain.com')).toBe(false);
    expect(isValidEmail('user@')).toBe(false);
    expect(isValidEmail('user @example.com')).toBe(false);
    expect(isValidEmail('user@domain')).toBe(false);
  });
});

// ── isValidEthAddress ───────────────────────────────────────────

describe('isValidEthAddress', () => {
  it('accepts valid Ethereum addresses', () => {
    expect(isValidEthAddress('0x1234567890abcdef1234567890abcdef12345678')).toBe(true);
    expect(isValidEthAddress('0xABCDEF1234567890ABCDEF1234567890ABCDEF12')).toBe(true);
  });

  it('rejects invalid Ethereum addresses', () => {
    expect(isValidEthAddress('')).toBe(false);
    expect(isValidEthAddress('0x')).toBe(false);
    expect(isValidEthAddress('1234567890abcdef1234567890abcdef12345678')).toBe(false);
    expect(isValidEthAddress('0xGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG')).toBe(false);
    expect(isValidEthAddress('0x1234')).toBe(false);
  });
});

// ── generateId ──────────────────────────────────────────────────

describe('generateId', () => {
  it('returns a string', () => {
    expect(typeof generateId()).toBe('string');
  });

  it('returns a non-empty string', () => {
    expect(generateId().length).toBeGreaterThan(0);
  });

  it('generates unique IDs', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateId()));
    expect(ids.size).toBe(100);
  });
});

// ── copyToClipboard ─────────────────────────────────────────────

describe('copyToClipboard', () => {
  beforeEach(() => {
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn(),
      },
    });
  });

  it('returns true on success', async () => {
    (navigator.clipboard.writeText as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    const result = await copyToClipboard('test text');
    expect(result).toBe(true);
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('test text');
  });

  it('returns false on failure', async () => {
    (navigator.clipboard.writeText as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('fail'));
    const result = await copyToClipboard('test text');
    expect(result).toBe(false);
  });
});

// ── getStatusColor ──────────────────────────────────────────────

describe('getStatusColor', () => {
  it('returns success color for verified', () => {
    expect(getStatusColor('verified')).toBe('text-success');
  });

  it('returns warning color for pending', () => {
    expect(getStatusColor('pending')).toBe('text-warning');
  });

  it('returns warning color for processing', () => {
    expect(getStatusColor('processing')).toBe('text-warning');
  });

  it('returns destructive color for failed', () => {
    expect(getStatusColor('failed')).toBe('text-destructive');
  });

  it('returns destructive color for unverified', () => {
    expect(getStatusColor('unverified')).toBe('text-destructive');
  });

  it('returns muted-foreground for unknown status', () => {
    expect(getStatusColor('unknown')).toBe('text-muted-foreground');
  });
});

// ── getStatusBadgeVariant ───────────────────────────────────────

describe('getStatusBadgeVariant', () => {
  it('returns default for verified', () => {
    expect(getStatusBadgeVariant('verified')).toBe('default');
  });

  it('returns secondary for pending', () => {
    expect(getStatusBadgeVariant('pending')).toBe('secondary');
  });

  it('returns secondary for processing', () => {
    expect(getStatusBadgeVariant('processing')).toBe('secondary');
  });

  it('returns destructive for failed', () => {
    expect(getStatusBadgeVariant('failed')).toBe('destructive');
  });

  it('returns destructive for unverified', () => {
    expect(getStatusBadgeVariant('unverified')).toBe('destructive');
  });

  it('returns outline for unknown status', () => {
    expect(getStatusBadgeVariant('other')).toBe('outline');
  });
});

// ── formatConfidence ────────────────────────────────────────────

describe('formatConfidence', () => {
  it('formats integer confidence', () => {
    expect(formatConfidence(95)).toBe('95%');
  });

  it('formats zero confidence', () => {
    expect(formatConfidence(0)).toBe('0%');
  });

  it('formats 100 confidence', () => {
    expect(formatConfidence(100)).toBe('100%');
  });

  it('formats decimal confidence', () => {
    expect(formatConfidence(99.5)).toBe('99.5%');
  });
});

// ── getIpfsUrl ──────────────────────────────────────────────────

describe('getIpfsUrl', () => {
  it('uses default Pinata gateway', () => {
    expect(getIpfsUrl('QmTest123')).toBe('https://gateway.pinata.cloud/ipfs/QmTest123');
  });

  it('uses custom gateway', () => {
    expect(getIpfsUrl('QmTest123', 'https://ipfs.io/ipfs/')).toBe(
      'https://ipfs.io/ipfs/QmTest123'
    );
  });
});

// ── getExplorerUrl ──────────────────────────────────────────────

describe('getExplorerUrl', () => {
  it('defaults to tx type on testnet', () => {
    const url = getExplorerUrl('0xabc123');
    expect(url).toBe('https://mumbai.polygonscan.com/tx/0xabc123');
  });

  it('builds address URL', () => {
    const url = getExplorerUrl('0xabc123', 'address');
    expect(url).toBe('https://mumbai.polygonscan.com/address/0xabc123');
  });

  it('builds token URL', () => {
    const url = getExplorerUrl('0xabc123', 'token');
    expect(url).toBe('https://mumbai.polygonscan.com/token/0xabc123');
  });
});
