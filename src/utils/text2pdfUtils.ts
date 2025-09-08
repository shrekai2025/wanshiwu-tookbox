import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { 
  Text2PDFSettings, 
  DocumentContent, 
  InsertedImage,
  PAPER_SIZES,
  FONT_FAMILIES 
} from '@/types/text2pdf';
import { parseMarkdownWithImages } from './markdownUtils';

/**
 * 生成PDF文档
 */
export async function generateText2PDF(
  content: DocumentContent,
  settings: Text2PDFSettings
): Promise<void> {
  // 获取纸张尺寸
  const paperSize = PAPER_SIZES[settings.paperSize];
  
  // 解析markdown为HTML
  const htmlContent = parseMarkdownWithImages(content.markdown, content.images);
  
  if (!htmlContent.trim()) {
    throw new Error('没有内容可以生成PDF');
  }
  
  try {
    // 创建PDF文档
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [paperSize.width, paperSize.height]
    });

    // 解析HTML内容为DOM元素
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    const elements = Array.from(tempDiv.children);

    // 计算内容区域
    const contentWidth = paperSize.width - settings.margins.left - settings.margins.right;
    const pageHeight = paperSize.height - settings.margins.top - settings.margins.bottom;
    
    let currentY = settings.margins.top;
    let pageNumber = 1;
    let hasContent = false;
    
    // 逐个渲染元素
    for (const element of elements) {
      const elementCanvas = await renderElementToCanvas(element as HTMLElement, {
        width: contentWidth,
        settings
      });
      
      if (!elementCanvas) continue;
      
      hasContent = true;
      
      // 计算元素在PDF中的尺寸
      const elementWidth = contentWidth;
      const elementHeight = (elementCanvas.height * elementWidth) / elementCanvas.width;
      
      // 检查是否需要换页
      if (currentY + elementHeight > paperSize.height - settings.margins.bottom) {
        // 如果元素太高，需要分页处理
        if (elementHeight > pageHeight) {
          // 元素需要跨页显示
          const splitResult = await splitElementAcrossPages(
            pdf, elementCanvas, {
              startY: currentY,
              width: elementWidth,
              pageHeight,
              margins: settings.margins,
              paperSize
            }
          );
          currentY = splitResult.nextY;
          pageNumber = splitResult.pageNumber;
        } else {
          // 整个元素移到下一页
          pdf.addPage();
          currentY = settings.margins.top;
          pageNumber++;
          
          // 添加元素到新页面
          const imgData = elementCanvas.toDataURL('image/jpeg', 0.8);
          pdf.addImage(
            imgData,
            'JPEG',
            settings.margins.left,
            currentY,
            elementWidth,
            elementHeight
          );
          
          currentY += elementHeight + 5; // 元素间距
        }
      } else {
        // 直接添加到当前页
        const imgData = elementCanvas.toDataURL('image/jpeg', 0.8);
        pdf.addImage(
          imgData,
          'JPEG',
          settings.margins.left,
          currentY,
          elementWidth,
          elementHeight
        );
        
        currentY += elementHeight + 5; // 元素间距
      }
    }
    
    // 如果没有内容，添加一个空白页面
    if (!hasContent) {
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(12);
      pdf.text('文档暂无内容', settings.margins.left, settings.margins.top + 20);
    }
    
    // 生成文件名
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, "");
    const filename = `文本转PDF_${timestamp}.pdf`;
    
    // 下载PDF
    pdf.save(filename);
    
  } catch (error) {
    console.error('PDF生成失败:', error);
    throw new Error(`PDF生成失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
}

/**
 * 将HTML元素渲染为Canvas
 */
async function renderElementToCanvas(
  element: HTMLElement,
  options: {
    width: number;
    settings: Text2PDFSettings;
  }
): Promise<HTMLCanvasElement | null> {
  try {
    // 创建临时容器
    const tempContainer = document.createElement('div');
    tempContainer.appendChild(element.cloneNode(true));
    
    // 设置样式
    tempContainer.style.cssText = `
      position: absolute;
      left: -9999px;
      top: 0;
      width: ${options.width * 3.78}px;
      font-family: ${FONT_FAMILIES[options.settings.font.family].name}, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif;
      font-size: ${options.settings.font.size * 1.33}px;
      line-height: ${options.settings.font.lineHeight};
      padding: 10px 20px;
      background: white;
      color: #000;
    `;
    
    // 添加样式
    const style = document.createElement('style');
    style.textContent = `
      .pdf-element h1 { font-size: ${options.settings.headings.h1Size * 1.33}px; font-weight: bold; margin: 0.5em 0; }
      .pdf-element h2 { font-size: ${options.settings.headings.h2Size * 1.33}px; font-weight: bold; margin: 0.4em 0; }
      .pdf-element h3 { font-size: ${options.settings.headings.h3Size * 1.33}px; font-weight: bold; margin: 0.3em 0; }
      .pdf-element p { margin: 0.5em 0; line-height: ${options.settings.font.lineHeight}; }
      .pdf-element ul, .pdf-element ol { margin: 0.5em 0; padding-left: 2em; }
      .pdf-element li { margin: 0.2em 0; }
      .pdf-element blockquote { 
        margin: 1em 0; 
        padding: 0.5em 1em; 
        border-left: 4px solid #ddd; 
        background: #f9f9f9; 
        font-style: italic;
      }
      .pdf-element code { 
        background: #f5f5f5; 
        padding: 0.1em 0.3em; 
        border-radius: 3px; 
        font-family: "Courier New", monospace;
        font-size: 0.9em;
      }
      .pdf-element pre { 
        background: #f5f5f5; 
        padding: 1em; 
        border-radius: 5px; 
        overflow-x: auto;
        font-family: "Courier New", monospace;
        white-space: pre-wrap;
        word-break: break-word;
      }
      .pdf-element table { 
        border-collapse: collapse; 
        width: 100%; 
        margin: 1em 0;
      }
      .pdf-element th, .pdf-element td { 
        border: 1px solid #ddd; 
        padding: 0.5em; 
        text-align: left;
        word-break: break-word;
      }
      .pdf-element th { 
        background: #f5f5f5; 
        font-weight: bold;
      }
      .pdf-element img { 
        max-width: 100%; 
        height: auto; 
        display: block;
      }
      .pdf-element .text-center { text-align: center; }
      .pdf-element .text-left { text-align: left; }
      .pdf-element .text-right { text-align: right; }
      .pdf-element * { 
        word-wrap: break-word; 
        overflow-wrap: break-word;
      }
    `;
    document.head.appendChild(style);
    
    tempContainer.className = 'pdf-element';
    document.body.appendChild(tempContainer);
    
    // 渲染为canvas
    const canvas = await html2canvas(tempContainer, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      width: tempContainer.scrollWidth,
      height: tempContainer.scrollHeight,
      onclone: (clonedDoc) => {
        const clonedContainer = clonedDoc.querySelector('.pdf-element') as HTMLElement;
        if (clonedContainer) {
          clonedContainer.style.fontFamily = `${FONT_FAMILIES[options.settings.font.family].name}, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif`;
        }
      }
    });
    
    // 清理
    document.body.removeChild(tempContainer);
    document.head.removeChild(style);
    
    return canvas;
  } catch (error) {
    console.error('元素渲染失败:', error);
    return null;
  }
}

/**
 * 将大元素分页处理
 */
async function splitElementAcrossPages(
  pdf: jsPDF,
  canvas: HTMLCanvasElement,
  options: {
    startY: number;
    width: number;
    pageHeight: number;
    margins: Text2PDFSettings['margins'];
    paperSize: { width: number; height: number };
  }
): Promise<{ nextY: number; pageNumber: number }> {
  const elementHeight = (canvas.height * options.width) / canvas.width;
  let currentY = options.startY;
  let pageNumber = 1;
  
  // 计算在当前页剩余的空间
  let remainingSpaceOnPage = options.paperSize.height - options.margins.bottom - currentY;
  let processedHeight = 0;
  
  while (processedHeight < elementHeight) {
    // 计算当前页面可以显示的高度
    const heightToShow = Math.min(remainingSpaceOnPage, elementHeight - processedHeight);
    
    // 计算源图片中对应的区域
    const srcY = (processedHeight / elementHeight) * canvas.height;
    const srcHeight = (heightToShow / elementHeight) * canvas.height;
    
    // 创建临时canvas来裁剪图片
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    tempCanvas.width = canvas.width;
    tempCanvas.height = srcHeight;
    
    if (tempCtx) {
      tempCtx.drawImage(canvas, 0, srcY, canvas.width, srcHeight, 0, 0, canvas.width, srcHeight);
      const pageImgData = tempCanvas.toDataURL('image/jpeg', 0.8);
      
      // 添加到PDF
      pdf.addImage(
        pageImgData,
        'JPEG',
        options.margins.left,
        currentY,
        options.width,
        heightToShow
      );
    }
    
    processedHeight += heightToShow;
    
    // 如果还有内容需要处理，换页
    if (processedHeight < elementHeight) {
      pdf.addPage();
      pageNumber++;
      currentY = options.margins.top;
      remainingSpaceOnPage = options.pageHeight;
    } else {
      currentY += heightToShow;
    }
  }
  
  return { nextY: currentY + 5, pageNumber }; // 添加5mm间距
}



/**
 * 将文件转换为base64
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('读取文件失败'));
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/**
 * 验证图片URL是否有效
 */
export function validateImageUrl(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
  });
}

/**
 * 获取图片尺寸
 */
export function getImageDimensions(url: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight
      });
    };
    img.onerror = () => reject(new Error('无法加载图片'));
    img.src = url;
  });
}
