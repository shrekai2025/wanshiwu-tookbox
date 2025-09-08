import jsPDF from "jspdf";
import { ImageFile, PDFSettings } from "@/app/page";

export async function generatePDF(images: ImageFile[], settings: PDFSettings): Promise<void> {
  // 如果没有图片，直接返回
  if (images.length === 0) return;
  
  // PDF固定为竖版A4
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });
  
  // 每页布局：将 images 按每页数量切分
  const perPage = Math.max(1, settings.imagesPerPage || 1);
  for (let pageStart = 0; pageStart < images.length; pageStart += perPage) {
    const pageImages = images.slice(pageStart, pageStart + perPage);
    const isFirstPage = pageStart === 0;

    if (!isFirstPage) {
      pdf.addPage("a4", "portrait");
    }

    // 纵向排列：单列多行
    const cols = 1;
    const rows = Math.min(perPage, pageImages.length);

    // 页面尺寸与内边距
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const contentWidth = pageWidth - settings.margin * 2;
    const contentHeight = pageHeight - settings.margin * 2;

    const cellWidth = contentWidth; // 单列
    const cellHeight = contentHeight / rows; // 均分高度

    for (let idx = 0; idx < pageImages.length; idx++) {
      const image = pageImages[idx];
      try {
        const placement = image.placement || settings.defaultPlacement;
        const dims = await getImageDimensions(image.url);

        // cell 内布局：在 cell 内再次按边距留出间隔（cellPadding）
        const cellPadding = 2; // mm 的微边距
        const availableW = cellWidth - cellPadding * 2;
        const availableH = cellHeight - cellPadding * 2;

        const layout = calculateImagePlacement(
          dims.width,
          dims.height,
          availableW,
          availableH,
          0,
          placement
        );

        // 放置在对应 cell 的位置（转换回页面坐标）
        const col = 0;
        const row = idx;
        const cellX = settings.margin + col * cellWidth + cellPadding;
        const cellY = settings.margin + row * cellHeight + cellPadding;

        const x = cellX + (availableW - layout.width) / 2;
        const y = cellY + (availableH - layout.height) / 2;

        const rotated = await getImageDataUrlWithRotation(image.file, placement === "rotated" ? 90 : 0);
        pdf.addImage(rotated.dataUrl, rotated.format, x, y, layout.width, layout.height);
      } catch (error) {
        console.error(`处理图片 ${image.file.name} 时出错:`, error);
      }
    }
  }
  
  // 如果没有成功添加任何图片，添加一个空白页面避免错误
  if (pdf.getNumberOfPages() === 0) {
    pdf.addPage();
    pdf.text("没有可用的图片", 20, 20);
  }
  
  // 生成文件名
  const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, "");
  const filename = `图片合成_${timestamp}.pdf`;
  
  // 下载PDF
  pdf.save(filename);
}

// 将File转换为DataURL
function loadImageAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("读取文件失败"));
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

// 获取图片尺寸
function getImageDimensions(url: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => reject(new Error("无法加载图片"));
    img.src = url;
  });
}

// 计算图片在PDF页面中的尺寸、位置（如果是横放，则按旋转后的宽高计算）
function calculateImagePlacement(
  imgWidth: number,
  imgHeight: number,
  pageWidth: number,
  pageHeight: number,
  margin: number,
  placement: "normal" | "rotated"
): { width: number; height: number; x: number; y: number } {
  const availableWidth = pageWidth - 2 * margin;
  const availableHeight = pageHeight - 2 * margin;
  
  let finalImgWidth = imgWidth;
  let finalImgHeight = imgHeight;
  
  // 如果是横放，需要旋转90度，所以交换宽高来计算
  if (placement === "rotated") {
    finalImgWidth = imgHeight;
    finalImgHeight = imgWidth;
  }
  
  // 计算缩放比例
  const scaleX = availableWidth / finalImgWidth;
  const scaleY = availableHeight / finalImgHeight;
  const scale = Math.min(scaleX, scaleY, 1); // 不放大，只缩小
  
  const scaledWidth = finalImgWidth * scale;
  const scaledHeight = finalImgHeight * scale;
  
  // 居中定位
  const x = (pageWidth - scaledWidth) / 2;
  const y = (pageHeight - scaledHeight) / 2;
  
  return {
    width: scaledWidth,
    height: scaledHeight,
    x,
    y
  };
}

// 将图片按需要旋转后返回DataURL和格式
async function getImageDataUrlWithRotation(
  file: File,
  rotateDeg: number
): Promise<{ dataUrl: string; format: "JPEG" | "PNG" }> {
  const originalDataUrl = await loadImageAsDataURL(file);
  // 判断目标格式，尽量保持原格式（仅支持 PNG/JPEG）
  const isPng = file.type.toLowerCase().includes("png");
  const targetMime = isPng ? "image/png" : "image/jpeg";
  const format: "JPEG" | "PNG" = isPng ? "PNG" : "JPEG";

  if (!rotateDeg) {
    return { dataUrl: originalDataUrl, format };
  }

  // 使用canvas进行预旋转
  const img = await loadImageElement(originalDataUrl);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return { dataUrl: originalDataUrl, format };
  }

  const rad = (rotateDeg * Math.PI) / 180;

  // 仅处理90/270度：交换画布宽高
  const rotatedWidth = img.height;
  const rotatedHeight = img.width;
  canvas.width = rotatedWidth;
  canvas.height = rotatedHeight;

  // 将原点移动到画布中心再旋转，然后以图片中心为基准绘制
  ctx.translate(rotatedWidth / 2, rotatedHeight / 2);
  ctx.rotate(rad);
  ctx.drawImage(img, -img.width / 2, -img.height / 2);

  const rotatedDataUrl = canvas.toDataURL(targetMime, 0.92);
  return { dataUrl: rotatedDataUrl, format };
}

function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("图片元素加载失败"));
    img.src = src;
  });
}
