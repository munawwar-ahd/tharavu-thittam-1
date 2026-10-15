// API client for தரவு திட்டம் backend — Gemini edition

const configuredApiBase = import.meta.env.VITE_API_URL?.trim().replace(/\/+$/, '');
export const API_BASE = import.meta.env.DEV
  ? '/api'
  : configuredApiBase || 'http://localhost:8000';

// Timeout for OCR requests — Gemini can take a few seconds on large images
const OCR_TIMEOUT_MS = 120_000;

export interface WordConfidence {
  word: string;
  confidence: number;
}

export interface OCRResult {
  success: boolean;
  raw_text: string;
  cleaned_text: string;
  words_with_confidence: WordConfidence[];
  regions_found: number;
  engine: string;
  engine_model: string;
  api_key_configured: boolean;
  language: string;
  error: string | null;
}

export interface SystemStatus {
  ocr_engine: string;          // "gemini"
  ocr_engine_loaded: boolean;  // SDK importable
  api_key_configured: boolean; // GEMINI_API_KEY is set
  gemini_model: string;        // model name in use
  ready: boolean;              // fully operational
  diagnostic_message: string | null;
}

export class ApiHttpError extends Error {
  readonly status: number;

  constructor(status: number) {
    super(`API request failed with status ${status}`);
    this.name = 'ApiHttpError';
    this.status = status;
  }
}

export class ApiResponseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ApiResponseError';
  }
}

function isSystemStatus(value: unknown): value is SystemStatus {
  if (typeof value !== 'object' || value === null) return false;

  return (
    'ocr_engine' in value &&
    typeof value.ocr_engine === 'string' &&
    'ocr_engine_loaded' in value &&
    typeof value.ocr_engine_loaded === 'boolean' &&
    'api_key_configured' in value &&
    typeof value.api_key_configured === 'boolean' &&
    'gemini_model' in value &&
    typeof value.gemini_model === 'string' &&
    'ready' in value &&
    typeof value.ready === 'boolean' &&
    'diagnostic_message' in value &&
    (typeof value.diagnostic_message === 'string' ||
      value.diagnostic_message === null)
  );
}

export async function fetchStatus(): Promise<SystemStatus> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const res = await fetch(`${API_BASE}/status`, { signal: controller.signal });
    if (!res.ok) throw new ApiHttpError(res.status);
    let data: unknown;
    try {
      data = await res.json();
    } catch {
      throw new ApiResponseError('Status endpoint did not return valid JSON');
    }
    if (!isSystemStatus(data)) {
      throw new ApiResponseError('Status response does not match the expected API schema');
    }
    return data;
  } finally {
    clearTimeout(timer);
  }
}

export async function runOCR(
  file: File,
  lang: string,
  onProgress?: (pct: number) => void,
): Promise<OCRResult> {
  const form = new FormData();
  form.append('file', file);
  form.append('lang', lang);

  // Simulated progress — Gemini has no streaming progress callback
  let tick = 0;
  const interval = onProgress
    ? setInterval(() => {
        tick = Math.min(tick + 3, 88);
        onProgress(tick);
      }, 500)
    : null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), OCR_TIMEOUT_MS);

  try {
    const res = await fetch(`${API_BASE}/ocr`, {
      method: 'POST',
      body: form,
      signal: controller.signal,
    });

    if (!res.ok) {
      let detail: string;
      try {
        const body = await res.json();
        detail = body?.detail ?? `Server error ${res.status}`;
      } catch {
        detail = `Server error ${res.status}`;
      }
      throw new Error(detail);
    }

    const data: OCRResult = await res.json();
    onProgress?.(100);
    return data;
  } catch (err: unknown) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error(
        `OCR request timed out after ${OCR_TIMEOUT_MS / 1000}s. Try a smaller image.`,
      );
    }
    throw err;
  } finally {
    clearTimeout(timer);
    if (interval) clearInterval(interval);
  }
}
