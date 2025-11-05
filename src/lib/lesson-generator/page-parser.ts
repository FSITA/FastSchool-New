import { LessonPage } from '@/types/lesson-generator';

/**
 * Smart page parser for multi-page lesson content
 */
export class PageParser {
  
  /**
   * Parse multi-page content from AI response
   */
  static parsePages(content: string): LessonPage[] {
    console.log('🔍 Parsing lesson pages...');
    
    // Clean the content first
    const cleanedContent = PageParser.cleanContent(content);
    
    // Try multiple parsing strategies
    const strategies = [
      PageParser.parseWithPageHeaders,
      PageParser.parseWithNumberedSections,
      PageParser.parseWithBulletSections,
      PageParser.parseWithFallback
    ];
    
    for (const strategy of strategies) {
      const result = strategy(cleanedContent);
      if (result.length > 0) {
        console.log(`✅ Successfully parsed using ${strategy.name} with ${result.length} pages`);
        return result;
      }
    }
    
    console.log('❌ All parsing strategies failed');
    return [];
  }
  
  /**
   * Strategy 1: Parse with PAGE X: headers
   */
  private static parseWithPageHeaders(content: string): LessonPage[] {
    const pageRegex = /PAGE\s+(\d+):\s*(.*?)(?=PAGE\s+\d+:|$)/gs;
    const matches = [...content.matchAll(pageRegex)];
    
    if (matches.length === 0) return [];
    
    return matches.map(match => {
      const pageNumber = parseInt(match[1]);
      const fullContent = match[2].trim();
      const lines = fullContent.split('\n');
      const title = lines[0]?.trim() || `Page ${pageNumber}`;
      const content = lines.slice(1).join('\n').trim();
      
      return {
        pageNumber,
        title,
        content,
        type: PageParser.determinePageType(title, content)
      };
    });
  }
  
  /**
   * Strategy 2: Parse with numbered sections
   */
  private static parseWithNumberedSections(content: string): LessonPage[] {
    const sectionRegex = /^(\d+)\.\s+(.*?)(?=^\d+\.\s+|$)/gms;
    const matches = [...content.matchAll(sectionRegex)];
    
    if (matches.length === 0) return [];
    
    return matches.map(match => {
      const pageNumber = parseInt(match[1]);
      const fullContent = match[2].trim();
      const lines = fullContent.split('\n');
      const title = lines[0]?.trim() || `Section ${pageNumber}`;
      const content = lines.slice(1).join('\n').trim();
      
      return {
        pageNumber,
        title,
        content,
        type: PageParser.determinePageType(title, content)
      };
    });
  }
  
  /**
   * Strategy 3: Parse with bullet sections
   */
  private static parseWithBulletSections(content: string): LessonPage[] {
    const lines = content.split('\n').filter(line => line.trim());
    const pages: LessonPage[] = [];
    let currentPage: LessonPage | null = null;
    let pageNumber = 1;
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      // Check if this is a section header (starts with bullet or dash)
      if (trimmed.match(/^[•\-*]\s+[A-Z]/) || trimmed.match(/^[•\-*]\s+[A-Z]/)) {
        // Save previous page if exists
        if (currentPage) {
          pages.push(currentPage);
        }
        
        // Start new page
        const title = trimmed.replace(/^[•\-*]\s+/, '').trim();
        currentPage = {
          pageNumber: pageNumber++,
          title,
          content: '',
          type: PageParser.determinePageType(title, '')
        };
      } else if (currentPage) {
        currentPage.content += (currentPage.content ? '\n' : '') + trimmed;
      }
    }
    
    // Save the last page
    if (currentPage) {
      pages.push(currentPage);
    }
    
    return pages;
  }
  
  /**
   * Strategy 4: Fallback - split content into equal parts
   */
  private static parseWithFallback(content: string): LessonPage[] {
    const lines = content.split('\n').filter(line => line.trim());
    const estimatedPages = Math.max(1, Math.ceil(lines.length / 20)); // ~20 lines per page
    const linesPerPage = Math.ceil(lines.length / estimatedPages);
    
    const pages: LessonPage[] = [];
    
    for (let i = 0; i < estimatedPages; i++) {
      const startLine = i * linesPerPage;
      const endLine = Math.min((i + 1) * linesPerPage, lines.length);
      const pageLines = lines.slice(startLine, endLine);
      
      if (pageLines.length > 0) {
        const title = pageLines[0]?.trim() || `Page ${i + 1}`;
        const content = pageLines.slice(1).join('\n').trim();
        
        pages.push({
          pageNumber: i + 1,
          title,
          content,
          type: PageParser.determinePageType(title, content)
        });
      }
    }
    
    return pages;
  }
  
  /**
   * Determine page type based on title and content
   */
  private static determinePageType(title: string, content: string): 'overview' | 'content' | 'activities' | 'assessment' | 'summary' {
    const titleLower = title.toLowerCase();
    const contentLower = content.toLowerCase();
    
    if (titleLower.includes('overview') || titleLower.includes('introduction') || titleLower.includes('introduction')) {
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
}
