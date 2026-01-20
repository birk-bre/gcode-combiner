import { useCallback, useRef, useState } from 'react';

interface DropZoneProps {
  onFilesSelected: (files: File[]) => void;
  disabled?: boolean;
}

export function DropZone({ onFilesSelected, disabled = false }: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!disabled) {
        setIsDragging(true);
      }
    },
    [disabled],
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (disabled) return;

      const files = Array.from(e.dataTransfer.files).filter(
        (file) =>
          file.name.endsWith('.gcode.3mf') || file.name.endsWith('.3mf'),
      );

      if (files.length > 0) {
        onFilesSelected(files);
      }
    },
    [onFilesSelected, disabled],
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files ? Array.from(e.target.files) : [];
      if (files.length > 0) {
        onFilesSelected(files);
      }
      e.target.value = '';
    },
    [onFilesSelected],
  );

  const handleClick = useCallback(() => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [disabled]);

  return (
    <button
      type="button"
      className={`
        relative w-full rounded-2xl text-center cursor-pointer
        transition-all duration-300 ease-out group
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={handleClick}
      disabled={disabled}
      aria-label="Upload files"
    >
      {/* Background */}
      <div
        className={`
        absolute inset-0 rounded-2xl transition-all duration-300
        ${
          isDragging
            ? 'bg-[var(--color-accent)]/8 border-2 border-dashed border-[var(--color-accent)]'
            : 'bg-[var(--color-bg-elevated)] border-2 border-dashed border-[var(--color-border)] group-hover:border-[var(--color-text-muted)] group-hover:bg-[var(--color-bg-surface)]'
        }
      `}
      />

      {/* Content */}
      <div className="relative z-10 p-10 sm:p-12">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".3mf,.gcode.3mf"
          onChange={handleFileInput}
          className="hidden"
          disabled={disabled}
        />

        <div className="flex flex-col items-center gap-5">
          {/* Icon */}
          <div
            className={`
            w-14 h-14 rounded-xl flex items-center justify-center transition-all duration-300
            ${
              isDragging
                ? 'bg-[var(--color-accent)]/20 scale-110'
                : 'bg-[var(--color-bg-surface)] group-hover:bg-[var(--color-bg-hover)] group-hover:scale-105'
            }
          `}
          >
            <svg
              className={`w-7 h-7 transition-colors duration-300 ${
                isDragging
                  ? 'text-[var(--color-accent)]'
                  : 'text-[var(--color-text-muted)] group-hover:text-[var(--color-accent)]'
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
          </div>

          {/* Text */}
          <div className="space-y-1.5">
            <p
              className={`
              text-base font-medium transition-colors duration-300
              ${isDragging ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-primary)]'}
            `}
            >
              {isDragging ? 'Drop to upload' : 'Drop your print files here'}
            </p>
            <p className="text-sm text-[var(--color-text-muted)]">
              or{' '}
              <span className="text-[var(--color-accent)] hover:underline">
                browse
              </span>{' '}
              to select
            </p>
          </div>

          {/* Supported format badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--color-bg-base)] border border-[var(--color-border-subtle)]">
            <svg
              className="w-3.5 h-3.5 text-[var(--color-text-muted)]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <span className="text-xs font-medium text-[var(--color-text-muted)]">
              .gcode.3mf files
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}
