"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { 
  GripVertical, 
  Trash2, 
  ChevronUp, 
  ChevronDown,
  Eye,
  RotateCw,
  FileImage
} from "lucide-react";
import { ImageFile } from "@/components/PDFComposer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

interface ImageItemProps {
  image: ImageFile;
  index: number;
  onRemove: (id: string) => void;
  onMove: (id: string, direction: "up" | "down") => void;
  onPreview: (image: ImageFile) => void;
  onTogglePlacement: (id: string) => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}

export function ImageItem({
  image,
  index,
  onRemove,
  onMove,
  onPreview,
  onTogglePlacement,
  canMoveUp,
  canMoveDown,
}: ImageItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: image.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`transition-all ${
        isDragging ? "opacity-50 ring-2 ring-primary" : ""
      }`}
    >
      <div className="flex items-center gap-4 p-4">
        {/* 拖拽手柄 */}
        <Button
          {...attributes}
          {...listeners}
          variant="ghost"
          size="sm"
          className="cursor-grab active:cursor-grabbing h-8 w-8 p-0"
        >
          <GripVertical className="h-4 w-4" />
        </Button>

        {/* 序号 */}
        <div className="flex items-center justify-center w-8 h-8 bg-primary/10 text-primary rounded-full text-sm font-semibold">
          {index + 1}
        </div>

        {/* 缩略图 */}
        <div className="relative group">
          <img
            src={image.url}
            alt={image.file.name}
            className="w-16 h-16 object-cover rounded-md border"
          />
          <Button
            onClick={() => onPreview(image)}
            variant="ghost"
            size="sm"
            className="absolute inset-0 bg-background/0 hover:bg-background/80 transition-all rounded-md opacity-0 group-hover:opacity-100 h-16 w-16 p-0"
          >
            <Eye className="h-4 w-4" />
          </Button>
        </div>

        {/* 文件信息 */}
        <div className="flex-1 min-w-0 space-y-1">
          <h4 className="text-sm font-medium truncate">
            {image.file.name}
          </h4>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {formatFileSize(image.file.size)}
            </Badge>
            {image.compressed && (
              <Badge variant="outline" className="text-xs text-green-700 border-green-200">
                已压缩
              </Badge>
            )}
            <Badge 
              variant={image.placement === "normal" ? "default" : "secondary"} 
              className="text-xs"
            >
              {image.placement === "normal" ? "正常" : "横放"}
            </Badge>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex items-center gap-1">
          {/* 上移按钮 */}
          <Button
            onClick={() => onMove(image.id, "up")}
            disabled={!canMoveUp}
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            title="上移"
          >
            <ChevronUp className="h-4 w-4" />
          </Button>

          {/* 下移按钮 */}
          <Button
            onClick={() => onMove(image.id, "down")}
            disabled={!canMoveDown}
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            title="下移"
          >
            <ChevronDown className="h-4 w-4" />
          </Button>

          {/* 放置切换按钮 */}
          <Button
            onClick={() => onTogglePlacement(image.id)}
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            title={`切换为${image.placement === "normal" ? "横放" : "正常放置"}`}
          >
            <RotateCw className="h-4 w-4" />
          </Button>

          {/* 删除按钮 */}
          <Button
            onClick={() => onRemove(image.id)}
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
            title="删除"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
