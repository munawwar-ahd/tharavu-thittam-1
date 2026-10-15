import { useCallback, useRef, useState } from 'react';
import type { DragEvent, ChangeEvent } from 'react';

interface SectionUploadProps {
  file: File | null;
  preview: string | null;
  onFileSelect: (file: File) => void;
  onRemoveFile: () => void;
  error: string | null;
}

const ACCEPTED_TYPES = '.jpg,.jpeg,.png,.tiff,.tif,.bmp';
const ALLOWED_MIME = ['image/jpeg', 'image/jpg', 'image/png', 'image/tiff', 'image/tif', 'image/bmp', 'image/x-tiff', 'image/x-bmp'];
const ALLOWED_EXT = ['.jpg', '.jpeg', '.png', '.tiff', '.tif', '.bmp'];

export function SectionUpload({ file, preview, onFileSelect, onRemoveFile, error }: SectionUploadProps) {
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    if (dropZoneRef.current && !dropZoneRef.current.contains(e.relatedTarget as Node)) {
      setDragOver(false);
    }
  }, []);

  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) onFileSelect(dropped);
  }, [onFileSelect]);

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileInput = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) onFileSelect(selected);
    // Reset input so re-selecting same file triggers onChange
    e.target.value = '';
  }, [onFileSelect]);

  const validateFile = (f: File): boolean => {
    const ext = '.' + f.name.split('.').pop()?.toLowerCase();
    return ALLOWED_MIME.includes(f.type) || ALLOWED_EXT.includes(ext);
  };

  return (
    <section className="section section-upload" aria-labelledby="upload-heading">
      <div className="section-content">
        {/* Hidden heading for accessibility */}
        <h1 id="upload-heading" className="section-title" style={{ textAlign: 'center' }}>
          தரவு திட்டம் - DATA PLAN
        </h1>

        <div
          ref={dropZoneRef}
          className={`drop-zone ${dragOver ? 'drag-over' : ''} ${file ? 'has-file' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={!file ? handleClick : undefined}
          role={!file ? 'button' : undefined}
          tabIndex={!file ? 0 : undefined}
          onKeyDown={!file
            ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleClick(); } }
            : undefined
          }
          aria-label={
            file
              ? 'Image selected'
              : 'Drop zone — drop an image here or click to browse'
          }
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_TYPES}
            onChange={handleFileInput}
            onClick={(e) => e.stopPropagation()}
            className="drop-zone-input"
            aria-hidden="true"
            tabIndex={-1}
          />

          {!file ? (
            <>
              {/* Upload icon */}
              <div className="drop-zone-icon" aria-hidden="true">
                <svg
                  width="44"
                  height="44"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </div>
              <p className="drop-zone-text">Drop image</p>
              <p className="drop-zone-subtext">JPEG · PNG · TIFF · BMP</p>
            </>
          ) : (
            <>
              {preview && (
                <div className="drop-zone-preview">
                  <img src={preview} alt="Uploaded image preview" />
                </div>
              )}
              <p className="drop-zone-filename">{file.name}</p>
              <p className="drop-zone-filesize">
                {(file.size / 1024).toFixed(1)} KB
                {file.type ? ` · ${file.type}` : ''}
              </p>
              <button
                className="drop-zone-replace"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClick();
                }}
                aria-label="Replace image"
              >
                Replace
              </button>
            </>
          )}
        </div>

        {error && (
          <div className="upload-error" role="alert" aria-live="assertive">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {file && !validateFile(file) && (
          <div className="upload-error" role="alert">
            <span>Unsupported file type. Use JPEG, PNG, TIFF, or BMP.</span>
          </div>
        )}

        {file && (
          <button
            className="btn-remove"
            onClick={(e) => { e.stopPropagation(); onRemoveFile(); }}
            aria-label="Remove selected image"
            type="button"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
            Remove
          </button>
        )}
      </div>
    </section>
  );
}