// Text2PDF功能相关类型定义

// 纸张规格类型
export type PaperSize = "a4" | "b5";

// 字体类型
export type FontFamily = 
  | "inter" 
  | "noto-sans" 
  | "source-han-sans" 
  | "lato" 
  | "roboto";

// 图片对齐方式
export type ImageAlignment = "left" | "center" | "right";

// 图片尺寸
export type ImageSize = "small" | "medium" | "large";

// PDF设置接口
export interface Text2PDFSettings {
  // 纸张设置
  paperSize: PaperSize;
  
  // 边距设置 (mm)
  margins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  
  // 字体设置
  font: {
    family: FontFamily;
    size: number;      // 正文字体大小 (pt)
    lineHeight: number; // 行高倍数
  };
  
  // 标题字体设置
  headings: {
    h1Size: number;
    h2Size: number;
    h3Size: number;
  };
}

// 插入的图片信息
export interface InsertedImage {
  id: string;
  url: string;         // 图片URL或base64
  alt: string;         // 替代文本
  size: ImageSize;     // 图片尺寸
  alignment: ImageAlignment; // 对齐方式
  width?: number;      // 自定义宽度 (%)
  height?: number;     // 自定义高度 (%)
  isLocal: boolean;    // 是否为本地文件
  file?: File;         // 本地文件对象（如果是本地图片）
}

// 文档内容状态
export interface DocumentContent {
  markdown: string;    // 原始markdown文本
  images: InsertedImage[]; // 插入的图片列表
}

// 字体映射
export const FONT_FAMILIES: Record<FontFamily, { name: string; displayName: string }> = {
  "inter": { name: "Inter", displayName: "Inter (现代简洁)" },
  "noto-sans": { name: "Noto Sans", displayName: "Noto Sans (多语言)" },
  "source-han-sans": { name: "Source Han Sans", displayName: "思源黑体 (中文优化)" },
  "lato": { name: "Lato", displayName: "Lato (优雅易读)" },
  "roboto": { name: "Roboto", displayName: "Roboto (Google字体)" }
};

// 纸张尺寸映射 (mm)
export const PAPER_SIZES: Record<PaperSize, { width: number; height: number; displayName: string }> = {
  "a4": { width: 210, height: 297, displayName: "A4 (210×297mm)" },
  "b5": { width: 176, height: 250, displayName: "B5 (176×250mm)" }
};

// 图片尺寸映射 (相对于页面宽度的百分比)
export const IMAGE_SIZES: Record<ImageSize, { width: number; displayName: string }> = {
  "small": { width: 30, displayName: "小 (30%宽度)" },
  "medium": { width: 60, displayName: "中 (60%宽度)" },
  "large": { width: 100, displayName: "大 (填满宽度)" }
};

// 默认设置
export const DEFAULT_TEXT2PDF_SETTINGS: Text2PDFSettings = {
  paperSize: "a4",
  margins: {
    top: 20,
    right: 20,
    bottom: 20,
    left: 20
  },
  font: {
    family: "inter",
    size: 12,
    lineHeight: 1.6
  },
  headings: {
    h1Size: 24,
    h2Size: 20,
    h3Size: 16
  }
};
