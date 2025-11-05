"use client"

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, RotateCcw, FileText, Clock, CheckCircle, BookOpen } from 'lucide-react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import html2canvas from 'html2canvas';
import { toast } from 'sonner';
import type { QuizGeneratorViewerProps, Quiz, QuizQuestion } from '@/types/quiz-generator';
import { getQuizGeneratorTranslations } from '@/lib/quiz-generator/language-translations';

export function QuizGeneratorViewer({ quiz, generatedQuizzes, onGenerateAgain }: QuizGeneratorViewerProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const translations = getQuizGeneratorTranslations(quiz.language || 'english');

  // Reset downloading state when component unmounts
  useEffect(() => {
    return () => {
      setIsDownloading(false);
    };
  }, []);

  // Helper function to check if language needs special font handling (CJK or Cyrillic)
  const needsSpecialFontHandling = (language: string): boolean => {
    const specialLanguages = ['chinese', 'russian', 'japanese', 'korean'];
    return specialLanguages.includes(language.toLowerCase());
  };

  // Helper function to load Google Fonts for special languages
  const loadGoogleFonts = async (language: string): Promise<void> => {
    return new Promise((resolve) => {
      // Check if fonts are already loaded
      if (document.getElementById('google-fonts-loaded')) {
        resolve();
        return;
      }

      const fontsToLoad: string[] = [];
      
      if (language === 'chinese') {
        fontsToLoad.push('Noto+Sans+SC');
      } else if (language === 'russian') {
        fontsToLoad.push('Noto+Sans');
      } else if (language === 'japanese') {
        fontsToLoad.push('Noto+Sans+JP');
      } else if (language === 'korean') {
        fontsToLoad.push('Noto+Sans+KR');
      } else {
        // Load all fonts for safety
        fontsToLoad.push('Noto+Sans', 'Noto+Sans+SC', 'Noto+Sans+TC', 'Noto+Sans+KR', 'Noto+Sans+JP');
      }

      if (fontsToLoad.length === 0) {
        resolve();
        return;
      }

      const link = document.createElement('link');
      link.id = 'google-fonts-loaded';
      link.rel = 'stylesheet';
      link.href = `https://fonts.googleapis.com/css2?${fontsToLoad.map(f => `family=${f}:wght@400;700`).join('&')}&display=swap`;
      
      link.onload = () => {
        // Wait a bit for fonts to be fully loaded
        setTimeout(() => resolve(), 500);
      };
      link.onerror = () => {
        // Even if fonts fail to load, continue with system fonts
        resolve();
      };
      
      document.head.appendChild(link);
    });
  };

  // Helper function to escape HTML
  const escapeHtml = (text: string): string => {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  };

  const generatePDF = async () => {
    setIsDownloading(true);
    
    // Show notification in Italian
    toast.info('Il tuo PDF sta scaricando... Trova la chiave di risposta nell\'ultima pagina del PDF.', {
      duration: 8000,
      style: {
        background: '#ffffff',
        color: '#1f2937',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        fontSize: '14px',
        padding: '12px 16px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      },
    });
    
    const currentLanguage = quiz.language || 'english';
    const needsSpecialFonts = needsSpecialFontHandling(currentLanguage);
    
    try {
      // Validate quizzes exist
      if (!generatedQuizzes || generatedQuizzes.length === 0) {
        throw new Error('No quizzes available to export');
      }

      // Validate each quiz has questions
      const hasQuestions = generatedQuizzes.every(q => q.questions && q.questions.length > 0);
      if (!hasQuestions) {
        throw new Error('Some quizzes have no questions');
      }

      const translations = getQuizGeneratorTranslations(currentLanguage);
      
      // Calculate total questions
      const totalQuestions = generatedQuizzes.reduce((sum, q) => sum + q.questions.length, 0);
      
      if (totalQuestions === 0) {
        throw new Error('No questions available to export');
      }

      // For Chinese and Russian, use html2canvas approach with proper font support
      if (needsSpecialFonts) {
        // Load Google Fonts for special languages
        await loadGoogleFonts(currentLanguage);
        
        // Create a hidden container with HTML content for PDF generation
        const printContainer = document.createElement('div');
        printContainer.style.position = 'absolute';
        printContainer.style.left = '-9999px';
        printContainer.style.top = '0';
        printContainer.style.width = '210mm'; // A4 width
        printContainer.style.padding = '20mm';
        printContainer.style.backgroundColor = 'white';
        
        // Use a comprehensive font stack that supports all languages, especially CJK and Cyrillic
        const fontStack = [
          'system-ui',
          '-apple-system',
          '"Segoe UI"',
          'Roboto',
          '"Noto Sans"',
          '"Noto Sans SC"',
          '"Noto Sans TC"',
          '"Noto Sans CJK SC"',
          '"Noto Sans CJK TC"',
          '"Noto Sans CJK KR"',
          '"Noto Sans JP"',
          '"Noto Sans KR"',
          '"Microsoft YaHei"',
          '"SimHei"',
          '"SimSun"',
          '"Microsoft JhengHei"',
          '"Helvetica Neue"',
          'Helvetica',
          'Arial',
          'sans-serif'
        ].join(', ');
        printContainer.style.fontFamily = fontStack;
        printContainer.style.fontSize = '14px';
        printContainer.style.lineHeight = '1.6';
        printContainer.style.color = '#000';

        // Add header
        const headerDiv = document.createElement('div');
        headerDiv.style.background = 'linear-gradient(to right, #2563EB, #1D4ED8)';
        headerDiv.style.color = 'white';
        headerDiv.style.padding = '20px';
        headerDiv.style.marginBottom = '20px';
        headerDiv.style.borderRadius = '4px';
        headerDiv.innerHTML = `
          <h1 style="font-size: 24px; margin: 0 0 10px 0; font-weight: bold;">${escapeHtml(quiz.topic)}</h1>
          <div style="font-size: 12px; opacity: 0.9;">
            ${escapeHtml(`${translations.gradeLevel}: ${quiz.gradeLevel}`)} | 
            ${escapeHtml(`${translations.date}: ${new Date().toLocaleDateString()}`)} |
            ${escapeHtml(`${translations.totalQuestions}: ${totalQuestions}`)} |
            ${escapeHtml(`${translations.numberOfQuizzes}: ${generatedQuizzes.length}`)}
          </div>
        `;
        printContainer.appendChild(headerDiv);

        // Render all quizzes
        generatedQuizzes.forEach((quizSet) => {
          const quizDiv = document.createElement('div');
          quizDiv.style.marginBottom = '25px';
          quizDiv.style.pageBreakInside = 'avoid';
          
          // Quiz header (small badge)
          const quizHeader = document.createElement('div');
          quizHeader.style.background = '#2563EB';
          quizHeader.style.color = 'white';
          quizHeader.style.padding = '8px 12px';
          quizHeader.style.fontWeight = 'bold';
          quizHeader.style.fontSize = '12px';
          quizHeader.style.marginBottom = '10px';
          quizHeader.style.display = 'inline-block';
          quizHeader.style.borderRadius = '4px';
          quizHeader.textContent = `${translations.quiz} ${quizSet.quizNumber}`;
          quizDiv.appendChild(quizHeader);
          
          // Questions
          quizSet.questions.forEach((question) => {
            const questionDiv = document.createElement('div');
            questionDiv.style.marginBottom = '15px';
            questionDiv.style.padding = '10px';
            questionDiv.style.border = '1px solid #e0e0e0';
            questionDiv.style.borderRadius = '4px';
            questionDiv.style.backgroundColor = '#fff';
            
            // Question text
            const questionText = document.createElement('div');
            questionText.style.fontWeight = 'bold';
            questionText.style.fontSize = '14px';
            questionText.style.marginBottom = '10px';
            questionText.textContent = `${question.questionNumber || 1}. ${question.question}`;
            questionDiv.appendChild(questionText);
            
            // Options
            const optionsDiv = document.createElement('div');
            optionsDiv.style.marginLeft = '10px';
            question.options.forEach((option, optIndex) => {
              const optionDiv = document.createElement('div');
              optionDiv.style.marginBottom = '5px';
              optionDiv.style.fontSize = '13px';
              optionDiv.textContent = `${String.fromCharCode(65 + optIndex)}. ${option}`;
              optionsDiv.appendChild(optionDiv);
            });
            questionDiv.appendChild(optionsDiv);
            
            quizDiv.appendChild(questionDiv);
          });
          
          printContainer.appendChild(quizDiv);
        });

        // Answer Key section
        const answerKeyDiv = document.createElement('div');
        answerKeyDiv.style.marginTop = '40px';
        answerKeyDiv.style.pageBreakBefore = 'always';
        
        const answerKeyHeader = document.createElement('div');
        answerKeyHeader.style.background = 'linear-gradient(to right, #2563EB, #1D4ED8)';
        answerKeyHeader.style.color = 'white';
        answerKeyHeader.style.padding = '15px';
        answerKeyHeader.style.fontWeight = 'bold';
        answerKeyHeader.style.fontSize = '18px';
        answerKeyHeader.style.marginBottom = '15px';
        answerKeyHeader.style.borderRadius = '4px';
        answerKeyHeader.textContent = translations.answerKey;
        answerKeyDiv.appendChild(answerKeyHeader);
        
        // Answer key table
        const table = document.createElement('table');
        table.style.width = '100%';
        table.style.borderCollapse = 'collapse';
        table.style.fontSize = '12px';
        
        // Table header
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        headerRow.style.background = '#2563EB';
        ['Quiz #', 'Question', 'Answer', 'Correct Option'].forEach(headerText => {
          const th = document.createElement('th');
          th.style.padding = '8px';
          th.style.border = '1px solid #ddd';
          th.style.textAlign = 'left';
          th.style.fontWeight = 'bold';
          th.style.color = 'white';
          th.textContent = headerText;
          headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);
        table.appendChild(thead);
        
        // Table body
        const tbody = document.createElement('tbody');
        generatedQuizzes.forEach(quizSet => {
          quizSet.questions.forEach(q => {
            const tr = document.createElement('tr');
            tr.style.borderBottom = '1px solid #eee';
            [
              `Quiz ${quizSet.quizNumber}`,
              q.question.length > 45 ? q.question.substring(0, 45) + '...' : q.question,
              String.fromCharCode(65 + q.correctAnswer),
              q.options[q.correctAnswer].length > 55 
                ? q.options[q.correctAnswer].substring(0, 55) + '...' 
                : q.options[q.correctAnswer]
            ].forEach(cellText => {
              const td = document.createElement('td');
              td.style.padding = '8px';
              td.style.border = '1px solid #ddd';
              td.style.wordWrap = 'break-word';
              td.textContent = cellText;
              tr.appendChild(td);
            });
            tbody.appendChild(tr);
          });
        });
        table.appendChild(tbody);
        answerKeyDiv.appendChild(table);
        
        printContainer.appendChild(answerKeyDiv);

        document.body.appendChild(printContainer);

        // Render to canvas using html2canvas
        const canvas = await html2canvas(printContainer, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          allowTaint: true,
        });

        // Clean up
        document.body.removeChild(printContainer);

        // Create PDF from canvas
        const imgData = canvas.toDataURL('image/png');
        const pdfWidth = 210; // A4 width in mm
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        
        const doc = new jsPDF({
          orientation: pdfHeight > pdfWidth ? 'portrait' : 'landscape',
          unit: 'mm',
          format: [pdfWidth, pdfHeight]
        });

        doc.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        doc.save(`${quiz.topic}-quiz.pdf`);
      } else {
        // For non-CJK/Cyrillic languages, use the existing jsPDF approach
        const doc = new jsPDF();
    
        // Cover page with blue header
        doc.setFillColor(37, 99, 235); // Blue color (quiz theme)
        doc.rect(0, 0, 210, 40, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.text(quiz.topic, 20, 25);
        
        // Metadata
        doc.setTextColor(0);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        let yPos = 50;
        doc.text(`${translations.gradeLevel}: ${quiz.gradeLevel}`, 20, yPos);
        doc.text(`${translations.date}: ${new Date().toLocaleDateString()}`, 120, yPos);
        yPos += 12;
        doc.text(`${translations.totalQuestions}: ${totalQuestions}`, 20, yPos);
        doc.text(`${translations.numberOfQuizzes}: ${generatedQuizzes.length}`, 120, yPos);
        yPos += 20;
        
        // Start on first page with content
        let currentY = yPos;
        let isFirstPage = true;
        
        // Render all quizzes on pages efficiently
        generatedQuizzes.forEach((quizSet, quizIndex) => {
          // Add page header if needed (not on cover page)
          if (!isFirstPage || currentY > 50) {
            // Check if we need a new page before starting new quiz
            if (currentY > 250 && !isFirstPage) {
              doc.addPage();
              currentY = 30;
            }
          }
          isFirstPage = false;
          
          // Render quiz header (small badge)
          doc.setFillColor(37, 99, 235);
          doc.rect(10, currentY - 5, 50, 8, 'F');
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(10);
          doc.setFont('helvetica', 'bold');
          doc.text(`${translations.quiz} ${quizSet.quizNumber}`, 12, currentY + 1);
          doc.setTextColor(0);
          currentY += 10;
          
          // Render questions for this quiz
          quizSet.questions.forEach((question, qIndex) => {
            try {
              // Validate question
              if (!question || !question.question || !question.options || question.options.length !== 4) {
                console.warn(`Question ${qIndex + 1} in quiz ${quizSet.quizNumber} is invalid, skipping`);
                return;
              }

              // Validate correct answer index
              if (question.correctAnswer < 0 || question.correctAnswer >= question.options.length) {
                console.warn(`Question ${qIndex + 1} has invalid correct answer index, skipping`);
                return;
              }

              // Check if we need a new page
              if (currentY > 270) {
                doc.addPage();
                currentY = 30;
              }
              
              // Question text - render ALL lines, not just first
              doc.setFontSize(11);
              doc.setFont('helvetica', 'bold');
              const questionText = `${question.questionNumber || qIndex + 1}. ${question.question}`;
              const questionLines = doc.splitTextToSize(questionText, 170);
              
              // Render all question lines
              for (let i = 0; i < questionLines.length; i++) {
                if (currentY > 270) {
                  doc.addPage();
                  currentY = 30;
                }
                doc.text(questionLines[i], 20, currentY);
                currentY += 6;
              }
              
              currentY += 2; // Space after question
              
              // Options
              doc.setFontSize(10);
              doc.setFont('helvetica', 'normal');
              question.options.forEach((option, optIndex) => {
                if (!option || option.trim().length === 0) {
                  console.warn(`Empty option ${optIndex} in question ${qIndex + 1}, skipping`);
                  return;
                }

                const prefix = `${String.fromCharCode(65 + optIndex)}. `;
                const text = prefix + option;
                
                // Check if we need a new page for options
                if (currentY > 270) {
                  doc.addPage();
                  currentY = 30;
                }
                
                // Option text - NO highlighting, NO checkmark
                doc.setTextColor(0);
                const optionLines = doc.splitTextToSize(text, 165);
                
                // Render all option lines
                for (let i = 0; i < optionLines.length; i++) {
                  if (currentY > 270) {
                    doc.addPage();
                    currentY = 30;
                  }
                  doc.text(optionLines[i], 20, currentY);
                  currentY += 6;
                }
                
                currentY += 3; // Space between options
              });
              
              currentY += 5; // Space between questions
            } catch (questionError) {
              console.error(`Error rendering question ${qIndex + 1}:`, questionError);
              // Continue with next question
            }
          });
          
          // Space between quizzes
          currentY += 5;
        });
      
        // Answer Key Page
        doc.addPage();
        doc.setFillColor(37, 99, 235);
        doc.rect(0, 0, 210, 30, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text(translations.answerKey, 20, 20);
        
        // Create answer key data
        const answerKeyData: string[][] = [];
        generatedQuizzes.forEach(quizSet => {
          quizSet.questions.forEach(q => {
            answerKeyData.push([
              `Quiz ${quizSet.quizNumber}`,
              q.question.length > 45 ? q.question.substring(0, 45) + '...' : q.question,
              String.fromCharCode(65 + q.correctAnswer),
              q.options[q.correctAnswer].length > 55 
                ? q.options[q.correctAnswer].substring(0, 55) + '...' 
                : q.options[q.correctAnswer]
            ]);
          });
        });
        
        // Render answer key table
        (doc as any).autoTable({
          head: [['Quiz #', 'Question', 'Answer', 'Correct Option']],
          body: answerKeyData,
          startY: 40,
          theme: 'grid',
          headStyles: { fillColor: [37, 99, 235], textColor: 255, halign: 'left' },
          bodyStyles: { fontSize: 9 },
          alternateRowStyles: { fillColor: [250, 250, 250] },
          margin: { left: 20, right: 20 },
          styles: { cellPadding: 3, valign: 'top' },
          columnStyles: {
            0: { cellWidth: 25 }, // Quiz #
            1: { cellWidth: 65 }, // Question
            2: { cellWidth: 20 }, // Answer
            3: { cellWidth: 80 }  // Correct Option
          }
        });
      
        doc.save(`${quiz.topic}-quiz.pdf`);
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  const totalQuestions = generatedQuizzes.reduce((sum, q) => sum + q.questions.length, 0);

  return (
    <div className="max-w-4xl mx-auto space-y-6 bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg p-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2">{quiz.topic}</h1>
            <div className="flex items-center gap-4 text-blue-100">
              <span className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                {translations.gradeLevel}: {quiz.gradeLevel}
              </span>
              <span className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {translations.date}: {new Date().toLocaleDateString()}
              </span>
              <span className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                {totalQuestions} {translations.questions}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={generatePDF}
              disabled={isDownloading}
              className="bg-white text-blue-600 hover:bg-blue-50"
            >
              <Download className="h-4 w-4 mr-2" />
              {isDownloading ? translations.downloading : translations.downloadPdf}
            </Button>
            <Button
              onClick={onGenerateAgain}
              className="bg-blue-500 text-white hover:bg-blue-400"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Genera di Nuovo
            </Button>
          </div>
        </div>
      </div>

      {/* All Quizzes - Single View */}
      <div className="space-y-4">
        {generatedQuizzes.map((quizSet) => (
          <Card key={quizSet.quizNumber} className="border-2">
            <CardContent className="p-6">
              {quizSet.questions.map((question, qIndex) => (
                <div key={qIndex} className="mb-6 last:mb-0">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-sm font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                      {translations.quiz} {quizSet.quizNumber}
                    </span>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {question.question}
                    </h3>
                  </div>
                  <div className="space-y-3">
                    {question.options.map((option, index) => (
                      <div
                        key={index}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          index === question.correctAnswer
                            ? 'border-blue-500 bg-blue-50 shadow-md'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className={`font-bold text-lg ${
                            index === question.correctAnswer ? 'text-blue-600' : 'text-gray-600'
                          }`}>
                            {String.fromCharCode(65 + index)}.
                          </span>
                          <span className={`flex-1 ${
                            index === question.correctAnswer ? 'text-blue-800 font-medium' : 'text-gray-700'
                          }`}>
                            {option}
                          </span>
                          {index === question.correctAnswer && (
                            <CheckCircle className="h-5 w-5 text-blue-500 flex-shrink-0" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

