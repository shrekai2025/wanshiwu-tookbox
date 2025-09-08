"use client";

import { useState } from "react";
import { PictureBook, PictureBookPage, DEFAULT_TEXT_STYLE } from "@/types/pictureBook";
import { PagePreview } from "./PagePreview";
import { PageEditor } from "./PageEditor";
import { exportPictureBookAsPDF, ExportQuality } from "@/utils/pictureBookExport";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  BookOpen,
  Plus,
  Download,
  Loader2,
  FileText,
  Info
} from "lucide-react";

export function PictureBookEditor() {
  const [pictureBook, setPictureBook] = useState<PictureBook>({
    pages: [createNewPage()],
    selectedPageId: null,
  });
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [showPDFExportOptions, setShowPDFExportOptions] = useState(false);
  const [pdfExportQuality, setPdfExportQuality] = useState<ExportQuality>('medium');

  const selectedPage = pictureBook.pages.find(
    (page) => page.id === pictureBook.selectedPageId
  );
  
  const selectedPageNumber = selectedPage 
    ? pictureBook.pages.findIndex((page) => page.id === selectedPage.id) + 1
    : undefined;

  function createNewPage(): PictureBookPage {
    return {
      id: `page-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      text: {
        content: "",
        ...DEFAULT_TEXT_STYLE,
      },
    };
  }

  const addPage = () => {
    const newPage = createNewPage();
    setPictureBook((prev) => ({
      ...prev,
      pages: [...prev.pages, newPage],
      selectedPageId: newPage.id,
    }));
  };

  const deletePage = (pageId: string) => {
    setPictureBook((prev) => {
      const filteredPages = prev.pages.filter((page) => page.id !== pageId);
      if (filteredPages.length === 0) {
        // 如果删除了所有页面，创建一个新的空页面
        const newPage = createNewPage();
        return {
          pages: [newPage],
          selectedPageId: newPage.id,
        };
      }
      
      let newSelectedId = prev.selectedPageId;
      if (pageId === prev.selectedPageId) {
        // 如果删除的是当前选中的页面，选择第一个可用页面
        newSelectedId = filteredPages[0]?.id || null;
      }
      
      return {
        pages: filteredPages,
        selectedPageId: newSelectedId,
      };
    });
  };

  const selectPage = (pageId: string) => {
    setPictureBook((prev) => ({
      ...prev,
      selectedPageId: pageId,
    }));
  };

  const updatePage = (pageId: string, updates: Partial<PictureBookPage>) => {
    setPictureBook((prev) => ({
      ...prev,
      pages: prev.pages.map((page) =>
        page.id === pageId ? { ...page, ...updates } : page
      ),
    }));
  };

  const movePage = (dragIndex: number, hoverIndex: number) => {
    setPictureBook((prev) => {
      const dragPage = prev.pages[dragIndex];
      const newPages = [...prev.pages];
      newPages.splice(dragIndex, 1);
      newPages.splice(hoverIndex, 0, dragPage);
      
      return {
        ...prev,
        pages: newPages,
      };
    });
  };

  const handleExportPDF = async () => {
    setIsExportingPDF(true);
    try {
      const jpegQuality = pdfExportQuality === 'high' ? 0.9 : pdfExportQuality === 'medium' ? 0.8 : 0.6;
      await exportPictureBookAsPDF(pictureBook.pages, {
        quality: pdfExportQuality,
        jpegQuality: jpegQuality
      });
      setShowPDFExportOptions(false);
    } catch (error) {
      console.error("PDF导出失败:", error);
      alert("PDF导出失败，请稍后重试");
    } finally {
      setIsExportingPDF(false);
    }
  };

  return (
    <div className="flex h-full min-h-screen">
      {/* 左侧页面预览区 */}
      <div className="w-80 border-r bg-card flex flex-col">
        <Card className="rounded-none border-0 border-b">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <BookOpen className="h-5 w-5" />
                  页面管理
                </CardTitle>
                <CardDescription>
                  管理绘本的所有页面
                </CardDescription>
              </div>
              <Badge variant="secondary">
                {pictureBook.pages.length} 页
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button
                onClick={addPage}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                增加页
              </Button>
              <Button
                onClick={() => setShowPDFExportOptions(!showPDFExportOptions)}
                disabled={isExportingPDF}
                size="sm"
                className="flex items-center gap-2"
              >
                {isExportingPDF ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                {isExportingPDF ? "导出中..." : "导出PDF"}
              </Button>
            </div>

            {/* PDF导出选项面板 */}
            {showPDFExportOptions && (
              <>
                <Separator />
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">PDF质量设置</span>
                    </div>
                    <Select 
                      value={pdfExportQuality} 
                      onValueChange={(value: ExportQuality) => setPdfExportQuality(value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">小文件 (72DPI)</SelectItem>
                        <SelectItem value="medium">中等质量 (150DPI)</SelectItem>
                        <SelectItem value="high">高清打印 (300DPI)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-start gap-2 p-3 bg-muted rounded-md">
                    <Info className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div className="text-xs text-muted-foreground">
                      {pdfExportQuality === 'low' && "适合网络分享，文件最小 (~1-2MB)"}
                      {pdfExportQuality === 'medium' && "平衡质量与文件大小 (~5-8MB)"}
                      {pdfExportQuality === 'high' && "最佳打印质量，文件较大 (~15-25MB)"}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => setShowPDFExportOptions(false)}
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      取消
                    </Button>
                    <Button
                      onClick={handleExportPDF}
                      disabled={isExportingPDF}
                      size="sm"
                      className="flex-1"
                    >
                      {isExportingPDF ? "导出中..." : "开始导出"}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
        
        <div className="flex-1 overflow-y-auto">
          <PagePreview
            pages={pictureBook.pages}
            selectedPageId={pictureBook.selectedPageId}
            onSelectPage={selectPage}
            onDeletePage={deletePage}
            onMovePage={movePage}
          />
        </div>
      </div>

      {/* 右侧编辑区 */}
      <div className="flex-1 flex flex-col bg-background">
        {selectedPage ? (
          <PageEditor
            page={selectedPage}
            pageNumber={selectedPageNumber}
            onUpdatePage={(updates) => updatePage(selectedPage.id, updates)}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <Card className="max-w-md">
              <CardContent className="flex flex-col items-center text-center p-8">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <BookOpen className="h-8 w-8 text-muted-foreground" />
                </div>
                <CardTitle className="mb-2">选择一个页面开始编辑</CardTitle>
                <CardDescription>
                  点击左侧页面预览来选择要编辑的页面，或添加新的页面开始创作
                </CardDescription>
                <Button
                  onClick={addPage}
                  className="mt-4 flex items-center gap-2"
                  variant="outline"
                >
                  <Plus className="h-4 w-4" />
                  添加新页面
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
