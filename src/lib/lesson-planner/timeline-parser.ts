import { TimelineRow, TimelineParseResult } from '@/types/lesson-planner';

/**
 * Smart timeline parser with multiple detection strategies and auto-correction
 */
export class TimelineParser {
  
  /**
   * Parse timeline content using multiple strategies
   */
  static parseTimelineContent(content: string): TimelineParseResult {
    console.log('🔍 Parsing timeline content:', content.substring(0, 200) + '...');
    
    // Strategy 1: Standard pipe-separated format
    const pipeResult = this.parsePipeSeparated(content);
    if (pipeResult.success) {
      console.log('✅ Successfully parsed using pipe-separated strategy');
      return pipeResult;
    }
    
    // Strategy 2: Tab-separated format
    const tabResult = this.parseTabSeparated(content);
    if (tabResult.success) {
      console.log('✅ Successfully parsed using tab-separated strategy');
      return tabResult;
    }
    
    // Strategy 3: Structured list format
    const listResult = this.parseStructuredList(content);
    if (listResult.success) {
      console.log('✅ Successfully parsed using structured list strategy');
      return listResult;
    }
    
    // Strategy 4: Auto-correction for common issues
    const correctedResult = this.parseWithAutoCorrection(content);
    if (correctedResult.success) {
      console.log('✅ Successfully parsed using auto-correction strategy');
      return correctedResult;
    }
    
    console.log('❌ All parsing strategies failed, using fallback');
    return {
      success: false,
      rows: [],
      error: 'Unable to parse timeline content',
      fallbackContent: content
    };
  }
  
  /**
   * Strategy 1: Parse pipe-separated format
   */
  private static parsePipeSeparated(content: string): TimelineParseResult {
    const lines = content.split('\n').filter(line => line.trim());
    const rows: TimelineRow[] = [];
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      // Skip empty lines, headers, and separators
      if (!trimmed || 
          trimmed.includes('Duration') || 
          trimmed.includes('Activity') ||
          trimmed.match(/^\|[\s\-:]+\|/) ||
          trimmed.match(/^\|\s*\*\s*\*\s*\*\s*\|/)) {
        continue;
      }
      
      // Check if line contains pipe separators
      if (trimmed.includes('|')) {
        const cells = trimmed.split('|').map(cell => cell.trim());
        
        // Validate we have exactly 4 columns
        if (cells.length === 4) {
          const row = this.validateAndCreateRow(cells);
          if (row) {
            rows.push(row);
          }
        }
      }
    }
    
    return {
      success: rows.length > 0,
      rows,
      error: rows.length === 0 ? 'No valid pipe-separated rows found' : undefined
    };
  }
  
  /**
   * Strategy 2: Parse tab-separated format
   */
  private static parseTabSeparated(content: string): TimelineParseResult {
    const lines = content.split('\n').filter(line => line.trim());
    const rows: TimelineRow[] = [];
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      // Skip empty lines and headers
      if (!trimmed || 
          trimmed.includes('Duration') || 
          trimmed.includes('Activity')) {
        continue;
      }
      
      // Check if line contains tab separators
      if (trimmed.includes('\t')) {
        const cells = trimmed.split('\t').map(cell => cell.trim());
        
        if (cells.length === 4) {
          const row = this.validateAndCreateRow(cells);
          if (row) {
            rows.push(row);
          }
        }
      }
    }
    
    return {
      success: rows.length > 0,
      rows,
      error: rows.length === 0 ? 'No valid tab-separated rows found' : undefined
    };
  }
  
  /**
   * Strategy 3: Parse structured list format
   */
  private static parseStructuredList(content: string): TimelineParseResult {
    const lines = content.split('\n').filter(line => line.trim());
    const rows: TimelineRow[] = [];
    let currentRow: string[] = [];
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      // Skip empty lines and headers
      if (!trimmed || 
          trimmed.includes('Duration') || 
          trimmed.includes('Activity')) {
        continue;
      }
      
      // Check for bullet points or numbered items
      if (trimmed.match(/^[\d\-\•\*]\s+/)) {
        // If we have a complete row, process it
        if (currentRow.length === 4) {
          const row = this.validateAndCreateRow(currentRow);
          if (row) {
            rows.push(row);
          }
        }
        currentRow = [trimmed.replace(/^[\d\-\•\*]\s+/, '')];
      } else if (currentRow.length > 0 && currentRow.length < 4) {
        // Add to current row
        currentRow.push(trimmed);
      }
    }
    
    // Process the last row
    if (currentRow.length === 4) {
      const row = this.validateAndCreateRow(currentRow);
      if (row) {
        rows.push(row);
      }
    }
    
    return {
      success: rows.length > 0,
      rows,
      error: rows.length === 0 ? 'No valid structured list rows found' : undefined
    };
  }
  
  /**
   * Strategy 4: Parse with auto-correction for common issues
   */
  private static parseWithAutoCorrection(content: string): TimelineParseResult {
    const lines = content.split('\n').filter(line => line.trim());
    const rows: TimelineRow[] = [];
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      // Skip empty lines and headers
      if (!trimmed || 
          trimmed.includes('Duration') || 
          trimmed.includes('Activity')) {
        continue;
      }
      
      // Try to detect and fix common formatting issues
      let correctedLine = trimmed;
      
      // Fix missing separators between columns
      if (!correctedLine.includes('|') && !correctedLine.includes('\t')) {
        // Try to detect column boundaries by looking for time patterns
        const timeMatch = correctedLine.match(/(\d+\s*(?:min|minutes?|hr|hour|h))/i);
        if (timeMatch) {
          const timeIndex = timeMatch.index! + timeMatch[0].length;
          correctedLine = correctedLine.substring(0, timeIndex) + ' | ' + correctedLine.substring(timeIndex);
        }
      }
      
      // Try to split and validate
      const separators = ['|', '\t'];
      for (const separator of separators) {
        if (correctedLine.includes(separator)) {
          const cells = correctedLine.split(separator).map(cell => cell.trim());
          
          // Try to fix column count issues
          if (cells.length === 3) {
            // Split the last column if it seems to contain multiple pieces
            const lastCell = cells[2];
            if (lastCell.includes('.') && lastCell.length > 50) {
              const parts = lastCell.split('.');
              if (parts.length >= 2) {
                cells[2] = parts[0].trim();
                cells[3] = parts.slice(1).join('.').trim();
              }
            }
          }
          
          if (cells.length === 4) {
            const row = this.validateAndCreateRow(cells);
            if (row) {
              rows.push(row);
              break;
            }
          }
        }
      }
    }
    
    return {
      success: rows.length > 0,
      rows,
      error: rows.length === 0 ? 'Auto-correction failed to parse content' : undefined
    };
  }
  
  /**
   * Validate and create a timeline row from cells
   */
  private static validateAndCreateRow(cells: string[]): TimelineRow | null {
    if (cells.length !== 4) {
      return null;
    }
    
    const [duration, activity, instructions, teacherNotes] = cells;
    
    // Basic validation
    if (!duration || !activity || !instructions) {
      return null;
    }
    
    // Validate duration format
    const durationPattern = /^\d+\s*(?:min|minutes?|hr|hour|h|sec|seconds?)$/i;
    if (!durationPattern.test(duration.trim())) {
      // Try to extract duration from the cell
      const extractedDuration = duration.match(/(\d+\s*(?:min|minutes?|hr|hour|h|sec|seconds?))/i);
      if (extractedDuration) {
        cells[0] = extractedDuration[0];
      } else {
        return null;
      }
    }
    
    return {
      duration: cells[0].trim(),
      activity: cells[1].trim(),
      instructions: cells[2].trim(),
      teacherNotes: cells[3]?.trim() || ''
    };
  }
  
  /**
   * Format timeline rows for display
   */
  static formatTimelineRows(rows: TimelineRow[]): string {
    if (rows.length === 0) {
      return 'No timeline data available';
    }
    
    return rows.map(row => 
      `${row.duration} | ${row.activity} | ${row.instructions} | ${row.teacherNotes}`
    ).join('\n');
  }
}
