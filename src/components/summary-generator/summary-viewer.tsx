"use client"

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, RotateCcw, FileText, Clock, Target, BookOpen, CheckSquare, Lightbulb } from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import type { SummaryGeneratorViewerProps, SummaryOutline } from '@/types/summary-generator';
import { getSummaryGeneratorTranslations } from '@/lib/summary-generator/language-translations';

export function SummaryGeneratorViewer({ summary, generatedOutlines, onGenerateAgain }: SummaryGeneratorViewerProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const translations = getSummaryGeneratorTranslations(summary.language || 'english');

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
    
    const currentLanguage = summary.language || 'english';
    const needsSpecialFonts = needsSpecialFontHandling(currentLanguage);
    const translations = getSummaryGeneratorTranslations(currentLanguage);
    
    try {
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
          <h1 style="font-size: 24px; margin: 0 0 10px 0; font-weight: bold;">${escapeHtml(summary.topic)}</h1>
          <div style="font-size: 12px; opacity: 0.9;">
            ${escapeHtml(`${translations.gradeLevel}: ${summary.gradeLevel}`)} | 
            ${escapeHtml(`${translations.date}: ${new Date().toLocaleDateString()}`)} | 
            ${escapeHtml(`${translations.numberOfOutlines}: 10`)}
          </div>
        `;
        printContainer.appendChild(headerDiv);
        
        // Generate outlines in a compact format - fit 5-6 per page
        const outlinesPerPage = 5;
        let currentPage = 0;
        
        for (let i = 0; i < generatedOutlines.length; i++) {
          if (i > 0 && i % outlinesPerPage === 0) {
            // Add page break
            const pageBreak = document.createElement('div');
            pageBreak.style.pageBreakBefore = 'always';
            pageBreak.style.marginTop = '20px';
            printContainer.appendChild(pageBreak);
            currentPage++;
          }
          
          const outline = generatedOutlines[i];
          
          const outlineDiv = document.createElement('div');
          outlineDiv.style.marginBottom = '15px';
          outlineDiv.style.padding = '12px';
          outlineDiv.style.border = '1px solid #e0e0e0';
          outlineDiv.style.borderRadius = '4px';
          outlineDiv.style.backgroundColor = '#fff';
          outlineDiv.style.display = 'flex';
          outlineDiv.style.alignItems = 'flex-start';
          outlineDiv.style.gap = '12px';
          
          // Outline number badge
          const badgeDiv = document.createElement('div');
          badgeDiv.style.background = '#2563EB';
          badgeDiv.style.color = 'white';
          badgeDiv.style.width = '28px';
          badgeDiv.style.height = '28px';
          badgeDiv.style.borderRadius = '50%';
          badgeDiv.style.display = 'flex';
          badgeDiv.style.alignItems = 'center';
          badgeDiv.style.justifyContent = 'center';
          badgeDiv.style.fontWeight = 'bold';
          badgeDiv.style.fontSize = '12px';
          badgeDiv.style.flexShrink = '0';
          badgeDiv.textContent = outline.outlineNumber.toString();
          outlineDiv.appendChild(badgeDiv);
          
          // Outline content
          const contentDiv = document.createElement('div');
          contentDiv.style.flex = '1';
          
          // Title
          const titleDiv = document.createElement('div');
          titleDiv.style.fontWeight = 'bold';
          titleDiv.style.fontSize = '14px';
          titleDiv.style.marginBottom = '6px';
          titleDiv.style.color = '#1f2937';
          titleDiv.textContent = outline.title;
          contentDiv.appendChild(titleDiv);
          
          // Content (max 2 lines)
          const textDiv = document.createElement('div');
          textDiv.style.fontSize = '12px';
          textDiv.style.color = '#4b5563';
          textDiv.style.lineHeight = '1.5';
          const contentLines = outline.content.split('\n').filter(l => l.trim()).slice(0, 2);
          textDiv.textContent = contentLines.join(' ');
          contentDiv.appendChild(textDiv);
          
          outlineDiv.appendChild(contentDiv);
          printContainer.appendChild(outlineDiv);
        }
        
        document.body.appendChild(printContainer);
        
        // Generate PDF from HTML
        const canvas = await html2canvas(printContainer, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
        });
        
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgWidth = 210; // A4 width in mm
        const pageHeight = 297; // A4 height in mm
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;
        let position = 0;
        
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
        
        while (heightLeft > 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }
        
        // Clean up
        document.body.removeChild(printContainer);
        
        pdf.save(`${summary.topic}-summary.pdf`);
      } else {
        // Use jsPDF for other languages with optimized spacing (5-6 outlines per page)
        const doc = new jsPDF();
        
        // Header with title inside blue strip
        doc.setFillColor(37, 99, 235); // Blue color
        doc.rect(0, 0, 210, 35, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.text(summary.topic, 20, 22);
        
        // Basic info section
        let yPos = 52;
        doc.setTextColor(0);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.text(`${translations.gradeLevel}: ${summary.gradeLevel}`, 20, yPos);
        doc.text(`${translations.date}: ${new Date().toLocaleDateString()}`, 120, yPos);
        yPos += 12;
        doc.text(`${translations.numberOfOutlines}: 10`, 20, yPos);
        yPos += 12; // Reduced spacing
        
        // Generate outlines in a compact format - fit 5-6 per page
        const outlinesPerPage = 6; // Try to fit 6 per page
        const minYForNewPage = 280; // Start new page when reaching this Y position
        
        generatedOutlines.forEach((outline, index) => {
          // Check if we need a new page (based on space, not fixed count)
          if (index > 0 && yPos > minYForNewPage) {
            doc.addPage();
            yPos = 35; // Start from top of new page
          }
          
          // Outline number badge (smaller)
          doc.setFillColor(37, 99, 235);
          doc.rect(20, yPos - 4, 12, 7, 'F');
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(9);
          doc.setFont('helvetica', 'bold');
          doc.text(outline.outlineNumber.toString(), 26, yPos + 1);
          
          // Outline title (smaller font)
          doc.setTextColor(0);
          doc.setFontSize(11);
          doc.setFont('helvetica', 'bold');
          const titleLines = doc.splitTextToSize(outline.title, 160);
          doc.text(titleLines[0], 35, yPos);
          yPos += 6; // Reduced spacing
          
          // Outline content (max 2 lines, smaller font)
          doc.setFontSize(9);
          doc.setFont('helvetica', 'normal');
          const contentLines = outline.content.split('\n').filter(l => l.trim()).slice(0, 2);
          contentLines.forEach(line => {
            const wrapped = doc.splitTextToSize(line, 170);
            wrapped.forEach(wrappedLine => {
              if (yPos > minYForNewPage) {
                doc.addPage();
                yPos = 35;
              }
              doc.text(wrappedLine, 35, yPos);
              yPos += 5; // Reduced line spacing
            });
          });
          
          yPos += 6; // Reduced spacing between outlines
        });
        
        doc.save(`${summary.topic}-summary.pdf`);
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  const getOutlineIcon = (outlineType: string) => {
    switch (outlineType) {
      case 'overview':
        return <BookOpen className="h-4 w-4" />;
      case 'content':
        return <FileText className="h-4 w-4" />;
      case 'activities':
        return <CheckSquare className="h-4 w-4" />;
      case 'assessment':
        return <Target className="h-4 w-4" />;
      case 'summary':
        return <Lightbulb className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getOutlineTypeColor = (outlineType: string) => {
    switch (outlineType) {
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

  const renderOutlineContent = (content: string) => {
    const lines = content.split('\n').filter(l => l.trim());
    return (
      <div className="space-y-1">
        {lines.map((line, index) => (
          <p key={index} className="text-gray-700 text-sm leading-relaxed">
            {line}
          </p>
        ))}
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg p-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2">{summary.topic}</h1>
            <div className="flex items-center gap-4 text-blue-100">
              <span className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                {translations.gradeLevel}: {summary.gradeLevel}
              </span>
              <span className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {translations.date}: {new Date().toLocaleDateString()}
              </span>
              <span className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                10 {translations.outlines}
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
              {translations.generateAgain}
            </Button>
          </div>
        </div>
      </div>

      {/* Outlines Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {generatedOutlines.map((outline) => (
          <Card key={outline.outlineNumber} className="p-4 hover:shadow-lg transition-shadow">
            <div className="flex items-start gap-3">
              {/* Outline Number Badge */}
              <div className="flex-shrink-0">
                <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
                  {outline.outlineNumber}
                </div>
              </div>
              
              {/* Outline Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`p-1 rounded ${getOutlineTypeColor(outline.type)}`}>
                    {getOutlineIcon(outline.type)}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 truncate">
                    {outline.title}
                  </h3>
                </div>
                <div className="text-gray-600">
                  {renderOutlineContent(outline.content)}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Summary Footer */}
      <Card className="p-4 bg-gray-50">
        <div className="text-center text-sm text-gray-600">
          <p>
            {translations.summary}: <strong>{summary.topic}</strong> • {translations.numberOfOutlines}: <strong>10</strong>
          </p>
        </div>
      </Card>
    </div>
  );
}

