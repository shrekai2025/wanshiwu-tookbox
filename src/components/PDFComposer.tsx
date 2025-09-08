"use client";

import { useState, useRef } from "react";
import { ImageItem } from "@/components/ImageItem";
import { ImageModal } from "@/components/ImageModal";
import { generatePDF } from "@/utils/pdfUtils";
import { compressImage } from "@/utils/imageUtils";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { 
  ImagePlus, 
  Download,
  Trash2,
  Settings,
  Loader2,
  RotateCw,
  Move,
  FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export interface ImageFile {
  id: string;
  file: File;
  url: string;
  compressed?: boolean;
  placement?: "normal" | "rotated";
}

export interface PDFSettings {
  margin: number;
  defaultPlacement: "normal" | "rotated";
  imagesPerPage: number;
}

export function PDFComposer() {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [selectedImage, setSelectedImage] = useState<ImageFile | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [compressionEnabled, setCompressionEnabled] = useState(true);
  const [compressionQuality, setCompressionQuality] = useState(0.8);
  const [pdfSettings, setPdfSettings] = useState<PDFSettings>({
    margin: 10,
    defaultPlacement: "normal",
    imagesPerPage: 1,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newImages: ImageFile[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type.startsWith("image/")) {
        let processedFile = file;
        let compressed = false;
        
        if (compressionEnabled) {
          try {
            processedFile = await compressImage(file, compressionQuality);
            compressed = true;
          } catch (error) {
            console.warn("图片压缩失败，使用原图:", error);
          }
        }
        
        const imageFile: ImageFile = {
          id: `${Date.now()}-${i}`,
          file: processedFile,
          url: URL.createObjectURL(processedFile),
          compressed,
          placement: pdfSettings.defaultPlacement,
        };
        newImages.push(imageFile);
      }
    }
    
    setImages(prev => [...prev, ...newImages]);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setImages((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over?.id);

        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const moveImage = (id: string, direction: "up" | "down") => {
    setImages((items) => {
      const index = items.findIndex((item) => item.id === id);
      if (index === -1) return items;
      
      const newIndex = direction === "up" ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= items.length) return items;
      
      return arrayMove(items, index, newIndex);
    });
  };

  const removeImage = (id: string) => {
    setImages((items) => {
      const item = items.find((item) => item.id === id);
      if (item) {
        URL.revokeObjectURL(item.url);
      }
      return items.filter((item) => item.id !== id);
    });
  };

  const toggleImagePlacement = (id: string) => {
    setImages((items) =>
      items.map((item) =>
        item.id === id
          ? {
              ...item,
              placement:
                item.placement === "normal" ? "rotated" : "normal",
            }
          : item
      )
    );
  };

  const setAllImagesPlacement = (placement: "normal" | "rotated") => {
    setImages((items) =>
      items.map((item) => ({
        ...item,
        placement,
      }))
    );
  };

  const clearAllImages = () => {
    images.forEach((image) => {
      URL.revokeObjectURL(image.url);
    });
    setImages([]);
  };

  const handleGeneratePDF = async () => {
    if (images.length === 0) return;
    
    setIsGenerating(true);
    try {
      await generatePDF(images, pdfSettings);
    } catch (error) {
      console.error("PDF生成失败:", error);
      alert("PDF生成失败，请稍后重试");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div>
      {/* 控制面板 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                图片转PDF工具
              </CardTitle>
              <CardDescription>
                将多张图片合成为一个PDF文档，支持自定义布局和压缩
              </CardDescription>
            </div>
            <Badge variant="secondary" className="flex items-center gap-1">
              <span>{images.length}</span> 张图片
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 主要操作按钮 */}
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="default"
              size="default"
              className="flex items-center gap-2"
            >
              <ImagePlus className="h-4 w-4" />
              选择图片
            </Button>
            
            <Button
              onClick={handleGeneratePDF}
              disabled={images.length === 0 || isGenerating}
              variant="default"
              size="default"
              className="flex items-center gap-2"
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              {isGenerating ? "生成中..." : "生成PDF"}
            </Button>
            
            {images.length > 0 && (
              <Button
                onClick={clearAllImages}
                variant="destructive"
                size="default"
                className="flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                清空所有
              </Button>
            )}
          </div>

          <Separator />
          
          {/* 压缩设置 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4 text-muted-foreground" />
                <Label className="text-sm font-medium">图片压缩</Label>
              </div>
              <Switch
                checked={compressionEnabled}
                onCheckedChange={setCompressionEnabled}
              />
            </div>
            
            {compressionEnabled && (
              <div className="space-y-3 pl-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">压缩质量</Label>
                    <Badge variant="outline">{Math.round(compressionQuality * 100)}%</Badge>
                  </div>
                  <Slider
                    value={[compressionQuality]}
                    onValueChange={(value) => setCompressionQuality(value[0])}
                    max={1}
                    min={0.1}
                    step={0.1}
                    className="w-full"
                  />
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* PDF设置 */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <Label className="text-sm font-medium">PDF设置</Label>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-sm">页面边距 (mm)</Label>
                <Input
                  type="number"
                  min="0"
                  max="50"
                  value={pdfSettings.margin}
                  onChange={(e) =>
                    setPdfSettings((prev) => ({
                      ...prev,
                      margin: parseFloat(e.target.value) || 0,
                    }))
                  }
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm">默认放置方式</Label>
                <Select
                  value={pdfSettings.defaultPlacement}
                  onValueChange={(value: "normal" | "rotated") =>
                    setPdfSettings((prev) => ({
                      ...prev,
                      defaultPlacement: value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">正常放置</SelectItem>
                    <SelectItem value="rotated">横放（旋转90°）</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm">每页图片数</Label>
                <Input
                  type="number"
                  min="1"
                  max="12"
                  value={pdfSettings.imagesPerPage}
                  onChange={(e) =>
                    setPdfSettings((prev) => ({
                      ...prev,
                      imagesPerPage: Math.max(1, Math.min(12, parseInt(e.target.value || "1", 10))),
                    }))
                  }
                />
              </div>
            </div>
            
            <div className="rounded-md bg-muted p-3">
              <p className="text-xs text-muted-foreground">
                📄 纸张固定为竖版 A4 (210×297mm)，横放模式下图片将向右旋转90度后放置
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 隐藏的文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* 图片列表 */}
      {images.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center space-y-4">
              <div className="mx-auto h-12 w-12 text-muted-foreground">
                <ImagePlus className="h-12 w-12" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">还没有选择图片</h3>
                <p className="text-muted-foreground">
                  点击上方"选择图片"按钮来添加图片
                </p>
                <p className="text-sm text-muted-foreground">
                  支持 JPG, PNG, GIF, WebP 等格式
                </p>
              </div>
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                className="mt-4"
              >
                <ImagePlus className="h-4 w-4 mr-2" />
                选择图片
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Move className="h-5 w-5" />
                已选择 {images.length} 张图片
              </CardTitle>
              <div className="flex items-center gap-2">
                <Label className="text-sm">批量设置:</Label>
                <Button
                  onClick={() => setAllImagesPlacement("normal")}
                  variant="outline"
                  size="sm"
                  className="h-8"
                >
                  全部正常
                </Button>
                <Button
                  onClick={() => setAllImagesPlacement("rotated")}
                  variant="outline"
                  size="sm"
                  className="h-8"
                >
                  <RotateCw className="h-3 w-3 mr-1" />
                  全部横放
                </Button>
              </div>
            </div>
            <CardDescription>
              拖拽图片可以调整顺序，或使用上下箭头按钮
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={images} strategy={verticalListSortingStrategy}>
                <div className="space-y-4">
                  {images.map((image, index) => (
                    <ImageItem
                      key={image.id}
                      image={image}
                      index={index}
                      onRemove={removeImage}
                      onMove={moveImage}
                      onPreview={setSelectedImage}
                      onTogglePlacement={toggleImagePlacement}
                      canMoveUp={index > 0}
                      canMoveDown={index < images.length - 1}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </CardContent>
        </Card>
      )}

      {/* 图片预览模态框 */}
      <ImageModal
        image={selectedImage}
        isOpen={selectedImage !== null}
        onClose={() => setSelectedImage(null)}
      />
    </div>
  );
}
