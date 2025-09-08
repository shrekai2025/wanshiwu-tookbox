export interface PDFPage {
  id: string;
  pageNumber: number;
  canvas: HTMLCanvasElement;
  selected: boolean;
  width: number;
  height: number;
}

export interface PDFDocument {
  file: File;
  pages: PDFPage[];
  totalPages: number;
}

export interface ExportSettings {
  format: 'jpg' | 'pptx';
  jpgQuality: number; // 0-100的百分比
  selectedPages: number[];
}

export interface PPTXSlideElement {
  type: 'image' | 'text';
  content: string | HTMLCanvasElement;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
}

export interface PPTXSlide {
  pageNumber: number;
  elements: PPTXSlideElement[];
}
