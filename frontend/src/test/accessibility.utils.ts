/**
 * Accessibility Testing Utilities
 *
 * Helpers for testing WCAG 2.1 compliance in components.
 * Use these utilities with Vitest/Jest to ensure accessibility requirements are met.
 */

import { expect } from 'vitest';

/**
 * Common WCAG 2.1 AA contrast ratios
 */
export const CONTRAST_RATIOS = {
  /** Minimum contrast for normal text (WCAG 2.1 AA) */
  normalText: 4.5,
  /** Minimum contrast for large text (WCAG 2.1 AA) - 18pt+ or 14pt+ bold */
  largeText: 3,
  /** Minimum contrast for UI components and graphical objects */
  uiComponent: 3,
} as const;

/**
 * Calculate relative luminance of a color
 * @see https://www.w3.org/WAI/GL/wiki/Relative_luminance
 */
export function getRelativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculate contrast ratio between two colors
 * @see https://www.w3.org/WAI/GL/wiki/Contrast_ratio
 */
export function getContrastRatio(
  color1: { r: number; g: number; b: number },
  color2: { r: number; g: number; b: number }
): number {
  const l1 = getRelativeLuminance(color1.r, color1.g, color1.b);
  const l2 = getRelativeLuminance(color2.r, color2.g, color2.b);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Parse hex color to RGB
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Check if contrast meets WCAG 2.1 AA requirements
 */
export function meetsContrastRequirements(
  foreground: string,
  background: string,
  type: 'normalText' | 'largeText' | 'uiComponent' = 'normalText'
): boolean {
  const fg = hexToRgb(foreground);
  const bg = hexToRgb(background);
  if (!fg || !bg) return false;

  const ratio = getContrastRatio(fg, bg);
  return ratio >= CONTRAST_RATIOS[type];
}

/**
 * Required ARIA attributes for common patterns
 */
export const ARIA_PATTERNS = {
  button: {
    required: [],
    recommended: ['aria-label', 'aria-pressed', 'aria-expanded'],
  },
  link: {
    required: [],
    recommended: ['aria-label', 'aria-current'],
  },
  dialog: {
    required: ['role', 'aria-modal', 'aria-labelledby'],
    recommended: ['aria-describedby'],
  },
  menu: {
    required: ['role', 'aria-labelledby'],
    recommended: ['aria-orientation'],
  },
  menuitem: {
    required: ['role'],
    recommended: ['aria-disabled', 'aria-checked'],
  },
  progressbar: {
    required: ['role', 'aria-valuenow', 'aria-valuemin', 'aria-valuemax'],
    recommended: ['aria-label', 'aria-labelledby'],
  },
  alert: {
    required: ['role'],
    recommended: ['aria-live', 'aria-atomic'],
  },
  form: {
    required: [],
    recommended: ['aria-describedby'],
  },
  input: {
    required: [],
    recommended: ['aria-required', 'aria-invalid', 'aria-describedby'],
  },
} as const;

/**
 * Check if an element has required ARIA attributes for a pattern
 */
export function hasRequiredAriaAttributes(
  element: HTMLElement,
  pattern: keyof typeof ARIA_PATTERNS
): { valid: boolean; missing: string[] } {
  const patternDef = ARIA_PATTERNS[pattern];
  const missing: string[] = [];

  for (const attr of patternDef.required) {
    if (attr === 'role') {
      if (!element.getAttribute('role')) {
        missing.push(attr);
      }
    } else if (!element.hasAttribute(attr)) {
      missing.push(attr);
    }
  }

  return { valid: missing.length === 0, missing };
}

/**
 * Check if element is keyboard focusable
 */
export function isKeyboardFocusable(element: HTMLElement): boolean {
  const focusableSelectors = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled]):not([type="hidden"])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]',
  ];

  return focusableSelectors.some((selector) => element.matches(selector));
}

/**
 * Get all focusable elements within a container
 */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const focusableSelectors = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled]):not([type="hidden"])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]',
  ].join(', ');

  return Array.from(container.querySelectorAll<HTMLElement>(focusableSelectors));
}

/**
 * Check if element has visible focus indicator
 */
export function hasVisibleFocusIndicator(element: HTMLElement): boolean {
  const styles = window.getComputedStyle(element);

  // Check for outline
  const hasOutline =
    styles.outlineStyle !== 'none' &&
    styles.outlineWidth !== '0px';

  // Check for box-shadow (often used for custom focus)
  const hasBoxShadow =
    styles.boxShadow !== 'none' &&
    styles.boxShadow !== '';

  // Check for border changes
  const hasBorder =
    styles.borderStyle !== 'none' &&
    styles.borderWidth !== '0px';

  return hasOutline || hasBoxShadow || hasBorder;
}

/**
 * Custom Vitest/Jest matchers for accessibility testing
 */
export const a11yMatchers = {
  /**
   * Check if element has proper accessible name
   */
  toHaveAccessibleName(element: HTMLElement, expectedName?: string) {
    const accessibleName =
      element.getAttribute('aria-label') ||
      element.getAttribute('aria-labelledby') ||
      element.getAttribute('title') ||
      element.textContent?.trim();

    if (expectedName) {
      const pass = accessibleName === expectedName;
      return {
        pass,
        message: () =>
          pass
            ? `Expected element not to have accessible name "${expectedName}"`
            : `Expected element to have accessible name "${expectedName}", but got "${accessibleName}"`,
      };
    }

    const pass = !!accessibleName && accessibleName.length > 0;
    return {
      pass,
      message: () =>
        pass
          ? `Expected element not to have an accessible name`
          : `Expected element to have an accessible name, but it was empty or missing`,
    };
  },

  /**
   * Check if element is keyboard accessible
   */
  toBeKeyboardAccessible(element: HTMLElement) {
    const pass = isKeyboardFocusable(element);
    return {
      pass,
      message: () =>
        pass
          ? `Expected element not to be keyboard accessible`
          : `Expected element to be keyboard accessible (focusable via Tab key)`,
    };
  },

  /**
   * Check if element has required ARIA attributes for a pattern
   */
  toHaveRequiredAriaFor(element: HTMLElement, pattern: keyof typeof ARIA_PATTERNS) {
    const result = hasRequiredAriaAttributes(element, pattern);
    return {
      pass: result.valid,
      message: () =>
        result.valid
          ? `Expected element not to have all required ARIA attributes for ${pattern}`
          : `Expected element to have required ARIA attributes for ${pattern}, missing: ${result.missing.join(', ')}`,
    };
  },
};

/**
 * Extend Vitest/Jest expect with accessibility matchers
 */
export function extendExpectWithA11y() {
  expect.extend(a11yMatchers);
}

/**
 * Test helper: Simulate keyboard navigation
 */
export function simulateKeyPress(
  element: HTMLElement,
  key: string,
  modifiers: { shift?: boolean; ctrl?: boolean; alt?: boolean; meta?: boolean } = {}
): void {
  const event = new KeyboardEvent('keydown', {
    key,
    code: key,
    shiftKey: modifiers.shift || false,
    ctrlKey: modifiers.ctrl || false,
    altKey: modifiers.alt || false,
    metaKey: modifiers.meta || false,
    bubbles: true,
    cancelable: true,
  });
  element.dispatchEvent(event);
}

/**
 * Test helper: Check if skip link is functional
 */
export function testSkipLink(skipLink: HTMLAnchorElement): boolean {
  const targetId = skipLink.getAttribute('href')?.slice(1);
  if (!targetId) return false;

  const target = document.getElementById(targetId);
  if (!target) return false;

  // Check if target can receive focus
  const tabIndex = target.getAttribute('tabindex');
  return tabIndex === '-1' || tabIndex === '0';
}

/**
 * Test helper: Validate heading hierarchy
 */
export function validateHeadingHierarchy(container: HTMLElement): {
  valid: boolean;
  errors: string[];
} {
  const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
  const errors: string[] = [];
  let previousLevel = 0;

  headings.forEach((heading, index) => {
    const level = parseInt(heading.tagName[1]);

    // First heading should be h1
    if (index === 0 && level !== 1) {
      errors.push(`First heading should be h1, found h${level}`);
    }

    // Heading level should not skip levels (e.g., h1 -> h3)
    if (previousLevel > 0 && level > previousLevel + 1) {
      errors.push(`Heading level skipped from h${previousLevel} to h${level}`);
    }

    previousLevel = level;
  });

  return { valid: errors.length === 0, errors };
}

/**
 * Test helper: Check for images without alt text
 */
export function findImagesWithoutAlt(container: HTMLElement): HTMLImageElement[] {
  const images = container.querySelectorAll('img');
  return Array.from(images).filter((img) => {
    const alt = img.getAttribute('alt');
    // Images should have alt attribute (can be empty for decorative images)
    return alt === null;
  });
}

/**
 * Test helper: Check for form inputs without labels
 */
export function findInputsWithoutLabels(container: HTMLElement): HTMLElement[] {
  const inputs = container.querySelectorAll('input, select, textarea');
  return Array.from(inputs).filter((input) => {
    const id = input.getAttribute('id');
    const ariaLabel = input.getAttribute('aria-label');
    const ariaLabelledBy = input.getAttribute('aria-labelledby');

    // Check if there's a label element
    const hasLabelElement = id && container.querySelector(`label[for="${id}"]`);

    return !hasLabelElement && !ariaLabel && !ariaLabelledBy;
  }) as HTMLElement[];
}
