import "@testing-library/jest-dom";
import { expect, vi } from "vitest";
import * as axeMatchers from "vitest-axe/matchers";

// enregistre le matcher toHaveNoViolations (axe) sur l'expect de Vitest
expect.extend(axeMatchers);

// jsdom ne fournit pas ces API utilisées par certains composants → on les simule.
if (!window.matchMedia) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

if (!window.IntersectionObserver) {
  window.IntersectionObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
    root = null;
    rootMargin = "";
    thresholds = [];
  } as unknown as typeof IntersectionObserver;
}
