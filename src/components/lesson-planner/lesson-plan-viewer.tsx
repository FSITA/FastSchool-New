"use client"

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, RotateCcw, FileText, Clock, Target, BookOpen, CheckSquare, Lightbulb } from 'lucide-react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import type { LessonPlanViewerProps, LessonPlanSection } from '@/types/lesson-planner';

export function LessonPlanViewer({ lessonPlan, generatedContent, onGenerateAgain }: LessonPlanViewerProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  // Reset downloading state when component unmounts
  useEffect(() => {
    return () => {
      setIsDownloading(false);
    };
  }, []);

  const generatePDF = () => {
    setIsDownloading(true);
    
    try {
      const doc = new jsPDF();
    
    // Header
    doc.setFillColor(255, 140, 0); // Orange color
    doc.rect(0, 0, 210, 30, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.text(`Lesson Plan: ${lessonPlan.topic}`, 20, 20);
  
    // Basic info
    let yPos = 40;
    doc.setTextColor(0);
    doc.setFontSize(12);
    doc.text(`Grade Level: ${lessonPlan.gradeLevel}`, 20, yPos);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 120, yPos);
    
    // Parse and format content
    const sections = generatedContent.split(/SECTION\s*\d*:?\s*/i);
    let currentY = 50;
  
    sections.forEach((section, index) => {
      if (index === 0 || !section.trim()) return; 

      const lines = section.split('\n');
      const sectionTitle = lines[0]?.trim() || `Section ${index}`;
      const sectionContent = lines.slice(1);
      const cleanContent = sectionContent.join('\n').trim();

      // Section header
      (doc as any).autoTable({
        startY: currentY,
        head: [[sectionTitle]],
        headStyles: { 
          fillColor: [255, 140, 0],
          textColor: 255,
          fontSize: 14,
          fontStyle: 'bold'
        },
        body: [],
        margin: { top: 10 }
      });
  
      currentY = (doc as any).lastAutoTable.finalY + 5;
  
      // Timeline table
      if (sectionTitle && (sectionTitle.toUpperCase().includes('TIMELINE') || 
                          sectionTitle.toUpperCase().includes('CRONOLOGIA') ||
                          sectionTitle.toUpperCase().includes('CRONOPROGRAMMA') ||
                          sectionTitle.toUpperCase().includes('SCHEDULE') ||
                          sectionTitle.toUpperCase().includes('AGENDA') ||
                          sectionTitle.toUpperCase().includes('PROGRAMMA'))) {
        const rows = cleanContent.split('\n')
          .filter(row => {
            const trimmed = row.trim();
            return trimmed && 
                   trimmed.includes('|') && 
                   !trimmed.startsWith('•') && 
                   !trimmed.startsWith('-') &&
                   !trimmed.startsWith('*') &&
                   !trimmed.match(/^\|[\s\-:]+\|/) &&
                   !trimmed.match(/^\|\s*\*\s*\*\s*\*\s*\|/);
          })
          .map(row => {
            // Clean the row by removing bullet points and extra formatting
            const cleanRow = row.replace(/^[\s•\-\*]+\s*/, '').trim();
            return cleanRow.split('|').map(cell => {
              // Remove bold markers for PDF
              return cell.trim().replace(/\*\*(.*?)\*\*/g, '$1');
            });
          })
          .filter(row => row.length >= 2); // Only include rows with at least 2 columns
        
        if (rows.length > 0) {
          (doc as any).autoTable({
            startY: currentY,
            head: [['Duration', 'Activity', 'Instructions', 'Notes']],
            body: rows,
            headStyles: { fillColor: [255, 165, 0] },
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
        }
      } else {
        // Regular content
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
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  const parseContent = (content: string): LessonPlanSection[] => {
    // Split by SECTION followed by a number and colon
    const sections = content.split(/SECTION\s*\d*:?\s*/i);
    const parsedSections: LessonPlanSection[] = [];
    
    sections.forEach((section, index) => {
      if (index === 0 || !section.trim()) return;
      
      const lines = section.split('\n');
      const titleLine = lines[0]?.trim();
      const contentLines = lines.slice(1);
      const cleanContent = contentLines.join('\n').trim();
      
      // Clean up the title
      const cleanTitle = titleLine || `Section ${index}`;
      
      let type: 'list' | 'table' | 'text' = 'text';
      if (cleanTitle.toUpperCase().includes('TIMELINE') || 
          cleanTitle.toUpperCase().includes('CRONOLOGIA') ||
          cleanTitle.toUpperCase().includes('CRONOPROGRAMMA') ||
          cleanTitle.toUpperCase().includes('SCHEDULE') ||
          cleanTitle.toUpperCase().includes('AGENDA') ||
          cleanTitle.toUpperCase().includes('PROGRAMMA')) {
        type = 'table';
      } else if (cleanContent.includes('•') || cleanContent.includes('-') || cleanContent.includes('*')) {
        type = 'list';
      }
      
      parsedSections.push({
        title: cleanTitle,
        content: cleanContent,
        type
      });
    });
    
    return parsedSections;
  };

  const getSectionIcon = (title: string) => {
    if (title.includes('MATERIALS')) return <BookOpen className="h-5 w-5" />;
    if (title.includes('OBJECTIVES')) return <Target className="h-5 w-5" />;
    if (title.includes('TIMELINE')) return <Clock className="h-5 w-5" />;
    if (title.includes('ASSESSMENT')) return <CheckSquare className="h-5 w-5" />;
    if (title.includes('NOTES')) return <Lightbulb className="h-5 w-5" />;
    return <FileText className="h-5 w-5" />;
  };

  const parsedSections = parseContent(generatedContent);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-lg p-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2">{lessonPlan.topic}</h1>
            <div className="flex items-center gap-4 text-orange-100">
              <span className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Grade {lessonPlan.gradeLevel}
              </span>
              <span className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {new Date().toLocaleDateString()}
              </span>
            </div>
          </div>
          <Button
            onClick={generatePDF}
            disabled={isDownloading}
            className="bg-white text-orange-600 hover:bg-orange-50"
          >
            <Download className="h-4 w-4 mr-2" />
            {isDownloading ? 'Downloading...' : 'Download PDF'}
          </Button>
        </div>
      </div>

      {/* Lesson Plan Content */}
      <div className="space-y-6">
        {parsedSections.map((section, index) => (
          <Card key={index} className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
                {getSectionIcon(section.title)}
              </div>
              <h2 className="text-xl font-semibold text-gray-900">{section.title}</h2>
            </div>
            
            <div className="prose prose-gray max-w-none">
              {section.type === 'table' ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Duration</th>
                        <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Activity</th>
                        <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Instructions</th>
                        <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {section.content.split('\n')
                        .filter(row => {
                          const trimmed = row.trim();
                          // Include rows with | separator, but exclude bullet points and markdown separators
                          return trimmed && 
                                 trimmed.includes('|') && 
                                 !trimmed.startsWith('•') && 
                                 !trimmed.startsWith('-') &&
                                 !trimmed.startsWith('*') &&
                                 !trimmed.match(/^\|[\s\-:]+\|/) && // Exclude markdown table separators like | --- |
                                 !trimmed.match(/^\|\s*\*\s*\*\s*\*\s*\|/); // Exclude separator rows like | * * * |
                        })
                        .map((row, rowIndex) => {
                          // Clean the row by removing bullet points and extra formatting
                          const cleanRow = row.replace(/^[\s•\-\*]+\s*/, '').trim();
                          const cells = cleanRow.split('|').map(cell => cell.trim());
                          
                          // Skip header rows that might be in the content
                          if (cells.some(cell => 
                            cell.toLowerCase().includes('duration') || 
                            cell.toLowerCase().includes('activity') ||
                            cell.toLowerCase().includes('durata') ||
                            cell.toLowerCase().includes('attività') ||
                            cell.toLowerCase().includes('istruzioni') ||
                            cell.toLowerCase().includes('note')
                          )) {
                            return null;
                          }
                          
                          return (
                            <tr key={rowIndex} className="hover:bg-gray-50">
                              {cells.map((cell, cellIndex) => {
                                // Handle bold text in cells
                                const boldRegex = /\*\*(.*?)\*\*/g;
                                const hasBold = boldRegex.test(cell);
                                
                                if (hasBold) {
                                  const parts = cell.split(/(\*\*.*?\*\*)/g);
                                  return (
                                    <td key={cellIndex} className="border border-gray-300 px-4 py-2">
                                      {parts.map((part, partIndex) => {
                                        if (part.startsWith('**') && part.endsWith('**')) {
                                          return (
                                            <strong key={partIndex} className="font-semibold">
                                              {part.slice(2, -2)}
                                            </strong>
                                          );
                                        }
                                        return part;
                                      })}
                                    </td>
                                  );
                                }
                                
                                return (
                                  <td key={cellIndex} className="border border-gray-300 px-4 py-2">
                                    {cell}
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        }).filter(Boolean)}
                    </tbody>
                  </table>
                </div>
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
                            <span className="text-orange-600 mt-1">•</span>
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
                          <span className="text-orange-600 mt-1">•</span>
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

      {/* Action Buttons */}
      <div className="flex justify-center gap-4 pt-6">
        <Button
          onClick={onGenerateAgain}
          variant="outline"
          size="lg"
          className="flex items-center gap-2"
        >
          <RotateCcw className="h-4 w-4" />
          Generate Another Lesson Plan
        </Button>
      </div>
    </div>
  );
}
