import { LessonPlanSection } from '@/types/lesson-planner';

/**
 * Robust section parser that handles various AI output formats
 */
export class SectionParser {
  
  /**
   * Check if a section has sufficient content to be considered complete
   */
  private static isSectionComplete(section: LessonPlanSection): boolean {
    // A section is complete if it has at least 50 characters of content
    // This prevents showing sections with just headers or single lines
    const minContentLength = 50;
    return section.content.trim().length >= minContentLength;
  }

  /**
   * Parse lesson plan content into structured sections
   * @param content The content to parse
   * @param allowPartial If true, returns sections even if fewer than expected (for streaming)
   */
  static parseContent(content: string, allowPartial: boolean = false): LessonPlanSection[] {
    console.log('🔍 Parsing lesson plan content...', allowPartial ? '(partial content allowed)' : '');
    
    // Clean the content first
    const cleanedContent = SectionParser.cleanContent(content);
    
    // Try multiple parsing strategies
    const strategies = [
      this.parseWithStrictSectionHeaders,
      this.parseWithFlexibleSectionHeaders,
      this.parseWithNumberedSections,
      this.parseWithBulletSections
    ];
    
    let bestResult: LessonPlanSection[] = [];
    let bestStrategyName = '';
    
    for (const strategy of strategies) {
      const result = strategy(cleanedContent);
      
      // Filter out incomplete sections during streaming
      const completeSections = allowPartial 
        ? result.filter(section => SectionParser.isSectionComplete(section))
        : result;
      
      // During streaming, accept any complete sections found
      if (allowPartial && completeSections.length > 0) {
        if (completeSections.length > bestResult.length) {
          bestResult = completeSections;
          bestStrategyName = strategy.name;
        }
      } else if (result.length >= 6) { // We expect at least 6 sections for final parse
        console.log(`✅ Successfully parsed using ${strategy.name} with ${result.length} sections`);
        return result;
      }
    }
    
    // If we found some complete sections during streaming, return them
    if (allowPartial && bestResult.length > 0) {
      console.log(`✅ Parsed ${bestResult.length} complete sections using ${bestStrategyName} (streaming mode)`);
      return bestResult;
    }
    
    // If no sections found or not allowing partial, try fallback
    console.log('⚠️ All parsing strategies failed, using fallback');
    const fallbackSections = this.createFallbackSections(cleanedContent);
    
    // During streaming, only return complete fallback sections
    if (allowPartial) {
      const completeFallbackSections = fallbackSections.filter(section => 
        SectionParser.isSectionComplete(section)
      );
      if (completeFallbackSections.length > 0) {
        return completeFallbackSections;
      }
      return []; // Don't return incomplete sections during streaming
    }
    
    return fallbackSections;
  }
  
  /**
   * Strategy 1: Parse with strict section headers (SECTION 1:, SECTION 2:, etc.)
   */
  private static parseWithStrictSectionHeaders(content: string): LessonPlanSection[] {
    const sections: LessonPlanSection[] = [];
    
    // Look for patterns like "SECTION 1:", "SECTION 2:", etc.
    const sectionRegex = /^SECTION\s+(\d+):\s*(.+)$/gim;
    const matches = Array.from(content.matchAll(sectionRegex));
    
    if (matches.length === 0) return sections;
    
    for (let i = 0; i < matches.length; i++) {
      const match = matches[i];
      const sectionNumber = parseInt(match[1]);
      const title = match[2].trim();
      
      // Find the content for this section
      const startIndex = match.index! + match[0].length;
      const endIndex = i < matches.length - 1 ? matches[i + 1].index! : content.length;
      
      const sectionContent = content.substring(startIndex, endIndex).trim();
      
      if (sectionContent) {
        sections.push({
          title: SectionParser.normalizeSectionTitle(title),
          content: sectionContent,
          type: SectionParser.determineSectionType(title, sectionContent)
        });
      }
    }
    
    return sections;
  }
  
  /**
   * Strategy 2: Parse with flexible section headers
   */
  private static parseWithFlexibleSectionHeaders(content: string): LessonPlanSection[] {
    const sections: LessonPlanSection[] = [];
    
    // Look for section patterns without strict numbering
    const sectionPatterns = [
      /^SECTION\s*:?\s*(.+)$/gim,
      /^(\d+\.\s*.+)$/gim,
      /^([A-Z][A-Z\s]+):\s*$/gim
    ];
    
    for (const pattern of sectionPatterns) {
      const matches = Array.from(content.matchAll(pattern));
      if (matches.length >= 6) {
        for (let i = 0; i < matches.length; i++) {
          const match = matches[i];
          const title = match[1].trim();
          
          // Skip if this looks like content rather than a section header
          if (title.length > 50 || title.includes('|') || title.includes('•')) {
            continue;
          }
          
          const startIndex = match.index! + match[0].length;
          const endIndex = i < matches.length - 1 ? matches[i + 1].index! : content.length;
          
          const sectionContent = content.substring(startIndex, endIndex).trim();
          
          if (sectionContent && SectionParser.isValidSectionTitle(title)) {
            sections.push({
              title: SectionParser.normalizeSectionTitle(title),
              content: sectionContent,
              type: SectionParser.determineSectionType(title, sectionContent)
            });
          }
        }
        break;
      }
    }
    
    return sections;
  }
  
  /**
   * Strategy 3: Parse with numbered sections
   */
  private static parseWithNumberedSections(content: string): LessonPlanSection[] {
    const sections: LessonPlanSection[] = [];
    
    // Look for numbered patterns like "1. LESSON OVERVIEW", "2. MATERIALS NEEDED"
    const numberedRegex = /^(\d+)\.\s*(.+)$/gim;
    const matches = Array.from(content.matchAll(numberedRegex));
    
    if (matches.length === 0) return sections;
    
    for (let i = 0; i < matches.length; i++) {
      const match = matches[i];
      const title = match[2].trim();
      
      if (!SectionParser.isValidSectionTitle(title)) continue;
      
      const startIndex = match.index! + match[0].length;
      const endIndex = i < matches.length - 1 ? matches[i + 1].index! : content.length;
      
      const sectionContent = content.substring(startIndex, endIndex).trim();
      
      if (sectionContent) {
        sections.push({
          title: SectionParser.normalizeSectionTitle(title),
          content: sectionContent,
          type: SectionParser.determineSectionType(title, sectionContent)
        });
      }
    }
    
    return sections;
  }
  
  /**
   * Strategy 4: Parse with bullet sections
   */
  private static parseWithBulletSections(content: string): LessonPlanSection[] {
    const sections: LessonPlanSection[] = [];
    
    // Look for bullet patterns like "• LESSON OVERVIEW", "• MATERIALS NEEDED"
    const bulletRegex = /^[•\-\*]\s*(.+)$/gim;
    const matches = Array.from(content.matchAll(bulletRegex));
    
    if (matches.length === 0) return sections;
    
    for (let i = 0; i < matches.length; i++) {
      const match = matches[i];
      const title = match[1].trim();
      
      if (!SectionParser.isValidSectionTitle(title)) continue;
      
      const startIndex = match.index! + match[0].length;
      const endIndex = i < matches.length - 1 ? matches[i + 1].index! : content.length;
      
      const sectionContent = content.substring(startIndex, endIndex).trim();
      
      if (sectionContent) {
        sections.push({
          title: SectionParser.normalizeSectionTitle(title),
          content: sectionContent,
          type: SectionParser.determineSectionType(title, sectionContent)
        });
      }
    }
    
    return sections;
  }
  
  /**
   * Clean content before parsing
   */
  private static cleanContent(content: string): string {
    return content
      .replace(/\r\n/g, '\n') // Normalize line endings
      .replace(/\n{3,}/g, '\n\n') // Remove excessive line breaks
      .trim();
  }
  
  /**
   * Check if a title is a valid section title
   */
  private static isValidSectionTitle(title: string): boolean {
    const validSections = [
      'LESSON OVERVIEW',
      'MATERIALS NEEDED',
      'LEARNING OBJECTIVES',
      'LESSON TIMELINE',
      'ACTIVITIES AND INSTRUCTIONS',
      'ASSESSMENT METHODS',
      'DIFFERENTIATION STRATEGIES',
      'ADDITIONAL NOTES'
    ];
    
    const upperTitle = title.toUpperCase();
    return validSections.some(section => 
      upperTitle.includes(section) || 
      section.includes(upperTitle) ||
      SectionParser.isSimilarTitle(upperTitle, section)
    );
  }
  
  /**
   * Check if titles are similar (for fuzzy matching)
   */
  private static isSimilarTitle(title1: string, title2: string): boolean {
    const words1 = title1.split(/\s+/);
    const words2 = title2.split(/\s+/);
    
    // Check if at least 2 words match
    const matchingWords = words1.filter(word => 
      words2.some(w2 => w2.includes(word) || word.includes(w2))
    );
    
    return matchingWords.length >= 2;
  }
  
  /**
   * Normalize section title to standard format
   */
  private static normalizeSectionTitle(title: string): string {
    const titleMap: { [key: string]: string } = {
      'LESSON OVERVIEW': 'LESSON OVERVIEW',
      'MATERIALS NEEDED': 'MATERIALS NEEDED',
      'LEARNING OBJECTIVES': 'LEARNING OBJECTIVES',
      'LESSON TIMELINE': 'LESSON TIMELINE',
      'ACTIVITIES AND INSTRUCTIONS': 'ACTIVITIES AND INSTRUCTIONS',
      'ASSESSMENT METHODS': 'ASSESSMENT METHODS',
      'DIFFERENTIATION STRATEGIES': 'DIFFERENTIATION STRATEGIES',
      'ADDITIONAL NOTES': 'ADDITIONAL NOTES'
    };
    
    const upperTitle = title.toUpperCase();
    
    for (const [standard, normalized] of Object.entries(titleMap)) {
      if (upperTitle.includes(standard) || standard.includes(upperTitle)) {
        return normalized;
      }
    }
    
    return title;
  }
  
  /**
   * Determine section type based on title and content
   */
  private static determineSectionType(title: string, content: string): 'list' | 'table' | 'text' {
    const upperTitle = title.toUpperCase();
    
    if (upperTitle.includes('TIMELINE') || 
        upperTitle.includes('CRONOLOGIA') ||
        upperTitle.includes('CRONOPROGRAMMA') ||
        upperTitle.includes('SCHEDULE') ||
        upperTitle.includes('AGENDA') ||
        upperTitle.includes('PROGRAMMA')) {
      return 'table';
    }
    
    if (content.includes('•') || content.includes('-') || content.includes('*')) {
      return 'list';
    }
    
    return 'text';
  }
  
  /**
   * Create fallback sections when parsing fails
   */
  private static createFallbackSections(content: string): LessonPlanSection[] {
    console.log('🔄 Creating fallback sections');
    
    const lines = content.split('\n').filter(line => line.trim());
    const sections: LessonPlanSection[] = [];
    
    // Try to find any recognizable section headers
    const sectionHeaders = [
      'LESSON OVERVIEW',
      'MATERIALS NEEDED', 
      'LEARNING OBJECTIVES',
      'LESSON TIMELINE',
      'ACTIVITIES AND INSTRUCTIONS',
      'ASSESSMENT METHODS',
      'DIFFERENTIATION STRATEGIES',
      'ADDITIONAL NOTES'
    ];
    
    let currentSection: LessonPlanSection | null = null;
    const collectedContent: string[] = [];
    
    for (const line of lines) {
      const upperLine = line.toUpperCase().trim();
      
      // Check if this line is a section header
      const matchingHeader = sectionHeaders.find(header => 
        upperLine.includes(header) || header.includes(upperLine)
      );
      
      if (matchingHeader) {
        // Save previous section if exists
        if (currentSection) {
          currentSection.content = collectedContent.join('\n').trim();
          sections.push(currentSection);
        }
        
        // Start new section
        currentSection = {
          title: matchingHeader,
          content: '',
          type: 'text'
        };
        collectedContent.length = 0;
      } else if (currentSection) {
        collectedContent.push(line);
      }
    }
    
    // Save the last section
    if (currentSection) {
      currentSection.content = collectedContent.join('\n').trim();
      sections.push(currentSection);
    }
    
    // If no sections were found, create a single section with all content
    if (sections.length === 0) {
      sections.push({
        title: 'LESSON PLAN',
        content: content,
        type: 'text'
      });
    }
    
    return sections;
  }
}
