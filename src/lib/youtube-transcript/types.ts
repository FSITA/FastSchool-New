export interface TranscriptResult {
  success: boolean;
  source?: "gemini-summary" | "innertube-api";
  transcript?: string;
  error?: string;
}

export interface Tier1Result {
  success: boolean;
  transcript?: string;
  error?: string;
}

export interface Tier2Result {
  success: boolean;
  transcript?: string;
  error?: string;
}

