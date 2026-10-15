import { useCallback } from 'react';

interface SectionLanguageProps {
  preview: string | null;
  fileName: string | null;
  language: string;
  onLanguageChange: (lang: string) => void;
  processing: boolean;
  onRunOcr: () => void;
}

// Three radio options as specified in the wireframe: Tamil, English, Hindi
const LANG_OPTIONS = [
  { code: 'tam', label: 'Tamil' },
  { code: 'eng', label: 'English' },
  { code: 'hin', label: 'Hindi' },
] as const;

export function SectionLanguage({
  preview,
  fileName,
  language,
  onLanguageChange,
  processing,
  onRunOcr,
}: SectionLanguageProps) {
  const handleRadioChange = useCallback(
    (code: string) => {
      onLanguageChange(code);
    },
    [onLanguageChange],
  );

  return (
    <section className="section section-language" aria-labelledby="language-heading">
      <div className="section-content">
        <h2 id="language-heading" className="section-title">
          Select language
        </h2>

        {preview && (
          <div className="image-preview-container">
            <img
              src={preview}
              alt={`Preview of ${fileName ?? 'uploaded image'}`}
              className="image-preview-img"
            />
            {fileName && <div className="image-preview-label">{fileName}</div>}
          </div>
        )}

        <div className="language-options" role="radiogroup" aria-label="OCR language selection">
          {LANG_OPTIONS.map((opt) => (
            <label
              key={opt.code}
              className={`radio-option ${language === opt.code ? 'active' : ''}`}
            >
              <input
                type="radio"
                name="ocr-language"
                value={opt.code}
                checked={language === opt.code}
                onChange={() => handleRadioChange(opt.code)}
                disabled={processing}
                className="radio-input"
                aria-label={opt.label}
              />
              <span className="radio-custom" aria-hidden="true">
                <span className="radio-dot" />
              </span>
              <span className="radio-label">{opt.label}</span>
            </label>
          ))}
        </div>

        <button
          className="btn-primary btn-run-ocr"
          id="run-ocr-btn"
          onClick={onRunOcr}
          disabled={!preview || processing}
          aria-busy={processing}
        >
          {processing ? (
            <>
              <span className="btn-spinner" aria-hidden="true" />
              Processing…
            </>
          ) : (
            'Extract Text'
          )}
        </button>
      </div>
    </section>
  );
}