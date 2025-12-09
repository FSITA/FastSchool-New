import { NextRequest, NextResponse } from "next/server";
import puppeteer from "puppeteer";
import chromium from "@sparticuz/chromium";
import { join } from "path";
import { existsSync } from "fs";

export async function POST(req: NextRequest) {
  let browser;
  
  try {
    const { presentationId } = await req.json();

    if (!presentationId) {
      return NextResponse.json(
        { error: "Presentation ID is required" },
        { status: 400 }
      );
    }

    // Get base URL from request
    const protocol = req.headers.get("x-forwarded-proto") || "http";
    const host = req.headers.get("host") || "localhost:3000";
    const baseUrl = `${protocol}://${host}`;

    // Configure Puppeteer for Render.com
    // Use @sparticuz/chromium for serverless/cloud environments (works better than regular Chrome)
    let executablePath: string | undefined;
    
    // Try to use serverless Chromium first (best for Render.com)
    if (process.env.RENDER || process.env.NODE_ENV === "production") {
      try {
        // Configure Chromium for serverless environment
        chromium.setGraphicsMode(false); // Disable graphics for headless
        executablePath = await chromium.executablePath();
        console.log("[PDF Export] ✅ Using serverless Chromium:", executablePath);
      } catch (chromiumError: any) {
        console.warn("[PDF Export] ⚠️ Failed to get serverless Chromium, will try other options:", chromiumError?.message);
      }
    }
    
    // Fallback: Check environment variable
    if (!executablePath && process.env.PUPPETEER_EXECUTABLE_PATH) {
      executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
      console.log("[PDF Export] Using Chrome from PUPPETEER_EXECUTABLE_PATH:", executablePath);
    }
    
    // Launch Puppeteer with Render.com-compatible configuration
    const puppeteerOptions: any = {
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--disable-web-security",
        "--disable-features=IsolateOrigins,site-per-process",
        "--single-process", // Important for serverless environments
        "--disable-extensions",
      ],
    };
    
    // Set executable path if we have one
    if (executablePath) {
      puppeteerOptions.executablePath = executablePath;
      console.log("[PDF Export] ✅ Launching with executable path:", executablePath);
    } else {
      console.log("[PDF Export] No explicit executable path, Puppeteer will try to find Chrome automatically");
    }
    
    // Launch browser
    console.log("[PDF Export] Launching Puppeteer...");
    browser = await puppeteer.launch(puppeteerOptions);

    const page = await browser.newPage();

    // Enable console logging from browser for debugging
    page.on("console", (msg) => console.log("[Browser]", msg.text()));

    // Set viewport for consistent rendering
    await page.setViewport({
      width: 1920,
      height: 1080,
      deviceScaleFactor: 2,
    });

    // Navigate to print-friendly page
    const url = `${baseUrl}/presentation/${presentationId}?pdf=1`;
    
    console.log(`[PDF Export] Navigating to: ${url}`);
    
    await page.goto(url, {
      waitUntil: "networkidle0",
      timeout: 0, // No timeout limit
    });

    // Take a screenshot for debugging (before waiting)
    try {
      await page.screenshot({ path: "debug-before-wait.png", fullPage: true });
      console.log("[PDF Export] Screenshot saved: debug-before-wait.png");
    } catch (e) {
      console.log("[PDF Export] Could not save screenshot:", e);
    }

    // Wait for main container
    console.log("[PDF Export] Waiting for .print-view...");
    await page.waitForSelector(".print-view", { timeout: 60000 });
    
    console.log("[PDF Export] Waiting for .presentation-slides...");
    await page.waitForSelector(".presentation-slides", { timeout: 60000 });

    // Wait a bit for initial React render
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Check what's in the page initially
    const initialState = await page.evaluate(() => {
      const container = document.querySelector(".presentation-slides");
      return {
        printView: !!document.querySelector(".print-view"),
        presentationSlidesContainer: !!container,
        containerChildren: container?.children.length || 0,
        containerHTML: container?.innerHTML.substring(0, 200) || "",
        slideWrappers: document.querySelectorAll(".slide-wrapper").length,
        presentationSlides: document.querySelectorAll(
          ".presentation-slide[data-slide-content='true']"
        ).length,
        isLoading: document.body.textContent?.includes("Caricamento presentazione"),
        pdfReady: (window as any).__pdfReady,
        pdfSlideCount: (window as any).__pdfSlideCount || 0,
      };
    });
    console.log("[PDF Export] Initial page state:", JSON.stringify(initialState, null, 2));

    // Wait for ready signal - this ensures both state and DOM are ready
    console.log("[PDF Export] Waiting for PDF ready signal (up to 3 minutes)...");
    try {
      // Wait for the ready signal (which requires both state and DOM)
      await page.waitForFunction(
        "window.__pdfReady === true && window.__pdfSlideCount > 0",
        {
          timeout: 180000, // 3 minutes - give React plenty of time
          polling: 1000, // Check every 1 second
        }
      );
      const slideCount = await page.evaluate(() => (window as any).__pdfSlideCount || 0);
      console.log(`[PDF Export] ✅ Got __pdfReady signal! Slide count: ${slideCount}`);
    } catch (e) {
      console.log(
        "[PDF Export] ⚠️ PDF ready signal not received in time, trying fallback..."
      );

      // Fallback: Wait for slides in DOM - check with more detailed logging
      const fallbackResult = await page.evaluate(() => {
        const wrappers = document.querySelectorAll(".slide-wrapper");
        const slides = document.querySelectorAll(
          ".presentation-slide[data-slide-content='true']"
        );
        const containers = document.querySelectorAll('[class*="slide-container"]');
        const editors = document.querySelectorAll("[contenteditable='true']");
        const slidesContainer = document.querySelector(".presentation-slides");
        
        // Get what's actually in the container
        const containerChildren = slidesContainer?.children || [];
        const childrenInfo = Array.from(containerChildren).map((child, idx) => ({
          index: idx,
          tagName: child.tagName,
          className: child.className,
          hasChildren: child.children.length > 0,
        }));

        return {
          wrappers: wrappers.length,
          slides: slides.length,
          containers: containers.length,
          editors: editors.length,
          containerExists: !!slidesContainer,
          containerChildren: containerChildren.length,
          childrenInfo,
        };
      });
      console.log("[PDF Export] Fallback DOM check:", JSON.stringify(fallbackResult, null, 2));

      // If we have any slides, proceed
      const hasAnySlides = fallbackResult.wrappers > 0 || 
                          fallbackResult.slides > 0 || 
                          fallbackResult.containers > 0 ||
                          fallbackResult.editors > 0;
      
      if (!hasAnySlides) {
        // Take screenshot for debugging
        await page.screenshot({
          path: "debug-timeout.png",
          fullPage: true,
        });
        console.log("[PDF Export] Screenshot saved: debug-timeout.png");
        
        throw new Error(
          `No slides found. Container has ${fallbackResult.containerChildren} children but no slide elements. Check debug-timeout.png`
        );
      }

      console.log("[PDF Export] Found slides via fallback, proceeding...");
    }

    // Verify slides exist - try multiple selectors
    const slideInfo = await page.evaluate(() => {
      const wrappers = document.querySelectorAll(".slide-wrapper");
      const slides = document.querySelectorAll(
        ".presentation-slide[data-slide-content='true']"
      );
      const containers = document.querySelectorAll('[class*="slide-container"]');

      return {
        slideWrappers: wrappers.length,
        presentationSlides: slides.length,
        slideContainers: containers.length,
        total: Math.max(wrappers.length, slides.length, containers.length),
        pdfSlideCount: (window as any).__pdfSlideCount || 0,
      };
    });

    console.log(`[PDF Export] Slide counts:`, slideInfo);

    if (slideInfo.total === 0) {
      // Take screenshot for debugging
      await page.screenshot({ path: "debug-no-slides.png", fullPage: true });
      console.log("[PDF Export] Screenshot saved: debug-no-slides.png");
      throw new Error("No slides found — aborting PDF export");
    }

    // Wait for React to fully render all slide content (editor, images, etc.)
    console.log("[PDF Export] Waiting for React to fully render slide content...");
    
    // Wait for all slide editors to be ready (they have contenteditable attributes)
    await page.waitForFunction(
      () => {
        const slides = document.querySelectorAll(".presentation-slide[data-slide-content='true']");
        const editors = document.querySelectorAll("[contenteditable='true']");
        // Check that we have slides and at least some have editors, or slides are rendered
        return slides.length > 0 && (editors.length > 0 || slides.length >= 1);
      },
      { timeout: 30000 }
    ).catch(() => {
      console.log("[PDF Export] Editor check timed out, continuing anyway...");
    });

    // Additional delay for images and other async content to load
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Import pdf-lib for merging PDFs with different page sizes
    const { PDFDocument } = await import("pdf-lib");

    // Get all slides and their dimensions
    const slideElements = await page.$$(".slide-wrapper");
    console.log(`[PDF Export] Found ${slideElements.length} slides to process`);

    const finalPdfDoc = await PDFDocument.create();

    // Process each slide individually with its own dimensions
    for (let i = 0; i < slideElements.length; i++) {
      console.log(`[PDF Export] Processing slide ${i + 1}/${slideElements.length}...`);

      // First, show all slides to ensure content is rendered
      await page.evaluate(() => {
        const slides = document.querySelectorAll(".slide-wrapper");
        slides.forEach((slide) => {
          (slide as HTMLElement).style.display = "block";
          (slide as HTMLElement).style.visibility = "visible";
          (slide as HTMLElement).style.position = "relative";
          (slide as HTMLElement).style.left = "auto";
        });
      });

      // Wait for all slides to render
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Now hide all slides except the current one, and hide preview renderers
      await page.evaluate((slideIndex) => {
        const slides = document.querySelectorAll(".slide-wrapper");
        slides.forEach((slide, idx) => {
          if (idx === slideIndex) {
            (slide as HTMLElement).style.display = "block";
            (slide as HTMLElement).style.visibility = "visible";
            (slide as HTMLElement).style.position = "relative";
            (slide as HTMLElement).style.left = "auto";
          } else {
            (slide as HTMLElement).style.display = "none";
            (slide as HTMLElement).style.visibility = "hidden";
            (slide as HTMLElement).style.position = "absolute";
            (slide as HTMLElement).style.left = "-9999px";
          }
        });
        
        // Hide all preview renderers (they cause duplicate content)
        const previewRenderers = document.querySelectorAll('[class*="SlidePreviewRenderer"], [id^="preview-"]');
        previewRenderers.forEach((preview) => {
          (preview as HTMLElement).style.display = "none";
          (preview as HTMLElement).style.visibility = "hidden";
        });
        
        // Scroll to the current slide to ensure it's in view
        const currentSlide = slides[slideIndex] as HTMLElement;
        if (currentSlide) {
          currentSlide.scrollIntoView({ behavior: "instant", block: "start" });
        }
        
        // Ensure body height matches content to avoid multiple pages
        document.body.style.height = "auto";
        document.documentElement.style.height = "auto";
      }, i);

      // Wait for DOM update and scroll
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Double-check that only the current slide is visible and previews are hidden
      await page.evaluate((slideIndex) => {
        // Ensure only current slide is visible
        const slides = document.querySelectorAll(".slide-wrapper");
        slides.forEach((slide, idx) => {
          if (idx !== slideIndex) {
            (slide as HTMLElement).style.display = "none";
            (slide as HTMLElement).style.visibility = "hidden";
            (slide as HTMLElement).style.position = "absolute";
            (slide as HTMLElement).style.left = "-9999px";
          }
        });
        
        // Ensure ALL preview renderers are hidden (these cause duplicates)
        const previews = document.querySelectorAll('[class*="SlidePreviewRenderer"], [id^="preview-"]');
        previews.forEach((preview) => {
          (preview as HTMLElement).style.display = "none";
          (preview as HTMLElement).style.visibility = "hidden";
          (preview as HTMLElement).style.position = "absolute";
          (preview as HTMLElement).style.left = "-9999px";
        });
      }, i);

      // Wait for images to load in the current slide
      await page.evaluate((slideIndex) => {
        return new Promise<void>((resolve) => {
          const slide = document.querySelector(
            `.slide-wrapper:nth-child(${slideIndex + 1})`
          ) as HTMLElement;
          if (!slide) {
            resolve();
            return;
          }

          const images = slide.querySelectorAll("img");
          let loadedCount = 0;
          const totalImages = images.length;

          if (totalImages === 0) {
            resolve();
            return;
          }

          const checkImage = (img: HTMLImageElement) => {
            if (img.complete && img.naturalHeight !== 0) {
              loadedCount++;
              if (loadedCount === totalImages) {
                resolve();
              }
            } else {
              img.onload = () => {
                loadedCount++;
                if (loadedCount === totalImages) {
                  resolve();
                }
              };
              img.onerror = () => {
                loadedCount++;
                if (loadedCount === totalImages) {
                  resolve();
                }
              };
            }
          };

          images.forEach(checkImage);

          // Timeout after 3 seconds
          setTimeout(() => resolve(), 3000);
        });
      }, i);

      // Wait a bit more for changes to apply
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Get the slide's actual dimensions (only the visible slide content, not previews)
      const slideDimensions = await page.evaluate((slideIndex) => {
        const slide = document.querySelector(
          `.slide-wrapper:nth-child(${slideIndex + 1})`
        ) as HTMLElement;
        if (!slide) return null;

        // Find the actual presentation slide element (not preview)
        const presentationSlide = slide.querySelector(
          '.presentation-slide[data-slide-content="true"]'
        ) as HTMLElement;
        
        // Use the presentation slide dimensions if found, otherwise use wrapper
        const targetElement = presentationSlide || slide;
        
        // Get bounding box
        const rect = targetElement.getBoundingClientRect();
        // Also check computed styles for actual size
        const computed = window.getComputedStyle(targetElement);
        
        return {
          width: Math.max(rect.width, parseInt(computed.width) || rect.width),
          height: Math.max(rect.height, parseInt(computed.height) || rect.height),
          scrollWidth: targetElement.scrollWidth,
          scrollHeight: targetElement.scrollHeight,
        };
      }, i);

      if (!slideDimensions) {
        console.log(`[PDF Export] Could not get dimensions for slide ${i + 1}, skipping...`);
        continue;
      }

      // Use scroll dimensions if larger (accounts for content overflow)
      const finalWidth = Math.max(slideDimensions.width, slideDimensions.scrollWidth);
      const finalHeight = Math.max(slideDimensions.height, slideDimensions.scrollHeight);

      console.log(`[PDF Export] Slide ${i + 1} dimensions:`, {
        width: finalWidth,
        height: finalHeight,
        original: slideDimensions,
      });

      // Set body/container to match slide dimensions to ensure proper PDF capture
      // Make body exactly the size of the slide, and position it correctly
      await page.evaluate((width, height, slideIndex) => {
        // Get the current slide
        const slide = document.querySelector(
          `.slide-wrapper:nth-child(${slideIndex + 1})`
        ) as HTMLElement;
        
        if (slide) {
          // Position slide at top-left
          slide.style.position = "absolute";
          slide.style.top = "0";
          slide.style.left = "0";
          slide.style.width = `${width}px`;
          slide.style.height = `${height}px`;
        }
        
        // Set body to exact slide size
        document.body.style.width = `${width}px`;
        document.body.style.height = `${height}px`;
        document.body.style.margin = "0";
        document.body.style.padding = "0";
        document.body.style.overflow = "hidden";
        document.body.style.position = "relative";
        
        const printView = document.querySelector(".print-view");
        if (printView) {
          (printView as HTMLElement).style.width = `${width}px`;
          (printView as HTMLElement).style.height = `${height}px`;
          (printView as HTMLElement).style.margin = "0";
          (printView as HTMLElement).style.padding = "0";
          (printView as HTMLElement).style.overflow = "hidden";
          (printView as HTMLElement).style.position = "relative";
        }
        
        const slidesContainer = document.querySelector(".presentation-slides");
        if (slidesContainer) {
          (slidesContainer as HTMLElement).style.width = `${width}px`;
          (slidesContainer as HTMLElement).style.height = `${height}px`;
          (slidesContainer as HTMLElement).style.overflow = "hidden";
          (slidesContainer as HTMLElement).style.position = "relative";
        }
        
        // Set html element size too
        document.documentElement.style.width = `${width}px`;
        document.documentElement.style.height = `${height}px`;
        document.documentElement.style.margin = "0";
        document.documentElement.style.padding = "0";
        document.documentElement.style.overflow = "hidden";
      }, finalWidth, finalHeight, i);

      // Set viewport to exactly match slide dimensions (no padding to avoid misalignment)
      const viewportWidth = Math.ceil(finalWidth);
      const viewportHeight = Math.ceil(finalHeight);
      
      await page.setViewport({
        width: viewportWidth,
        height: viewportHeight,
        deviceScaleFactor: 2, // High DPI for better quality
      });

      // Wait for viewport to update and ensure content is rendered
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      // Scroll to the current slide to ensure it's in view
      await page.evaluate((slideIndex) => {
        const slide = document.querySelector(
          `.slide-wrapper:nth-child(${slideIndex + 1})`
        ) as HTMLElement;
        if (slide) {
          slide.scrollIntoView({ behavior: "instant", block: "start" });
        }
        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
      }, i);

      // Verify content is visible before generating PDF
      const visibleContent = await page.evaluate((slideIndex) => {
        const slide = document.querySelector(
          `.slide-wrapper:nth-child(${slideIndex + 1})`
        ) as HTMLElement;
        if (!slide) return { visible: false, reason: "Slide not found" };

        const isVisible = slide.offsetParent !== null && 
                         window.getComputedStyle(slide).display !== "none" &&
                         window.getComputedStyle(slide).visibility !== "hidden";
        
        const images = slide.querySelectorAll("img");
        const textElements = slide.querySelectorAll("p, h1, h2, h3, h4, h5, h6, div[contenteditable]");
        
        return {
          visible: isVisible,
          slideWidth: slide.offsetWidth,
          slideHeight: slide.offsetHeight,
          imagesCount: images.length,
          imagesLoaded: Array.from(images).filter(img => img.complete && img.naturalHeight > 0).length,
          textElementsCount: textElements.length,
          hasContent: slide.textContent?.trim().length > 0 || images.length > 0,
        };
      }, i);

      console.log(`[PDF Export] Slide ${i + 1} visibility check:`, visibleContent);

      if (!visibleContent.visible || !visibleContent.hasContent) {
        console.log(`[PDF Export] Slide ${i + 1} is not visible or has no content, skipping...`);
        continue;
      }

      // Convert pixels to inches (Puppeteer expects inches)
      // Standard web DPI is 96 pixels per inch
      // deviceScaleFactor is for rendering quality, not size calculation
      const widthInches = finalWidth / 96; // pixels to inches
      const heightInches = finalHeight / 96;

      // Ensure reasonable dimensions (at least 1 inch, max reasonable size)
      const minWidth = Math.max(Math.min(widthInches, 50), 1); // Max 50 inches wide
      const minHeight = Math.max(Math.min(heightInches, 100), 1); // Max 100 inches tall

      console.log(`[PDF Export] Slide ${i + 1} PDF dimensions (inches):`, {
        width: minWidth,
        height: minHeight,
        pixels: { width: finalWidth, height: finalHeight },
      });

      // Use screenshot-based approach for more reliable capture
      // Capture the slide element as an image, then embed in PDF
      const slideElement = await page.$(`.slide-wrapper:nth-child(${i + 1})`);
      
      if (!slideElement) {
        console.log(`[PDF Export] Could not find slide element ${i + 1}, skipping...`);
        continue;
      }

      // Take screenshot of the slide element
      const screenshot = await slideElement.screenshot({
        type: "png",
        omitBackground: false,
      }) as Buffer;

      if (!screenshot || screenshot.length === 0) {
        console.log(`[PDF Export] Could not capture screenshot for slide ${i + 1}, skipping...`);
        continue;
      }

      // Add the screenshot as a PDF page with custom dimensions
      const image = await finalPdfDoc.embedPng(screenshot);
      
      // Get actual image dimensions
      const imageDims = image.scale(1);
      
      // Calculate page dimensions in points (PDF uses points, 1 inch = 72 points)
      const pageWidth = minWidth * 72; // inches to points
      const pageHeight = minHeight * 72; // inches to points
      
      // Calculate scaling to fit the image to page while maintaining aspect ratio
      const scaleX = pageWidth / imageDims.width;
      const scaleY = pageHeight / imageDims.height;
      const scale = Math.min(scaleX, scaleY); // Use min to ensure it fits
      
      const scaledWidth = imageDims.width * scale;
      const scaledHeight = imageDims.height * scale;
      
      // Center the image on the page
      const x = (pageWidth - scaledWidth) / 2;
      const y = (pageHeight - scaledHeight) / 2;
      
      // Create a new page with the slide's dimensions
      const pdfPage = finalPdfDoc.addPage([pageWidth, pageHeight]);
      
      // Embed the screenshot to fill the page (or fit centered if dimensions differ slightly)
      pdfPage.drawImage(image, {
        x: 0,
        y: 0,
        width: pageWidth,
        height: pageHeight,
      });

      console.log(`[PDF Export] Slide ${i + 1}: Added as PDF page (${minWidth.toFixed(2)}" x ${minHeight.toFixed(2)}")`);
    }

    // Restore viewport
    await page.setViewport({
      width: 1920,
      height: 1080,
      deviceScaleFactor: 2,
    });

    // Show all slides again
    await page.evaluate(() => {
      const slides = document.querySelectorAll(".slide-wrapper");
      slides.forEach((slide) => {
        (slide as HTMLElement).style.display = "block";
        (slide as HTMLElement).style.visibility = "visible";
      });
    });

    // Generate final merged PDF
    const pdfBuffer = Buffer.from(await finalPdfDoc.save());

    await browser.close();

    // Return PDF
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="presentazione-${presentationId}-${new Date().toISOString().split("T")[0]}.pdf"`,
      },
    });
  } catch (error) {
    console.error("[PDF Export] Error generating PDF:", error);
    
    // Make sure browser is closed even on error
    if (browser) {
      try {
        await browser.close();
      } catch (closeError) {
        console.error("[PDF Export] Error closing browser:", closeError);
      }
    }
    
    return NextResponse.json(
      { 
        error: "Failed to generate PDF", 
        details: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    );
  }
}

