"use client";

import { useState, useRef, useEffect } from "react";
import { processPDF, getPDFInfo, formatFileSize } from "../utils/pdfCropUtils";

interface PDFFile {
  file: File;
  name: string;
  size: number;
  pageCount?: number;
  isEncrypted?: boolean;
}

interface CompressionSettings {
  quality: number; // 0.1 - 1.0
  removeAnnotations: boolean;
  removeBookmarks: boolean;
  optimizeImages: boolean;
}

interface PageRange {
  start: number;
  end: number;
}

function PDFCropper() {
  const [selectedFile, setSelectedFile] = useState<PDFFile | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [compressionSettings, setCompressionSettings] = useState<CompressionSettings>({
    quality: 0.8,
    removeAnnotations: false,
    removeBookmarks: false,
    optimizeImages: true,
  });
  const [pageRange, setPageRange] = useState<PageRange>({ start: 1, end: 1 });
  const [usePageRange, setUsePageRange] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [processingMode, setProcessingMode] = useState<'normal' | 'compatibility' | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === "application/pdf") {
      await processFile(file);
    } else {
      alert("请选择有效的PDF文件");
    }
  };

  const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    
    const files = event.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type === "application/pdf") {
        // 直接处理文件，不需要模拟事件
        await processFile(file);
      } else {
        alert("请选择有效的PDF文件");
      }
    }
  };

  const processFile = async (file: File) => {
    try {
      const pdfInfo = await getPDFInfo(file);
      const pdfFile: PDFFile = {
        file,
        name: file.name,
        size: file.size,
        pageCount: pdfInfo.pageCount,
        isEncrypted: pdfInfo.isEncrypted,
      };
      setSelectedFile(pdfFile);
      
      // 设置页面范围为全部页面
      setPageRange({ start: 1, end: pdfInfo.pageCount });
      setUsePageRange(false);
    } catch (error) {
      console.error("读取PDF文件失败:", error);
      let errorMessage = "无法读取PDF文件，请确保文件未损坏";
      if (error instanceof Error) {
        if (error.message.includes('encrypted')) {
          errorMessage = "此PDF文件已加密且无法处理，请尝试其他文件";
        } else if (error.message.includes('Invalid')) {
          errorMessage = "PDF文件格式无效或已损坏";
        }
      }
      alert(errorMessage);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const handleProcess = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setProcessingMode(null);
    try {
      const processedPdfBytes = await processPDF(
        selectedFile.file,
        compressionSettings,
        usePageRange ? pageRange : null
      );

      // 创建下载链接
      const blob = new Blob([processedPdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `compressed_${selectedFile.name}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("PDF处理失败:", error);
      alert("PDF处理失败，请重试");
    } finally {
      setIsProcessing(false);
    }
  };



  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">PDF裁剪与压缩</h1>
        
        {/* 文件选择区域 */}
        <div className="mb-8">
          <div 
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging 
                ? "border-blue-400 bg-blue-50" 
                : "border-gray-300 hover:border-gray-400"
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handleFileSelect}
              className="hidden"
            />
            {selectedFile ? (
              <div className="space-y-2">
                <div className="text-green-600 text-lg">✓ 已选择文件</div>
                <div className="text-gray-700 font-medium">{selectedFile.name}</div>
                <div className="text-gray-500 text-sm">
                  大小: {formatFileSize(selectedFile.size)}
                  {selectedFile.pageCount && ` • ${selectedFile.pageCount} 页`}
                  {selectedFile.isEncrypted && (
                    <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
                      🔒 加密文件
                    </span>
                  )}
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                >
                  重新选择
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className={`text-4xl ${isDragging ? "text-blue-500" : "text-gray-400"}`}>📄</div>
                <div className="text-gray-600">
                  <div className="text-lg font-medium mb-2">
                    {isDragging ? "释放文件到此处" : "选择PDF文件"}
                  </div>
                  <div className="text-sm">支持拖拽文件或点击选择</div>
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  选择文件
                </button>
              </div>
            )}
          </div>
        </div>

        {selectedFile && (
          <>
            {/* 加密文件提示 */}
            {selectedFile.isEncrypted && (
              <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center space-x-2 text-yellow-800">
                  <span className="text-lg">🔒</span>
                  <div>
                    <div className="font-medium">检测到加密PDF文件</div>
                    <div className="text-sm text-yellow-700 mt-1">
                      此文件已加密，我们将尝试处理它，但某些功能可能受限。处理后的文件将不会保留原始加密。
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 压缩设置区域 */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">压缩设置</h2>
              <div className="space-y-4">
                {/* 压缩质量 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    压缩质量: {Math.round(compressionSettings.quality * 100)}%
                  </label>
                  <input
                    type="range"
                    min="0.1"
                    max="1.0"
                    step="0.1"
                    value={compressionSettings.quality}
                    onChange={(e) =>
                      setCompressionSettings(prev => ({
                        ...prev,
                        quality: parseFloat(e.target.value),
                      }))
                    }
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>最小文件</span>
                    <span>最佳质量</span>
                  </div>
                </div>

                {/* 其他选项 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={compressionSettings.optimizeImages}
                      onChange={(e) =>
                        setCompressionSettings(prev => ({
                          ...prev,
                          optimizeImages: e.target.checked,
                        }))
                      }
                      className="rounded"
                    />
                    <span className="text-sm text-gray-700">优化图片</span>
                  </label>
                  
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={compressionSettings.removeAnnotations}
                      onChange={(e) =>
                        setCompressionSettings(prev => ({
                          ...prev,
                          removeAnnotations: e.target.checked,
                        }))
                      }
                      className="rounded"
                    />
                    <span className="text-sm text-gray-700">移除注释</span>
                  </label>
                  
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={compressionSettings.removeBookmarks}
                      onChange={(e) =>
                        setCompressionSettings(prev => ({
                          ...prev,
                          removeBookmarks: e.target.checked,
                        }))
                      }
                      className="rounded"
                    />
                    <span className="text-sm text-gray-700">移除书签</span>
                  </label>
                </div>
              </div>
            </div>

            {/* 页面范围设置区域 */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">页面选择</h2>
              <div className="space-y-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={usePageRange}
                    onChange={(e) => setUsePageRange(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700">指定页面范围</span>
                </label>

                {usePageRange && (
                  <div className="ml-6 space-y-3">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <label className="text-sm text-gray-700">从第</label>
                        <input
                          type="number"
                          min="1"
                          max={selectedFile?.pageCount || 999}
                          value={pageRange.start}
                          onChange={(e) =>
                            setPageRange(prev => ({
                              ...prev,
                              start: Math.max(1, Math.min(selectedFile?.pageCount || 999, parseInt(e.target.value) || 1)),
                            }))
                          }
                          className="w-20 px-2 py-1 text-gray-900 border border-gray-300 rounded text-center"
                        />
                        <label className="text-sm text-gray-700">页</label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <label className="text-sm text-gray-700">到第</label>
                        <input
                          type="number"
                          min={pageRange.start}
                          max={selectedFile?.pageCount || 999}
                          value={pageRange.end}
                          onChange={(e) =>
                            setPageRange(prev => ({
                              ...prev,
                              end: Math.max(prev.start, Math.min(selectedFile?.pageCount || 999, parseInt(e.target.value) || prev.start)),
                            }))
                          }
                          className="w-20 px-2 py-1 text-gray-900 border border-gray-300 rounded text-center"
                        />
                        <label className="text-sm text-gray-700">页</label>
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                      将导出 {pageRange.end - pageRange.start + 1} 页
                      {selectedFile?.pageCount && ` （总共 ${selectedFile.pageCount} 页）`}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 处理按钮 */}
            <div className="flex flex-col items-center space-y-4">
              <button
                onClick={handleProcess}
                disabled={isProcessing}
                className={`px-8 py-3 rounded-lg font-medium transition-colors ${
                  isProcessing
                    ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                    : "bg-green-600 text-white hover:bg-green-700"
                }`}
              >
                {isProcessing ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>处理中...</span>
                  </div>
                ) : (
                  "开始处理"
                )}
              </button>
              
              {processingMode === 'compatibility' && (
                <div className="text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                  ℹ️ 正在使用兼容模式处理
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default PDFCropper;
