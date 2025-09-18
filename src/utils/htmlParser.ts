import { ContentBlock, ParsedContent } from '@/types/localExtractor';

// 主要内容选择器，按优先级排序
const MAIN_CONTENT_SELECTORS = [
  'article',
  'main',
  '[role="main"]',
  '.post-content',
  '.entry-content',
  '.content',
  '.main-content',
  '.article-content',
  '.post-body',
  '.entry-body'
];

// 评论区域选择器
const COMMENT_SELECTORS = [
  '.comments',
  '.comment-list',
  '#comments',
  '.comment-section',
  '.comment-area',
  '.comments-area',
  '[class*="comment"]',
  '[id*="comment"]'
];

// 需要移除的元素选择器
const EXCLUDE_SELECTORS = [
  'script',
  'style',
  'nav',
  'header',
  'footer',
  '.navigation',
  '.navbar',
  '.sidebar',
  '.aside',
  '.advertisement',
  '.ads',
  '.social-share',
  '.related-posts',
  '.breadcrumb',
  '.pagination',
  '[class*="ad"]',
  '[class*="banner"]'
];

/**
 * 从HTML文档中提取主要内容
 */
function extractMainContent(doc: Document): Element | null {
  // 尝试使用主要内容选择器
  for (const selector of MAIN_CONTENT_SELECTORS) {
    const element = doc.querySelector(selector);
    if (element && element.textContent && element.textContent.trim().length > 100) {
      return element;
    }
  }

  // 如果没有找到，尝试找到最大的文本内容区域
  const candidates = doc.querySelectorAll('div, section, article');
  let bestCandidate: Element | null = null;
  let maxTextLength = 0;

  candidates.forEach(candidate => {
    const textLength = candidate.textContent?.trim().length || 0;
    if (textLength > maxTextLength && textLength > 200) {
      maxTextLength = textLength;
      bestCandidate = candidate;
    }
  });

  return bestCandidate;
}

/**
 * 从HTML文档中提取评论内容
 */
function extractComments(doc: Document): Element[] {
  const commentElements: Element[] = [];

  for (const selector of COMMENT_SELECTORS) {
    const elements = doc.querySelectorAll(selector);
    elements.forEach(element => {
      if (element.textContent && element.textContent.trim().length > 20) {
        commentElements.push(element);
      }
    });
  }

  return commentElements;
}

/**
 * 清理HTML元素，移除不需要的内容
 */
function cleanElement(element: Element): Element {
  const clonedElement = element.cloneNode(true) as Element;

  // 移除不需要的元素
  EXCLUDE_SELECTORS.forEach(selector => {
    const elementsToRemove = clonedElement.querySelectorAll(selector);
    elementsToRemove.forEach(el => el.remove());
  });

  return clonedElement;
}

/**
 * 将HTML元素转换为内容块
 */
function elementToContentBlocks(element: Element, startId: number = 0): ContentBlock[] {
  const blocks: ContentBlock[] = [];
  let idCounter = startId;

  const processNode = (node: Node) => {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as Element;
      const tagName = el.tagName.toLowerCase();
      const textContent = el.textContent?.trim() || '';

      // 跳过空内容
      if (!textContent) return;

      // 处理标题
      if (/^h[1-6]$/.test(tagName)) {
        blocks.push({
          id: `block-${idCounter++}`,
          type: 'heading',
          content: textContent,
          originalHtml: el.outerHTML,
          selected: false,
          level: parseInt(tagName[1])
        });
        return;
      }

      // 处理列表
      if (tagName === 'ul' || tagName === 'ol') {
        const listItems = Array.from(el.querySelectorAll('li'))
          .map(li => li.textContent?.trim())
          .filter(text => text)
          .map(text => `- ${text}`)
          .join('\n');

        if (listItems) {
          blocks.push({
            id: `block-${idCounter++}`,
            type: 'list',
            content: listItems,
            originalHtml: el.outerHTML,
            selected: false
          });
        }
        return;
      }

      // 处理引用
      if (tagName === 'blockquote') {
        blocks.push({
          id: `block-${idCounter++}`,
          type: 'quote',
          content: `> ${textContent}`,
          originalHtml: el.outerHTML,
          selected: false
        });
        return;
      }

      // 处理图片
      if (tagName === 'img') {
        const alt = el.getAttribute('alt') || '';
        const src = el.getAttribute('src') || '';
        blocks.push({
          id: `block-${idCounter++}`,
          type: 'image',
          content: `![${alt}](${src})`,
          originalHtml: el.outerHTML,
          selected: false
        });
        return;
      }

      // 处理段落
      if (tagName === 'p' || tagName === 'div') {
        if (textContent.length > 10) {
          blocks.push({
            id: `block-${idCounter++}`,
            type: 'paragraph',
            content: textContent,
            originalHtml: el.outerHTML,
            selected: false
          });
        }
        return;
      }

      // 递归处理子元素
      Array.from(el.childNodes).forEach(processNode);
    } else if (node.nodeType === Node.TEXT_NODE) {
      const textContent = node.textContent?.trim() || '';
      if (textContent.length > 10) {
        blocks.push({
          id: `block-${idCounter++}`,
          type: 'paragraph',
          content: textContent,
          originalHtml: textContent,
          selected: false
        });
      }
    }
  };

  Array.from(element.childNodes).forEach(processNode);
  return blocks;
}

/**
 * 解析HTML内容并提取结构化数据
 */
export function parseHTMLContent(htmlContent: string): ParsedContent {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');

  // 提取标题
  const titleElement = doc.querySelector('title') || doc.querySelector('h1');
  const title = titleElement?.textContent?.trim() || '未知标题';

  // 提取主要内容
  const mainContentElement = extractMainContent(doc);
  const mainContent: ContentBlock[] = [];
  
  if (mainContentElement) {
    const cleanedElement = cleanElement(mainContentElement);
    mainContent.push(...elementToContentBlocks(cleanedElement));
  }

  // 提取评论
  const commentElements = extractComments(doc);
  const comments: ContentBlock[] = [];
  
  commentElements.forEach((commentElement, index) => {
    const cleanedElement = cleanElement(commentElement);
    const commentBlocks = elementToContentBlocks(cleanedElement, mainContent.length + comments.length);
    comments.push(...commentBlocks);
  });

  return {
    title,
    mainContent,
    comments
  };
}

/**
 * 读取文件内容
 */
export async function readFileContent(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result;
      if (typeof result === 'string') {
        resolve(result);
      } else {
        reject(new Error('Failed to read file as text'));
      }
    };
    reader.onerror = () => reject(new Error('Error reading file'));
    reader.readAsText(file, 'utf-8');
  });
}

/**
 * 递归扫描文件夹获取所有HTML文件
 */
export async function scanDirectoryForHTMLFiles(
  directoryHandle: FileSystemDirectoryHandle,
  maxFiles: number = 500
): Promise<FileSystemFileHandle[]> {
  const htmlFiles: FileSystemFileHandle[] = [];

  async function traverse(dirHandle: FileSystemDirectoryHandle, currentPath: string = '') {
    if (htmlFiles.length >= maxFiles) return;

    try {
      for await (const [name, handle] of dirHandle.entries()) {
        if (htmlFiles.length >= maxFiles) break;

        if (handle.kind === 'file' && name.toLowerCase().endsWith('.html')) {
          htmlFiles.push(handle);
        } else if (handle.kind === 'directory') {
          await traverse(handle, `${currentPath}/${name}`);
        }
      }
    } catch (error) {
      console.warn('Error scanning directory:', error);
    }
  }

  await traverse(directoryHandle);
  return htmlFiles;
}
