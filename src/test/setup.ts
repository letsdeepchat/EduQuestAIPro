import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    clear: () => {
      store = {};
    },
    removeItem: (key: string) => {
      delete store[key];
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock window.aistudio
Object.defineProperty(window, 'aistudio', {
  value: {
    hasSelectedApiKey: vi.fn().mockResolvedValue(true),
    openSelectKey: vi.fn().mockResolvedValue(undefined),
  },
});

// Mock Speech APIs
(window as any).SpeechRecognition = vi.fn();
(window as any).webkitSpeechRecognition = vi.fn();
(window as any).speechSynthesis = {
  speak: vi.fn(),
  cancel: vi.fn(),
  getVoices: vi.fn().mockReturnValue([]),
};
