import JSZip from 'jszip';
import type { ExtractedPlates, GCodeFile, ParsedGCodeInfo } from '../types';

export class FileProcessingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FileProcessingError';
  }
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

function parseEstimatedTime(gcode: string): string | null {
  // Bambu Lab slicer typically includes time estimates in comments like:
  // ; estimated printing time (normal mode) = 1h 23m 45s
  // ; total estimated time: 1234
  // Or in the format: ;TIME:1234 (seconds)

  const timePatterns = [
    /;\s*estimated printing time.*?=\s*(.+?)(?:\n|$)/i,
    /;\s*TIME[_:]?\s*(\d+)/i,
    /;\s*total estimated time[:\s]*(.+?)(?:\n|$)/i,
  ];

  for (const pattern of timePatterns) {
    const match = gcode.match(pattern);
    if (match) {
      const value = match[1].trim();
      // If it's just a number, it's likely seconds
      if (/^\d+$/.test(value)) {
        const seconds = Number.parseInt(value, 10);
        return formatSeconds(seconds);
      }
      return value;
    }
  }

  return null;
}

function formatSeconds(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`);

  return parts.join(' ');
}

export async function extractAllPlatesFromZip(
  file: File,
): Promise<ExtractedPlates> {
  let zip: JSZip;
  let arrayBuffer: ArrayBuffer;

  try {
    arrayBuffer = await file.arrayBuffer();
    zip = await JSZip.loadAsync(arrayBuffer);
  } catch {
    throw new FileProcessingError(
      `"${file.name}" is not a valid ZIP archive. Make sure you're uploading a .gcode.3mf file.`,
    );
  }

  const plates: ParsedGCodeInfo[] = [];

  // Look for all plate G-code files (plate_1.gcode through plate_16.gcode to be safe)
  for (let plateNum = 1; plateNum <= 16; plateNum++) {
    const gcodePath = `Metadata/plate_${plateNum}.gcode`;
    const gcodeFile = zip.file(gcodePath);

    if (gcodeFile) {
      const gcodeContent = await gcodeFile.async('string');
      const lineCount = gcodeContent.split('\n').length;
      const estimatedTime = parseEstimatedTime(gcodeContent);

      plates.push({
        gcode: gcodeContent,
        lineCount,
        estimatedTime,
        plateNumber: plateNum,
      });
    }
  }

  // If no plates found in standard locations, search for any .gcode files
  if (plates.length === 0) {
    const allFiles = Object.keys(zip.files);
    const gcodeFiles = allFiles
      .filter((name) => name.endsWith('.gcode') && !zip.files[name].dir)
      .sort();

    for (let i = 0; i < gcodeFiles.length; i++) {
      const gcodeContent = await zip.file(gcodeFiles[i])?.async('string');
      if (gcodeContent) {
        const lineCount = gcodeContent.split('\n').length;
        const estimatedTime = parseEstimatedTime(gcodeContent);

        plates.push({
          gcode: gcodeContent,
          lineCount,
          estimatedTime,
          plateNumber: i + 1,
        });
      }
    }
  }

  if (plates.length === 0) {
    throw new FileProcessingError(
      `"${file.name}" doesn't contain any G-code. Make sure you exported it as "All plates sliced file" or "Plate sliced file" from Bambu Studio.`,
    );
  }

  return {
    plates,
    originalZip: arrayBuffer,
    fileName: file.name,
  };
}

export async function processUploadedFile(file: File): Promise<GCodeFile[]> {
  const { plates, originalZip, fileName } = await extractAllPlatesFromZip(file);

  const isMultiPlate = plates.length > 1;

  return plates.map((plate) => ({
    id: generateId(),
    fileName: fileName,
    displayName: isMultiPlate
      ? `${fileName} — Plate ${plate.plateNumber}`
      : fileName,
    gcode: plate.gcode,
    originalZip: originalZip,
    lineCount: plate.lineCount,
    estimatedTime: plate.estimatedTime,
    copies: 1,
    plateNumber: plate.plateNumber,
    sourceFile: fileName,
  }));
}

export function parseTimeToSeconds(timeStr: string): number {
  // Parse formats like "1h 23m 45s" or "1h23m45s" or just "1234"
  if (/^\d+$/.test(timeStr.trim())) {
    return Number.parseInt(timeStr.trim(), 10);
  }

  let totalSeconds = 0;

  const hourMatch = timeStr.match(/(\d+)\s*h/i);
  const minMatch = timeStr.match(/(\d+)\s*m/i);
  const secMatch = timeStr.match(/(\d+)\s*s/i);

  if (hourMatch) totalSeconds += Number.parseInt(hourMatch[1], 10) * 3600;
  if (minMatch) totalSeconds += Number.parseInt(minMatch[1], 10) * 60;
  if (secMatch) totalSeconds += Number.parseInt(secMatch[1], 10);

  return totalSeconds;
}

export function calculateTotalTime(files: GCodeFile[]): string | null {
  let totalSeconds = 0;
  let hasAnyTime = false;

  for (const file of files) {
    if (file.estimatedTime) {
      hasAnyTime = true;
      const seconds = parseTimeToSeconds(file.estimatedTime);
      totalSeconds += seconds * file.copies;
    }
  }

  if (!hasAnyTime) return null;

  return formatSeconds(totalSeconds);
}
