import { Quiz, QuizQuestion } from '@/types/quiz-generator';

/**
 * Smart quiz parser for multi-quiz content from AI response
 * Uses multiple parsing strategies with fallback
 */
export class QuizParser {
  
  /**
   * Parse quizzes from AI response content
   * @param content The AI-generated content
   * @param numberOfQuizzes Optional: Number of quizzes to split questions into
   */
  static parseQuizzes(content: string, numberOfQuizzes?: number): Quiz[] {
    console.log('🔍 Parsing quiz content...');
    
    // Clean the content first
    const cleanedContent = QuizParser.cleanContent(content);
    
    // Try multiple parsing strategies to extract all questions first
    const strategies = [
      QuizParser.parseWithQuestionHeaders,
      QuizParser.parseWithNumberedQuestions,
      QuizParser.parseWithQFormat,
      QuizParser.parseWithFallback
    ];
    
    let allQuestions: QuizQuestion[] = [];
    
    for (const strategy of strategies) {
      const result = strategy(cleanedContent);
      if (result.length > 0 && QuizParser.validateQuizzes(result)) {
        console.log(`✅ Successfully parsed using ${strategy.name}`);
        // Extract all questions from all quizzes
        result.forEach(quiz => {
          allQuestions.push(...quiz.questions);
        });
        break; // Stop after first successful strategy
      }
    }
    
    if (allQuestions.length === 0) {
      console.log('❌ All parsing strategies failed');
      return [];
    }
    
    console.log(`📊 Total questions parsed: ${allQuestions.length}`);
    
    // If numberOfQuizzes is specified, split questions into that many quizzes
    if (numberOfQuizzes && numberOfQuizzes > 0) {
      return QuizParser.splitQuestionsIntoQuizzes(allQuestions, numberOfQuizzes);
    }
    
    // Otherwise return all questions in a single quiz
    return [{
      quizNumber: 1,
      questions: allQuestions
    }];
  }
  
  /**
   * Parse all questions from content without grouping into quizzes
   * Used for incremental parsing during streaming
   */
  static parseAllQuestions(content: string): QuizQuestion[] {
    const cleanedContent = QuizParser.cleanContent(content);
    
    // Try multiple parsing strategies to extract all questions
    const strategies = [
      QuizParser.parseWithQuestionHeaders,
      QuizParser.parseWithNumberedQuestions,
      QuizParser.parseWithQFormat,
      QuizParser.parseWithFallback
    ];
    
    for (const strategy of strategies) {
      const result = strategy(cleanedContent);
      if (result.length > 0 && QuizParser.validateQuizzes(result)) {
        // Extract all questions from all quizzes
        const allQuestions: QuizQuestion[] = [];
        result.forEach(quiz => {
          allQuestions.push(...quiz.questions);
        });
        return allQuestions;
      }
    }
    
    return [];
  }
  
  /**
   * Randomize a single question's correct answer position
   */
  static randomizeSingleQuestion(question: QuizQuestion): QuizQuestion {
    try {
      // Validate current state
      if (!question.options || question.options.length !== 4) {
        console.warn(`Question ${question.questionNumber}: Invalid options count, skipping randomization`);
        return question;
      }
      
      if (question.correctAnswer < 0 || question.correctAnswer >= question.options.length) {
        console.warn(`Question ${question.questionNumber}: Invalid correct answer index, skipping randomization`);
        return question;
      }
      
      // Get the correct answer text
      const correctText = question.options[question.correctAnswer];
      if (!correctText || correctText.trim().length === 0) {
        console.warn(`Question ${question.questionNumber}: Empty correct answer text, skipping randomization`);
        return question;
      }
      
      // Shuffle options array
      const shuffled = QuizParser.shuffleArray([...question.options]);
      
      // Find new position of correct answer
      const newCorrectIndex = shuffled.findIndex(opt => opt === correctText || opt.trim() === correctText.trim());
      
      if (newCorrectIndex === -1) {
        console.warn(`Question ${question.questionNumber}: Could not find correct answer after shuffle, keeping original`);
        return question;
      }
      
      return {
        ...question,
        options: shuffled,
        correctAnswer: newCorrectIndex,
        correctAnswerText: correctText
      };
    } catch (error) {
      console.error(`Error randomizing question ${question.questionNumber}:`, error);
      return question; // Return original on error
    }
  }
  
  /**
   * Split questions into multiple quizzes
   */
  private static splitQuestionsIntoQuizzes(questions: QuizQuestion[], numberOfQuizzes: number): Quiz[] {
    // Remove duplicate questions (by question text)
    const uniqueQuestions = QuizParser.removeDuplicateQuestions(questions);
    const totalQuestions = uniqueQuestions.length;
    
    // Ensure we have enough questions
    if (totalQuestions === 0) {
      console.warn('No questions to split into quizzes');
      return [];
    }
    
    // Cap number of quizzes to number of questions if needed
    const actualNumberOfQuizzes = Math.min(numberOfQuizzes, totalQuestions);
    
    const questionsPerQuiz = Math.floor(totalQuestions / actualNumberOfQuizzes);
    const remainder = totalQuestions % actualNumberOfQuizzes;
    
    console.log(`📦 Splitting ${totalQuestions} unique questions into ${actualNumberOfQuizzes} quizzes`);
    console.log(`   Questions per quiz: ~${questionsPerQuiz} (remainder: ${remainder})`);
    
    const quizzes: Quiz[] = [];
    let questionIndex = 0;
    
    for (let i = 0; i < actualNumberOfQuizzes; i++) {
      // Distribute remainder questions to first few quizzes
      const quizQuestionCount = questionsPerQuiz + (i < remainder ? 1 : 0);
      const quizQuestions = uniqueQuestions.slice(questionIndex, questionIndex + quizQuestionCount);
      
      // Renumber questions within each quiz
      const renumberedQuestions = quizQuestions.map((q, idx) => ({
        ...q,
        questionNumber: idx + 1
      }));
      
      quizzes.push({
        quizNumber: i + 1,
        questions: renumberedQuestions
      });
      
      questionIndex += quizQuestionCount;
    }
    
    console.log(`✅ Created exactly ${quizzes.length} quizzes`);
    
    // Only randomize once after splitting
    return QuizParser.randomizeCorrectAnswers(quizzes);
  }
  
  /**
   * Remove duplicate questions based on question text
   */
  private static removeDuplicateQuestions(questions: QuizQuestion[]): QuizQuestion[] {
    const seen = new Set<string>();
    const unique: QuizQuestion[] = [];
    
    for (const question of questions) {
      const questionKey = question.question.trim().toLowerCase();
      if (!seen.has(questionKey)) {
        seen.add(questionKey);
        unique.push(question);
      } else {
        console.warn(`Skipping duplicate question: "${question.question.substring(0, 50)}..."`);
      }
    }
    
    return unique;
  }
  
  /**
   * Strategy 1: Parse with QUESTION X: headers
   */
  private static parseWithQuestionHeaders(content: string): Quiz[] {
    // Ignore PAGE markers - remove them before parsing
    const contentWithoutPages = content.replace(/PAGE\s+\d+[:\s]*/gi, '').replace(/^Page\s+\d+[:\s]*/gmi, '');
    
    const questionRegex = /QUESTION\s+(\d+):\s*(.*?)(?=QUESTION\s+\d+:|$)/gis;
    const matches = [...contentWithoutPages.matchAll(questionRegex)];
    
    if (matches.length === 0) return [];
    
    const allQuestions: QuizQuestion[] = [];
    
    matches.forEach(match => {
      const questionNumber = parseInt(match[1]);
      const questionText = match[2].trim();
      
      // Skip if questionText contains page markers
      if (/^PAGE\s+\d+/i.test(questionText)) {
        return;
      }
      
      const parsed = QuizParser.extractQuestionAndOptions(questionText, questionNumber);
      if (parsed) {
        allQuestions.push(parsed);
      }
    });
    
    if (allQuestions.length === 0) return [];
    
    // Group questions into quizzes (default: 1 quiz with all questions)
    return [{
      quizNumber: 1,
      questions: allQuestions
    }];
  }
  
  /**
   * Strategy 2: Parse with numbered questions (1., 2., etc.)
   */
  private static parseWithNumberedQuestions(content: string): Quiz[] {
    const numberedRegex = /^(\d+)\.\s+(.*?)(?=^\d+\.\s+|$)/gms;
    const matches = [...content.matchAll(numberedRegex)];
    
    if (matches.length === 0) return [];
    
    const allQuestions: QuizQuestion[] = [];
    
    matches.forEach(match => {
      const questionNumber = parseInt(match[1]);
      const questionText = match[2].trim();
      
      const parsed = QuizParser.extractQuestionAndOptions(questionText, questionNumber);
      if (parsed) {
        allQuestions.push(parsed);
      }
    });
    
    if (allQuestions.length === 0) return [];
    
    return [{
      quizNumber: 1,
      questions: allQuestions
    }];
  }
  
  /**
   * Strategy 3: Parse with Q1, Q2 format
   */
  private static parseWithQFormat(content: string): Quiz[] {
    const qFormatRegex = /Q(\d+)[:\.]\s*(.*?)(?=Q\d+|$)/gis;
    const matches = [...content.matchAll(qFormatRegex)];
    
    if (matches.length === 0) return [];
    
    const allQuestions: QuizQuestion[] = [];
    
    matches.forEach(match => {
      const questionNumber = parseInt(match[1]);
      const questionText = match[2].trim();
      
      const parsed = QuizParser.extractQuestionAndOptions(questionText, questionNumber);
      if (parsed) {
        allQuestions.push(parsed);
      }
    });
    
    if (allQuestions.length === 0) return [];
    
    return [{
      quizNumber: 1,
      questions: allQuestions
    }];
  }
  
  /**
   * Strategy 4: Fallback - try to extract any question-like patterns
   */
  private static parseWithFallback(content: string): Quiz[] {
    // Try to find questions by looking for patterns like:
    // - Lines ending with ?
    // - Followed by A), B), C), D) patterns
    
    const lines = content.split('\n').filter(line => line.trim());
    const allQuestions: QuizQuestion[] = [];
    let currentQuestion: Partial<QuizQuestion> | null = null;
    let questionNumber = 1;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Check if this line is a question (ends with ? or starts with question number)
      if ((line.endsWith('?') || /^\d+[\.:\)]\s/.test(line)) && currentQuestion === null) {
        currentQuestion = {
          questionNumber: questionNumber++,
          question: line.replace(/^\d+[\.:\)]\s*/, ''),
          options: [],
          correctAnswer: -1,
          correctAnswerText: ''
        };
      }
      // Check if this line is an option (A), B), C), D))
      else if (currentQuestion && /^[A-D][\.:\)]\s+/.test(line)) {
        const optionText = line.replace(/^[A-D][\.:\)]\s+/, '').trim();
        if (currentQuestion.options) {
          currentQuestion.options.push(optionText);
          
          // Check for correct answer markers
          if (/✓|✅|CORRECT|correct|Correct/i.test(optionText)) {
            currentQuestion.correctAnswer = currentQuestion.options.length - 1;
            currentQuestion.correctAnswerText = optionText.replace(/✓|✅|CORRECT|correct|Correct/gi, '').trim();
            currentQuestion.options[currentQuestion.options.length - 1] = currentQuestion.correctAnswerText;
          }
        }
        
        // If we have 4 options, finalize the question
        if (currentQuestion.options && currentQuestion.options.length === 4) {
          if (currentQuestion.correctAnswer === -1) {
            // If no correct answer found, default to first option
            currentQuestion.correctAnswer = 0;
            currentQuestion.correctAnswerText = currentQuestion.options[0];
          }
          allQuestions.push(currentQuestion as QuizQuestion);
          currentQuestion = null;
        }
      }
      // If current question exists and line doesn't match patterns, append to question text
      else if (currentQuestion && line && !/^[A-D][\.:\)]\s+/.test(line)) {
        currentQuestion.question += ' ' + line;
      }
    }
    
    // Add final question if incomplete but has at least 2 options
    if (currentQuestion && currentQuestion.options && currentQuestion.options.length >= 2) {
      // Fill missing options or pad to 4
      while (currentQuestion.options.length < 4) {
        currentQuestion.options.push(`Option ${currentQuestion.options.length + 1}`);
      }
      if (currentQuestion.correctAnswer === -1) {
        currentQuestion.correctAnswer = 0;
        currentQuestion.correctAnswerText = currentQuestion.options[0];
      }
      allQuestions.push(currentQuestion as QuizQuestion);
    }
    
    if (allQuestions.length === 0) return [];
    
    return [{
      quizNumber: 1,
      questions: allQuestions
    }];
  }
  
  /**
   * Extract question and options from text block
   */
  private static extractQuestionAndOptions(text: string, questionNumber: number): QuizQuestion | null {
    try {
      const lines = text.split('\n').filter(line => line.trim());
      if (lines.length < 2) {
        console.warn(`Question ${questionNumber}: Not enough lines (need at least 2, got ${lines.length})`);
        return null; // Need at least question + 1 option
      }
      
      let question = '';
      const options: string[] = [];
      let correctAnswer = -1;
      let correctAnswerText = '';
      
      // First line is usually the question
      question = lines[0].trim();
      if (!question || question.length === 0) {
        console.warn(`Question ${questionNumber}: Empty question text`);
        return null;
      }
      
      // Look for options (A), B), C), D) or A., B., etc.)
      // Also handle cases where options might span multiple lines
      let currentOption: string | null = null;
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) {
          // If we have a current option being built, continue it
          if (currentOption !== null) {
            currentOption += ' ' + line;
          }
          continue;
        }
        
        // Try multiple option patterns - more comprehensive
        const optionMatch = line.match(/^([A-D])[\.:\)]\s*(.+)$/i) || 
                          line.match(/^([A-D])\.\s*(.+)$/i) ||
                          line.match(/^([A-D])\s+[\.:\)]\s*(.+)$/i) ||
                          line.match(/^([A-D])\s+(.+)$/i);
        
        if (optionMatch) {
          // If we were building a previous option, finalize it first
          if (currentOption !== null) {
            const prevOptionText = currentOption.trim();
            if (prevOptionText && !/^Option\s+\d+$/i.test(prevOptionText) && !/^Option\s+[A-D]$/i.test(prevOptionText)) {
              options.push(prevOptionText);
            }
            currentOption = null;
          }
          
          const optionText = optionMatch[2] || optionMatch[3] || optionMatch[optionMatch.length - 1];
          if (!optionText || optionText.trim().length === 0) continue;
          
          let cleanOptionText = optionText.trim();
          
          // Skip placeholder options like "Option 1", "Option 2", "Option 3", "Option 4"
          if (/^Option\s+\d+$/i.test(cleanOptionText) || /^Option\s+[A-D]$/i.test(cleanOptionText)) {
            console.warn(`Question ${questionNumber}: Skipping placeholder option "${cleanOptionText}"`);
            continue;
          }
          
          // Check for correct answer markers (more comprehensive)
          const hasCorrectMarker = /✓|✅|CORRECT|correct|Correct|RIGHT|right|\(correct\)|\(right\)|\(\s*correct\s*\)|\(\s*right\s*\)/i.test(cleanOptionText);
          
          if (hasCorrectMarker) {
            cleanOptionText = cleanOptionText
              .replace(/✓|✅/g, '')
              .replace(/CORRECT|correct|Correct|RIGHT|right/gi, '')
              .replace(/\(correct\)|\(right\)|\(\s*correct\s*\)|\(\s*right\s*\)/gi, '')
              .trim();
            
            // Only set if we haven't found a correct answer yet
            if (correctAnswer === -1) {
              correctAnswer = options.length;
              correctAnswerText = cleanOptionText || optionText.trim();
            }
          }
          
          // Only add if we have meaningful text (not placeholder)
          if (cleanOptionText.length > 0 && !/^Option\s+\d+$/i.test(cleanOptionText) && !/^Option\s+[A-D]$/i.test(cleanOptionText)) {
            // Check if this might be a multi-line option (next line doesn't start with A-D)
            if (i + 1 < lines.length) {
              const nextLine = lines[i + 1].trim();
              if (nextLine && !/^[A-D][\.:\)]\s*/i.test(nextLine) && !/^Option\s+\d+$/i.test(nextLine)) {
                // This might be a continuation, start building the option
                currentOption = cleanOptionText;
                continue;
              }
            }
            options.push(cleanOptionText);
          } else if (hasCorrectMarker && !/^Option\s+\d+$/i.test(optionText.trim()) && !/^Option\s+[A-D]$/i.test(optionText.trim())) {
            // If marker was found but text is empty, use original (if not placeholder)
            options.push(optionText.trim());
            if (correctAnswer === -1) {
              correctAnswer = options.length - 1;
              correctAnswerText = optionText.trim();
            }
          }
        } else if (currentOption !== null) {
          // Continue building current option across multiple lines
          currentOption += ' ' + line;
        }
      }
      
      // Finalize any option being built
      if (currentOption !== null) {
        const finalOption = currentOption.trim();
        if (finalOption && !/^Option\s+\d+$/i.test(finalOption) && !/^Option\s+[A-D]$/i.test(finalOption)) {
          options.push(finalOption);
        }
      }
      
      // Need exactly 4 options - reject if we don't have exactly 4
      if (options.length < 4) {
        console.warn(`Question ${questionNumber}: Only found ${options.length} options, need exactly 4. Rejecting question.`);
        return null; // Reject incomplete questions
      } else if (options.length > 4) {
        console.warn(`Question ${questionNumber}: Found ${options.length} options, using first 4`);
        options.splice(4);
      }
      
      // Validate all options have content and are not placeholders
      const hasPlaceholderOptions = options.some(opt => 
        !opt || 
        opt.trim().length === 0 || 
        /^Option\s+\d+$/i.test(opt.trim()) || 
        /^Option\s+[A-D]$/i.test(opt.trim())
      );
      
      if (hasPlaceholderOptions) {
        console.warn(`Question ${questionNumber}: Contains placeholder options, rejecting question`);
        return null; // Reject questions with placeholder options
      }
      
      // Validate all options have meaningful content (at least 3 characters)
      if (options.some(opt => !opt || opt.trim().length < 3)) {
        console.warn(`Question ${questionNumber}: Some options are too short or empty, rejecting question`);
        return null; // Reject questions with empty or too-short options
      }
      
      // If no correct answer found, default to first (will be randomized later)
      if (correctAnswer === -1) {
        console.warn(`Question ${questionNumber}: No correct answer marker found, defaulting to first option`);
        correctAnswer = 0;
        correctAnswerText = options[0];
      }
      
      // Validate correct answer index
      if (correctAnswer < 0 || correctAnswer >= options.length) {
        console.warn(`Question ${questionNumber}: Invalid correct answer index ${correctAnswer}, using 0`);
        correctAnswer = 0;
        correctAnswerText = options[0];
      }
      
      return {
        questionNumber,
        question: question.trim(),
        options: options.map(opt => opt.trim()),
        correctAnswer,
        correctAnswerText: correctAnswerText.trim() || options[correctAnswer].trim()
      };
    } catch (error) {
      console.error(`Error extracting question ${questionNumber}:`, error);
      return null;
    }
  }
  
  /**
   * Validate quizzes structure
   */
  private static validateQuizzes(quizzes: Quiz[]): boolean {
    if (!quizzes || quizzes.length === 0) return false;
    
    return quizzes.every(quiz => 
      quiz.questions && 
      quiz.questions.length > 0 &&
      quiz.questions.every(q => {
        // Basic structure validation
        if (!q.options || q.options.length !== 4 || q.correctAnswer < 0 || q.correctAnswer >= 4 || q.question.trim().length === 0) {
          return false;
        }
        
        // Check for placeholder options
        const hasPlaceholders = q.options.some(opt => 
          /^Option\s+\d+$/i.test(opt.trim()) || 
          /^Option\s+[A-D]$/i.test(opt.trim()) ||
          opt.trim().length < 3
        );
        
        if (hasPlaceholders) {
          console.warn(`Question ${q.questionNumber}: Contains placeholder options, invalid`);
          return false;
        }
        
        return true;
      })
    );
  }
  
  /**
   * Randomize correct answer positions
   */
  private static randomizeCorrectAnswers(quizzes: Quiz[]): Quiz[] {
    try {
      return quizzes.map(quiz => ({
        ...quiz,
        questions: quiz.questions.map(q => {
          try {
            // Validate current state
            if (!q.options || q.options.length !== 4) {
              console.warn(`Question ${q.questionNumber}: Invalid options count, skipping randomization`);
              return q;
            }
            
            if (q.correctAnswer < 0 || q.correctAnswer >= q.options.length) {
              console.warn(`Question ${q.questionNumber}: Invalid correct answer index, skipping randomization`);
              return q;
            }
            
            // Get the correct answer text
            const correctText = q.options[q.correctAnswer];
            if (!correctText || correctText.trim().length === 0) {
              console.warn(`Question ${q.questionNumber}: Empty correct answer text, skipping randomization`);
              return q;
            }
            
            // Shuffle options array
            const shuffled = QuizParser.shuffleArray([...q.options]);
            
            // Find new position of correct answer
            const newCorrectIndex = shuffled.findIndex(opt => opt === correctText || opt.trim() === correctText.trim());
            
            if (newCorrectIndex === -1) {
              console.warn(`Question ${q.questionNumber}: Could not find correct answer after shuffle, keeping original`);
              return q;
            }
            
            return {
              ...q,
              options: shuffled,
              correctAnswer: newCorrectIndex,
              correctAnswerText: correctText
            };
          } catch (error) {
            console.error(`Error randomizing question ${q.questionNumber}:`, error);
            return q; // Return original on error
          }
        })
      }));
    } catch (error) {
      console.error('Error randomizing correct answers:', error);
      return quizzes; // Return original on error
    }
  }
  
  /**
   * Shuffle array (Fisher-Yates algorithm)
   */
  private static shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
  
  /**
   * Clean content for better parsing
   */
  private static cleanContent(content: string): string {
    return content
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      // Remove PAGE markers completely - ignore them
      .replace(/PAGE\s+\d+[:\s]*/gi, '')
      .replace(/^Page\s+\d+[:\s]*/gmi, '')
      .replace(/^PAGE\s+\d+[:\s]*/gmi, '')
      .trim();
  }
}

