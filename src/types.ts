export interface GCodeFile {
  id: string;
  fileName: string;
  displayName: string;
  gcode: string;
  originalZip: ArrayBuffer;
  lineCount: number;
  estimatedTime: string | null;
  copies: number;
  plateNumber: number | null;
  sourceFile: string;
}

export interface ProcessingState {
  isProcessing: boolean;
  progress: number;
  message: string;
}

export interface ParsedGCodeInfo {
  gcode: string;
  lineCount: number;
  estimatedTime: string | null;
  plateNumber: number;
}

export interface ExtractedPlates {
  plates: ParsedGCodeInfo[];
  originalZip: ArrayBuffer;
  fileName: string;
}
