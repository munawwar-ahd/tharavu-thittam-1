import { useCallback, useEffect, useRef, useState } from 'react';
import type { OCRResult } from '../api';

interface SectionOutputProps {
  result: OCRResult | null;
  processing: boolean;
  progress: number;
  file: File | null;
  editedText: string;
  onTextChange: (text: string) => void;
  onCopy: () => void;
}

function downloadText(text: string, filename: string) {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

function downloadJSON(data: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

export function SectionOutput({ result, processing, progress, file, editedText, onTextChange, onCopy }: SectionOutputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [copied, setCopied] = useState(false);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = 'auto';
      ta.style.height = `${Math.max(200, ta.scrollHeight)}px`;
    }
  }, [editedText, result]);

  const handleCopy = useCallback(() => {
    onCopy();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [onCopy]);

  const handleDownloadText = useCallback(() => {
    if (!result) return;
    downloadText(editedText, 'tamil_ocr_output.txt');
  }, [result, editedText]);

  const handleDownloadJson = useCallback(() => {
    if (!result || !file) return;
    downloadJSON({
      file: file.name,
      language: result.language,
      engine: result.engine,
      engine_model: result.engine_model,
      raw_text: result.raw_text,
      cleaned_text: result.cleaned_text,
      edited_text: editedText,
    }, 'tamil_ocr_result.json');
  }, [result, file, editedText]);

  const handleDownloadRaw = useCallback(() => {
    if (!result) return;
    downloadText(result.raw_text, 'raw_ocr_output.txt');
  }, [result]);

  return (
    <section className="section section-output" aria-labelledby="output-heading">
      <div className="section-content">
        <h2 id="output-heading" className="section-title">Output</h2>

        {processing && (
          <div className="progress-container" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label="OCR processing progress">
            <div className="progress-bar" style={{ width: `${progress}%` }} />
            <span className="progress-text">{Math.round(progress)}%</span>
          </div>
        )}

        {result?.error && (
          <div className="output-error" role="alert">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
            <div className="output-error-content">
              <strong>Error</strong>
              <p>{result.error}</p>
            </div>
          </div>
        )}

        {result?.success && (
          <>
            <div className="output-header">
              <div className="output-meta">
                <span className="output-engine">{result.engine_model || 'Gemini'}</span>
                <span className="output-lang">{result.language}</span>
              </div>
              <div className="output-actions">
                <button
                  className="btn-secondary"
                  onClick={handleCopy}
                  aria-label={copied ? 'Copied to clipboard' : 'Copy to clipboard'}
                >
                  {copied ? (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      Copied
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                      </svg>
                      Copy
                    </>
                  )}
                </button>
                <button
                  className="btn-secondary"
                  onClick={() => onTextChange(result.raw_text)}
                  aria-label="Reset to raw OCR output"
                >
                  Reset
                </button>
              </div>
            </div>

            <textarea
              ref={textareaRef}
              className="output-textarea"
              value={editedText}
              onChange={(e) => onTextChange(e.target.value)}
              spellCheck={false}
              placeholder="OCR output will appear here…"
              aria-label="OCR output text"
              rows={12}
            />

            <div className="output-success" role="status">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>Transcription complete. You can edit the text above.</span>
            </div>

            <div className="output-export">
              <button className="btn-export" onClick={handleDownloadText}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                Download Text
              </button>
              <button className="btn-export" onClick={handleDownloadJson}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                </svg>
                Download JSON
              </button>
              <button className="btn-export" onClick={handleDownloadRaw}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
                Download Raw
              </button>
            </div>
          </>
        )}

        {!result && !processing && (
          <div className="output-empty">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <p className="output-empty-title">No result yet</p>
            <p className="output-empty-sub">Upload an image, select a language, and click <strong>Extract Text</strong> to run OCR.</p>
          </div>
        )}
      </div>
    </section>
  );
}