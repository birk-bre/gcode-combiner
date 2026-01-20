import { useCallback, useState } from 'react';
import type { GCodeFile } from '../types';

interface FileListProps {
  files: GCodeFile[];
  onReorder: (files: GCodeFile[]) => void;
  onUpdateCopies: (id: string, copies: number) => void;
  onRemove: (id: string) => void;
  disabled?: boolean;
}

interface FileItemProps {
  file: GCodeFile;
  index: number;
  onUpdateCopies: (id: string, copies: number) => void;
  onRemove: (id: string) => void;
  onDragStart: (index: number) => void;
  onDragOver: (index: number) => void;
  onDragEnd: () => void;
  isDragging: boolean;
  dragOverIndex: number | null;
  disabled?: boolean;
}

function FileItem({
  file,
  index,
  onUpdateCopies,
  onRemove,
  onDragStart,
  onDragOver,
  onDragEnd,
  isDragging,
  dragOverIndex,
  disabled = false,
}: FileItemProps) {
  const isDropTarget = dragOverIndex === index;

  const handleCopiesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.max(
      1,
      Math.min(99, Number.parseInt(e.target.value, 10) || 1),
    );
    onUpdateCopies(file.id, value);
  };

  const incrementCopies = () => {
    if (file.copies < 99) {
      onUpdateCopies(file.id, file.copies + 1);
    }
  };

  const decrementCopies = () => {
    if (file.copies > 1) {
      onUpdateCopies(file.id, file.copies - 1);
    }
  };

  return (
    <li
      draggable={!disabled}
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = 'move';
        onDragStart(index);
      }}
      onDragOver={(e) => {
        e.preventDefault();
        onDragOver(index);
      }}
      onDragEnd={onDragEnd}
      className={`
        relative flex items-center gap-3 p-4 rounded-xl list-none
        transition-all duration-200 group
        ${
          isDropTarget
            ? 'bg-[var(--color-accent)]/10 ring-2 ring-[var(--color-accent)] ring-inset'
            : 'cozy-card'
        }
        ${isDragging ? 'opacity-40 scale-[0.98]' : ''}
        ${disabled ? 'opacity-60' : 'cursor-grab active:cursor-grabbing'}
      `}
      style={{
        animationDelay: `${index * 0.05}s`,
      }}
    >
      {/* Drag Handle */}
      <div className="flex-shrink-0 text-[var(--color-text-muted)] group-hover:text-[var(--color-text-secondary)] transition-colors">
        <svg
          className="w-5 h-5"
          fill="currentColor"
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z" />
        </svg>
      </div>

      {/* Sequence Number */}
      <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-[var(--color-bg-surface)] flex items-center justify-center">
        <span className="text-sm font-semibold text-[var(--color-accent)]">
          {index + 1}
        </span>
      </div>

      {/* File Info */}
      <div className="flex-grow min-w-0">
        <p
          className="text-sm font-medium text-[var(--color-text-primary)] truncate"
          title={file.displayName}
        >
          {file.displayName}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-[var(--color-text-muted)]">
            {file.lineCount.toLocaleString()} lines
          </span>
          {file.estimatedTime && (
            <>
              <span className="text-[var(--color-border)]">·</span>
              <span className="text-xs text-[var(--color-text-muted)]">
                {file.estimatedTime}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Copies Control */}
      <div className="flex items-center gap-1 bg-[var(--color-bg-base)] rounded-lg p-1 border border-[var(--color-border-subtle)]">
        <button
          type="button"
          onClick={decrementCopies}
          disabled={disabled || file.copies <= 1}
          className="w-7 h-7 rounded-md flex items-center justify-center
                     text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]
                     hover:bg-[var(--color-bg-surface)]
                     disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent
                     transition-all duration-150"
          aria-label="Decrease copies"
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
              d="M20 12H4"
            />
          </svg>
        </button>
        <input
          type="number"
          min={1}
          max={99}
          value={file.copies}
          onChange={handleCopiesChange}
          disabled={disabled}
          className="w-10 h-7 bg-transparent text-center text-sm font-semibold
                     text-[var(--color-accent)] focus:outline-none disabled:opacity-60
                     [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        <button
          type="button"
          onClick={incrementCopies}
          disabled={disabled || file.copies >= 99}
          className="w-7 h-7 rounded-md flex items-center justify-center
                     text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]
                     hover:bg-[var(--color-bg-surface)]
                     disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent
                     transition-all duration-150"
          aria-label="Increase copies"
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
              d="M12 4v16m8-8H4"
            />
          </svg>
        </button>
      </div>

      {/* Delete Button */}
      <button
        type="button"
        onClick={() => onRemove(file.id)}
        disabled={disabled}
        className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center
                   text-[var(--color-text-muted)] hover:text-[var(--color-error)]
                   hover:bg-[var(--color-error)]/10
                   disabled:opacity-40 disabled:cursor-not-allowed
                   transition-all duration-150"
        aria-label={`Remove ${file.displayName}`}
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
            strokeWidth={1.5}
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
          />
        </svg>
      </button>
    </li>
  );
}

export function FileList({
  files,
  onReorder,
  onUpdateCopies,
  onRemove,
  disabled = false,
}: FileListProps) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragStart = useCallback((index: number) => {
    setDragIndex(index);
  }, []);

  const handleDragOver = useCallback((index: number) => {
    setDragOverIndex(index);
  }, []);

  const handleDragEnd = useCallback(() => {
    if (
      dragIndex !== null &&
      dragOverIndex !== null &&
      dragIndex !== dragOverIndex
    ) {
      const newFiles = [...files];
      const [draggedItem] = newFiles.splice(dragIndex, 1);
      newFiles.splice(dragOverIndex, 0, draggedItem);
      onReorder(newFiles);
    }
    setDragIndex(null);
    setDragOverIndex(null);
  }, [dragIndex, dragOverIndex, files, onReorder]);

  if (files.length === 0) {
    return null;
  }

  const totalPrints = files.reduce((sum, f) => sum + f.copies, 0);

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="status-warm" />
            <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
              Print Queue
            </h2>
          </div>
          <span className="text-sm text-[var(--color-text-muted)]">
            {files.length} file{files.length !== 1 ? 's' : ''} · {totalPrints}{' '}
            print{totalPrints !== 1 ? 's' : ''}
          </span>
        </div>
        <span className="text-xs text-[var(--color-text-muted)]">
          Drag to reorder
        </span>
      </div>

      {/* File List */}
      <ul className="space-y-2">
        {files.map((file, index) => (
          <FileItem
            key={file.id}
            file={file}
            index={index}
            onUpdateCopies={onUpdateCopies}
            onRemove={onRemove}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            isDragging={dragIndex === index}
            dragOverIndex={dragOverIndex}
            disabled={disabled}
          />
        ))}
      </ul>
    </div>
  );
}
