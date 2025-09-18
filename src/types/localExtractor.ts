export interface ContentBlock {
  id: string;
  type: 'heading' | 'paragraph' | 'list' | 'quote' | 'image';
  content: string; // Markdown格式
  originalHtml: string;
  selected: boolean;
  expanded?: boolean; // 用于展开/收起完整内容
  level?: number; // 用于heading的级别
}

export interface ExtractedPage {
  fileName: string;
  filePath: string;
  title: string;
  mainContent: ContentBlock[];
  comments: ContentBlock[];
  status: 'pending' | 'parsing' | 'success' | 'error';
  error?: string;
}

export interface LocalExtractorState {
  selectedFolder: FileSystemDirectoryHandle | null;
  pages: ExtractedPage[];
  currentPageIndex: number;
  isProcessing: boolean;
  totalFiles: number;
  processedFiles: number;
}

export interface ParsedContent {
  title: string;
  mainContent: ContentBlock[];
  comments: ContentBlock[];
}
