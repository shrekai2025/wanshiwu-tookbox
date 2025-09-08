import { PDFDocument, PDFPage, ExportSettings, PPTXSlide, PPTXSlideElement } from "@/types/pdf2image";
// @ts-ignore
import * as pdfjs from "pdfjs-dist";

// 配置 PDF.js worker - 参考PDF裁剪模块的设置
// 使用 jsDelivr CDN，它比 CDNJS 更稳定
// 只在客户端环境下配置
if (typeof window !== 'undefined' && typeof pdfjs.GlobalWorkerOptions !== 'undefined') {
  pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@5.4.54/build/pdf.worker.min.mjs';
}

/**
 * 解析PDF文件，提取所有页面
 */
export async function parsePDF(file: File): Promise<PDFDocument> {
  try {
    console.log('开始解析PDF文件:', file.name, '大小:', getFileSizeMB(file).toFixed(2) + 'MB');
    
    const arrayBuffer = await file.arrayBuffer();
    console.log('文件已读取为ArrayBuffer，大小:', arrayBuffer.byteLength);
    
    // 配置PDF加载选项 - 参考PDF裁剪模块的设置
    const loadingTask = pdfjs.getDocument({
      data: new Uint8Array(arrayBuffer),
      stopAtErrors: true
    });
    
    const pdf = await loadingTask.promise;
    console.log('PDF解析成功，总页数:', pdf.numPages);
    
    const totalPages = pdf.numPages;
    const pages: PDFPage[] = [];

    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      try {
        console.log(`正在处理第 ${pageNum} 页...`);
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: 1.0 });
        
        // 创建canvas
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        
        if (!context) {
          throw new Error(`无法创建第 ${pageNum} 页的Canvas上下文`);
        }
        
        // 设置canvas尺寸
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        
        // 渲染页面到canvas
        await page.render({
          canvasContext: context,
          viewport: viewport
        }).promise;

        const pdfPage: PDFPage = {
          id: `page-${pageNum}`,
          pageNumber: pageNum,
          canvas: canvas,
          selected: false,
          width: viewport.width,
          height: viewport.height
        };

        pages.push(pdfPage);
        console.log(`第 ${pageNum} 页处理完成`);
      } catch (pageError) {
        console.error(`处理第 ${pageNum} 页时出错:`, pageError);
        throw new Error(`处理第 ${pageNum} 页失败: ${pageError instanceof Error ? pageError.message : '未知错误'}`);
      }
    }

    console.log('所有页面处理完成');
    return {
      file,
      pages,
      totalPages
    };
  } catch (error) {
    console.error('PDF解析失败，详细错误:', error);
    
    // 提供更详细的错误信息
    if (error instanceof Error) {
      if (error.message.includes('Invalid PDF')) {
        throw new Error('PDF文件格式无效，请确保文件未损坏');
      } else if (error.message.includes('password')) {
        throw new Error('PDF文件受密码保护，暂不支持');
      } else if (error.message.includes('worker')) {
        throw new Error('PDF处理组件加载失败，请刷新页面重试');
      } else {
        throw new Error(`PDF解析失败: ${error.message}`);
      }
    } else {
      throw new Error('PDF解析失败: 未知错误，请检查文件是否损坏');
    }
  }
}

/**
 * 将canvas转换为JPG blob
 */
export function canvasToJPG(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      }
    }, 'image/jpeg', quality / 100);
  });
}

/**
 * 批量导出选中页面为JPG
 */
export async function exportPagesAsJPG(
  pages: PDFPage[], 
  selectedPageNumbers: number[], 
  quality: number
): Promise<void> {
  const selectedPages = pages.filter(page => selectedPageNumbers.includes(page.pageNumber));
  
  for (const page of selectedPages) {
    const blob = await canvasToJPG(page.canvas, quality);
    
    // 创建下载链接
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `page-${page.pageNumber}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

/**
 * 简单的OCR文本检测（基于画布像素分析）
 * 这是一个简化版本，实际使用中可以集成更强大的OCR库
 */
export function extractTextRegions(canvas: HTMLCanvasElement): PPTXSlideElement[] {
  const ctx = canvas.getContext('2d');
  if (!ctx) return [];

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  
  // 简单的文本区域检测（基于颜色变化）
  const textElements: PPTXSlideElement[] = [];
  const blockSize = 50; // 检测块大小
  
  for (let y = 0; y < canvas.height; y += blockSize) {
    for (let x = 0; x < canvas.width; x += blockSize) {
      let hasText = false;
      let pixelCount = 0;
      let darkPixels = 0;
      
      // 分析块内像素
      for (let dy = 0; dy < blockSize && y + dy < canvas.height; dy++) {
        for (let dx = 0; dx < blockSize && x + dx < canvas.width; dx++) {
          const i = ((y + dy) * canvas.width + (x + dx)) * 4;
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const brightness = (r + g + b) / 3;
          
          pixelCount++;
          if (brightness < 128) { // 暗像素
            darkPixels++;
          }
        }
      }
      
      // 如果暗像素比例在文本范围内，认为是文本区域
      const darkRatio = darkPixels / pixelCount;
      if (darkRatio > 0.1 && darkRatio < 0.7) {
        hasText = true;
      }
      
      if (hasText) {
        textElements.push({
          type: 'text',
          content: `文本区域 ${textElements.length + 1}`,
          x: x,
          y: y,
          width: Math.min(blockSize, canvas.width - x),
          height: Math.min(blockSize, canvas.height - y),
          zIndex: 2
        });
      }
    }
  }
  
  return textElements;
}

/**
 * 将PDF页面转换为PPTX幻灯片
 */
export function convertPageToPPTXSlide(page: PDFPage): PPTXSlide {
  // 提取文本区域
  const textElements = extractTextRegions(page.canvas);
  
  // 添加背景图片元素
  const imageElement: PPTXSlideElement = {
    type: 'image',
    content: page.canvas,
    x: 0,
    y: 0,
    width: page.width,
    height: page.height,
    zIndex: 1
  };
  
  return {
    pageNumber: page.pageNumber,
    elements: [imageElement, ...textElements]
  };
}

/**
 * 导出选中页面为PPTX
 */
export async function exportPagesAsPPTX(
  pages: PDFPage[], 
  selectedPageNumbers: number[]
): Promise<void> {
  const selectedPages = pages.filter(page => selectedPageNumbers.includes(page.pageNumber));
  
  if (selectedPages.length === 0) {
    throw new Error('请选择要导出的页面');
  }

  try {
    // 动态导入JSZip和PPTX生成器
    const JSZip = (await import('jszip')).default;
    const { createPPTXStructure } = await import('./pptxGenerator');
    
    const zip = new JSZip();

    // 创建PPTX文件结构
    await createPPTXStructure(zip, selectedPages);

    // 生成ZIP文件并下载
    const content = await zip.generateAsync({ type: 'blob' });
    
    // 创建下载链接
    const url = URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url;
    a.download = `converted-pages.pptx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
  } catch (error) {
    console.error('PPTX导出失败:', error);
    throw new Error(`PPTX导出失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
}

/**
 * 获取文件大小（MB）
 */
export function getFileSizeMB(file: File): number {
  return file.size / (1024 * 1024);
}

/**
 * 验证文件大小是否在限制内
 */
export function validateFileSize(file: File, maxSizeMB: number = 200): boolean {
  return getFileSizeMB(file) <= maxSizeMB;
}
