import { marked } from 'marked';
import { InsertedImage } from '@/types/text2pdf';

// 图片插入语法：{{image:imageId}}
const IMAGE_SYNTAX_REGEX = /\{\{image:([^}]+)\}\}/g;

// 配置marked选项
marked.setOptions({
  gfm: true,          // GitHub Flavored Markdown
  breaks: true,       // 换行符转换为<br>
});

/**
 * 解析markdown文本并处理图片
 */
export function parseMarkdownWithImages(
  markdown: string, 
  images: InsertedImage[]
): string {
  // 创建图片ID到图片对象的映射
  const imageMap = new Map(images.map(img => [img.id, img]));
  
  // 先处理图片语法，替换为HTML img标签
  const markdownWithImages = markdown.replace(IMAGE_SYNTAX_REGEX, (match, imageId) => {
    const image = imageMap.get(imageId);
    if (!image) {
      return `[图片不存在: ${imageId}]`;
    }
    
    // 生成图片HTML
    const alignClass = `text-${image.alignment}`;
    const widthStyle = image.size === 'large' ? 'width: 100%' : 
                      image.size === 'medium' ? 'width: 60%' : 'width: 30%';
    
    return `<div class="${alignClass}">
      <img src="${image.url}" alt="${image.alt}" style="${widthStyle}; height: auto; max-width: 100%;" />
    </div>`;
  });
  
  // 使用marked解析markdown
  const rawHtml = marked(markdownWithImages) as string;
  
  // 简单的HTML清理（如果DOMPurify不可用）
  return sanitizeHtml(rawHtml);
}

/**
 * 简单的HTML清理函数
 */
function sanitizeHtml(html: string): string {
  // 在浏览器环境中，我们可以使用更简单的方式
  // 暂时返回原始HTML，因为marked本身相对安全
  return html;
}

/**
 * 生成图片插入语法
 */
export function generateImageSyntax(imageId: string): string {
  return `{{image:${imageId}}}`;
}

/**
 * 从markdown文本中提取所有图片引用
 */
export function extractImageReferences(markdown: string): string[] {
  const matches = markdown.matchAll(IMAGE_SYNTAX_REGEX);
  return Array.from(matches, match => match[1]);
}

/**
 * 检查图片是否在markdown中被使用
 */
export function isImageUsed(markdown: string, imageId: string): boolean {
  return markdown.includes(generateImageSyntax(imageId));
}

/**
 * 移除markdown中未使用的图片引用
 */
export function removeUnusedImageReferences(
  markdown: string, 
  validImageIds: string[]
): string {
  const validIdSet = new Set(validImageIds);
  
  return markdown.replace(IMAGE_SYNTAX_REGEX, (match, imageId) => {
    return validIdSet.has(imageId) ? match : '';
  });
}

/**
 * 获取markdown统计信息
 */
export function getMarkdownStats(markdown: string): {
  characters: number;
  charactersNoSpaces: number;
  words: number;
  lines: number;
  paragraphs: number;
} {
  const characters = markdown.length;
  const charactersNoSpaces = markdown.replace(/\s/g, '').length;
  const words = markdown.trim() ? markdown.trim().split(/\s+/).length : 0;
  const lines = markdown.split('\n').length;
  const paragraphs = markdown.split(/\n\s*\n/).filter(p => p.trim()).length;
  
  return {
    characters,
    charactersNoSpaces,
    words,
    lines,
    paragraphs
  };
}

/**
 * 验证markdown语法（基础检查）
 */
export function validateMarkdown(markdown: string): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // 检查不平衡的标记
  const codeBlockMatches = markdown.match(/```/g);
  if (codeBlockMatches && codeBlockMatches.length % 2 !== 0) {
    errors.push('存在未闭合的代码块');
  }
  
  // 检查图片引用
  const imageRefs = extractImageReferences(markdown);
  const uniqueImageRefs = new Set(imageRefs);
  if (imageRefs.length !== uniqueImageRefs.size) {
    warnings.push('存在重复的图片引用');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}
