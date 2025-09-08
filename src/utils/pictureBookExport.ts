import { PictureBookPage, FONT_CSS_MAPPING } from "@/types/pictureBook";

// 导出质量选项
export type ExportQuality = 'high' | 'medium' | 'low';

// A4横版尺寸对应不同DPI
const A4_LANDSCAPE_SIZES = {
  high: {    // 300 DPI - 高质量打印
    width: 3508,
    height: 2480,
    dpi: 300,
  },
  medium: {  // 150 DPI - 中等质量
    width: 1754,
    height: 1240,
    dpi: 150,
  },
  low: {     // 72 DPI - 网络分享
    width: 842,
    height: 595,
    dpi: 72,
  },
};

/**
 * 将单页绘本内容渲染为Canvas
 */
export async function renderPageToCanvas(page: PictureBookPage, quality: ExportQuality = 'medium'): Promise<HTMLCanvasElement> {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  
  if (!ctx) {
    throw new Error("无法创建Canvas上下文");
  }

  // 根据质量设置画布尺寸
  const size = A4_LANDSCAPE_SIZES[quality];
  canvas.width = size.width;
  canvas.height = size.height;

  // 白色背景
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const halfWidth = canvas.width / 2;

  // 渲染左侧图片区域
  if (page.image?.src) {
    await drawImageToCanvas(ctx, page.image.src, page.image.mode, 0, 0, halfWidth, canvas.height);
  } else {
    // 图片区域背景
    ctx.fillStyle = "#f3f4f6";
    ctx.fillRect(0, 0, halfWidth, canvas.height);
  }

  // 中间分割线
  ctx.strokeStyle = "#e5e7eb";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(halfWidth, 0);
  ctx.lineTo(halfWidth, canvas.height);
  ctx.stroke();

  // 渲染右侧文字区域
  if (page.text.content) {
    drawTextToCanvas(ctx, page.text, halfWidth, 0, halfWidth, canvas.height, quality);
  }

  return canvas;
}

/**
 * 将图片绘制到Canvas
 */
async function drawImageToCanvas(
  ctx: CanvasRenderingContext2D,
  imageSrc: string,
  mode: "cover" | "contain",
  x: number,
  y: number,
  width: number,
  height: number
): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    
    img.onload = () => {
      const imgRatio = img.width / img.height;
      const areaRatio = width / height;

      let drawWidth: number;
      let drawHeight: number;
      let drawX: number;
      let drawY: number;

      if (mode === "cover") {
        // 覆盖整个区域，可能会裁剪
        if (imgRatio > areaRatio) {
          drawHeight = height;
          drawWidth = height * imgRatio;
          drawX = x + (width - drawWidth) / 2;
          drawY = y;
        } else {
          drawWidth = width;
          drawHeight = width / imgRatio;
          drawX = x;
          drawY = y + (height - drawHeight) / 2;
        }
      } else {
        // 完整显示图片，可能会有留白
        if (imgRatio > areaRatio) {
          drawWidth = width;
          drawHeight = width / imgRatio;
          drawX = x;
          drawY = y + (height - drawHeight) / 2;
        } else {
          drawHeight = height;
          drawWidth = height * imgRatio;
          drawX = x + (width - drawWidth) / 2;
          drawY = y;
        }
      }

      ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
      resolve();
    };

    img.onerror = () => reject(new Error("图片加载失败"));
    img.src = imageSrc;
  });
}

/**
 * 将文字绘制到Canvas
 */
function drawTextToCanvas(
  ctx: CanvasRenderingContext2D,
  text: { content: string; fontSize: number; fontFamily: string; padding: number },
  x: number,
  y: number,
  width: number,
  height: number,
  quality: ExportQuality
): void {
  // 动态获取编辑区域的实际显示尺寸来计算精确的缩放比例
  const editArea = document.getElementById('picture-book-edit-area');
  const displayWidth = editArea ? editArea.clientWidth : 720; // 如果找不到元素则使用默认值
  const targetWidth = A4_LANDSCAPE_SIZES[quality].width;
  const scale = targetWidth / displayWidth;
  
  const padding = text.padding * scale;
  const fontSize = text.fontSize * scale;

  const textArea = {
    x: x + padding,
    y: y + padding,
    width: width - padding * 2,
    height: height - padding * 2,
  };

  // 使用统一的字体映射
  const fontFamily = FONT_CSS_MAPPING[text.fontFamily] || text.fontFamily;
  
  ctx.fillStyle = "#000000";
  ctx.font = `500 ${fontSize}px ${fontFamily}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // 简单的文字换行处理
  const words = text.content.split("");
  const lines: string[] = [];
  let currentLine = "";

  for (const char of words) {
    const testLine = currentLine + char;
    const metrics = ctx.measureText(testLine);
    
    if (metrics.width > textArea.width && currentLine.length > 0) {
      lines.push(currentLine);
      currentLine = char;
    } else {
      currentLine = testLine;
    }
  }
  
  if (currentLine) {
    lines.push(currentLine);
  }

  // 绘制每一行
  const lineHeight = fontSize * 1.5;
  const totalTextHeight = lines.length * lineHeight;
  const startY = textArea.y + textArea.height / 2 - totalTextHeight / 2 + lineHeight / 2;

  lines.forEach((line, index) => {
    const lineY = startY + index * lineHeight;
    ctx.fillText(line, textArea.x + textArea.width / 2, lineY);
  });
}

/**
 * 导出单页为图片
 */
export async function exportPageAsImage(
  page: PictureBookPage, 
  pageNumber?: number,
  options: {
    quality: ExportQuality;
    format: 'png' | 'jpeg';
    jpegQuality?: number; // JPEG质量 0.1-1.0
  } = { quality: 'medium', format: 'jpeg', jpegQuality: 0.8 }
): Promise<void> {
  try {
    const canvas = await renderPageToCanvas(page, options.quality);
    
    // 根据格式和质量设置确定输出参数
    const mimeType = options.format === 'png' ? 'image/png' : 'image/jpeg';
    const qualityParam = options.format === 'jpeg' ? options.jpegQuality || 0.8 : undefined;
    
    // 转换为blob
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error("Canvas转换失败"));
          return;
        }

        // 创建下载链接
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        
        // 生成文件名
        const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, "");
        const qualityName = options.quality === 'high' ? '高清' : options.quality === 'medium' ? '中等' : '低质量';
        const filename = pageNumber 
          ? `绘本_页面${pageNumber}_${qualityName}.${options.format}`
          : `绘本_页面_${qualityName}.${options.format}`;
        
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        resolve();
      }, mimeType, qualityParam);
    });
  } catch (error) {
    console.error("图片导出失败:", error);
    throw error;
  }
}

/**
 * 导出单页为PNG（兼容性函数）
 */
export async function exportPageAsPNG(page: PictureBookPage, pageNumber?: number): Promise<void> {
  return exportPageAsImage(page, pageNumber, { quality: 'medium', format: 'png' });
}

/**
 * 导出多页为PDF
 */
export async function exportPictureBookAsPDF(
  pages: PictureBookPage[],
  options: {
    quality: ExportQuality;
    jpegQuality?: number; // JPEG压缩质量 0.1-1.0
  } = { quality: 'medium', jpegQuality: 0.8 }
): Promise<void> {
  // 动态导入jsPDF以减小bundle大小
  const { default: jsPDF } = await import("jspdf");
  
  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    
    if (i > 0) {
      pdf.addPage("a4", "landscape");
    }

    try {
      const canvas = await renderPageToCanvas(page, options.quality);
      // 使用JPEG格式和压缩质量来减小PDF文件大小
      const imgData = canvas.toDataURL("image/jpeg", options.jpegQuality || 0.8);
      
      // 添加到PDF (A4横版: 297x210mm)
      pdf.addImage(imgData, "JPEG", 0, 0, 297, 210);
    } catch (error) {
      console.error(`处理第${i + 1}页时出错:`, error);
    }
  }

  // 生成文件名并下载
  const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, "");
  const qualityName = options.quality === 'high' ? '高清' : options.quality === 'medium' ? '中等' : '小文件';
  const filename = `绘本合集_${qualityName}_${timestamp}.pdf`;
  pdf.save(filename);
}
