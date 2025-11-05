"use client"

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, RotateCcw, FileText, Clock, Target, BookOpen, CheckSquare, Lightbulb } from 'lucide-react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import html2canvas from 'html2canvas';
import type { LessonPlanViewerProps, LessonPlanSection, TimelineRow } from '@/types/lesson-planner';
import { TimelineParser } from '@/lib/lesson-planner/timeline-parser';
import { SectionParser } from '@/lib/lesson-planner/section-parser';
import { getLessonPlanTranslations, translateSectionTitle } from '@/lib/lesson-planner/language-translations';

export function LessonPlanViewer({ lessonPlan, generatedContent, onGenerateAgain }: LessonPlanViewerProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const translations = getLessonPlanTranslations(lessonPlan.language || 'english');

  // Reset downloading state when component unmounts
  useEffect(() => {
    return () => {
      setIsDownloading(false);
    };
  }, []);

  // Helper function to check if language is CJK (Chinese, Japanese, Korean)
  const isCJKLanguage = (language: string): boolean => {
    const cjkLanguages = ['chinese', 'japanese', 'korean'];
    return cjkLanguages.includes(language.toLowerCase());
  };

  // Helper function to escape HTML
  const escapeHtml = (text: string): string => {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  };

  // Helper function to load Google Fonts for CJK languages
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
      } else if (language === 'japanese') {
        fontsToLoad.push('Noto+Sans+JP');
      } else if (language === 'korean') {
        fontsToLoad.push('Noto+Sans+KR');
      } else {
        // Load all CJK fonts for safety
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

  const generatePDF = async () => {
    setIsDownloading(true);
    
    const currentLanguage = lessonPlan.language || 'english';
    const isCJK = isCJKLanguage(currentLanguage);
    
    try {
      // For CJK languages, use html2canvas approach with proper font support
      if (isCJK) {
        // Load Google Fonts for CJK languages
        await loadGoogleFonts(currentLanguage);
        
        // Create a hidden container with HTML content for PDF generation
        const printContainer = document.createElement('div');
        printContainer.style.position = 'absolute';
        printContainer.style.left = '-9999px';
        printContainer.style.top = '0';
        printContainer.style.width = '210mm'; // A4 width
        printContainer.style.padding = '20mm';
        printContainer.style.backgroundColor = 'white';
        
        // Use a comprehensive font stack that supports all languages, especially CJK
        const fontStack = [
          'system-ui',
          '-apple-system',
          '"Segoe UI"',
          'Roboto',
          '"Noto Sans"',
          '"Noto Sans CJK SC"',
          '"Noto Sans CJK TC"',
          '"Noto Sans CJK KR"',
          '"Noto Sans JP"',
          '"Noto Sans SC"',
          '"Noto Sans TC"',
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
          <h1 style="font-size: 24px; margin: 0 0 10px 0; font-weight: bold;">${escapeHtml(`Lesson Plan: ${lessonPlan.topic}`)}</h1>
          <div style="font-size: 12px; opacity: 0.9;">
            ${escapeHtml(`${translations.gradeLevel}: ${lessonPlan.gradeLevel}`)} | 
            ${escapeHtml(`${translations.date}: ${new Date().toLocaleDateString()}`)}
          </div>
        `;
        printContainer.appendChild(headerDiv);

        // Parse and format content
        const parsedSections = SectionParser.parseContent(generatedContent);
        
        parsedSections.forEach((section) => {
          const sectionTitle = translateSectionTitle(section.title, currentLanguage);
          const cleanContent = section.content;

          // Section header
          const sectionDiv = document.createElement('div');
          sectionDiv.style.marginBottom = '20px';
          sectionDiv.style.pageBreakInside = 'avoid';
          
          const sectionHeader = document.createElement('div');
          sectionHeader.style.background = '#2563EB';
          sectionHeader.style.color = 'white';
          sectionHeader.style.padding = '10px 15px';
          sectionHeader.style.fontWeight = 'bold';
          sectionHeader.style.fontSize = '16px';
          sectionHeader.style.marginBottom = '10px';
          sectionHeader.textContent = sectionTitle;
          sectionDiv.appendChild(sectionHeader);

          // Section content
          const contentDiv = document.createElement('div');
          contentDiv.style.padding = '15px';
          contentDiv.style.border = '1px solid #e0e0e0';
          contentDiv.style.borderRadius = '4px';
          contentDiv.style.backgroundColor = '#fff';

          if (section.type === 'table') {
            const parseResult = TimelineParser.parseTimelineContent(cleanContent);
            
            if (parseResult.success && parseResult.rows.length > 0) {
              const table = document.createElement('table');
              table.style.width = '100%';
              table.style.borderCollapse = 'collapse';
              table.style.fontSize = '12px';
              
              // Table header
              const thead = document.createElement('thead');
              const headerRow = document.createElement('tr');
              headerRow.style.background = '#2563EB';
              [translations.duration, translations.activity, translations.instructions, translations.teacherNotes].forEach(headerText => {
                const th = document.createElement('th');
                th.style.padding = '8px';
                th.style.border = '1px solid #ddd';
                th.style.textAlign = 'left';
                th.style.fontWeight = 'bold';
                th.textContent = headerText;
                headerRow.appendChild(th);
              });
              thead.appendChild(headerRow);
              table.appendChild(thead);
              
              // Table body
              const tbody = document.createElement('tbody');
              parseResult.rows.forEach(row => {
                const tr = document.createElement('tr');
                tr.style.borderBottom = '1px solid #eee';
                [row.duration, row.activity, row.instructions, row.teacherNotes].forEach(cellText => {
                  const td = document.createElement('td');
                  td.style.padding = '8px';
                  td.style.border = '1px solid #ddd';
                  td.style.wordWrap = 'break-word';
                  td.textContent = cellText;
                  tr.appendChild(td);
                });
                tbody.appendChild(tr);
              });
              table.appendChild(tbody);
              contentDiv.appendChild(table);
            } else {
              // Fallback to regular content
              cleanContent.split('\n').filter(line => line.trim()).forEach(line => {
                const p = document.createElement('p');
                p.style.margin = '5px 0';
                p.textContent = line.trim();
                contentDiv.appendChild(p);
              });
            }
          } else if (section.type === 'list') {
            const ul = document.createElement('ul');
            ul.style.margin = '0';
            ul.style.paddingLeft = '20px';
            cleanContent.split('\n').filter(line => line.trim()).forEach(line => {
              const cleanLine = line.replace(/^[•\-\*]\s*/, '').trim();
              const li = document.createElement('li');
              li.style.margin = '5px 0';
              li.textContent = cleanLine;
              ul.appendChild(li);
            });
            contentDiv.appendChild(ul);
          } else {
            cleanContent.split('\n').filter(line => line.trim()).forEach(line => {
              const p = document.createElement('p');
              p.style.margin = '5px 0';
              p.style.lineHeight = '1.6';
              p.textContent = line.trim();
              contentDiv.appendChild(p);
            });
          }

          sectionDiv.appendChild(contentDiv);
          printContainer.appendChild(sectionDiv);
        });

        // Add page numbers placeholder (will be added during PDF generation)
        const footerDiv = document.createElement('div');
        footerDiv.style.textAlign = 'center';
        footerDiv.style.marginTop = '20px';
        footerDiv.style.fontSize = '10px';
        footerDiv.style.color = '#808080';
        footerDiv.textContent = 'Generated by Fastschool';
        printContainer.appendChild(footerDiv);

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
        doc.save(`lesson-plan-${lessonPlan.topic.toLowerCase().replace(/\s+/g, '-')}.pdf`);
      } else {
        // For non-CJK languages, use the existing jsPDF approach
        const doc = new jsPDF();
        const translations = getLessonPlanTranslations(currentLanguage);
      
        // Header
        doc.setFillColor(37, 99, 235); // Blue color
        doc.rect(0, 0, 210, 30, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.text(`Lesson Plan: ${lessonPlan.topic}`, 20, 20);
      
        // Basic info
        let yPos = 40;
        doc.setTextColor(0);
        doc.setFontSize(12);
        doc.text(`${translations.gradeLevel}: ${lessonPlan.gradeLevel}`, 20, yPos);
        doc.text(`${translations.date}: ${new Date().toLocaleDateString()}`, 120, yPos);
        
        // Parse and format content using robust section parser
        const parsedSections = SectionParser.parseContent(generatedContent);
        let currentY = 50;
      
        parsedSections.forEach((section) => {
          const sectionTitle = translateSectionTitle(section.title, currentLanguage);
          const cleanContent = section.content;

          // Section header
          (doc as any).autoTable({
            startY: currentY,
            head: [[sectionTitle]],
            headStyles: { 
              fillColor: [37, 99, 235],
              textColor: 255,
              fontSize: 14,
              fontStyle: 'bold'
            },
            body: [],
            margin: { top: 10 }
          });
      
          currentY = (doc as any).lastAutoTable.finalY + 5;
      
          // Timeline table
          if (section.type === 'table') {
            const parseResult = TimelineParser.parseTimelineContent(cleanContent);
            
            if (parseResult.success && parseResult.rows.length > 0) {
              const rows = parseResult.rows.map(row => [
                row.duration,
                row.activity,
                row.instructions,
                row.teacherNotes
              ]);
              
              (doc as any).autoTable({
                startY: currentY,
                head: [[translations.duration, translations.activity, translations.instructions, translations.teacherNotes]],
                body: rows,
                headStyles: { fillColor: [37, 99, 235] },
                styles: { 
                  cellPadding: 3,
                  fontSize: 9,
                  overflow: 'linebreak'
                },
                columnStyles: {
                  0: { cellWidth: 25 },
                  1: { cellWidth: 35 },
                  2: { cellWidth: 80 },
                  3: { cellWidth: 40 }
                },
                margin: { left: 10, right: 10 }
              });
            } else {
              // Fallback to regular content if timeline parsing fails
              (doc as any).autoTable({
                startY: currentY,
                body: cleanContent.split('\n')
                  .filter(line => line.trim())
                  .map(line => [line.trim()]),
                styles: { 
                  cellPadding: 5,
                  fontSize: 11
                },
                columnStyles: {
                  0: { cellWidth: 'auto' }
                }
              });
            }
          } else {
            // Regular content (list or text)
            if (section.type === 'list') {
              // Handle list content
              const listItems = cleanContent.split('\n')
                .filter(line => line.trim())
                .map(line => {
                  // Remove bullet points and clean up
                  const cleanLine = line.replace(/^[•\-\*]\s*/, '').trim();
                  return [cleanLine];
                });
              
              (doc as any).autoTable({
                startY: currentY,
                body: listItems,
                styles: { 
                  cellPadding: 5,
                  fontSize: 11
                },
                columnStyles: {
                  0: { cellWidth: 'auto' }
                }
              });
            } else {
              // Handle text content
              const textLines = cleanContent.split('\n')
                .filter(line => line.trim())
                .map(line => [line.trim()]);
              
              (doc as any).autoTable({
                startY: currentY,
                body: textLines,
                styles: { 
                  cellPadding: 5,
                  fontSize: 11
                },
                columnStyles: {
                  0: { cellWidth: 'auto' }
                }
              });
            }
          }
      
          currentY = (doc as any).lastAutoTable.finalY + 10;
        });
      
        // Page numbers
        const pageCount = (doc as any).internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
          doc.setPage(i);
          doc.setFontSize(10);
          doc.setTextColor(128);
          doc.text(
            `Page ${i} of ${pageCount}`,
            doc.internal.pageSize.getWidth() - 30,
            doc.internal.pageSize.getHeight() - 10
          );
        }
      
        doc.save(`lesson-plan-${lessonPlan.topic.toLowerCase().replace(/\s+/g, '-')}.pdf`);
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  const parseContent = (content: string): LessonPlanSection[] => {
    console.log('🔍 Parsing lesson plan content with robust section parser...');
    return SectionParser.parseContent(content);
  };

  const getSectionIcon = (title: string) => {
    if (title.includes('MATERIALS')) return <BookOpen className="h-5 w-5" />;
    if (title.includes('OBJECTIVES')) return <Target className="h-5 w-5" />;
    if (title.includes('TIMELINE')) return <Clock className="h-5 w-5" />;
    if (title.includes('ASSESSMENT')) return <CheckSquare className="h-5 w-5" />;
    if (title.includes('NOTES')) return <Lightbulb className="h-5 w-5" />;
    return <FileText className="h-5 w-5" />;
  };

  /**
   * Render timeline section with smart parsing and fallback
   */
  const renderTimelineSection = (content: string) => {
    console.log('🎯 Rendering timeline section with content:', content.substring(0, 200) + '...');
    
    try {
      const parseResult = TimelineParser.parseTimelineContent(content);
      
      if (parseResult.success && parseResult.rows.length > 0) {
        console.log('✅ Timeline parsed successfully, rendering table with', parseResult.rows.length, 'rows');
        return (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 px-4 py-2 text-left font-semibold">{translations.duration}</th>
                    <th className="border border-gray-300 px-4 py-2 text-left font-semibold">{translations.activity}</th>
                    <th className="border border-gray-300 px-4 py-2 text-left font-semibold">{translations.instructions}</th>
                    <th className="border border-gray-300 px-4 py-2 text-left font-semibold">{translations.teacherNotes}</th>
                  </tr>
                </thead>
              <tbody>
                {parseResult.rows.map((row, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-2 font-medium text-blue-600">
                      {row.duration}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 font-medium">
                      {row.activity}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      {row.instructions}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-gray-600">
                      {row.teacherNotes}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      } else {
        console.log('⚠️ Timeline parsing failed, using fallback list display');
        return (
          <div className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800 text-sm">
                <strong>Note:</strong> Timeline could not be parsed as a table. Displaying as structured list.
              </p>
            </div>
            <div className="space-y-2">
              {content.split('\n')
                .filter(line => line.trim())
                .map((line, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">•</span>
                    <span className="text-gray-700">{line.trim()}</span>
                  </div>
                ))}
            </div>
          </div>
        );
      }
    } catch (error) {
      console.error('❌ Error rendering timeline section:', error);
      return (
        <div className="space-y-2">
          {content.split('\n')
            .filter(line => line.trim())
            .map((line, index) => (
              <div key={index} className="flex items-start gap-2">
                <span className="text-orange-600 mt-1">•</span>
                <span className="text-gray-700">{line.trim()}</span>
              </div>
            ))}
        </div>
      );
    }
  };

  const parsedSections = parseContent(generatedContent);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg p-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2">{lessonPlan.topic}</h1>
            <div className="flex items-center gap-4 text-blue-100">
              <span className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                {translations.gradeLevel}: {lessonPlan.gradeLevel}
              </span>
              <span className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {translations.date}: {new Date().toLocaleDateString()}
              </span>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={onGenerateAgain}
              variant="outline"
              className="bg-white text-blue-600 hover:bg-blue-50 border-white"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              {translations.generateAnother}
            </Button>
            <Button
              onClick={generatePDF}
              disabled={isDownloading}
              className="bg-white text-blue-600 hover:bg-blue-50"
            >
              <Download className="h-4 w-4 mr-2" />
              {isDownloading ? translations.downloading : translations.downloadPdf}
            </Button>
          </div>
        </div>
      </div>

      {/* Lesson Plan Content */}
      <div className="space-y-6">
        {parsedSections.map((section, index) => (
          <Card key={index} className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                {getSectionIcon(section.title)}
              </div>
              <h2 className="text-xl font-semibold text-gray-900">{translateSectionTitle(section.title, lessonPlan.language || 'english')}</h2>
            </div>
            
            <div className="prose prose-gray max-w-none">
              {section.type === 'table' ? (
                renderTimelineSection(section.content)
              ) : section.type === 'list' ? (
                <ul className="space-y-2">
                  {section.content.split('\n')
                    .filter(line => line.trim())
                    .map((line, lineIndex) => {
                      const cleanLine = line.replace(/^[•\-]\s*/, '');
                      const boldRegex = /\*\*(.*?)\*\*/g;
                      const hasBold = boldRegex.test(cleanLine);
                      
                      if (hasBold) {
                        const parts = cleanLine.split(/(\*\*.*?\*\*)/g);
                        return (
                          <li key={lineIndex} className="flex items-start gap-2">
                            <span className="text-blue-600 mt-1">•</span>
                            <span>
                              {parts.map((part, partIndex) => {
                                if (part.startsWith('**') && part.endsWith('**')) {
                                  return (
                                    <strong key={partIndex} className="font-semibold text-gray-900">
                                      {part.slice(2, -2)}
                                    </strong>
                                  );
                                }
                                return part;
                              })}
                            </span>
                          </li>
                        );
                      }
                      
                      return (
                        <li key={lineIndex} className="flex items-start gap-2">
                          <span className="text-blue-600 mt-1">•</span>
                          <span>{cleanLine}</span>
                        </li>
                      );
                    })}
                </ul>
              ) : (
                <div className="space-y-2">
                  {section.content.split('\n')
                    .filter(line => line.trim())
                    .map((line, lineIndex) => {
                      // Check if line contains bold markers like **text**
                      const boldRegex = /\*\*(.*?)\*\*/g;
                      const hasBold = boldRegex.test(line);
                      
                      if (hasBold) {
                        const parts = line.split(/(\*\*.*?\*\*)/g);
                        return (
                          <p key={lineIndex} className="text-gray-700 leading-relaxed">
                            {parts.map((part, partIndex) => {
                              if (part.startsWith('**') && part.endsWith('**')) {
                                return (
                                  <strong key={partIndex} className="font-semibold text-gray-900">
                                    {part.slice(2, -2)}
                                  </strong>
                                );
                              }
                              return part;
                            })}
                          </p>
                        );
                      }
                      
                      return (
                        <p key={lineIndex} className="text-gray-700 leading-relaxed">
                          {line}
                        </p>
                      );
                    })}
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
