import { PDFDocument } from 'pdf-lib';
import jsPDF from 'jspdf';
import * as pdfjsLib from 'pdfjs-dist';

// 配置 PDF.js worker - 使用一个有效的 CDN 地址
// 使用 jsDelivr CDN，它比 CDNJS 更稳定
// 只在客户端环境下配置
if (typeof window !== 'undefined' && typeof pdfjsLib.GlobalWorkerOptions !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@5.4.54/build/pdf.worker.min.mjs';
}

export interface CompressionSettings {
  quality: number; // 0.1 - 1.0
  removeAnnotations: boolean;
  removeBookmarks: boolean;
  optimizeImages: boolean;
}

export interface PageRange {
  start: number;
  end: number;
}

/**
 * 处理PDF文件：压缩和裁剪页面
 */
export async function processPDF(
  file: File,
  settings: CompressionSettings,
  pageRange: PageRange | null = null
): Promise<Uint8Array> {
  try {
    // 读取PDF文件
    const arrayBuffer = await file.arrayBuffer();
    let pdfDoc: PDFDocument;
    
    try {
      // 首先尝试正常加载
      pdfDoc = await PDFDocument.load(arrayBuffer);
    } catch (error: any) {
      if (error.message && error.message.includes('encrypted')) {
        // 如果是加密文件，尝试忽略加密加载
        pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
      } else {
        throw error;
      }
    }

    // 创建新的PDF文档
    const newPdfDoc = await PDFDocument.create();

    // 获取总页数
    const totalPages = pdfDoc.getPageCount();
    
    // 确定要处理的页面范围
    let startPage = 1;
    let endPage = totalPages;
    
    if (pageRange) {
      startPage = Math.max(1, Math.min(pageRange.start, totalPages));
      endPage = Math.max(startPage, Math.min(pageRange.end, totalPages));
    }

    // 复制指定页面到新文档
    const pageIndices = [];
    for (let i = startPage - 1; i < endPage; i++) {
      pageIndices.push(i);
    }

    const copiedPages = await newPdfDoc.copyPages(pdfDoc, pageIndices);
    
    // 将复制的页面添加到新文档
    copiedPages.forEach((page) => {
      newPdfDoc.addPage(page);
    });

    // 移除注释（如果设置了）
    if (settings.removeAnnotations) {
      const pages = newPdfDoc.getPages();
      pages.forEach(page => {
        // 这里可以添加移除注释的逻辑
        // pdf-lib可能需要更复杂的操作来移除注释
      });
    }

    // 移除书签（如果设置了）
    if (settings.removeBookmarks) {
      // pdf-lib目前没有直接移除书签的API
      // 但新创建的文档默认不会包含原文档的书签
    }

    // 设置PDF元数据以优化文件大小
    newPdfDoc.setTitle('');
    newPdfDoc.setAuthor('');
    newPdfDoc.setSubject('');
    newPdfDoc.setCreator('PDF Cropper');
    newPdfDoc.setProducer('PDF Cropper');

    // 生成PDF字节数据
    const pdfBytes = await newPdfDoc.save({
      useObjectStreams: true, // 启用对象流压缩
      addDefaultPage: false,
    });

    return pdfBytes;
  } catch (error) {
    console.warn('📄 PDF文件结构不标准，正在使用兼容模式处理...');
    console.debug('详细错误信息:', error);
    // 使用 PDF.js 回退方案：将页面光栅化后用 jsPDF 重新组装
    try {
      const result = await renderAndExportWithPdfjs(file, settings, pageRange);
      console.info('✅ 兼容模式处理成功！PDF已导出');
      return result;
    } catch (fallbackError) {
      console.error('❌ 兼容模式也失败:', fallbackError);
      throw new Error('此PDF文件无法处理，请尝试其他PDF文件或使用专业PDF工具预处理');
    }
  }
}

/**
 * 获取PDF文件信息
 */
export async function getPDFInfo(file: File): Promise<{
  pageCount: number;
  fileSize: number;
  title?: string;
  isEncrypted?: boolean;
}> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    let pdfDoc: PDFDocument;
    let isEncrypted = false;
    
    try {
      // 首先尝试正常加载
      pdfDoc = await PDFDocument.load(arrayBuffer);
    } catch (error: any) {
      if (error.message && error.message.includes('encrypted')) {
        // 如果是加密文件，尝试忽略加密加载
        isEncrypted = true;
        pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
      } else {
        throw error;
      }
    }
    
    return {
      pageCount: pdfDoc.getPageCount(),
      fileSize: file.size,
      title: pdfDoc.getTitle() || undefined,
      isEncrypted,
    };
  } catch (error) {
    console.debug('📋 正在使用兼容模式读取PDF信息...');
    // 使用 PDF.js 仅提取基础信息（页数）
    try {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ 
        data: new Uint8Array(arrayBuffer), 
        stopAtErrors: true
      });
      const pdf = await loadingTask.promise;
      return {
        pageCount: pdf.numPages,
        fileSize: file.size,
        title: undefined,
        isEncrypted: false,
      };
    } catch (e) {
      console.debug('PDF.js 解析详细错误:', e);
      // 最后的回退：基于文件大小估算页数，让用户至少能使用基本功能
      const estimatedPages = Math.max(1, Math.floor(file.size / 100000)); // 假设每页约100KB
      console.warn(`⚠️ 无法精确解析PDF，估算页数为 ${estimatedPages} 页`);
      return {
        pageCount: estimatedPages,
        fileSize: file.size,
        title: undefined,
        isEncrypted: false,
      };
    }
  }
}

/**
 * 格式化文件大小
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * 计算压缩比例
 */
export function calculateCompressionRatio(originalSize: number, compressedSize: number): string {
  if (originalSize === 0) return '0%';
  const ratio = ((originalSize - compressedSize) / originalSize * 100);
  return ratio.toFixed(1) + '%';
}

/**
 * 使用 PDF.js 渲染所选页面并通过 jsPDF 导出
 * 该回退路径可处理部分结构不标准或仅权限加密的 PDF
 */
async function renderAndExportWithPdfjs(
  file: File,
  settings: CompressionSettings,
  pageRange: PageRange | null
): Promise<Uint8Array> {
  // 确保在客户端环境中执行
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    throw new Error('此功能只能在浏览器环境中使用');
  }

  const arrayBuffer = await file.arrayBuffer();
  const data = new Uint8Array(arrayBuffer);

  // 在主线程中运行PDF.js以避免worker加载问题
  const loadingTask = pdfjsLib.getDocument({ 
    data, 
    stopAtErrors: true
  });
  const pdf = await loadingTask.promise;

  const totalPages = pdf.numPages;
  const start = Math.max(1, pageRange ? Math.min(pageRange.start, totalPages) : 1);
  const end = Math.max(start, pageRange ? Math.min(pageRange.end, totalPages) : totalPages);

  // 以 pt 为单位，页面尺寸与渲染尺寸一致，确保清晰度
  let doc: jsPDF | null = null;

  for (let pageNum = start; pageNum <= end; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: 2 }); // 2x 提升清晰度

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) throw new Error('无法创建Canvas上下文');
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);

    await page.render({ canvasContext: context, viewport, canvas }).promise;

    const pageWidthPt = viewport.width; // px ≈ pt（1:1 用于 jsPDF 自定义尺寸）
    const pageHeightPt = viewport.height;

    const imageQuality = Math.min(1, Math.max(0.1, settings.quality || 0.8));
    const optimize = settings.optimizeImages !== false;
    const mime = optimize ? 'image/jpeg' : 'image/png';
    const dataUrl = canvas.toDataURL(mime, imageQuality);

    if (!doc) {
      doc = new jsPDF({ unit: 'pt', format: [pageWidthPt, pageHeightPt] });
    } else {
      doc.addPage([pageWidthPt, pageHeightPt]);
    }
    doc.addImage(dataUrl, optimize ? 'JPEG' : 'PNG', 0, 0, pageWidthPt, pageHeightPt);
  }

  if (!doc) throw new Error('没有可渲染的页面');
  const out = doc.output('arraybuffer');
  return new Uint8Array(out);
}
