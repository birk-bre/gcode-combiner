import { useCallback, useState } from "react";
import "./App.css";
import { DropZone } from "./components/DropZone";
import { FileList } from "./components/FileList";
import type { GCodeFile, ProcessingState } from "./types";
import {
  calculateTotalTime,
  FileProcessingError,
  processUploadedFile,
} from "./utils/fileProcessor";
import {
  combineGCode,
  createCombinedZip,
  downloadBlob,
} from "./utils/gcodeCombiner";

function App() {
  const [files, setFiles] = useState<GCodeFile[]>([]);
  const [processing, setProcessing] = useState<ProcessingState>({
    isProcessing: false,
    progress: 0,
    message: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [profileConfirmed, setProfileConfirmed] = useState(false);

  const handleFilesSelected = useCallback(async (selectedFiles: File[]) => {
    setError(null);
    setProcessing({
      isProcessing: true,
      progress: 0,
      message: "Processing files...",
    });

    const newFiles: GCodeFile[] = [];
    const errors: string[] = [];

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      setProcessing({
        isProcessing: true,
        progress: ((i + 1) / selectedFiles.length) * 100,
        message: `Processing ${file.name}...`,
      });

      try {
        const processedFiles = await processUploadedFile(file);
        newFiles.push(...processedFiles);
      } catch (err) {
        if (err instanceof FileProcessingError) {
          errors.push(err.message);
        } else {
          errors.push(
            `Error processing "${file.name}": ${err instanceof Error ? err.message : "Unknown error"}`,
          );
        }
      }
    }

    setFiles((prev) => [...prev, ...newFiles]);
    setProcessing({ isProcessing: false, progress: 0, message: "" });

    if (errors.length > 0) {
      setError(errors.join("\n"));
    }
  }, []);

  const handleReorder = useCallback((reorderedFiles: GCodeFile[]) => {
    setFiles(reorderedFiles);
  }, []);

  const handleUpdateCopies = useCallback((id: string, copies: number) => {
    setFiles((prev) =>
      prev.map((file) => (file.id === id ? { ...file, copies } : file)),
    );
  }, []);

  const handleRemove = useCallback((id: string) => {
    setFiles((prev) => prev.filter((file) => file.id !== id));
    setError(null);
  }, []);

  const handleClearAll = useCallback(() => {
    setFiles([]);
    setError(null);
  }, []);

  const handleCombineAndDownload = useCallback(async () => {
    if (files.length === 0) return;

    setError(null);
    setProcessing({
      isProcessing: true,
      progress: 0,
      message: "Combining G-code files...",
    });

    try {
      setProcessing({
        isProcessing: true,
        progress: 30,
        message: "Combining G-code...",
      });

      const combinedGCode = combineGCode(files);

      setProcessing({
        isProcessing: true,
        progress: 60,
        message: "Creating ZIP archive...",
      });

      const zipBlob = await createCombinedZip(files, combinedGCode);

      setProcessing({
        isProcessing: true,
        progress: 90,
        message: "Preparing download...",
      });

      const totalPrints = files.reduce((sum, f) => sum + f.copies, 0);
      const filename = `combined_${totalPrints}_prints.gcode.3mf`;
      downloadBlob(zipBlob, filename);

      setProcessing({ isProcessing: false, progress: 100, message: "" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to combine files");
      setProcessing({ isProcessing: false, progress: 0, message: "" });
    }
  }, [files]);

  const totalPrints = files.reduce((sum, f) => sum + f.copies, 0);
  const totalTime = calculateTotalTime(files);
  const totalLines = files.reduce((sum, f) => sum + f.lineCount * f.copies, 0);

  return (
    <div className="min-h-screen warm-ambient grain-texture relative">
      <div className="relative z-10 max-w-xl mx-auto px-5 py-10 sm:py-16">
        {/* Header */}
        <header className="mb-10 animate-rise text-center">
          {/* Logo */}
          <div className="inline-flex items-center justify-center mb-6">
            <div className="relative w-16 h-16 rounded-2xl bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] flex items-center justify-center shadow-lg">
              <svg
                className="w-8 h-8 text-[var(--color-accent)]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
                />
              </svg>
              {/* Warm indicator */}
              <div className="absolute -top-1 -right-1 status-warm soft-pulse" />
            </div>
          </div>

          <h1 className="font-display text-3xl sm:text-4xl font-semibold text-[var(--color-text-primary)] mb-3 tracking-tight">
            G-code Combiner
          </h1>
          <p className="text-[var(--color-text-secondary)] text-base max-w-sm mx-auto leading-relaxed">
            Merge your Bambu Lab print files into one seamless batch with
            automatic ejection between prints.
          </p>
        </header>

        {/* Main Content */}
        <main className="space-y-5">
          {/* Drop Zone */}
          <div className="animate-rise" style={{ animationDelay: "0.1s" }}>
            <DropZone
              onFilesSelected={handleFilesSelected}
              disabled={processing.isProcessing}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="cozy-card p-4 border-[var(--color-error)]/30 animate-rise">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-[var(--color-error)]/15 flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-4 h-4 text-[var(--color-error)]"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="flex-grow min-w-0">
                  <p className="text-sm font-medium text-[var(--color-error)] mb-1">
                    Something went wrong
                  </p>
                  <p className="text-sm text-[var(--color-text-secondary)] whitespace-pre-wrap">
                    {error}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setError(null)}
                  className="text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors p-1 rounded-lg hover:bg-[var(--color-bg-surface)]"
                  aria-label="Dismiss error"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* Processing Indicator */}
          {processing.isProcessing && (
            <div className="cozy-card p-5 animate-rise">
              <div className="flex items-center gap-3 mb-4">
                <div className="relative w-5 h-5">
                  <div className="absolute inset-0 border-2 border-[var(--color-accent)]/30 rounded-full" />
                  <div className="absolute inset-0 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
                </div>
                <span className="text-sm font-medium text-[var(--color-accent)]">
                  Working on it...
                </span>
              </div>
              <p className="text-sm text-[var(--color-text-secondary)] mb-3">
                {processing.message}
              </p>
              {processing.progress > 0 && (
                <div className="h-2 bg-[var(--color-bg-base)] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[var(--color-accent-muted)] to-[var(--color-accent)] transition-all duration-300 relative shimmer rounded-full"
                    style={{ width: `${processing.progress}%` }}
                  />
                </div>
              )}
            </div>
          )}

          {/* File List */}
          <div className="animate-rise" style={{ animationDelay: "0.15s" }}>
            <FileList
              files={files}
              onReorder={handleReorder}
              onUpdateCopies={handleUpdateCopies}
              onRemove={handleRemove}
              disabled={processing.isProcessing}
            />
          </div>

          {/* Summary & Actions */}
          {files.length > 0 && (
            <div
              className="space-y-4 animate-rise"
              style={{ animationDelay: "0.2s" }}
            >
              {/* Stats */}
              <div className="cozy-card p-5">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="label-soft mb-1">Files</p>
                    <p className="font-display text-2xl font-semibold text-[var(--color-text-primary)]">
                      {files.length}
                    </p>
                  </div>
                  <div>
                    <p className="label-soft mb-1">Total Prints</p>
                    <p className="font-display text-2xl font-semibold text-[var(--color-accent)]">
                      {totalPrints}
                    </p>
                  </div>
                  <div>
                    <p className="label-soft mb-1">Lines</p>
                    <p className="font-display text-2xl font-semibold text-[var(--color-text-primary)]">
                      {totalLines.toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Time Estimate */}
                {totalTime && (
                  <div className="mt-4 pt-4 border-t border-[var(--color-border-subtle)] flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[var(--color-text-muted)]">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span className="text-sm">Estimated print time</span>
                    </div>
                    <span className="font-display font-semibold text-[var(--color-accent)]">
                      {totalTime}
                    </span>
                  </div>
                )}
              </div>

              {/* Profile Confirmation */}
              <div className="cozy-card p-5">
                <label className="flex items-start gap-4 cursor-pointer group">
                  <div className="relative flex-shrink-0 mt-0.5">
                    <input
                      type="checkbox"
                      checked={profileConfirmed}
                      onChange={(e) => setProfileConfirmed(e.target.checked)}
                      className="peer sr-only"
                    />
                    <div
                      className="w-6 h-6 rounded-lg border-2 border-[var(--color-border)] bg-[var(--color-bg-base)]
                                  peer-checked:border-[var(--color-accent)] peer-checked:bg-[var(--color-accent)]
                                  group-hover:border-[var(--color-text-muted)]
                                  transition-all duration-200 flex items-center justify-center"
                    >
                      <svg
                        className="w-4 h-4 text-[var(--color-bg-deep)] opacity-0 peer-checked:opacity-100 transition-opacity duration-200"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                    <svg
                      className={`absolute top-1 left-1 w-4 h-4 text-[var(--color-bg-deep)] transition-opacity duration-200 ${profileConfirmed ? "opacity-100" : "opacity-0"}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <div className="flex-grow">
                    <p className="text-sm font-medium text-[var(--color-text-primary)] mb-1">
                      I've installed the automation profile
                    </p>
                    <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">
                      Your sliced files need the correct start/end G-code for
                      auto-ejection between prints.
                    </p>
                    <a
                      href="https://factoriandesigns.com/print-automation-bambu-lab-a1-a1-mini"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 mt-2 text-sm text-[var(--color-accent)] hover:text-[var(--color-accent-hover)] transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span>Get the profiles from Factorian Designs</span>
                      <svg
                        className="w-3.5 h-3.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                        />
                      </svg>
                    </a>
                  </div>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={handleCombineAndDownload}
                  disabled={
                    processing.isProcessing ||
                    files.length === 0 ||
                    !profileConfirmed
                  }
                  className="flex-grow py-4 px-6 rounded-xl font-semibold text-[var(--color-bg-deep)]
                           bg-gradient-to-b from-[var(--color-accent-hover)] to-[var(--color-accent)]
                           hover:from-[var(--color-accent)] hover:to-[var(--color-accent-muted)]
                           active:scale-[0.98]
                           disabled:from-[var(--color-border)] disabled:to-[var(--color-border)]
                           disabled:text-[var(--color-text-muted)] disabled:cursor-not-allowed
                           transition-all duration-200 shadow-lg hover:shadow-xl
                           disabled:shadow-none"
                >
                  <span className="flex items-center justify-center gap-2">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                      />
                    </svg>
                    <span>Combine & Download</span>
                    <span className="opacity-70">({totalPrints})</span>
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handleClearAll}
                  disabled={processing.isProcessing}
                  className="py-4 px-6 rounded-xl font-medium text-[var(--color-text-secondary)]
                           bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)]
                           hover:border-[var(--color-border)] hover:text-[var(--color-text-primary)]
                           hover:bg-[var(--color-bg-surface)]
                           disabled:opacity-50 disabled:cursor-not-allowed
                           transition-all duration-200"
                >
                  Clear All
                </button>
              </div>
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="mt-16 text-center">
          <div className="divider-warm mb-6" />
          <p className="text-sm text-[var(--color-text-muted)] mb-2">
            Tested to work with A1
          </p>
          <p className="text-xs text-[var(--color-text-muted)] mb-4">
            Everything runs locally in your browser — your files never leave
            your computer.
          </p>
          <a
            href="https://github.com/birk-bre/gcode-combiner"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg
                     text-sm text-[var(--color-text-muted)]
                     hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-surface)]
                     transition-all duration-200"
          >
            <svg
              className="w-5 h-5"
              fill="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                clipRule="evenodd"
              />
            </svg>
            <span>View on GitHub</span>
          </a>
        </footer>
      </div>
    </div>
  );
}

export default App;
