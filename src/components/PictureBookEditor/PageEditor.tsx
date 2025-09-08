"use client";

import { useState, useRef } from "react";
import { PictureBookPage, FONT_FAMILIES, FONT_SIZES } from "@/types/pictureBook";
import { ImageArea } from "./ImageArea";
import { TextArea } from "./TextArea";
import { 
  ImagePlus, 
  Download,
  Palette 
} from "lucide-react";
import { exportPageAsPNG, exportPageAsImage, ExportQuality } from "@/utils/pictureBookExport";

interface PageEditorProps {
  page: PictureBookPage;
  pageNumber?: number;
  onUpdatePage: (updates: Partial<PictureBookPage>) => void;
}

export function PageEditor({ page, pageNumber, onUpdatePage }: PageEditorProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [exportQuality, setExportQuality] = useState<ExportQuality>('medium');
  const [exportFormat, setExportFormat] = useState<'png' | 'jpeg'>('jpeg');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const imageUrl = URL.createObjectURL(file);
    onUpdatePage({
      image: {
        src: imageUrl,
        file,
        mode: page.image?.mode || "contain",
      },
    });

    // 清空文件输入
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleImageUpdate = (imageData: { src: string; file: File; mode: "cover" | "contain" }) => {
    onUpdatePage({
      image: imageData,
    });
  };

  const updateImageMode = (mode: "cover" | "contain") => {
    if (!page.image) return;
    onUpdatePage({
      image: {
        ...page.image,
        mode,
      },
    });
  };

  const updateTextContent = (content: string) => {
    onUpdatePage({
      text: {
        ...page.text,
        content,
      },
    });
  };

  const updateTextStyle = (styleUpdates: Partial<typeof page.text>) => {
    onUpdatePage({
      text: {
        ...page.text,
        ...styleUpdates,
      },
    });
  };

  const handleExportPage = async () => {
    setIsExporting(true);
    try {
      const jpegQuality = exportFormat === 'jpeg' ? (exportQuality === 'high' ? 0.9 : exportQuality === 'medium' ? 0.8 : 0.6) : undefined;
      await exportPageAsImage(page, pageNumber, {
        quality: exportQuality,
        format: exportFormat,
        jpegQuality: jpegQuality
      });
      setShowExportOptions(false);
    } catch (error) {
      console.error("图片导出失败:", error);
      alert("图片导出失败，请稍后重试");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* 工具栏 */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">页面编辑</h3>
          <div className="flex items-center gap-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              <ImagePlus className="w-4 h-4" />
              选择图片
            </button>
            
            <button
              onClick={() => setShowExportOptions(!showExportOptions)}
              disabled={isExporting}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              <Download className="w-4 h-4" />
              {isExporting ? "导出中..." : "导出图片"}
            </button>
          </div>
        </div>

        {/* 图片模式控制 */}
        {page.image && (
          <div className="mt-3 flex items-center gap-3">
            <span className="text-sm text-gray-600">图片适配:</span>
            <div className="flex gap-2">
              <button
                onClick={() => updateImageMode("contain")}
                className={`px-3 py-1 text-sm rounded transition-colors ${
                  page.image.mode === "contain"
                    ? "bg-blue-100 text-blue-700 border border-blue-300"
                    : "bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200"
                }`}
              >
                完整显示
              </button>
              <button
                onClick={() => updateImageMode("cover")}
                className={`px-3 py-1 text-sm rounded transition-colors ${
                  page.image.mode === "cover"
                    ? "bg-blue-100 text-blue-700 border border-blue-300"
                    : "bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200"
                }`}
              >
                覆盖页面
              </button>
            </div>
          </div>
        )}

        {/* 文字样式控制 */}
        <div className="mt-3 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-gray-600" />
            <span className="text-sm text-gray-600">文字样式:</span>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">字体:</span>
            <select
              value={page.text.fontFamily}
              onChange={(e) => updateTextStyle({ fontFamily: e.target.value })}
              className="px-2 py-1 text-sm text-gray-900 border border-gray-300 rounded"
            >
              {FONT_FAMILIES.map((font) => (
                <option key={font} value={font}>
                  {font}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">字号:</span>
            <select
              value={page.text.fontSize}
              onChange={(e) => updateTextStyle({ fontSize: parseInt(e.target.value) })}
              className="px-2 py-1 text-sm text-gray-900 border border-gray-300 rounded"
            >
              {FONT_SIZES.map((size) => (
                <option key={size} value={size}>
                  {size}px
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">边距:</span>
            <input
              type="range"
              min="10"
              max="50"
              value={page.text.padding}
              onChange={(e) => updateTextStyle({ padding: parseInt(e.target.value) })}
              className="w-20"
            />
            <span className="text-sm text-gray-600 w-12">{page.text.padding}px</span>
          </div>
        </div>

        {/* 导出选项面板 */}
        {showExportOptions && (
          <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">导出质量:</span>
                <select
                  value={exportQuality}
                  onChange={(e) => setExportQuality(e.target.value as ExportQuality)}
                  className="px-2 py-1 text-sm text-gray-900 border border-gray-300 rounded"
                >
                  <option value="low">小文件 (72DPI)</option>
                  <option value="medium">中等质量 (150DPI)</option>
                  <option value="high">高清打印 (300DPI)</option>
                </select>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">格式:</span>
                <select
                  value={exportFormat}
                  onChange={(e) => setExportFormat(e.target.value as 'png' | 'jpeg')}
                  className="px-2 py-1 text-sm text-gray-900 border border-gray-300 rounded"
                >
                  <option value="jpeg">JPEG (小文件)</option>
                  <option value="png">PNG (无损)</option>
                </select>
              </div>

              <div className="flex gap-2 ml-auto">
                <button
                  onClick={() => setShowExportOptions(false)}
                  className="px-3 py-1 text-sm bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleExportPage}
                  disabled={isExporting}
                  className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {isExporting ? "导出中..." : "开始导出"}
                </button>
              </div>
            </div>
            
            {/* 质量说明 */}
            <div className="mt-2 text-xs text-gray-500">
              {exportQuality === 'low' && "适合网络分享，文件最小 (~200KB)"}
              {exportQuality === 'medium' && "平衡质量与文件大小 (~800KB)"}
              {exportQuality === 'high' && "最佳打印质量，文件较大 (~3MB)"}
            </div>
          </div>
        )}
      </div>

      {/* 编辑区域 */}
      <div className="flex-1 p-6 bg-gray-100">
        <div className="max-w-4xl mx-auto">
          {/* A4横版比例的编辑区域 */}
          <div 
            id="picture-book-edit-area"
            className="aspect-[297/210] bg-white shadow-lg rounded-lg overflow-hidden flex"
          >
            {/* 左侧图片区域 */}
            <div className="w-1/2">
              <ImageArea
                image={page.image}
                onPaste={() => {}} // 保留接口兼容性，实际使用onImageUpdate
                onImageSelect={() => fileInputRef.current?.click()}
                onImageUpdate={handleImageUpdate}
              />
            </div>
            
            {/* 右侧文字区域 */}
            <div className="w-1/2">
              <TextArea
                text={page.text}
                onUpdateContent={updateTextContent}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 隐藏的文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageSelect}
        className="hidden"
      />
    </div>
  );
}
