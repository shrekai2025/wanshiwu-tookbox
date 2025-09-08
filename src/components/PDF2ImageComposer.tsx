"use client";

import { useState, useRef, useCallback } from "react";
import { PDFDocument, PDFPage, ExportSettings } from "@/types/pdf2image";
import { 
  parsePDF, 
  exportPagesAsJPG, 
  exportPagesAsPPTX,
  validateFileSize,
  getFileSizeMB 
} from "@/utils/pdf2imageUtils";
import {
  Upload,
  Download,
  Image,
  Presentation,
  CheckSquare,
  Square,
  Loader2,
  AlertCircle,
  ArrowLeftRight,
  Settings,
  File
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";

function PDF2ImageComposer() {
  const [pdfDocument, setPdfDocument] = useState<PDFDocument | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [exportSettings, setExportSettings] = useState<ExportSettings>({
    format: 'jpg',
    jpgQuality: 85,
    selectedPages: []
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 处理PDF文件选择
  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    if (!file.type.includes('pdf')) {
      setError('请选择PDF文件');
      return;
    }

    // 验证文件大小
    if (!validateFileSize(file, 200)) {
      setError(`文件大小超过限制（${getFileSizeMB(file).toFixed(1)}MB > 200MB）`);
      return;
    }

    setError(null);
    setIsLoading(true);
    setPdfDocument(null);

    try {
      const document = await parsePDF(file);
      setPdfDocument(document);
      setExportSettings(prev => ({
        ...prev,
        selectedPages: []
      }));
    } catch (err) {
      console.error('PDF解析失败:', err);
      setError('PDF解析失败，请检查文件是否损坏');
    } finally {
      setIsLoading(false);
    }

    // 清除文件输入
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  // 切换页面选择状态
  const togglePageSelection = useCallback((pageNumber: number) => {
    setExportSettings(prev => ({
      ...prev,
      selectedPages: prev.selectedPages.includes(pageNumber)
        ? prev.selectedPages.filter(p => p !== pageNumber)
        : [...prev.selectedPages, pageNumber].sort((a, b) => a - b)
    }));
  }, []);

  // 全选/取消全选
  const toggleSelectAll = useCallback(() => {
    if (!pdfDocument) return;
    
    const allPageNumbers = pdfDocument.pages.map(p => p.pageNumber);
    const isAllSelected = exportSettings.selectedPages.length === allPageNumbers.length;
    
    setExportSettings(prev => ({
      ...prev,
      selectedPages: isAllSelected ? [] : allPageNumbers
    }));
  }, [pdfDocument, exportSettings.selectedPages]);

  // 导出文件
  const handleExport = useCallback(async () => {
    if (!pdfDocument || exportSettings.selectedPages.length === 0) return;

    setIsExporting(true);
    setExportProgress(0);

    try {
      if (exportSettings.format === 'jpg') {
        await exportPagesAsJPG(
          pdfDocument.pages, 
          exportSettings.selectedPages, 
          exportSettings.jpgQuality
        );
        setExportProgress(100);
      } else if (exportSettings.format === 'pptx') {
        await exportPagesAsPPTX(
          pdfDocument.pages, 
          exportSettings.selectedPages
        );
        setExportProgress(100);
      }
    } catch (err) {
      console.error('导出失败:', err);
      setError(err instanceof Error ? err.message : '导出失败，请稍后重试');
    } finally {
      setIsExporting(false);
      setTimeout(() => setExportProgress(0), 2000);
    }
  }, [pdfDocument, exportSettings]);

  const selectedPagesCount = exportSettings.selectedPages.length;
  const isAllSelected = pdfDocument ? selectedPagesCount === pdfDocument.totalPages : false;

  return (
    <div>
      {/* 主控制面板 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ArrowLeftRight className="h-5 w-5" />
                PDF转图片工具
              </CardTitle>
              <CardDescription>
                将PDF文档转换为JPG图片或PPTX演示文稿，支持分页选择和质量调节
              </CardDescription>
            </div>
            {pdfDocument && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  <File className="h-3 w-3 mr-1" />
                  {pdfDocument.totalPages} 页
                </Badge>
                <Badge variant="outline">
                  {getFileSizeMB(pdfDocument.file).toFixed(1)} MB
                </Badge>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* PDF上传区域 */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="default"
                size="default"
                className="flex items-center gap-2"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                {isLoading ? "解析中..." : "选择PDF文件"}
              </Button>
              
              {pdfDocument && (
                <Button
                  onClick={handleExport}
                  disabled={selectedPagesCount === 0 || isExporting}
                  variant="default"
                  size="default"
                  className="flex items-center gap-2"
                >
                  {isExporting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  {isExporting ? "导出中..." : `导出 ${selectedPagesCount} 页`}
                </Button>
              )}
            </div>
            
            {/* 进度条 */}
            {isExporting && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>正在导出...</span>
                  <span>{Math.round(exportProgress)}%</span>
                </div>
                <Progress value={exportProgress} className="w-full" />
              </div>
            )}
            
            {/* 错误信息 */}
            {error && (
              <div className="flex items-center gap-2 text-destructive text-sm">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}
          </div>

          {/* 导出设置 */}
          {pdfDocument && (
            <>
              <Separator />
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Settings className="h-4 w-4 text-muted-foreground" />
                  <Label className="text-sm font-medium">导出设置</Label>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm">输出格式</Label>
                    <Select
                      value={exportSettings.format}
                      onValueChange={(value: 'jpg' | 'pptx') =>
                        setExportSettings(prev => ({ ...prev, format: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="jpg">
                          <div className="flex items-center gap-2">
                            <Image className="h-4 w-4" />
                            JPG 图片
                          </div>
                        </SelectItem>
                        <SelectItem value="pptx">
                          <div className="flex items-center gap-2">
                            <Presentation className="h-4 w-4" />
                            PPTX 演示文稿
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {exportSettings.format === 'jpg' && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm">图片质量</Label>
                        <Badge variant="outline">{exportSettings.jpgQuality}%</Badge>
                      </div>
                      <Slider
                        value={[exportSettings.jpgQuality]}
                        onValueChange={(value) =>
                          setExportSettings(prev => ({ ...prev, jpgQuality: value[0] }))
                        }
                        max={100}
                        min={10}
                        step={5}
                        className="w-full"
                      />
                    </div>
                  )}
                </div>
                
                {exportSettings.format === 'pptx' && (
                  <div className="rounded-md bg-muted p-3">
                    <p className="text-xs text-muted-foreground">
                      💡 PPTX模式将每个PDF页面转换为单独的幻灯片，图片保持原始比例并居中显示。
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* 隐藏的文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* PDF页面预览网格 */}
      {pdfDocument && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <CheckSquare className="h-5 w-5" />
                页面选择
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  onClick={toggleSelectAll}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  {isAllSelected ? (
                    <CheckSquare className="h-4 w-4" />
                  ) : (
                    <Square className="h-4 w-4" />
                  )}
                  {isAllSelected ? "取消全选" : "全选"}
                </Button>
                <Badge variant="secondary">
                  已选择 {selectedPagesCount} / {pdfDocument.totalPages} 页
                </Badge>
              </div>
            </div>
            <CardDescription>
              点击页面缩略图来选择需要导出的页面
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {pdfDocument.pages.map((page) => {
                const isSelected = exportSettings.selectedPages.includes(page.pageNumber);
                return (
                  <div
                    key={page.id}
                    className={`
                      relative cursor-pointer rounded-lg border-2 transition-all hover:shadow-md
                      ${isSelected 
                        ? 'border-primary bg-primary/5 shadow-md' 
                        : 'border-muted hover:border-primary/50'
                      }
                    `}
                    onClick={() => togglePageSelection(page.pageNumber)}
                  >
                    {/* 页面缩略图 */}
                    <div className="aspect-[3/4] p-2">
                      <div className="relative h-full w-full overflow-hidden rounded bg-white shadow-sm">
                        <canvas
                          ref={(canvas) => {
                            if (canvas && page.canvas) {
                              const ctx = canvas.getContext('2d');
                              if (ctx) {
                                // 设置固定的缩略图尺寸
                                const maxWidth = 150;
                                const maxHeight = 200;
                                const scale = Math.min(
                                  maxWidth / page.width,
                                  maxHeight / page.height
                                );
                                canvas.width = page.width * scale;
                                canvas.height = page.height * scale;
                                ctx.drawImage(page.canvas, 0, 0, canvas.width, canvas.height);
                              }
                            }
                          }}
                          className="h-full w-full object-contain"
                        />
                      </div>
                    </div>
                    
                    {/* 选择状态指示器 */}
                    <div className="absolute top-2 right-2">
                      <div className={`
                        flex h-5 w-5 items-center justify-center rounded border-2 text-xs
                        ${isSelected 
                          ? 'border-primary bg-primary text-primary-foreground' 
                          : 'border-muted-foreground bg-background'
                        }
                      `}>
                        {isSelected && <CheckSquare className="h-3 w-3" />}
                      </div>
                    </div>
                    
                    {/* 页码 */}
                    <div className="absolute bottom-2 left-2">
                      <Badge variant="secondary" className="text-xs">
                        第 {page.pageNumber} 页
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 空状态 */}
      {!pdfDocument && !isLoading && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center space-y-4">
              <div className="mx-auto h-12 w-12 text-muted-foreground">
                <Upload className="h-12 w-12" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">还没有选择PDF文件</h3>
                <p className="text-muted-foreground">
                  点击上方"选择PDF文件"按钮来上传PDF
                </p>
                <p className="text-sm text-muted-foreground">
                  支持最大200MB的PDF文件
                </p>
              </div>
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                className="mt-4"
              >
                <Upload className="h-4 w-4 mr-2" />
                选择PDF文件
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default PDF2ImageComposer;
export { PDF2ImageComposer };
