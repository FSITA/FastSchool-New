export interface TranscriptResult {
  success: boolean;
  source?: 'innertube-api' | 'youtube-transcript-io';
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

export interface Tier3Result {
  success: boolean;
  transcript?: string;
  error?: string;
}

