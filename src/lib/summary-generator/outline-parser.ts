import { SummaryOutline } from '@/types/summary-generator';

/**
 * Smart outline parser for summary content
 */
export class OutlineParser {
  
  /**
   * Parse outlines from AI response
   */
  static parseOutlines(content: string): SummaryOutline[] {
    console.log('🔍 Parsing summary outlines...');
    
    // Clean the content first
    const cleanedContent = OutlineParser.cleanContent(content);
    
    // Try multiple parsing strategies
    const strategies = [
      OutlineParser.parseWithOutlineHeaders,
      OutlineParser.parseWithNumberedSections,
      OutlineParser.parseWithBulletSections,
      OutlineParser.parseWithFallback
    ];
    
    for (const strategy of strategies) {
      const result = strategy(cleanedContent);
      if (result.length >= 10) {
        console.log(`✅ Successfully parsed using ${strategy.name} with ${result.length} outlines`);
        // Ensure exactly 10 outlines
        return result.slice(0, 10);
      } else if (result.length > 0) {
        // If we got some outlines but not 10, pad with empty ones or return what we have
        console.log(`⚠️ Parsed ${result.length} outlines (expected 10) using ${strategy.name}`);
        return OutlineParser.padOutlines(result, 10);
      }
    }
    
    console.log('❌ All parsing strategies failed');
    return [];
  }
  
  /**
   * Strategy 1: Parse with OUTLINE X: headers
   */
  private static parseWithOutlineHeaders(content: string): SummaryOutline[] {
    const outlineRegex = /OUTLINE\s+(\d+):\s*(.*?)(?=OUTLINE\s+\d+:|$)/gs;
    const matches = [...content.matchAll(outlineRegex)];
    
    if (matches.length === 0) return [];
    
    return matches.map(match => {
      const outlineNumber = parseInt(match[1]);
      const fullContent = match[2].trim();
      const lines = fullContent.split('\n').filter(l => l.trim());
      const title = lines[0]?.trim() || `Outline ${outlineNumber}`;
      // Take max 2 lines for content
      const contentLines = lines.slice(1, 3).filter(l => l.trim());
      const content = contentLines.join('\n').trim();
      
      return {
        outlineNumber,
        title,
        content: OutlineParser.truncateToTwoLines(content),
        type: OutlineParser.determineOutlineType(title, content)
      };
    });
  }
  
  /**
   * Strategy 2: Parse with numbered sections
   */
  private static parseWithNumberedSections(content: string): SummaryOutline[] {
    const sectionRegex = /^(\d+)\.\s+(.*?)(?=^\d+\.\s+|$)/gms;
    const matches = [...content.matchAll(sectionRegex)];
    
    if (matches.length === 0) return [];
    
    return matches.map((match, index) => {
      const outlineNumber = parseInt(match[1]);
      const fullContent = match[2].trim();
      const lines = fullContent.split('\n').filter(l => l.trim());
      const title = lines[0]?.trim() || `Outline ${outlineNumber}`;
      const contentLines = lines.slice(1, 3).filter(l => l.trim());
      const content = contentLines.join('\n').trim();
      
      return {
        outlineNumber: outlineNumber || index + 1,
        title,
        content: OutlineParser.truncateToTwoLines(content),
        type: OutlineParser.determineOutlineType(title, content)
      };
    });
  }
  
  /**
   * Strategy 3: Parse with bullet sections
   */
  private static parseWithBulletSections(content: string): SummaryOutline[] {
    const lines = content.split('\n').filter(line => line.trim());
    const outlines: SummaryOutline[] = [];
    let currentOutline: SummaryOutline | null = null;
    let outlineNumber = 1;
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      // Check if this is a section header (starts with bullet or dash with number)
      if (trimmed.match(/^[•\-*]\s+\d+[\.\)]\s+/) || trimmed.match(/^[•\-*]\s+[A-Z]/)) {
        // Save previous outline if exists
        if (currentOutline) {
          outlines.push(currentOutline);
        }
        
        // Start new outline
        const title = trimmed.replace(/^[•\-*]\s+/, '').replace(/^\d+[\.\)]\s+/, '').trim();
        currentOutline = {
          outlineNumber: outlineNumber++,
          title,
          content: '',
          type: OutlineParser.determineOutlineType(title, '')
        };
      } else if (currentOutline) {
        // Add content line if we haven't exceeded 2 lines
        const currentLines = currentOutline.content.split('\n').filter(l => l.trim());
        if (currentLines.length < 2) {
          currentOutline.content += (currentOutline.content ? '\n' : '') + trimmed;
          currentOutline.content = OutlineParser.truncateToTwoLines(currentOutline.content);
        }
      }
    }
    
    // Save the last outline
    if (currentOutline) {
      outlines.push(currentOutline);
    }
    
    return outlines;
  }
  
  /**
   * Strategy 4: Fallback - split content into 10 equal parts
   */
  private static parseWithFallback(content: string): SummaryOutline[] {
    const lines = content.split('\n').filter(line => line.trim());
    const targetCount = 10;
    const linesPerOutline = Math.max(1, Math.ceil(lines.length / targetCount));
    
    const outlines: SummaryOutline[] = [];
    
    for (let i = 0; i < targetCount; i++) {
      const startLine = i * linesPerOutline;
      const endLine = Math.min((i + 1) * linesPerOutline, lines.length);
      const outlineLines = lines.slice(startLine, endLine);
      
      if (outlineLines.length > 0) {
        const title = outlineLines[0]?.trim() || `Outline ${i + 1}`;
        const contentLines = outlineLines.slice(1, 3).filter(l => l.trim());
        const content = contentLines.join('\n').trim();
        
        outlines.push({
          outlineNumber: i + 1,
          title,
          content: OutlineParser.truncateToTwoLines(content),
          type: OutlineParser.determineOutlineType(title, content)
        });
      }
    }
    
    return outlines;
  }
  
  /**
   * Pad outlines to exactly 10 if we have fewer
   */
  private static padOutlines(outlines: SummaryOutline[], targetCount: number): SummaryOutline[] {
    if (outlines.length >= targetCount) {
      return outlines.slice(0, targetCount);
    }
    
    const padded = [...outlines];
    // Ensure we start numbering from the correct position
    const startNumber = outlines.length > 0 ? Math.max(...outlines.map(o => o.outlineNumber)) + 1 : outlines.length + 1;
    for (let i = outlines.length; i < targetCount; i++) {
      padded.push({
        outlineNumber: startNumber + (i - outlines.length),
        title: `Riassunto ${startNumber + (i - outlines.length)}`,
        content: 'Contenuto non disponibile',
        type: 'content'
      });
    }
    
    return padded;
  }
  
  /**
   * Truncate content to maximum 2 lines
   */
  private static truncateToTwoLines(content: string): string {
    const lines = content.split('\n').filter(l => l.trim());
    return lines.slice(0, 2).join('\n').trim();
  }
  
  /**
   * Determine outline type based on title and content
   */
  private static determineOutlineType(title: string, content: string): 'overview' | 'content' | 'activities' | 'assessment' | 'summary' {
    const titleLower = title.toLowerCase();
    const contentLower = content.toLowerCase();
    
    if (titleLower.includes('overview') || titleLower.includes('introduction')) {
      return 'overview';
    }
    if (titleLower.includes('activity') || titleLower.includes('exercise') || titleLower.includes('practice')) {
      return 'activities';
    }
    if (titleLower.includes('assessment') || titleLower.includes('evaluation') || titleLower.includes('test') || titleLower.includes('quiz')) {
      return 'assessment';
    }
    if (titleLower.includes('summary') || titleLower.includes('conclusion') || titleLower.includes('wrap-up')) {
      return 'summary';
    }
    
    // Default to content
    return 'content';
  }
  
  /**
   * Clean content for better parsing
   */
  private static cleanContent(content: string): string {
    return content
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }
  
  /**
   * Validate outlines
   */
  static validateOutlines(outlines: SummaryOutline[]): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    
    if (outlines.length !== 10) {
      errors.push(`Expected 10 outlines, found ${outlines.length}`);
    }
    
    outlines.forEach((outline) => {
      const lines = outline.content.split('\n').filter(l => l.trim());
      if (lines.length > 2) {
        errors.push(`Outline ${outline.outlineNumber} has more than 2 lines`);
      }
      if (!outline.title.trim()) {
        errors.push(`Outline ${outline.outlineNumber} has no title`);
      }
    });
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
}

