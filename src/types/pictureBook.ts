export interface PictureBookPage {
  id: string;
  image?: {
    src: string;
    file?: File;
    mode: 'cover' | 'contain'; // 覆盖整个区域 | 完整显示
  };
  text: {
    content: string;
    fontSize: number;
    fontFamily: string;
    padding: number;
  };
}

export interface PictureBook {
  pages: PictureBookPage[];
  selectedPageId: string | null;
}

export interface TextStyle {
  fontSize: number;
  fontFamily: string;
  padding: number;
}

export const DEFAULT_TEXT_STYLE: TextStyle = {
  fontSize: 16,
  fontFamily: '微软雅黑',
  padding: 20,
};

export const FONT_FAMILIES = [
  '微软雅黑',
  '宋体',
  '黑体', 
  '楷体',
  '思源黑体',
] as const;

// 字体CSS映射
export const FONT_CSS_MAPPING: { [key: string]: string } = {
  '微软雅黑': 'Microsoft YaHei, PingFang SC, sans-serif',
  '宋体': 'SimSun, STSong, serif',
  '黑体': 'SimHei, STHeiti, sans-serif',
  '楷体': 'KaiTi, STKaiti, cursive',
  '思源黑体': 'Source Han Sans CN, Noto Sans SC, sans-serif',
};

export const FONT_SIZES = [
  12, 14, 16, 18, 20, 24, 28, 32, 36, 42, 48, 56, 64, 72
] as const;

export type FontFamily = typeof FONT_FAMILIES[number];
export type FontSize = typeof FONT_SIZES[number];
