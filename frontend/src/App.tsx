import { useCallback, useEffect, useState } from 'react';
import './index.css';
import { ApiHttpError, ApiResponseError, fetchStatus, runOCR } from './api';
import type { OCRResult, SystemStatus } from './api';
import { ScrollBackground, useScrollProgress, useReducedMotion } from './components/ScrollBackground';
import { SectionUpload } from './components/SectionUpload';
import { SectionLanguage } from './components/SectionLanguage';
import { SectionOutput } from './components/SectionOutput';
import { Footer } from './components/Footer';

// Section heights for scroll progress calculation (in viewport heights)
const SECTION_HEIGHTS = {
  upload: 1.0,     // 100vh
  language: 1.0,   // 100vh
  output: 1.5,     // 150vh
  footer: 0.6,     // 60vh
};

const TOTAL_SCROLL_HEIGHT =
  Object.values(SECTION_HEIGHTS).reduce((a, b) => a + b, 0) * window.innerHeight;

// ─── Main App ────────────────────────────────────────────────────────────────

export default function App() {
  // Backend status
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [statusError, setStatusError] = useState<Error | null>(null);

  // File state
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Language
  const [lang, setLang] = useState('tam+eng');

  // OCR state
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<OCRResult | null>(null);
  const [editedText, setEditedText] = useState('');

  // Scroll background
  const scrollProgress = useScrollProgress(TOTAL_SCROLL_HEIGHT);
  const reducedMotion = useReducedMotion();

  // ─── Backend status polling ────────────────────────────────────────────────
  useEffect(() => {
    let active = true;
    let retryTimer: ReturnType<typeof setTimeout>;

    const checkStatus = async () => {
      try {
        const nextStatus = await fetchStatus();
        if (active) {
          setStatus(nextStatus);
          setStatusError(null);
        }
      } catch (err: unknown) {
        if (active) {
          setStatusError(err instanceof Error ? err : new Error(String(err)));
        }
      } finally {
        if (active) retryTimer = setTimeout(checkStatus, 5000);
      }
    };

    void checkStatus();
    return () => {
      active = false;
      clearTimeout(retryTimer);
    };
  }, []);

  // ─── File handling ─────────────────────────────────────────────────────────
  const handleFileSelect = useCallback((f: File) => {
    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png',
      'image/tiff', 'image/tif', 'image/bmp',
      'image/x-tiff', 'image/x-bmp',
    ];
    const allowedExts = ['.jpg', '.jpeg', '.png', '.tiff', '.tif', '.bmp'];
    const ext = '.' + f.name.split('.').pop()?.toLowerCase();

    if (!allowedTypes.includes(f.type) && !allowedExts.includes(ext)) {
      setUploadError('Unsupported file type. Use JPEG, PNG, TIFF, or BMP.');
      return;
    }

    if (f.size > 20 * 1024 * 1024) {
      setUploadError('File too large. Maximum size is 20 MB.');
      return;
    }

    setUploadError(null);
    setFile(f);
    setResult(null);
    setEditedText('');

    const url = URL.createObjectURL(f);
    setPreview(url);
  }, []);

  const handleRemoveFile = useCallback(() => {
    if (preview) URL.revokeObjectURL(preview);
    setFile(null);
    setPreview(null);
    setResult(null);
    setEditedText('');
    setUploadError(null);
  }, [preview]);

  // ─── Run OCR ────────────────────────────────────────────────────────────────
  const runOcr = useCallback(async () => {
    if (!file) return;
    setProcessing(true);
    setProgress(0);
    setResult(null);
    setEditedText('');

    try {
      const res = await runOCR(file, lang, (p) => setProgress(p));
      setResult(res);
      setEditedText(res.cleaned_text || res.raw_text);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setResult({
        success: false,
        raw_text: '',
        cleaned_text: '',
        words_with_confidence: [],
        regions_found: 0,
        engine: 'gemini',
        engine_model: '',
        api_key_configured: false,
        language: lang,
        error: `Network error: ${msg}. Check that the backend is running and reachable.`,
      });
    } finally {
      setProcessing(false);
      setProgress(100);
    }
  }, [file, lang]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(editedText);
  }, [editedText]);

  // ─── Status chip logic ─────────────────────────────────────────────────────
  const isBackendOffline =
    statusError !== null &&
    !(statusError instanceof ApiHttpError) &&
    !(statusError instanceof ApiResponseError);

  const chipVariant = isBackendOffline
    ? 'error'
    : statusError
    ? 'warn'
    : !status
    ? 'warn'
    : status.ready
    ? 'ok'
    : 'warn';

  const chipLabel = isBackendOffline
    ? 'Backend offline'
    : statusError instanceof ApiHttpError
    ? `API error ${statusError.status}`
    : statusError instanceof ApiResponseError
    ? 'Unexpected response'
    : !status
    ? 'Connecting…'
    : status.ready
    ? `Gemini ${status.gemini_model}`
    : !status.ocr_engine_loaded
    ? 'Engine unavailable'
    : !status.api_key_configured
    ? 'API key not set'
    : 'OCR not ready';

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Scroll-driven animated background — z-index 0, behind everything */}
      <ScrollBackground progress={scrollProgress} reducedMotion={reducedMotion} />

      {/* Minimal status indicator — top-right, fixed */}
      <header className="status-bar" role="status" aria-live="polite">
        <div className={`status-chip ${chipVariant}`}>
          <span className="status-dot" aria-hidden="true" />
          {chipLabel}
        </div>
      </header>

      {/* Main scrollable content — z-index 10, above background */}
      <main className="main-content">
        {/* Section 1: Upload */}
        <SectionUpload
          file={file}
          preview={preview}
          onFileSelect={handleFileSelect}
          onRemoveFile={handleRemoveFile}
          error={uploadError}
        />

        {/* Section 2: Language Selection */}
        <SectionLanguage
          preview={preview}
          fileName={file?.name ?? null}
          language={lang}
          onLanguageChange={setLang}
          processing={processing}
          onRunOcr={runOcr}
        />

        {/* Section 3: Output */}
        <SectionOutput
          result={result}
          processing={processing}
          progress={progress}
          file={file}
          editedText={editedText}
          onTextChange={setEditedText}
          onCopy={handleCopy}
        />

        {/* Section 4: Footer & Team */}
        <Footer />
      </main>
    </>
  );
}