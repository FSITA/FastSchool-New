"use client"

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, RotateCcw, FileText, Clock, Target, BookOpen, CheckSquare, Lightbulb, ChevronLeft, ChevronRight } from 'lucide-react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import type { LessonGeneratorViewerProps, LessonPage } from '@/types/lesson-generator';
import { getLessonGeneratorTranslations } from '@/lib/lesson-generator/language-translations';

export function LessonGeneratorViewer({ lesson, generatedPages, onGenerateAgain }: LessonGeneratorViewerProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const translations = getLessonGeneratorTranslations(lesson.language || 'english');

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
      const translations = getLessonGeneratorTranslations(lesson.language || 'english');
    
      // Header with title inside blue strip
      doc.setFillColor(37, 99, 235); // Blue color
      doc.rect(0, 0, 210, 35, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      // Center the title vertically in the blue header (35/2 = 17.5, but we want it slightly higher for visual balance)
      doc.text(lesson.topic, 20, 22);
      
      // Basic info section (with proper spacing from header)
      let yPos = 52;
      doc.setTextColor(0);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(`${translations.gradeLevel}: ${lesson.gradeLevel}`, 20, yPos);
      doc.text(`${translations.date}: ${new Date().toLocaleDateString()}`, 120, yPos);
      yPos += 12; // Increased spacing between lines to prevent overlap
      doc.text(`${translations.numberOfPages}: ${lesson.numberOfPages}`, 20, yPos);
      yPos += 15; // Extra spacing before content starts
    
      // Helpers for parsing Markdown-like tables and simple lists for PDF
      const isPipeRow = (line: string) => /\|/.test(line);
      const isSeparatorRow = (line: string) => /\|?\s*-{3,}/.test(line);
      const splitCells = (line: string) => line
        .trim()
        .replace(/^\|/, '')
        .replace(/\|$/, '')
        .split('|')
        .map((c) => c.trim());

      const stripBold = (t: string) => t.replace(/\*\*(.*?)\*\*/g, '$1');

      const renderParagraph = (text: string, startY: number, pageNum: number = 1) => {
        const lines = doc.splitTextToSize(text, 170);
        let y = startY;
        let currentPageNum = pageNum;
        for (const line of lines) {
          if (y > 280) {
            doc.addPage();
            currentPageNum = (doc as any).internal.getNumberOfPages();
            // Add header to new page
            doc.setFillColor(37, 99, 235);
            doc.rect(0, 0, 210, 25, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text(`${translations.page} ${currentPageNum}`, 20, 16);
            doc.setTextColor(0);
            doc.setFontSize(11);
            doc.setFont('helvetica', 'normal');
            y = 35;
          }
          doc.text(line, 20, y);
          y += 7; // Slightly increased line spacing
        }
        return y;
      };

      const renderBulletedBlock = (items: string[], startY: number, pageNum: number = 1) => {
        let y = startY;
        let currentPageNum = pageNum;
        for (const item of items) {
          const wrapped = doc.splitTextToSize(stripBold(item), 160);
          for (let idx = 0; idx < wrapped.length; idx++) {
            if (y > 280) {
              doc.addPage();
              currentPageNum = (doc as any).internal.getNumberOfPages();
              // Add header to new page
              doc.setFillColor(255, 140, 0);
              doc.rect(0, 0, 210, 25, 'F');
              doc.setTextColor(255, 255, 255);
              doc.setFontSize(14);
              doc.setFont('helvetica', 'bold');
              doc.text(`${translations.page} ${currentPageNum}`, 20, 16);
              doc.setTextColor(0);
              doc.setFontSize(11);
              doc.setFont('helvetica', 'normal');
              y = 35;
            }
            if (idx === 0) {
              doc.text('•', 20, y);
              doc.text(wrapped[idx], 26, y);
            } else {
              doc.text(wrapped[idx], 26, y);
            }
            y += 7; // Slightly increased line spacing
          }
          y += 2; // Extra spacing between bullet items
        }
        return y;
      };

      const renderNumberedBlock = (items: string[], startY: number, pageNum: number = 1) => {
        let y = startY;
        let currentPageNum = pageNum;
        for (let i = 0; i < items.length; i++) {
          const label = `${i + 1}.`;
          const wrapped = doc.splitTextToSize(stripBold(items[i]), 155);
          for (let idx = 0; idx < wrapped.length; idx++) {
            if (y > 280) {
              doc.addPage();
              currentPageNum = (doc as any).internal.getNumberOfPages();
              // Add header to new page
              doc.setFillColor(255, 140, 0);
              doc.rect(0, 0, 210, 25, 'F');
              doc.setTextColor(255, 255, 255);
              doc.setFontSize(14);
              doc.setFont('helvetica', 'bold');
              doc.text(`${translations.page} ${currentPageNum}`, 20, 16);
              doc.setTextColor(0);
              doc.setFontSize(11);
              doc.setFont('helvetica', 'normal');
              y = 35;
            }
            if (idx === 0) {
              doc.text(label, 20, y);
              doc.text(wrapped[idx], 28, y);
            } else {
              doc.text(wrapped[idx], 28, y);
            }
            y += 7; // Slightly increased line spacing
          }
          y += 2; // Extra spacing between numbered items
        }
        return y;
      };

      const renderTable = (caption: string | null, head: string[], body: string[][], startY: number, pageNum: number = 1) => {
        let y = startY;
        let currentPageNum = pageNum;
        if (caption) {
          if (y > 280) {
            doc.addPage();
            currentPageNum = (doc as any).internal.getNumberOfPages();
            // Add header to new page
            doc.setFillColor(37, 99, 235);
            doc.rect(0, 0, 210, 25, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text(`${translations.page} ${currentPageNum}`, 20, 16);
            doc.setTextColor(0);
            doc.setFont('helvetica', 'bold');
            y = 35;
          }
          doc.setFont('helvetica', 'bold');
          doc.text(stripBold(caption), 20, y);
          doc.setFont('helvetica', 'normal');
          y += 8;
        }
        (doc as any).autoTable({
          head: [head.map((h) => stripBold(h))],
          body: body.map((row) => row.map((c) => stripBold(c))),
          startY: y,
          theme: 'grid',
          styles: { fontSize: 10, cellPadding: 3, valign: 'top' },
          headStyles: { fillColor: [37, 99, 235], textColor: 255, halign: 'left' },
          alternateRowStyles: { fillColor: [250, 250, 250] },
          margin: { left: 20, right: 20 },
        });
        const finalY = ((doc as any).lastAutoTable?.finalY ?? y) + 12; // Extra spacing after table
        return finalY;
      };

      // Generate pages
      generatedPages.forEach((page, index) => {
        if (index > 0) {
          doc.addPage();
        }
        
        // Page header with page number in blue strip
        doc.setFillColor(37, 99, 235);
        doc.rect(0, 0, 210, 25, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(`${translations.page} ${page.pageNumber} ${translations.of} ${generatedPages.length}`, 20, 16);
        
        // Page title (with proper spacing from header)
        doc.setTextColor(0);
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text(page.title, 20, 42);
        
        // Page content (with basic markdown-like parsing)
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');

        const raw = page.content.split('\n');
        let p = 0;
        let currentY = 52; // Start content with proper spacing from title
        while (p < raw.length) {
          let line = raw[p];
          const trimmed = line.trim();

          if (!trimmed) {
            p += 1;
            currentY += 4; // Increased gap for empty lines for better readability
            continue;
          }

          // Table caption + table
          let caption: string | null = null;
          let headerIdx = p;
          if (/^(\*\*)?Table:\s*/i.test(trimmed) && p + 2 < raw.length && isPipeRow(raw[p + 1]) && isSeparatorRow(raw[p + 2])) {
            caption = trimmed.replace(/^(\*\*)?Table:\s*/i, '').replace(/\*\*$/,'').trim();
            headerIdx = p + 1;
          }

          if (isPipeRow(raw[headerIdx]) && headerIdx + 1 < raw.length && isSeparatorRow(raw[headerIdx + 1])) {
            const headCells = splitCells(raw[headerIdx]);
            let q = headerIdx + 2;
            const body: string[][] = [];
            while (q < raw.length && isPipeRow(raw[q]) && raw[q].trim()) {
              body.push(splitCells(raw[q]));
              q += 1;
            }
            currentY = renderTable(caption, headCells, body, currentY, page.pageNumber);
            p = q; // advance past table
            continue;
          }

          // Bulleted list block
          if (/^[•\-*]\s+/.test(trimmed)) {
            const items: string[] = [];
            while (p < raw.length && raw[p].trim()) {
              const t = raw[p].trim();
              if (/^[•\-*]\s+/.test(t)) {
                items.push(t.replace(/^[•\-*]\s+/, ''));
                p += 1;
                // capture continuation lines for this bullet
                while (p < raw.length && raw[p].trim() && !/^[•\-*]\s+/.test(raw[p].trim()) && !/^\d+\.\s+/.test(raw[p].trim()) && !isPipeRow(raw[p])) {
                  items[items.length - 1] += ' ' + raw[p].trim();
                  p += 1;
                }
              } else {
                break;
              }
            }
            currentY = renderBulletedBlock(items, currentY, page.pageNumber);
            continue;
          }

          // Numbered list block
          if (/^\d+\.\s+/.test(trimmed)) {
            const items: string[] = [];
            while (p < raw.length && raw[p].trim()) {
              const t = raw[p].trim();
              if (/^\d+\.\s+/.test(t)) {
                items.push(t.replace(/^\d+\.\s+/, ''));
                p += 1;
                // capture continuation lines for this item
                while (p < raw.length && raw[p].trim() && !/^\d+\.\s+/.test(raw[p].trim()) && !/^[•\-*]\s+/.test(raw[p].trim()) && !isPipeRow(raw[p])) {
                  items[items.length - 1] += ' ' + raw[p].trim();
                  p += 1;
                }
              } else {
                break;
              }
            }
            currentY = renderNumberedBlock(items, currentY, page.pageNumber);
            continue;
          }

          // Paragraph block (consume until blank or special block)
          const paraLines: string[] = [];
          while (p < raw.length) {
            const t = raw[p].trim();
            if (!t) break;
            if (/^Table:\s*/i.test(t) || isPipeRow(raw[p]) || /^[•\-*]\s+/.test(t) || /^\d+\.\s+/.test(t)) {
              break;
            }
            paraLines.push(raw[p]);
            p += 1;
          }
          const paragraph = stripBold(paraLines.join(' ').replace(/\s{2,}/g, ' ').trim());
          if (paragraph) {
            currentY = renderParagraph(paragraph, currentY, page.pageNumber);
          }
        }
      });
    
      doc.save(`${lesson.topic}-lesson.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  const getPageIcon = (pageType: string) => {
    switch (pageType) {
      case 'overview':
        return <BookOpen className="h-5 w-5" />;
      case 'content':
        return <FileText className="h-5 w-5" />;
      case 'activities':
        return <CheckSquare className="h-5 w-5" />;
      case 'assessment':
        return <Target className="h-5 w-5" />;
      case 'summary':
        return <Lightbulb className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  const getPageTypeColor = (pageType: string) => {
    switch (pageType) {
      case 'overview':
        return 'bg-blue-100 text-blue-600';
      case 'content':
        return 'bg-green-100 text-green-600';
      case 'activities':
        return 'bg-purple-100 text-purple-600';
      case 'assessment':
        return 'bg-blue-100 text-blue-600';
      case 'summary':
        return 'bg-yellow-100 text-yellow-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const renderPageContent = (content: string) => {
    const rawLines = content.split('\n');

    // Helpers for Markdown-like table detection
    const isPipeRow = (line: string) => /\|/.test(line);
    const isSeparatorRow = (line: string) => /\|?\s*-{3,}/.test(line);
    const splitCells = (line: string) => line
      .trim()
      .replace(/^\|/, '')
      .replace(/\|$/, '')
      .split('|')
      .map((c) => c.trim());

    // Inline renderer for **bold** segments
    const renderInline = (text: string) => {
      if (!text.includes('**')) return text;
      const parts = text.split('**');
      return parts.map((part, idx) => (idx % 2 === 1 ? (
        <strong key={idx} className="font-semibold">{part}</strong>
      ) : (
        part
      )));
    };

    const elements: React.ReactNode[] = [];
    let i = 0;
    while (i < rawLines.length) {
      const line = rawLines[i];
      const trimmed = line.trim();

      // Skip empty lines but preserve spacing by adding margin via wrappers
      if (!trimmed) {
        i += 1;
        continue;
      }

      // Optional caption preceding a table
      let pendingCaption: string | null = null;
      if (/^(\*\*)?Table:\s*/i.test(trimmed) && i + 2 < rawLines.length && isPipeRow(rawLines[i + 1]) && isSeparatorRow(rawLines[i + 2])) {
        const cap = trimmed.replace(/^(\*\*)?Table:\s*/i, '').replace(/\*\*$/,'').trim();
        pendingCaption = cap;
        i += 1; // move to potential header row
      }

      // Detect markdown table: header row with pipes, followed by separator row of dashes
      if (isPipeRow(rawLines[i]) && i + 1 < rawLines.length && isSeparatorRow(rawLines[i + 1])) {
        const headerCells = splitCells(rawLines[i]);
        i += 2; // skip header + separator
        const rows: string[][] = [];
        while (i < rawLines.length && isPipeRow(rawLines[i]) && rawLines[i].trim()) {
          rows.push(splitCells(rawLines[i]));
          i += 1;
        }

        elements.push(
          <div key={`table-${i}-${elements.length}`} className="my-4 overflow-x-auto">
            {pendingCaption ? (
              <div className="text-sm text-gray-600 mb-2">{renderInline(pendingCaption)}</div>
            ) : null}
            <table className="w-full border-collapse table-auto">
              <thead>
                <tr>
                  {headerCells.map((h, idx) => (
                    <th key={idx} className="border border-gray-200 bg-gray-50 px-3 py-2 text-left text-gray-700 text-sm font-medium">
                      {renderInline(h)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((cells, rIdx) => (
                  <tr key={rIdx} className="odd:bg-white even:bg-gray-50">
                    {cells.map((c, cIdx) => (
                      <td key={cIdx} className="border border-gray-200 px-3 py-2 align-top text-gray-700 text-sm">
                        {renderInline(c)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        continue; // already advanced i inside the while
      }

      // Handle bullet list block, including continuation lines
      if (/^[•\-*]\s+/.test(trimmed)) {
        const items: string[] = [];
        while (i < rawLines.length && rawLines[i].trim()) {
          const t = rawLines[i].trim();
          if (/^[•\-*]\s+/.test(t)) {
            items.push(t.replace(/^[•\-*]\s+/, ''));
            i += 1;
            // capture continuation lines for this bullet
            while (i < rawLines.length && rawLines[i].trim() && !/^[•\-*]\s+/.test(rawLines[i].trim()) && !/^\d+\.\s+/.test(rawLines[i].trim()) && !isPipeRow(rawLines[i])) {
              items[items.length - 1] += ' ' + rawLines[i].trim();
              i += 1;
            }
          } else {
            break;
          }
        }
        elements.push(
          <ul key={`bullets-${i}-${elements.length}`} className="list-disc pl-6 space-y-1">
            {items.map((it, idx) => (
              <li key={idx} className="text-gray-700">{renderInline(it)}</li>
            ))}
          </ul>
        );
        continue;
      }

      // Handle numbered lists with continuation lines
      if (/^\d+\.\s+/.test(trimmed)) {
        const items: string[] = [];
        while (i < rawLines.length && rawLines[i].trim()) {
          const t = rawLines[i].trim();
          if (/^\d+\.\s+/.test(t)) {
            items.push(t.replace(/^\d+\.\s+/, ''));
            i += 1;
            // capture continuation lines for this item
            while (i < rawLines.length && rawLines[i].trim() && !/^\d+\.\s+/.test(rawLines[i].trim()) && !/^[•\-*]\s+/.test(rawLines[i].trim()) && !isPipeRow(rawLines[i])) {
              items[items.length - 1] += ' ' + rawLines[i].trim();
              i += 1;
            }
          } else {
            break;
          }
        }
        elements.push(
          <ol key={`numlist-${i}-${elements.length}`} className="list-decimal pl-6 space-y-1">
            {items.map((it, idx) => (
              <li key={idx} className="text-gray-700">{renderInline(it)}</li>
            ))}
          </ol>
        );
        continue;
      }

      // Handle inline bold markers **bold** in a paragraph
      if (trimmed.includes('**')) {
        elements.push(
          <p key={`bold-${i}`} className="text-gray-700">{renderInline(trimmed)}</p>
        );
        i += 1;
        continue;
      }

      // Default paragraph
      elements.push(
        <p key={`p-${i}`} className="text-gray-700 leading-relaxed">{renderInline(trimmed)}</p>
      );
      i += 1;
    }

    return <div className="space-y-4">{elements}</div>;
  };

  const currentPage = generatedPages[currentPageIndex];

  return (
    <div className="max-w-4xl mx-auto space-y-6 bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg p-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2">{lesson.topic}</h1>
            <div className="flex items-center gap-4 text-blue-100">
              <span className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                {translations.gradeLevel}: {lesson.gradeLevel}
              </span>
              <span className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {translations.date}: {new Date().toLocaleDateString()}
              </span>
              <span className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                {lesson.numberOfPages} {translations.pages}
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

      {/* Page Navigation */}
      {generatedPages.length > 1 && (
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <Button
              onClick={() => setCurrentPageIndex(Math.max(0, currentPageIndex - 1))}
              disabled={currentPageIndex === 0}
              variant="outline"
              size="sm"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              {translations.previousPage}
            </Button>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                {translations.page} {currentPageIndex + 1} {translations.of} {generatedPages.length}
              </span>
            </div>
            
            <Button
              onClick={() => setCurrentPageIndex(Math.min(generatedPages.length - 1, currentPageIndex + 1))}
              disabled={currentPageIndex === generatedPages.length - 1}
              variant="outline"
              size="sm"
            >
              {translations.nextPage}
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </Card>
      )}

      {/* Page Content */}
      {currentPage && (
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className={`p-2 rounded-lg ${getPageTypeColor(currentPage.type)}`}>
              {getPageIcon(currentPage.type)}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{currentPage.title}</h2>
              <p className="text-sm text-gray-600 capitalize">{currentPage.type}</p>
            </div>
          </div>
          
          <div className="prose prose-gray max-w-none">
            {renderPageContent(currentPage.content)}
          </div>
        </Card>
      )}

      {/* Page Thumbnails */}
      {generatedPages.length > 1 && (
        <Card className="p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Tutte le Pagine</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {generatedPages.map((page, index) => (
              <button
                key={index}
                onClick={() => setCurrentPageIndex(index)}
                className={`p-3 rounded-lg border-2 transition-all ${
                  index === currentPageIndex
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className={`p-2 rounded ${getPageTypeColor(page.type)} mb-2`}>
                  {getPageIcon(page.type)}
                </div>
                <div className="text-xs text-center">
                  <div className="font-medium text-gray-900 truncate">{page.title}</div>
                  <div className="text-gray-500">{translations.page} {page.pageNumber}</div>
                </div>
              </button>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
