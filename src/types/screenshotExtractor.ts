export interface ExtractionResult {
  id: string;
  timestamp: number;
  originalText: string;
  translation: string;
  imageDescription: string;
  imageDataUrls: string[]; // 支持多张图片的缩略图
  imageCount: number; // 图片数量
}

export interface ImageItem {
  id: string;
  dataUrl: string; // base64 data URL
  name: string;
  size: number;
  timestamp: number;
}

export interface ScreenshotExtractorState {
  selectedMode: 'clipboard' | 'file';
  currentImages: ImageItem[]; // 支持多张图片
  isProcessing: boolean;
  apiKey: string;
  apiProvider: 'openai' | 'openai-badger';
  systemPrompt: string;
  results: ExtractionResult[];
  currentResult: ExtractionResult | null;
}

export interface ApiConfig {
  provider: 'openai' | 'openai-badger';
  apiKey: string;
}

export interface OpenAIVisionResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}
