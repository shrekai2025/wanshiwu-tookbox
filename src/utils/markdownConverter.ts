import { ContentBlock } from '@/types/localExtractor';

/**
 * 将内容块数组转换为Markdown格式的字符串
 */
export function blocksToMarkdown(blocks: ContentBlock[]): string {
  return blocks
    .filter(block => block.selected)
    .map(block => {
      switch (block.type) {
        case 'heading':
          const level = block.level || 1;
          const prefix = '#'.repeat(Math.min(level, 6));
          return `${prefix} ${block.content}`;
        
        case 'paragraph':
          return block.content;
        
        case 'list':
          return block.content;
        
        case 'quote':
          return block.content;
        
        case 'image':
          return block.content;
        
        default:
          return block.content;
      }
    })
    .join('\n\n');
}

/**
 * 将内容块复制到剪贴板
 */
export async function copyBlocksToClipboard(blocks: ContentBlock[]): Promise<void> {
  const markdown = blocksToMarkdown(blocks);
  
  if (!markdown.trim()) {
    throw new Error('没有选中的内容可复制');
  }

  try {
    await navigator.clipboard.writeText(markdown);
  } catch (error) {
    // 备用方案：使用传统的复制方法
    const textArea = document.createElement('textarea');
    textArea.value = markdown;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      document.execCommand('copy');
      document.body.removeChild(textArea);
    } catch (fallbackError) {
      document.body.removeChild(textArea);
      throw new Error('复制到剪贴板失败');
    }
  }
}

/**
 * 清理HTML标签，保留纯文本
 */
export function stripHtmlTags(html: string): string {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
}

/**
 * 将HTML文本转换为简单的Markdown格式
 */
export function htmlToMarkdown(html: string): string {
  let markdown = html;

  // 处理标题
  markdown = markdown.replace(/<h([1-6])[^>]*>(.*?)<\/h[1-6]>/gi, (match, level, content) => {
    const prefix = '#'.repeat(parseInt(level));
    return `${prefix} ${stripHtmlTags(content)}`;
  });

  // 处理粗体
  markdown = markdown.replace(/<(strong|b)[^>]*>(.*?)<\/(strong|b)>/gi, '**$2**');

  // 处理斜体
  markdown = markdown.replace(/<(em|i)[^>]*>(.*?)<\/(em|i)>/gi, '*$2*');

  // 处理链接
  markdown = markdown.replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)');

  // 处理图片
  markdown = markdown.replace(/<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*>/gi, '![$2]($1)');
  markdown = markdown.replace(/<img[^>]*alt="([^"]*)"[^>]*src="([^"]*)"[^>]*>/gi, '![$1]($2)');

  // 处理代码
  markdown = markdown.replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`');

  // 处理引用
  markdown = markdown.replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gi, (match, content) => {
    const cleanContent = stripHtmlTags(content);
    return `> ${cleanContent}`;
  });

  // 处理列表项
  markdown = markdown.replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1');

  // 处理段落
  markdown = markdown.replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n');

  // 处理换行
  markdown = markdown.replace(/<br\s*\/?>/gi, '\n');

  // 清理剩余的HTML标签
  markdown = stripHtmlTags(markdown);

  // 清理多余的空行
  markdown = markdown.replace(/\n\s*\n\s*\n/g, '\n\n');

  return markdown.trim();
}

/**
 * 格式化内容块的预览文本
 */
export function formatBlockPreview(block: ContentBlock, maxLength: number = 100): string {
  let preview = block.content;

  // 移除Markdown标记以获得更清晰的预览
  preview = preview.replace(/^#+\s+/g, ''); // 移除标题标记
  preview = preview.replace(/^\>\s+/g, ''); // 移除引用标记
  preview = preview.replace(/^\-\s+/g, ''); // 移除列表标记
  preview = preview.replace(/\*\*(.*?)\*\*/g, '$1'); // 移除粗体标记
  preview = preview.replace(/\*(.*?)\*/g, '$1'); // 移除斜体标记
  preview = preview.replace(/`(.*?)`/g, '$1'); // 移除代码标记
  preview = preview.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1'); // 移除链接，保留文本
  preview = preview.replace(/!\[([^\]]*)\]\([^)]+\)/g, '[图片: $1]'); // 简化图片显示

  // 替换换行符为空格
  preview = preview.replace(/\n/g, ' ');

  // 清理多余的空格
  preview = preview.replace(/\s+/g, ' ').trim();

  // 截断过长的文本
  if (preview.length > maxLength) {
    preview = preview.substring(0, maxLength) + '...';
  }

  return preview;
}
