"use client";

import { ImageFile } from "@/components/PDFComposer";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface ImageModalProps {
  image: ImageFile | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ImageModal({ image, isOpen, onClose }: ImageModalProps) {
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        {image && (
          <>
            <DialogHeader className="p-6 pb-4">
              <DialogTitle className="text-left">
                {image.file.name}
              </DialogTitle>
              <div className="flex items-center gap-2 pt-2">
                <Badge variant="secondary">
                  {formatFileSize(image.file.size)}
                </Badge>
                {image.compressed && (
                  <Badge variant="outline" className="text-green-700 border-green-200">
                    已压缩
                  </Badge>
                )}
                <Badge variant={image.placement === "normal" ? "default" : "secondary"}>
                  {image.placement === "normal" ? "正常" : "横放"}
                </Badge>
              </div>
            </DialogHeader>

            {/* 图片内容 */}
            <div className="px-6 pb-6">
              <div className="flex items-center justify-center bg-muted rounded-lg overflow-hidden">
                <img
                  src={image.url}
                  alt={image.file.name}
                  className="max-w-full max-h-[60vh] object-contain"
                  loading="lazy"
                />
              </div>
              
              <p className="text-xs text-muted-foreground text-center mt-4">
                按 ESC 键或点击关闭按钮退出预览
              </p>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
